import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Tables } from '../lib/supabase';
import { CheckoutForm } from './CheckoutForm';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: Tables<'menu_items'>[];
  quantities: { [itemId: string]: number };
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  restaurant: Tables<'restaurants'>;
}

export function Cart({ 
  isOpen, 
  onClose, 
  items, 
  quantities, 
  onUpdateQuantity,
  restaurant 
}: CartProps) {
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => {
    const quantity = quantities[item.id] || 0;
    return sum + (item.price * quantity);
  }, 0);

  const deliveryFee = 3.00; // Fixed delivery fee
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    setShowCheckout(true);
    onClose(); // Close cart when opening checkout
  };

  const handleOrderSuccess = () => {
    setShowCheckout(false);
    // Clear cart logic could be added here
    Object.keys(quantities).forEach(itemId => {
      onUpdateQuantity(itemId, 0);
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ShoppingCart size={24} className="mr-2" />
              Количка
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">Количката ви е празна</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => {
                  const quantity = quantities[item.id] || 0;
                  if (quantity === 0) return null;

                  return (
                    <div key={item.id} className="flex items-center space-x-3 py-3 border-b border-gray-100">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.price.toFixed(2)} лв</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                          className="bg-gray-100 hover:bg-gray-200 p-1 rounded"
                        >
                          <Minus size={16} />
                        </button>
                        
                        <span className="font-medium min-w-8 text-center">
                          {quantity}
                        </span>
                        
                        <button
                          onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                          className="bg-gray-100 hover:bg-gray-200 p-1 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <span className="font-medium text-gray-900">
                          {(item.price * quantity).toFixed(2)} лв
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Междинна сума:</span>
                    <span>{subtotal.toFixed(2)} лв</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Доставка:</span>
                    <span>{deliveryFee.toFixed(2)} лв</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-gray-900">
                    <span>Общо:</span>
                    <span>{total.toFixed(2)} лв</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Продължи към поръчка
              </button>
            </>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutForm
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          items={items}
          quantities={quantities}
          restaurant={restaurant}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          total={total}
          onSuccess={handleOrderSuccess}
        />
      )}
    </>
  );
}