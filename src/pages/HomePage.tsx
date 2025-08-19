import React, { useState, useEffect } from 'react';
import { MapPin, Clock, AlertCircle, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { RestaurantCard } from '../components/RestaurantCard';
import { CitySelector } from '../components/CitySelector';
import { CutoffBanner } from '../components/CutoffBanner';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

export function HomePage() {
  const { profile } = useAuthContext();
  const [selectedCity, setSelectedCity] = useState(profile?.city || 'София');
  const [restaurants, setRestaurants] = useState<(Tables<'restaurants'> & {
    has_menu: boolean;
    cutoff_passed: boolean;
  })[]>([]);
  const [loading, setLoading] = useState(true);

  // Update selected city when profile changes
  useEffect(() => {
    if (profile?.city && profile.city !== selectedCity) {
      setSelectedCity(profile.city);
    }
  }, [profile]);

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCity]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('Today date:', today);

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
            menu_items(id)
          )
        `)
        .eq('city', selectedCity)
        .eq('status', 'active');

      if (error) throw error;

      console.log('Raw data from DB:', data);

      // Process all restaurants and check menu status
      const restaurantsWithMenus = await Promise.all(data?.map(async (restaurant: any) => {
        console.log(`Restaurant ${restaurant.name}:`, restaurant.menus);
        const todayMenu = restaurant.menus?.find((menu: any) => 
          menu.menu_date === today && menu.is_published
        );
        console.log(`Today menu for ${restaurant.name}:`, todayMenu);
        const currentTime = format(new Date(), 'HH:mm:ss');
        
        // Get average rating and review count
        const { data: reviewStats } = await supabase
          .from('reviews')
          .select('rating')
          .eq('restaurant_id', restaurant.id);
        
        const averageRating = reviewStats && reviewStats.length > 0
          ? reviewStats.reduce((sum, review) => sum + review.rating, 0) / reviewStats.length
          : 0;
        
        return {
          ...restaurant,
          has_menu: !!todayMenu && todayMenu.menu_items && todayMenu.menu_items.length > 0,
          cutoff_passed: currentTime > restaurant.cutoff_time,
          average_rating: averageRating,
          review_count: reviewStats?.length || 0
        };
      }) || []);

      console.log('Processed restaurants:', restaurantsWithMenus);
      setRestaurants(restaurantsWithMenus);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            OBEDNO
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Открий най-добрите обедни менюта в България
          </p>
          <div className="flex items-center justify-center space-x-2 text-lg">
            <Clock size={20} />
            <span>Днес, {format(new Date(), 'dd MMMM yyyy', { locale: bg })}</span>
          </div>
        </div>
      </div>

      {/* City Selector */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <CitySelector 
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
          />
        </div>
      </div>

      {/* Cutoff Banner */}
      <CutoffBanner selectedCity={selectedCity} />

      {/* Restaurants Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ресторанти в {selectedCity}
          </h2>
          <p className="text-gray-600">
            {restaurants.length} ресторанта с менюта за днес
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : restaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <RestaurantCard 
                key={restaurant.id} 
                restaurant={restaurant}
                showCutoffStatus
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Няма налични менюта
            </h3>
            <p className="text-gray-600">
              В момента няма ресторанти с публикувани менюта за днес в {selectedCity}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}