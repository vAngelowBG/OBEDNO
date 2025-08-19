import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Phone, MapPin, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { audioService } from '../services/audioService';

type OrderWithItems = Tables<'orders'> & {
  order_items: Tables<'order_items'>[];
};

export function OrdersManager() {
  const { profile } = useAuthContext();
  const [restaurant, setRestaurant] = useState<Tables<'restaurants'> | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered'>('all');
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchRestaurant();
    fetchSubscription();
  }, [profile]);

  useEffect(() => {
    if (!restaurant) return;
    fetchOrders();
  }, [restaurant]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchRestaurant = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const fetchOrders = async () => {
    if (!restaurant) return;

    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Tables<'orders'>['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId
            ? { ...order, status }
            : order
        )
      );

      toast.success('Статусът на поръчката е обновен');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Грешка при обновяването на статуса');
    }
  };

  const getStatusColor = (status: Tables<'orders'>['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivering':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Tables<'orders'>['status']) => {
    const statusMap = {
      pending: 'Очаква',
      confirmed: 'Потвърдена',
      preparing: 'Приготвя се',
      ready: 'Готова',
      delivering: 'Доставя се',
      delivered: 'Доставена',
      cancelled: 'Отказана',
    };
    return statusMap[status] || status;
  };

  const getNextStatus = (currentStatus: Tables<'orders'>['status']) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivering',
      delivering: 'delivered',
    } as const;
    
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const isSubscriptionActive = subscription?.subscription_status === 'active';

  if (loading) {
    return <div className="animate-pulse">Зареждане...</div>;
  }

  if (!restaurant) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Моля, първо настройте вашия ресторант</p>
      </div>
    );
  }

  if (!isSubscriptionActive) {
    return (
      <div className="text-center py-12">
        <Lock size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Абонамент е необходим
        </h3>
        <p className="text-gray-600 mb-4">
          За да управлявате поръчките си, трябва да имате активен абонамент.
        </p>
        <p className="text-sm text-gray-500">
          Отидете в раздел "Настройки" за да се абонирате.
        </p>
      </div>
    );
  }

  const statusFilters = [
    { key: 'all', label: 'Всички', count: orders.length },
    { key: 'pending', label: 'Очакващи', count: orders.filter(o => o.status === 'pending').length },
    { key: 'confirmed', label: 'Потвърдени', count: orders.filter(o => o.status === 'confirmed').length },
    { key: 'preparing', label: 'Приготвят се', count: orders.filter(o => o.status === 'preparing').length },
    { key: 'ready', label: 'Готови', count: orders.filter(o => o.status === 'ready').length },
  ];

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {statusFilters.map((filterItem) => (
          <button
            key={filterItem.key}
            onClick={() => setFilter(filterItem.key as any)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === filterItem.key
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filterItem.label}
            {filterItem.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === filterItem.key
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {filterItem.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              {filter === 'all' ? 'Няма поръчки' : `Няма поръчки със статус "${getStatusText(filter as any)}"`}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Поръчка #{order.id.slice(-8)}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: bg })}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {order.total.toFixed(2)} лв
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.payment_method === 'cash' ? 'В брой' : 'С карта'}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Phone size={16} className="text-gray-400" />
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-gray-600">{order.customer_phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">{order.address_line}</p>
                    {order.address_extra && (
                      <p className="text-xs text-gray-500">{order.address_extra}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Ястия:</h4>
                <div className="space-y-1">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.qty}x {item.name}</span>
                      <span>{(item.unit_price * item.qty).toFixed(2)} лв</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {order.replace_rules && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Забележки:</p>
                  <p className="text-sm text-yellow-700">{order.replace_rules}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>Доставка: {order.delivery_window}</span>
                </div>

                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <div className="flex space-x-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="px-3 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors text-sm"
                      >
                        Откажи
                      </button>
                    )}
                    
                    {getNextStatus(order.status) && (
                      <button
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        {order.status === 'pending' && 'Потвърди'}
                        {order.status === 'confirmed' && 'Започни приготвяне'}
                        {order.status === 'preparing' && 'Готова за доставка'}
                        {order.status === 'ready' && 'Изпрати за доставка'}
                        {order.status === 'delivering' && 'Маркирай като доставена'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}