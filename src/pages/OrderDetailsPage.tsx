import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { MapPanel } from '../components/orders/MapPanel';

type OrderRow = Tables<'orders'> & { order_items: Tables<'order_items'>[] };

export function OrderDetailsPage({ orderId }: { orderId?: string }) {
  const params = useParams<{ id: string }>();
  const id = orderId || params.id;
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        setOrder(data as any);
      } catch (e: any) {
        setError('Грешка при зареждането на поръчката');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 mb-4">{error || 'Поръчката не е намерена'}</p>
          <Link to="/restaurant" className="text-red-600 hover:underline">Назад</Link>
        </div>
      </div>
    );
  }

  const itemsQty = order.order_items?.reduce((sum, i) => sum + i.qty, 0) || 0;
  const addressFull = [order.address_line, order.address_extra].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</h1>
              <div className="mt-2 flex items-center space-x-2">
              <div className="text-sm text-gray-600">Статус: <span className="font-medium capitalize">{order.status}</span></div>
              <div className="text-sm text-gray-600">{new Date(order.created_at).toLocaleString('bg-BG')}</div>
                <button
                  className="px-3 py-1.5 rounded bg-green-600 text-white text-sm hover:bg-green-700"
                  onClick={async () => { await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id); setOrder({ ...order, status: 'confirmed' }); }}
                >
                  Потвърди
                </button>
                <button
                  className="px-3 py-1.5 rounded border border-red-300 text-red-700 text-sm hover:bg-red-50"
                  onClick={async () => { await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id); setOrder({ ...order, status: 'cancelled' }); }}
                >
                  Откажи
                </button>
              </div>
            </div>
          </div>
          <div className="text-right mt-2">
            <p className="text-2xl font-bold text-gray-900">{order.total.toFixed(2)} лв</p>
            <p className="text-sm text-gray-600">Артикули: {itemsQty}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="text-sm font-medium text-gray-900">Артикули</h3>
              </div>
              <div className="p-4 divide-y">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div className="text-sm text-gray-900">
                      {item.qty} × {item.name}
                    </div>
                    <div className="text-sm text-gray-900">{(item.unit_price * item.qty).toFixed(2)} лв</div>
                  </div>
                ))}
                <div className="pt-4 mt-2 border-t text-sm">
                  <div className="flex justify-between"><span>Междинна сума</span><span>{order.subtotal.toFixed(2)} лв</span></div>
                  <div className="flex justify-between"><span>Доставка</span><span>{order.delivery_fee.toFixed(2)} лв</span></div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-700"><span>Отстъпка</span><span>-{order.discount.toFixed(2)} лв</span></div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900 mt-2"><span>Общо</span><span>{order.total.toFixed(2)} лв</span></div>
                </div>
              </div>
            </div>
            {/* Timeline removed per request */}
          </div>

          {/* Right column: customer + map */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="text-sm font-medium text-gray-900">Клиент</h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="text-gray-900 font-medium">{order.customer_name}</div>
                <div>
                  <a className="text-red-600 hover:underline" href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
                </div>
                <div className="text-gray-600">{addressFull}</div>
                {order.delivery_window && (
                  <div className="text-gray-600">Прозорец доставка: {order.delivery_window}</div>
                )}
              </div>
            </div>

            <MapPanel fullAddress={addressFull} />
            
          </div>
        </div>
      </div>
    </div>
  );
}


