import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, Truck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { DeliveryInfo } from './DeliveryInfo';

interface RestaurantCardProps {
  restaurant: Tables<'restaurants'> & {
    has_menu?: boolean;
    cutoff_passed?: boolean;
    average_rating?: number;
    review_count?: number;
  };
  showCutoffStatus?: boolean;
}

export function RestaurantCard({ restaurant, showCutoffStatus = false }: RestaurantCardProps) {
  const canOrder = restaurant.has_menu && !restaurant.cutoff_passed;
  const rating = restaurant.average_rating || 0;
  const reviewCount = restaurant.review_count || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Restaurant Image/Logo */}
      <div className="h-32 bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
        {restaurant.logo_url ? (
          <img 
            src={restaurant.logo_url} 
            alt={restaurant.name}
            className="h-16 w-16 object-cover rounded-lg"
          />
        ) : (
          <div className="h-16 w-16 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {restaurant.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {restaurant.name}
          </h3>
          <div className="flex items-center text-sm text-yellow-600">
            <Star size={16} className="mr-1 fill-current" />
            <span>{rating.toFixed(1)}</span>
            {reviewCount > 0 && (
              <span className="text-gray-500 ml-1">({reviewCount})</span>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin size={14} className="mr-2" />
            <span className="line-clamp-1">{restaurant.address}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock size={14} className="mr-2" />
            <span>Поръчки до {restaurant.cutoff_time.slice(0, 5)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Truck size={14} className="mr-2" />
            <span>{restaurant.delivery_window}</span>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="mb-3">
          <DeliveryInfo
            deliveryFee={restaurant.delivery_fee || 0}
            freeDeliveryThreshold={restaurant.free_delivery_threshold}
            deliveryType={restaurant.delivery_type || 'fixed'}
            compact={true}
          />
        </div>

        {/* Districts */}
        {restaurant.districts && restaurant.districts.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Райони за доставка:</p>
            <div className="flex flex-wrap gap-1">
              {restaurant.districts.slice(0, 3).map((district) => (
                <span 
                  key={district}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  {district}
                </span>
              ))}
              {restaurant.districts.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{restaurant.districts.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Status and Action */}
        {showCutoffStatus && (
          <div className="mb-4">
            {restaurant.cutoff_passed ? (
              <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                <AlertCircle size={16} className="mr-2" />
                <span>Поръчките са затворени за днес</span>
              </div>
            ) : !restaurant.has_menu ? (
              <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                <AlertCircle size={16} className="mr-2" />
                <span>Няма меню за днес</span>
              </div>
            ) : (
              <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-2 rounded">
                <Clock size={16} className="mr-2" />
                <span>Приема поръчки</span>
              </div>
            )}
          </div>
        )}

        <Link
          to={`/restaurant/${restaurant.slug}`}
          className={`block w-full text-center py-2 px-4 rounded-lg font-medium transition-colors ${
            canOrder 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-gray-100 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canOrder ? 'Виж менюто' : 'Виж информация'}
        </Link>
      </div>
    </div>
  );
}