import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

interface OrderTimelineProps {
  status: OrderStatus;
  createdAt: string;
}

const STEPS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered'];

const LABELS: Record<OrderStatus, string> = {
  pending: 'Поръчана',
  confirmed: 'Потвърдена',
  preparing: 'Приготвя се',
  ready: 'Готова',
  delivering: 'Доставя се',
  delivered: 'Доставена',
  cancelled: 'Отказана',
};

export function OrderTimeline({ status, createdAt }: OrderTimelineProps) {
  const currentIndex = status === 'cancelled' ? 0 : Math.max(0, STEPS.indexOf(status));

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Проследяване</h3>
      <ol className="space-y-3">
        {STEPS.map((step, index) => {
          const done = index <= currentIndex && status !== 'cancelled';
          const isCurrent = index === currentIndex;
          return (
            <li key={step} className="flex items-start">
              <div className={`mt-0.5 mr-3 ${done ? 'text-green-600' : 'text-gray-400'}`}>
                {done ? <CheckCircle size={16} /> : <Clock size={16} />}
              </div>
              <div>
                <p className={`text-sm ${done ? 'text-gray-900' : 'text-gray-600'}`}>{LABELS[step]}</p>
                {index === 0 && (
                  <p className="text-xs text-gray-500">{new Date(createdAt).toLocaleString('bg-BG')}</p>
                )}
              </div>
            </li>
          );
        })}
        {status === 'cancelled' && (
          <li className="flex items-start">
            <div className="mt-0.5 mr-3 text-red-600">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-sm text-red-700">Отказана</p>
            </div>
          </li>
        )}
      </ol>
    </div>
  );
}


