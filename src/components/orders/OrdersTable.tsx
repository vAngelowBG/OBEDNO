import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';

export interface OrderListItem {
  id: string;
  created_at: string;
  customer_name: string;
  address_line: string;
  status: string;
  total: number;
  items_qty: number;
}

interface OrdersTableProps {
  orders: OrderListItem[];
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onRowClick?: (id: string) => void;
}

export function OrdersTable({ orders, onConfirm, onCancel, onRowClick }: OrdersTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border bg-white">
      {/* Desktop/tablet table */}
      <div className="overflow-x-auto hidden sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Адрес</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Количество</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => (onRowClick ? onRowClick(order.id) : navigate(`/restaurant/orders/${order.id}`))}
              >
                <td className="px-4 py-3 text-sm text-gray-900">{order.id.slice(-8).toUpperCase()}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div>{new Date(order.created_at).toLocaleDateString('bg-BG')}</div>
                  <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{order.customer_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">{order.address_line}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{order.items_qty}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{order.total.toFixed(2)} лв</td>
                <td className="px-4 py-3 text-sm text-right"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onConfirm(order.id); }}
                    className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                  >
                    Потвърди
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCancel(order.id); }}
                    className="px-2 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Откажи
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-gray-200">
        {orders.map((order) => (
          <div key={order.id} className="p-4" onClick={() => (onRowClick ? onRowClick(order.id) : navigate(`/restaurant/orders/${order.id}`))}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</div>
              <div className="text-sm text-gray-900 font-semibold">{order.total.toFixed(2)} лв</div>
            </div>
            <div className="mt-1 text-xs text-gray-600">
              {new Date(order.created_at).toLocaleDateString('bg-BG')} • {new Date(order.created_at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="mt-2 text-sm text-gray-900">{order.customer_name}</div>
            <div className="text-sm text-gray-600">{order.address_line}</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-gray-600">Количество: {order.items_qty}</div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-3 flex items-center justify-end space-x-2">
              <button
                onClick={(e) => { e.stopPropagation(); onConfirm(order.id); }}
                className="px-3 py-1.5 text-xs rounded bg-green-600 text-white"
              >
                Потвърди
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onCancel(order.id); }}
                className="px-3 py-1.5 text-xs rounded border border-red-300 text-red-700"
              >
                Откажи
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


