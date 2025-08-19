import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { Calendar, DollarSign, ShoppingBag, Settings, Lock } from 'lucide-react';
import { MenuManager } from '../components/MenuManager';
import { OrdersManager } from '../components/OrdersManager';
import { RestaurantSetup } from '../components/RestaurantSetup';
import { WeeklyMenuPlanner } from '../components/WeeklyMenuPlanner';
import { StatsCards } from '../components/StatsCards';
import { supabase } from '../lib/supabase';

export function RestaurantDashboard() {
  const { isAuthenticated, isRestaurant, loading } = useAuthContext();
  const [activeTab, setActiveTab] = useState('settings');
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && isRestaurant) {
      fetchSubscription();
    }
  }, [isAuthenticated, isRestaurant]);

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
    } finally {
      setSubscriptionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isRestaurant) {
    return <Navigate to="/auth" replace />;
  }

  const isSubscriptionActive = subscription?.subscription_status === 'active';

  const tabs = [
    { id: 'settings', label: 'Настройки', icon: Settings },
    { id: 'today', label: 'Днешно меню', icon: Calendar },
    { id: 'orders', label: 'Поръчки', icon: ShoppingBag },
    { id: 'weekly', label: 'Седмично планиране', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Портал за ресторанти
          </h1>
          <p className="text-gray-600">
            Управлявайте менютата и поръчките си
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'settings' && <RestaurantSetup />}
            {activeTab === 'today' && <MenuManager mode="today" />}
            {activeTab === 'orders' && <OrdersManager />}
            {activeTab === 'weekly' && <MenuManager mode="weekly" />}
          </div>
        </div>
      </div>
    </div>
  );
}