import React from 'react';
import { Truck, Gift, Info } from 'lucide-react';

interface DeliveryInfoProps {
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  deliveryType: 'fixed' | 'free' | 'conditional';
  currentCartTotal?: number;
  compact?: boolean;
}

export function DeliveryInfo({ 
  deliveryFee, 
  freeDeliveryThreshold, 
  deliveryType, 
  currentCartTotal = 0,
  compact = false 
}: DeliveryInfoProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bg-BG', {
      style: 'currency',
      currency: 'BGN'
    }).format(amount);
  };

  const getDeliveryMessage = () => {
    switch (deliveryType) {
      case 'free':
        return (
          <div className="flex items-center text-green-600 font-medium">
            <Gift className="h-4 w-4 mr-2" />
            Безплатна доставка
          </div>
        );
      
      case 'conditional':
        if (freeDeliveryThreshold && currentCartTotal >= freeDeliveryThreshold) {
          return (
            <div className="flex items-center text-green-600 font-medium">
              <Gift className="h-4 w-4 mr-2" />
              Безплатна доставка
            </div>
          );
        } else if (freeDeliveryThreshold) {
          return (
            <div className="flex items-center text-gray-600">
              <Truck className="h-4 w-4 mr-2" />
              Доставка: {formatCurrency(deliveryFee)}
              <span className="text-green-600 ml-2">
                (Над {formatCurrency(freeDeliveryThreshold)} безплатна)
              </span>
            </div>
          );
        }
        return null;
      
      case 'fixed':
      default:
        return (
          <div className="flex items-center text-gray-600">
            <Truck className="h-4 w-4 mr-2" />
            Доставка: {formatCurrency(deliveryFee)}
          </div>
        );
    }
  };

  // Compact version for cards
  if (compact) {
    return (
      <div className="flex items-center text-sm text-gray-600">
        {deliveryType === 'free' ? (
          <>
            <Gift className="h-4 w-4 mr-2 text-green-600" />
            <span className="text-green-600 font-medium">Безплатна доставка</span>
          </>
        ) : deliveryType === 'conditional' && freeDeliveryThreshold ? (
          <>
            <Truck className="h-4 w-4 mr-2" />
            <span>Доставка: {formatCurrency(deliveryFee)}</span>
            <span className="text-green-600 ml-2">(Над {formatCurrency(freeDeliveryThreshold)} безплатна)</span>
          </>
        ) : (
          <>
            <Truck className="h-4 w-4 mr-2" />
            <span>Доставка: {formatCurrency(deliveryFee)}</span>
          </>
        )}
      </div>
    );
  }

  // Full version for detailed pages
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {getDeliveryMessage()}
        </div>
        
        {deliveryType === 'conditional' && freeDeliveryThreshold && currentCartTotal > 0 && (
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Количка: {formatCurrency(currentCartTotal)}
            </div>
            {currentCartTotal < freeDeliveryThreshold && (
              <div className="text-xs text-blue-600">
                Остават {formatCurrency(freeDeliveryThreshold - currentCartTotal)}
              </div>
            )}
          </div>
        )}
      </div>
      
      {deliveryType === 'conditional' && freeDeliveryThreshold && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Доставка за {formatCurrency(deliveryFee)}, безплатна над {formatCurrency(freeDeliveryThreshold)}
          </div>
        </div>
      )}
    </div>
  );
}
