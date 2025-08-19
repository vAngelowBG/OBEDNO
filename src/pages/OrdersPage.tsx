import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, Loader2 } from 'lucide-react';
import { OrderCard } from '../components/OrderCard';

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

type StatusFilter = 'all' | 'active' | 'delivered' | 'cancelled';

export function OrdersPage() {
  const { profile, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

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

  const getStatusFilter = (filter: StatusFilter) => {
    switch (filter) {
      case 'active':
        return ['pending', 'confirmed', 'preparing', 'ready', 'delivering'];
      case 'delivered':
        return ['delivered'];
      case 'cancelled':
        return ['cancelled'];
      default:
        return ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];
    }
  };

  const fetchOrders = async (pageNum: number, reset: boolean = false) => {
    try {
      const statuses = getStatusFilter(statusFilter);
      const from = pageNum * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          currency,
          subtotal,
          delivery_fee,
          discount,
          created_at,
          delivery_window,
          restaurant:restaurants(
            name,
            logo_url,
            city
          )
        `)
        .eq('client_id', profile?.id)
        .in('status', statuses)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Transform the data to fix the restaurant type issue
      const transformedData = (data || []).map(order => ({
        ...order,
        restaurant: Array.isArray(order.restaurant) ? order.restaurant[0] : order.restaurant
      }));

      if (reset) {
        setOrders(transformedData);
        setPage(0);
      } else {
        setOrders(prev => [...prev, ...transformedData]);
      }

      setHasMore((data?.length || 0) === pageSize);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      setLoading(true);
      fetchOrders(0, true).finally(() => setLoading(false));
    }
  }, [profile?.id, statusFilter]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    await fetchOrders(page + 1);
    setPage(prev => prev + 1);
    setLoadingMore(false);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600 mb-4" />
          <p className="text-gray-600">Зареждане на поръчките...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Моите поръчки</h1>
          <p className="text-gray-600">История на всички ваши поръчки</p>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Всички' },
              { key: 'active', label: 'Активни' },
              { key: 'delivered', label: 'Доставени' },
              { key: 'cancelled', label: 'Отказани' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key as StatusFilter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === key
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <Clock className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нямате поръчки</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all' 
                ? "Нямате поръчки. Разгледайте ресторантите в вашия град."
                : "Няма поръчки с избрания статус."
              }
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Разгледай ресторанти
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-white text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Зареждане...
                    </>
                  ) : (
                    'Зареди още'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
