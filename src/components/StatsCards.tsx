import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, TrendingUp, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { format } from 'date-fns';

export function StatsCards() {
  const { profile } = useAuthContext();
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    monthlyOrders: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchSubscription();
  }, [profile]);

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

  const fetchStats = async () => {
    if (!profile) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

      // Get restaurant
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', profile.id)
        .maybeSingle();

      if (!restaurant) return;

      // Today's stats
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('restaurant_id', restaurant.id)
        .eq('menu_date', today);

      // Monthly stats
      const { data: monthlyOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('restaurant_id', restaurant.id)
        .gte('menu_date', monthStart);

      const todayRevenue = todayOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const monthlyRevenue = monthlyOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      setStats({
        todayOrders: todayOrders?.length || 0,
        todayRevenue,
        monthlyOrders: monthlyOrders?.length || 0,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSubscriptionActive = subscription?.subscription_status === 'active';

  if (!isSubscriptionActive) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 relative">
            <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-lg flex items-center justify-center">
              <Lock size={24} className="text-gray-400" />
            </div>
            <div className="flex items-center opacity-25">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="h-6 w-6 bg-gray-300 rounded" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Заключено</p>
                <p className="text-2xl font-bold text-gray-900">---</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Днешни поръчки',
      value: loading ? '...' : stats.todayOrders.toString(),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Днешен оборот',
      value: loading ? '...' : `${stats.todayRevenue.toFixed(2)} лв`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Месечни поръчки',
      value: loading ? '...' : stats.monthlyOrders.toString(),
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Месечен оборот',
      value: loading ? '...' : `${stats.monthlyRevenue.toFixed(2)} лв`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`${card.bg} p-3 rounded-lg`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}