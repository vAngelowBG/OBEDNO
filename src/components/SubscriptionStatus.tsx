import React, { useState, useEffect } from 'react';
import { Crown, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { getProductByPriceId } from '../stripe-config';

interface SubscriptionData {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export function SubscriptionStatus() {
  const { isAuthenticated } = useAuthContext();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    }
  }, [isAuthenticated]);

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
      setLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return null;
  }

  if (!subscription || !subscription.subscription_id) {
    return null;
  }

  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null;
  const isActive = subscription.subscription_status === 'active';
  const isPastDue = subscription.subscription_status === 'past_due';
  const isCanceled = subscription.subscription_status === 'canceled';

  const getStatusColor = () => {
    if (isActive) return 'text-green-600 bg-green-50 border-green-200';
    if (isPastDue) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (isCanceled) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusText = () => {
    switch (subscription.subscription_status) {
      case 'active':
        return 'Активна';
      case 'past_due':
        return 'Просрочена';
      case 'canceled':
        return 'Отказана';
      case 'trialing':
        return 'Пробен период';
      case 'incomplete':
        return 'Непълна';
      default:
        return subscription.subscription_status;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Crown size={20} />
          <div>
            <h3 className="font-medium">
              {product?.name || 'Абонамент'}
            </h3>
            <p className="text-sm opacity-75">
              Статус: {getStatusText()}
            </p>
          </div>
        </div>

        {(isPastDue || isCanceled) && (
          <AlertCircle size={20} />
        )}
      </div>

      {subscription.current_period_end && (
        <div className="mt-3 flex items-center space-x-2 text-sm opacity-75">
          <Calendar size={16} />
          <span>
            {subscription.cancel_at_period_end ? 'Изтича на' : 'Подновява се на'}: {' '}
            {new Date(subscription.current_period_end * 1000).toLocaleDateString('bg-BG')}
          </span>
        </div>
      )}

      {subscription.payment_method_brand && subscription.payment_method_last4 && (
        <div className="mt-2 flex items-center space-x-2 text-sm opacity-75">
          <CreditCard size={16} />
          <span>
            {subscription.payment_method_brand.toUpperCase()} ****{subscription.payment_method_last4}
          </span>
        </div>
      )}
    </div>
  );
}