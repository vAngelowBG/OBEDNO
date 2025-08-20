import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { OrdersTable, OrderListItem } from './orders/OrdersTable';
import { Pagination } from './orders/Pagination';
import { OrderDetailsPage } from '../pages/OrderDetailsPage';
import jsPDF from 'jspdf';

type StatusFilter = 'all' | 'processing' | 'delivered' | 'cancelled';

export function OrdersManager() {
  const { profile } = useAuthContext();
  const [restaurant, setRestaurant] = useState<Tables<'restaurants'> | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurant();
    fetchSubscription();
  }, [profile]);

  useEffect(() => {
    if (!restaurant) return;
    fetchOrders();
  }, [restaurant, status, page, query, pageSize]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();
      if (!error) setSubscription(data);
    } catch {}
  };

  const fetchRestaurant = async () => {
    if (!profile) return;
    try {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', profile.id)
        .maybeSingle();
      setRestaurant(data);
    } catch {}
  };

  const statusIn = useMemo(() => {
    switch (status) {
      case 'processing':
        return ['pending', 'confirmed', 'preparing', 'ready', 'delivering'];
      case 'delivered':
        return ['delivered'];
      case 'cancelled':
        return ['cancelled'];
      default:
        return ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];
    }
  }, [status]);

  const fetchOrders = async () => {
    if (!restaurant) return;
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    try {
      let queryBuilder = supabase
        .from('orders')
        .select('id, created_at, customer_name, customer_phone, address_line, status, total, channel, order_items(qty)', { count: 'exact' })
        .eq('restaurant_id', restaurant.id)
        .in('status', statusIn)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (status === 'processing') {
        const today = new Date().toISOString().slice(0, 10);
        queryBuilder = queryBuilder.eq('menu_date', today);
      }

      if (query && query.trim().length > 0) {
        const q = query.trim();
        queryBuilder = queryBuilder.or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,id.ilike.%${q}%`);
      }

      const { data, error, count } = await queryBuilder;
      if (error) throw error;

      const mapped: OrderListItem[] = (data || []).map((row: any) => ({
        id: row.id,
        created_at: row.created_at,
        customer_name: row.customer_name,
        address_line: row.address_line,
        status: row.status,
        total: row.total,
        items_qty: (row.order_items || []).reduce((s: number, i: any) => s + (i.qty || 0), 0),
      }));

      setOrders(mapped);
      setTotal(count || 0);
    } catch (e) {
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const isSubscriptionActive = subscription?.subscription_status === 'active';

  const printToday = async () => {
    if (!restaurant) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('orders')
      .select('id, customer_name, order_items(name, qty)')
      .eq('restaurant_id', restaurant.id)
      .eq('menu_date', today)
      .order('created_at', { ascending: true });
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(14);
    doc.text(`Поръчки за днес (${today})`, 10, y);
    y += 8;
    (data || []).forEach((o: any, idx: number) => {
      doc.setFontSize(12);
      doc.text(`${idx + 1}. #${o.id.slice(-8)} — ${o.customer_name}`, 10, y);
      y += 6;
      (o.order_items || []).forEach((it: any) => {
        doc.setFontSize(10);
        doc.text(`- ${it.qty} x ${it.name}`, 12, y);
        y += 5;
        if (y > 280) { doc.addPage(); y = 10; }
      });
      y += 3;
      if (y > 285) { doc.addPage(); y = 10; }
    });
    doc.save('orders-today.pdf');
  };

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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Абонамент е необходим</h3>
        <p className="text-gray-600">За да управлявате поръчките си, трябва да имате активен абонамент.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedId ? (
        <div className="bg-white border rounded-lg p-4">
          <button className="text-gray-600 hover:text-gray-800 text-sm mb-3" onClick={() => setSelectedId(null)}>← Назад към поръчки</button>
          {/* Reuse details page in-tab via route component approach is complex; we render it directly by navigating to URL. */}
          <OrderDetailsPage orderId={selectedId!} />
        </div>
      ) : (
      <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2 bg-white rounded-lg border px-3 py-2 w-full max-w-sm">
          <Search size={16} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Търси по ID / име / телефон"
            className="w-full text-sm outline-none"
          />
        </div>
        <div className="flex items-center space-x-2">
          {[
            { key: 'all', label: 'Всички' },
            { key: 'processing', label: 'Поръчки за днес' },
            { key: 'cancelled', label: 'Отказани' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatus(f.key as StatusFilter); setPage(1); }}
              className={`px-3 py-1.5 rounded text-sm border ${status === f.key ? 'bg-red-600 text-white border-red-600' : 'bg-white hover:bg-gray-50'}`}
            >
              {f.label}
            </button>
          ))}
          <button onClick={printToday} className="px-3 py-1.5 rounded text-sm border bg-white hover:bg-gray-50">Принтирай поръчки за днес</button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Показани:</div>
        <select
          className="text-sm border rounded px-2 py-1"
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
        >
          {[10, 50, 100].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="min-h-[320px]">
        {loading ? (
          <div className="p-6 bg-white border rounded-lg animate-pulse">Зареждане...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-gray-600 bg-white border rounded-lg">Няма поръчки</div>
        ) : (
          <OrdersTable
            orders={orders}
            onConfirm={async (id) => { await supabase.from('orders').update({ status: 'confirmed' }).eq('id', id); fetchOrders(); }}
            onCancel={async (id) => { await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id); fetchOrders(); }}
            onRowClick={(id) => setSelectedId(id)}
          />
        )}
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => setPage(p)}
      />
      </>
      )}
    </div>
  );
}