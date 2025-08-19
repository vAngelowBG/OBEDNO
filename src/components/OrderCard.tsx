import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, MapPin, Calendar, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  name: string;
  unit_price: number;
  qty: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  currency: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  created_at: string;
  delivery_window: string | null;
  restaurant: {
    name: string;
    logo_url: string | null;
    city: string;
  };
}

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bg-BG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Sofia'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('bg-BG', {
      style: 'currency',
      currency: currency || 'BGN'
    }).format(amount);
  };

  const toggleDetails = async () => {
    if (isOpen) {
      // Just close
      setIsOpen(false);
      return;
    }

    // Opening - load items if not already loaded
    if (!hasLoaded) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select('id, name, unit_price, qty')
          .eq('order_id', order.id)
          .order('id', { ascending: true });

        if (error) throw error;

        setItems(data || []);
        setHasLoaded(true);
        setIsOpen(true);
      } catch (error) {
        console.error('Error fetching order items:', error);
        toast.error('Не успяхме да заредим детайлите.');
        return;
      } finally {
        setLoading(false);
      }
    } else {
      // Items already loaded, just toggle
      setIsOpen(true);
    }
  };

  const calculateLineTotal = (unitPrice: number, qty: number) => {
    return (unitPrice * qty).toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Restaurant Info */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {order.restaurant.logo_url ? (
              <img
                src={order.restaurant.logo_url}
                alt={order.restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-2xl">🍽️</div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {order.restaurant.name}
            </h3>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              {order.restaurant.city}
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="text-right">
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Order Details */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {formatDate(order.created_at)}
          </span>
        </div>
        
        {order.delivery_window && (
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {order.delivery_window}
            </span>
          </div>
        )}
        
        <div className="text-right">
          <span className="text-lg font-semibold text-gray-900">
            Сметка: {formatCurrency(order.total, order.currency)}
          </span>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={toggleDetails}
          aria-expanded={isOpen}
          aria-labelledby={`order-${order.id}-header`}
          className="w-full bg-gray-50 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center"
        >
          {isOpen ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Скрий детайли
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Виж детайли
            </>
          )}
        </button>
      </div>

      {/* Order Items Details Panel */}
      {isOpen && (
        <div
          id={`order-${order.id}-details`}
          role="region"
          aria-labelledby={`order-${order.id}-header`}
          className="mt-4 pt-4 border-t border-gray-200"
        >
          {loading ? (
            // Loading skeleton
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center animate-pulse">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            // Order items list
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      {item.qty} × {formatCurrency(item.unit_price, order.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {calculateLineTotal(item.unit_price, item.qty)} лв.
                    </div>
                  </div>
                </div>
              ))}

              {/* Order summary footer */}
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Междинна сума:</span>
                  <span className="font-medium">{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                {order.delivery_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Доставка:</span>
                    <span className="font-medium">{formatCurrency(order.delivery_fee, order.currency)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Отстъпка:</span>
                    <span className="font-medium text-green-600">-{formatCurrency(order.discount, order.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Общо:</span>
                  <span className="text-gray-900">{formatCurrency(order.total, order.currency)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
