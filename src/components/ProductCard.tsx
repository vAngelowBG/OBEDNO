import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Product } from '../stripe-config';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  isPopular?: boolean;
}

export function ProductCard({ product, isPopular = false }: ProductCardProps) {
  const { isAuthenticated } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Моля, влезте в акаунта си за да продължите');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Моля, влезте в акаунта си отново');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при създаването на сесията');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Няма URL за пренасочване');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Грешка при обработката на плащането');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Пълен достъп до всички функции',
    'Приоритетна поддръжка',
    'Без реклами',
    'Месечни актуализации'
  ];

  return (
    <div className={`relative bg-white rounded-xl shadow-sm border-2 p-6 ${
      isPopular ? 'border-red-500' : 'border-gray-200'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Популярен
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 mb-4">
          {product.description}
        </p>
        <div className="text-3xl font-bold text-gray-900">
          1.00 лв
          {product.mode === 'subscription' && (
            <span className="text-base font-normal text-gray-600">/месец</span>
          )}
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center space-x-3">
            <Check size={16} className="text-green-500 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handlePurchase}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isPopular
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 size={16} className="animate-spin" />
            <span>Обработване...</span>
          </div>
        ) : (
          <>
            {product.mode === 'subscription' ? 'Започни абонамент' : 'Купи сега'}
          </>
        )}
      </button>
    </div>
  );
}