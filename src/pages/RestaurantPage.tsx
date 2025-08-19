import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { MapPin, Clock, Phone, Mail, Star, ShoppingCart, Minus, Plus, MessageCircle, Store } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { MenuItemCard } from '../components/MenuItemCard';
import { Cart } from '../components/Cart';
import { CheckoutForm } from '../components/CheckoutForm';
import { ReviewsSection } from '../components/ReviewsSection';
import { DeliveryInfo } from '../components/DeliveryInfo';
import { format } from 'date-fns';

interface RestaurantWithMenu extends Tables<'restaurants'> {
  menus: (Tables<'menus'> & {
    menu_items: Tables<'menu_items'>[];
  })[];
  average_rating?: number;
  review_count?: number;
}

export function RestaurantPage() {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<RestaurantWithMenu | null>(null);
  const [cart, setCart] = useState<{ [itemId: string]: number }>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userReview, setUserReview] = useState<Tables<'reviews'> | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (slug) {
      fetchRestaurant();
    }
  }, [slug]);

  useEffect(() => {
    if (restaurant && user) {
      fetchUserReview();
    }
  }, [restaurant, user]);

  useEffect(() => {
    // Listen for review changes to update restaurant stats
    const handleReviewChange = () => {
      if (restaurant) {
        fetchRestaurantStats();
      }
    };

    window.addEventListener('reviewChanged', handleReviewChange);
    return () => window.removeEventListener('reviewChanged', handleReviewChange);
  }, [restaurant]);

  const fetchRestaurant = async () => {
    if (!slug) return;
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          menus(
            id,
            menu_date,
            is_published,
            valid_from,
            valid_to,
            menu_items(*)
          )
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Ресторантът не е намерен');
        } else {
          throw error;
        }
        return;
      }

      // Filter for today's published menu
      const todayMenu = data.menus?.find((menu: any) => {
        return menu.menu_date === today && menu.is_published;
      });

      if (!todayMenu) {
        // Show restaurant info even without menu
        setRestaurant({ ...data, menus: [] });
        return;
      }

      if (!todayMenu.menu_items || todayMenu.menu_items.length === 0) {
        setError('Менюто за днес е празно');
        return;
      }

      setRestaurant({
        ...data,
        menus: [todayMenu]
      });
      
      // Fetch restaurant stats
      await fetchRestaurantStats(data.id);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      setError('Грешка при зареждането на ресторанта');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantStats = async (restaurantId?: string) => {
    const id = restaurantId || restaurant?.id;
    if (!id) return;

    try {
      const { data: reviewStats } = await supabase
        .from('reviews')
        .select('rating')
        .eq('restaurant_id', id);
      
      const averageRating = reviewStats && reviewStats.length > 0
        ? reviewStats.reduce((sum, review) => sum + review.rating, 0) / reviewStats.length
        : 0;
      
      setRestaurant(prev => prev ? {
        ...prev,
        average_rating: averageRating,
        review_count: reviewStats?.length || 0
      } : null);
    } catch (error) {
      console.error('Error fetching restaurant stats:', error);
    }
  };

  const fetchUserReview = async () => {
    if (!user || !restaurant) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setUserReview(data);
    } catch (error) {
      console.error('Error fetching user review:', error);
    }
  };

  const addToCart = (itemId: string, quantity: number = 1) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + quantity
    }));
  };

  const updateCart = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => {
        const newCart = { ...prev };
        delete newCart[itemId];
        return newCart;
      });
    } else {
      setCart(prev => ({
        ...prev,
        [itemId]: quantity
      }));
    }
  };

  const getCartTotal = () => {
    if (!restaurant?.menus[0]?.menu_items) return 0;
    
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = restaurant.menus[0].menu_items.find(item => item.id === itemId);
      return total + (item?.price || 0) * quantity;
    }, 0);
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Ресторантът не е намерен'}
          </h1>
          <p className="text-gray-600">
            Моля, опитайте отново по-късно или се върнете към началната страница
          </p>
        </div>
      </div>
    );
  }

  // Show restaurant info even if no menu
  if (!restaurant?.menus || restaurant.menus.length === 0) {
    return <RestaurantInfoOnly restaurant={restaurant} />;
  }

  const menu = restaurant.menus[0];
  const currentTime = new Date();
  const cutoffTime = new Date();
  const [hours, minutes] = restaurant.cutoff_time.split(':');
  cutoffTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const isOrdersDisabled = restaurant.orders_enabled === false;
  const isTimeClosed = currentTime >= cutoffTime;
  const canOrder = !isTimeClosed && !isOrdersDisabled;

  return (
    <RestaurantWithMenu 
      restaurant={restaurant}
      menu={menu}
      canOrder={canOrder}
      isOrdersDisabled={isOrdersDisabled}
      isTimeClosed={isTimeClosed}
      cart={cart}
      cartOpen={cartOpen}
      setCartOpen={setCartOpen}
      addToCart={addToCart}
      updateCart={updateCart}
      getCartTotal={getCartTotal}
      getCartItemCount={getCartItemCount}
      userReview={userReview}
    />
  );
}

// Component for restaurant without menu
function RestaurantInfoOnly({ restaurant }: { restaurant: Tables<'restaurants'> | null }) {
  if (!restaurant) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
            <div className="mb-4 md:mb-0">
              {restaurant.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.name}
                  className="h-24 w-24 object-cover rounded-xl"
                />
              ) : (
                <div className="h-24 w-24 bg-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {restaurant.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {restaurant.name}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin size={16} className="mr-2" />
                  <span>{restaurant.address}</span>
                </div>
                
                <div className="flex items-center">
                  <Phone size={16} className="mr-2" />
                  <span>{restaurant.phone}</span>
                </div>
                
                {!isOrdersDisabled && (
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2" />
                    <span>Поръчки до {restaurant.cutoff_time.slice(0, 5)}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Mail size={16} className="mr-2" />
                  <span>{restaurant.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* No Menu Message */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ресторантът няма меню за днес
          </h2>
          <p className="text-gray-600">
            Моля, опитайте отново по-късно или се върнете към началната страница
          </p>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <ReviewsSection 
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
        />
      </div>
    </div>
  );
}

// Component for restaurant with menu
function RestaurantWithMenu({ 
  restaurant, 
  menu, 
  canOrder, 
  cart, 
  cartOpen,
  setCartOpen,
  addToCart, 
  updateCart, 
  getCartTotal, 
  getCartItemCount,
  userReview,
  isOrdersDisabled,
  isTimeClosed
}: {
  restaurant: RestaurantWithMenu;
  menu: any;
  canOrder: boolean;
  isOrdersDisabled: boolean;
  isTimeClosed: boolean;
  cart: { [itemId: string]: number };
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (itemId: string, quantity?: number) => void;
  updateCart: (itemId: string, quantity: number) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  userReview: Tables<'reviews'> | null;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const { isAuthenticated } = useAuthContext();

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Get available categories from menu items
  const availableCategories = React.useMemo(() => {
    if (!menu.menu_items) return [];
    
    const categories = [...new Set(menu.menu_items.map((item: any) => item.category))];
    return categories.filter(cat => cat); // Remove empty categories
  }, [menu.menu_items]);

  const categoryNames: { [key: string]: string } = {
    all: 'Всички',
    salad: 'Салати',
    soup: 'Супи', 
    main: 'Основни',
    dessert: 'Десерти',
    drink: 'Напитки'
  };

  // Filter items based on active category
  const filteredItems = React.useMemo(() => {
    if (!menu.menu_items) return [];
    if (activeCategory === 'all') return menu.menu_items;
    return menu.menu_items.filter((item: any) => item.category === activeCategory);
  }, [menu.menu_items, activeCategory]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
            {/* Logo */}
            <div className="mb-4 md:mb-0">
              {restaurant.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.name}
                  className="h-24 w-24 object-cover rounded-xl"
                />
              ) : (
                <div className="h-24 w-24 bg-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {restaurant.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Restaurant Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {restaurant.name}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin size={16} className="mr-2" />
                  <span>{restaurant.address}</span>
                </div>
                
                <div className="flex items-center">
                  <Phone size={16} className="mr-2" />
                  <span>{restaurant.phone}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock size={16} className="mr-2" />
                  <span>Поръчки до {restaurant.cutoff_time.slice(0, 5)}</span>
                </div>
                
                <div className="flex items-center">
                  <Mail size={16} className="mr-2" />
                  <span>{restaurant.email}</span>
                </div>
              </div>

              {/* Delivery Info - Compact */}
              {!isOrdersDisabled && (
                <div className="mb-4">
                  <DeliveryInfo
                    deliveryFee={restaurant.delivery_fee || 0}
                    freeDeliveryThreshold={restaurant.free_delivery_threshold}
                    deliveryType={restaurant.delivery_type || 'fixed'}
                    currentCartTotal={getCartTotal()}
                    compact={true}
                  />
                </div>
              )}

              {/* Delivery Zones */}
              {!isOrdersDisabled && restaurant.districts && restaurant.districts.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Райони за доставка:</p>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.districts.map((district) => (
                      <span 
                        key={district}
                        className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                      >
                        {district}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-2 mb-2">
                {renderStars(Math.round(restaurant.average_rating || 0))}
                <span className="text-lg font-medium text-gray-900">
                  {(restaurant.average_rating || 0).toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({restaurant.review_count || 0} {(restaurant.review_count || 0) === 1 ? 'отзив' : 'отзива'})
                </span>
              </div>
              
              {isAuthenticated && (
                <div>
                  {userReview ? (
                    <span className="text-sm text-green-600 flex items-center">
                      <MessageCircle size={14} className="mr-1" />
                      Вече сте дали своят отзив
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowAddReview(true)}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center transition-colors"
                    >
                      <MessageCircle size={14} className="mr-1" />
                      Остави отзив
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ordering Status - closed by time */}
      {isTimeClosed && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-r">
          <div className="flex">
            <Clock className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">
                Поръчките за днес са затворени
              </p>
              <p className="text-red-600 text-sm">
                Ресторантът приема поръчки до {restaurant.cutoff_time.slice(0, 5)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ordering Status - disabled by restaurant */}
      {isOrdersDisabled && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-r">
          <div className="flex">
            <Store className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium">
                Ресторантът не приема поръчки онлайн
              </p>
              <p className="text-yellow-700 text-sm">
                Можете да разглеждате менюто като каталог
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Меню за днес ({format(new Date(menu.menu_date), 'dd.MM.yyyy')})
          </h2>
          
          {canOrder && getCartItemCount() > 0 && (
            <button
              onClick={() => setShowCheckout(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <ShoppingCart size={20} />
              <span>{getCartItemCount()} • {getCartTotal().toFixed(2)} лв</span>
            </button>
          )}
        </div>


        {/* Category Tabs */}
        {availableCategories.length > 0 && (
          <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Всички
            </button>
            {availableCategories.map((categoryKey) => (
              <button
                key={categoryKey}
                onClick={() => setActiveCategory(categoryKey)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeCategory === categoryKey
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {categoryNames[categoryKey] || categoryKey}
              </button>
            ))}
          </div>
          </div>
        )}

        {/* Menu Items */}
        {filteredItems && filteredItems.length > 0 ? (
          <div className="space-y-6">
            {activeCategory === 'all' ? (
              // Show all categories with banners
              availableCategories.map((categoryKey) => {
                const categoryItems = menu.menu_items.filter((item: any) => item.category === categoryKey);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={categoryKey} className="space-y-4">
                    {/* Category Banner */}
                    <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-red-500">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {categoryNames[categoryKey] || categoryKey}
                      </h3>
                    </div>

                    {/* Category Items */}
                    <div className="space-y-3">
                      {categoryItems.map((item: any) => (
                        <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">
                                {item.name}
                              </h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-4">
                                <span className="font-semibold text-lg text-red-600">
                                  {item.price.toFixed(2)} лв
                                </span>
                                {item.stock > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {item.stock} налични
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              {cart[item.id] > 0 ? (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => updateCart(item.id, cart[item.id] - 1)}
                                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <span className="font-medium min-w-8 text-center">
                                    {cart[item.id]}
                                  </span>
                                  <button
                                    onClick={() => updateCart(item.id, cart[item.id] + 1)}
                                    disabled={item.stock > 0 && cart[item.id] >= item.stock}
                                    className="bg-red-600 text-white hover:bg-red-700 p-2 rounded-lg disabled:opacity-50 transition-colors"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item.id)}
                                  disabled={!canOrder || (item.stock > 0 && item.stock <= 0)}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                  + Добави
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              // Show filtered category
              <div className="space-y-3">
                {filteredItems.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-lg text-red-600">
                            {item.price.toFixed(2)} лв
                          </span>
                          {item.stock > 0 && (
                            <span className="text-xs text-gray-500">
                              {item.stock} налични
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {cart[item.id] > 0 ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateCart(item.id, cart[item.id] - 1)}
                              className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="font-medium min-w-8 text-center">
                              {cart[item.id]}
                            </span>
                            <button
                              onClick={() => updateCart(item.id, cart[item.id] + 1)}
                              disabled={item.stock > 0 && cart[item.id] >= item.stock}
                              className="bg-red-600 text-white hover:bg-red-700 p-2 rounded-lg disabled:opacity-50 transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item.id)}
                            disabled={!canOrder || (item.stock > 0 && item.stock <= 0)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            + Добави
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {activeCategory === 'all' 
                ? 'Няма ястия в менюто'
                : `Няма ястия в категория "${categoryNames[activeCategory] || activeCategory}"`
              }
            </p>
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <ReviewsSection 
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
        />
      </div>

      {/* Direct Checkout Modal */}
      {showCheckout && (
        <CheckoutForm
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          items={menu.menu_items?.filter(item => cart[item.id]) || []}
          quantities={cart}
          restaurant={restaurant}
          subtotal={getCartTotal()}
          deliveryFee={3.00}
          total={getCartTotal() + 3.00}
          onSuccess={() => {
            setShowCheckout(false);
            Object.keys(cart).forEach(itemId => {
              updateCart(itemId, 0);
            });
          }}
        />
      )}

      {/* Add Review Modal */}
      {showAddReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Добави отзив</h3>
                <button
                  onClick={() => setShowAddReview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Отидете в секцията "Отзиви" по-долу, за да добавите вашия отзив.
              </p>
              <button
                onClick={() => {
                  setShowAddReview(false);
                  // Scroll to reviews section
                  const reviewsSection = document.querySelector('[data-reviews-section]');
                  if (reviewsSection) {
                    reviewsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Отиди към отзивите
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}