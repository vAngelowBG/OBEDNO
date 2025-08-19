import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, X, Truck, Gift, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface DeliverySettingsProps {
  restaurantId: string;
  currentSettings: {
    delivery_fee: number;
    free_delivery_threshold: number | null;
    delivery_type: 'fixed' | 'free' | 'conditional';
  };
  onUpdate: (settings: any) => void;
}

interface DeliveryForm {
  delivery_type: 'fixed' | 'free' | 'conditional';
  delivery_fee: number;
  free_delivery_threshold: number | null;
}

export function DeliverySettings({ restaurantId, currentSettings, onUpdate }: DeliverySettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(currentSettings);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<DeliveryForm>({
    defaultValues: currentSettings
  });

  const watchedDeliveryType = watch('delivery_type');

  const onSubmit = async (data: DeliveryForm) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          delivery_type: data.delivery_type,
          delivery_fee: data.delivery_fee,
          free_delivery_threshold: data.free_delivery_threshold
        })
        .eq('id', restaurantId);

      if (error) throw error;

      setSettings(data);
      onUpdate(data);
      setIsEditing(false);
      toast.success('Настройките за доставка са обновени успешно');
    } catch (error) {
      console.error('Error updating delivery settings:', error);
      toast.error('Грешка при обновяването на настройките');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSettings(currentSettings);
    setIsEditing(false);
  };

  const getDeliveryTypeIcon = (type: string) => {
    switch (type) {
      case 'free':
        return <Gift className="h-5 w-5 text-green-600" />;
      case 'conditional':
        return <Target className="h-5 w-5 text-blue-600" />;
      default:
        return <Truck className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDeliveryTypeLabel = (type: string) => {
    switch (type) {
      case 'free':
        return 'Безплатна доставка';
      case 'conditional':
        return 'Условна безплатна доставка';
      default:
        return 'Фиксирана такса за доставка';
    }
  };

  if (isEditing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
          <Truck className="mr-2" size={20} />
          Настройки за доставка
        </h4>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Delivery Type Selection */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-3">
              Тип доставка
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['fixed', 'conditional', 'free'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, delivery_type: type }))}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    settings.delivery_type === type
                      ? 'border-blue-500 bg-blue-100 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {getDeliveryTypeIcon(type)}
                    <span className="text-sm font-medium">{getDeliveryTypeLabel(type)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Fee Input */}
          {settings.delivery_type !== 'free' && (
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Такса за доставка (лв)
              </label>
              <input
                {...register('delivery_fee', { 
                  required: 'Таксата за доставка е задължителна',
                  min: { value: 0, message: 'Таксата не може да е отрицателна' }
                })}
                type="number"
                step="0.01"
                min="0"
                className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.delivery_fee}
                onChange={(e) => setSettings(prev => ({ ...prev, delivery_fee: parseFloat(e.target.value) || 0 }))}
              />
              {errors.delivery_fee && (
                <p className="text-red-600 text-xs mt-1">{errors.delivery_fee.message}</p>
              )}
            </div>
          )}

          {/* Free Delivery Threshold Input */}
          {settings.delivery_type === 'conditional' && (
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Праг за безплатна доставка (лв)
              </label>
              <input
                {...register('free_delivery_threshold', { 
                  required: 'Прагът е задължителен за условната доставка',
                  min: { value: 0, message: 'Прагът не може да е отрицателен' }
                })}
                type="number"
                step="0.01"
                min="0"
                className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.free_delivery_threshold || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, free_delivery_threshold: parseFloat(e.target.value) || null }))}
              />
              {errors.free_delivery_threshold && (
                <p className="text-red-600 text-xs mt-1">{errors.free_delivery_threshold.message}</p>
              )}
              <p className="text-xs text-blue-600 mt-1">
                При поръчки над тази сума доставката става безплатна
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="bg-white border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Предварителен изглед:</h5>
            <div className="text-sm text-blue-700">
              {settings.delivery_type === 'free' && 'Всички поръчки се доставят безплатно'}
              {settings.delivery_type === 'fixed' && `Всички поръчки се доставят за ${settings.delivery_fee.toFixed(2)} лв`}
              {settings.delivery_type === 'conditional' && settings.free_delivery_threshold && 
                `Доставка за ${settings.delivery_fee.toFixed(2)} лв, безплатна над ${settings.free_delivery_threshold.toFixed(2)} лв`
              }
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <X className="h-4 w-4 mr-2 inline" />
              Отказ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Запазване...' : 'Запази'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900 flex items-center">
          <Truck className="mr-2" size={20} />
          Настройки за доставка
        </h4>
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
        >
          Редактирай
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          {getDeliveryTypeIcon(settings.delivery_type)}
          <div>
            <div className="font-medium text-gray-900">
              {getDeliveryTypeLabel(settings.delivery_type)}
            </div>
            <div className="text-sm text-gray-600">
              {settings.delivery_type === 'free' && 'Всички поръчки се доставят безплатно'}
              {settings.delivery_type === 'fixed' && `Всички поръчки се доставят за ${settings.delivery_fee.toFixed(2)} лв`}
              {settings.delivery_type === 'conditional' && settings.free_delivery_threshold && 
                `Доставка за ${settings.delivery_fee.toFixed(2)} лв, безплатна над ${settings.free_delivery_threshold.toFixed(2)} лв`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
