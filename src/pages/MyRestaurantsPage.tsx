import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Store, MapPin, Clock, Loader2, Utensils } from 'lucide-react';

interface Restaurant {
  restaurant_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  city: string;
  last_order_at: string;
}

export function MyRestaurantsPage() {
  const { profile, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    if (profile && profile.role !== 'client') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, profile, navigate]);

  useEffect(() => {
    if (profile?.id) {
      fetchRestaurants();
    }
  }, [profile?.id]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      
      // First get distinct restaurant IDs from orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('restaurant_id')
        .eq('client_id', profile?.id)
        .not('restaurant_id', 'is', null);

      if (orderError) throw orderError;

      if (!orderData || orderData.length === 0) {
        setRestaurants([]);
        return;
      }

      const restaurantIds = [...new Set(orderData.map(o => o.restaurant_id))];

      // Then get restaurant details with last order date
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select(`
          id,
          name,
          slug,
          logo_url,
          city
        `)
        .in('id', restaurantIds);

      if (restaurantError) throw restaurantError;

      // Get last order date for each restaurant
      const restaurantsWithDates = await Promise.all(
        restaurantData.map(async (restaurant) => {
          const { data: lastOrder } = await supabase
            .from('orders')
            .select('created_at')
            .eq('client_id', profile?.id)
            .eq('restaurant_id', restaurant.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            restaurant_id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            logo_url: restaurant.logo_url,
            city: restaurant.city,
            last_order_at: lastOrder?.created_at || ''
          };
        })
      );

      // Sort by last order date (most recent first)
      const sortedRestaurants = restaurantsWithDates.sort((a, b) => 
        new Date(b.last_order_at).getTime() - new Date(a.last_order_at).getTime()
      );

      setRestaurants(sortedRestaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastOrderDate = (dateString: string) => {
    if (!dateString) return 'Няма поръчки';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `Преди ${diffDays} дни`;
    if (diffDays < 30) return `Преди ${Math.ceil(diffDays / 7)} седмици`;
    if (diffDays < 365) return `Преди ${Math.ceil(diffDays / 30)} месеца`;
    return `Преди ${Math.ceil(diffDays / 365)} години`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600 mb-4" />
          <p className="text-gray-600">Зареждане на ресторантите...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Моите ресторанти</h1>
          <p className="text-gray-600">Ресторанти, от които сте поръчвали</p>
        </div>

        {/* Restaurants Grid */}
        {restaurants.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <Store className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Още нямате любими ресторанти
            </h3>
            <p className="text-gray-600 mb-6">
              Поръчайте първо от някой ресторант, за да се появи тук.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Разгледай ресторанти
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.restaurant_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Restaurant Logo */}
                <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {restaurant.logo_url ? (
                    <img
                      src={restaurant.logo_url}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-6xl">🍽️</div>
                  )}
                </div>

                {/* Restaurant Info */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {restaurant.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{restaurant.city}</span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-4">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      Последна поръчка: {formatLastOrderDate(restaurant.last_order_at)}
                    </span>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => navigate(`/restaurant/${restaurant.slug}`)}
                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                  >
                    <Utensils className="h-4 w-4 mr-2" />
                    Виж меню
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
