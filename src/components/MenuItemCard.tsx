import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Tables } from '../lib/supabase';

interface MenuItemCardProps {
  item: Tables<'menu_items'>;
  quantity: number;
  onAddToCart: () => void;
  onUpdateQuantity: (quantity: number) => void;
  disabled?: boolean;
}

export function MenuItemCard({ 
  item, 
  quantity, 
  onAddToCart, 
  onUpdateQuantity, 
  disabled = false 
}: MenuItemCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Item Image */}
      <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-6xl">🍽️</div>
        )}
      </div>

      <div className="p-4">
        {/* Item Name and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
            {item.name}
          </h3>
          <span className="text-lg font-bold text-red-600 ml-2">
            {item.price.toFixed(2)} лв
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Stock Status */}
        {item.stock !== null && item.stock <= 0 && (
          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mb-3">
            Няма в наличност
          </div>
        )}

        {/* Add to Cart Controls */}
        <div className="flex items-center justify-between">
          {quantity === 0 ? (
            <button
              onClick={onAddToCart}
              disabled={disabled || (item.stock !== null && item.stock <= 0)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                disabled || (item.stock !== null && item.stock <= 0)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Добави
            </button>
          ) : (
            <div className="flex items-center space-x-3 flex-1">
              <button
                onClick={() => onUpdateQuantity(quantity - 1)}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
              >
                <Minus size={16} />
              </button>
              
              <span className="font-medium text-lg min-w-8 text-center">
                {quantity}
              </span>
              
              <button
                onClick={() => onUpdateQuantity(quantity + 1)}
                disabled={item.stock !== null && quantity >= item.stock}
                className={`p-2 rounded-lg transition-colors ${
                  item.stock !== null && quantity >= item.stock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <Plus size={16} />
              </button>
              
              <div className="flex-1 text-right">
                <span className="text-sm font-medium text-gray-900">
                  {(item.price * quantity).toFixed(2)} лв
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}