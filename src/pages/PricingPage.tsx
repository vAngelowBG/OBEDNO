import React from 'react';
import { Navigate } from 'react-router-dom';
import { products } from '../stripe-config';
import { ProductCard } from '../components/ProductCard';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { useAuthContext } from '../contexts/AuthContext';

export function PricingPage() {
  const { isAuthenticated, isRestaurant, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Redirect non-restaurant users to home
  if (isAuthenticated && !isRestaurant) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            План за ресторанти
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Абонирайте се за месечния план и започнете да приемате поръчки чрез OBEDNO
          </p>
        </div>

        {/* Subscription Status */}
        {isAuthenticated && isRestaurant && (
          <div className="max-w-md mx-auto mb-8">
            <SubscriptionStatus />
          </div>
        )}

        {/* Products Grid */}
        <div className="max-w-md mx-auto">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              isPopular={true}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Често задавани въпроси
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Какво включва месечният план?
              </h3>
              <p className="text-gray-600">
                Месечният план ви дава достъп до всички функции на платформата - управление на менюта, приемане на поръчки, статистики и поддръжка.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Мога ли да отменя абонамента си по всяко време?
              </h3>
              <p className="text-gray-600">
                Да, можете да отмените абонамента си по всяко време. Ще запазите достъп до функциите до края на текущия период.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Какви методи за плащане приемате?
              </h3>
              <p className="text-gray-600">
                Приемаме всички основни кредитни и дебитни карти чрез сигурната платформа на Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}