import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, CreditCard, Banknote, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  items: Tables<'menu_items'>[];
  quantities: { [itemId: string]: number };
  restaurant: Tables<'restaurants'>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  onSuccess: () => void;
}

interface FormData {
  customerName: string;
  customerPhone: string;
  addressLine: string;
  addressExtra?: string;
  paymentMethod: 'cash' | 'card' | 'online';
  replaceRules?: string;
}

export function CheckoutForm({
  isOpen,
  onClose,
  items,
  quantities,
  restaurant,
  subtotal,
  deliveryFee,
  total,
  onSuccess
}: CheckoutFormProps) {
  const { user, profile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      customerName: profile ? `${profile.first_name} ${profile.last_name}` : '',
      customerPhone: profile?.phone || '',
      paymentMethod: 'cash',
    }
  });

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: profile?.id || null,
          restaurant_id: restaurant.id,
          menu_date: format(new Date(), 'yyyy-MM-dd'),
          channel: 'web',
          payment_method: data.paymentMethod,
          payment_status: data.paymentMethod === 'cash' ? 'pending' : 'pending',
          status: 'pending',
          subtotal,
          delivery_fee: deliveryFee,
          total,
          currency: 'BGN',
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          address_line: data.addressLine,
          address_extra: data.addressExtra || null,
          replace_rules: data.replaceRules || null,
          delivery_window: restaurant.delivery_window,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items
        .filter(item => quantities[item.id] > 0)
        .map(item => ({
          order_id: order.id,
          menu_item_id: item.id,
          name: item.name,
          unit_price: item.price,
          qty: quantities[item.id],
        }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('Поръчката е направена успешно!');
      onSuccess();
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Грешка при създаването на поръчката');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethod = watch('paymentMethod');

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-60"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-full overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Финализиране на поръчка</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Информация за контакт</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Име и фамилия *
                    </label>
                    <input
                      {...register('customerName', { required: 'Името е задължително' })}
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {errors.customerName && (
                      <p className="text-red-600 text-xs mt-1">{errors.customerName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон *
                    </label>
                    <input
                      {...register('customerPhone', { required: 'Телефонът е задължителен' })}
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {errors.customerPhone && (
                      <p className="text-red-600 text-xs mt-1">{errors.customerPhone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <MapPin size={20} className="mr-2" />
                  Адрес за доставка
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Адрес *
                    </label>
                    <input
                      {...register('addressLine', { required: 'Адресът е задължителен' })}
                      type="text"
                      placeholder="ул. Витоша 1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {errors.addressLine && (
                      <p className="text-red-600 text-xs mt-1">{errors.addressLine.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Допълнителни указания
                    </label>
                    <input
                      {...register('addressExtra')}
                      type="text"
                      placeholder="Вход А, ет. 3, ап. 15"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Начин на плащане</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      {...register('paymentMethod')}
                      type="radio"
                      value="cash"
                      className="text-red-600 focus:ring-red-500"
                    />
                    <Banknote size={20} className="mx-3" />
                    <div>
                      <span className="font-medium">В брой при доставка</span>
                      <p className="text-sm text-gray-600">Плащане на куриера</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      {...register('paymentMethod')}
                      type="radio"
                      value="card"
                      className="text-red-600 focus:ring-red-500"
                    />
                    <CreditCard size={20} className="mx-3" />
                    <div>
                      <span className="font-medium">С карта при доставка</span>
                      <p className="text-sm text-gray-600">POS терминал при куриера</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Забележки за заместители
                </label>
                <textarea
                  {...register('replaceRules')}
                  placeholder="Например: Без лук, заменете месото с тофу, и др."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  В случай че дадено ястие не е налично, как да бъде заменено?
                </p>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Обобщение на поръчката</h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Ястия:</span>
                    <span>{subtotal.toFixed(2)} лв</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Доставка:</span>
                    <span>{deliveryFee.toFixed(2)} лв</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Общо:</span>
                      <span>{total.toFixed(2)} лв</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-2">
                  Очаквано време за доставка: {restaurant.delivery_window}
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отказ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Обработване...' : 'Потвърди поръчката'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}