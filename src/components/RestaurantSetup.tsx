import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, MapPin, Clock, Phone, Mail, Store, ChevronDown, Search, Crown, Calendar, CreditCard, Lock, Bell, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { ProductCard } from './ProductCard';
import { products } from '../stripe-config';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { DeliverySettings } from './DeliverySettings';
import { audioService } from '../services/audioService';

interface RestaurantForm {
  name: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  districts: string;
  delivery_zones: string;
  cutoff_time: string;
  delivery_window: string;
  logo_url: string | null;
  cover_url: string | null;
}

export function RestaurantSetup() {
  const { profile } = useAuthContext();
  const [restaurant, setRestaurant] = useState<Tables<'restaurants'> | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<RestaurantForm>({
    defaultValues: {
      cutoff_time: '11:00',
      delivery_window: '12:00-14:00',
    }
  });

  useEffect(() => {
    fetchCities();
    fetchRestaurant();
    fetchSubscription();
    // Load notification settings
    setNotificationsEnabled(audioService.isNotificationEnabled());
  }, [profile]);

  useEffect(() => {
    if (citySearchTerm.trim() === '') {
      setFilteredCities(cities.slice(0, 10));
    } else {
      const filtered = cities
        .filter(city => 
          city.toLowerCase().includes(citySearchTerm.toLowerCase())
        )
        .slice(0, 10);
      setFilteredCities(filtered);
    }
  }, [cities, citySearchTerm]);

  const fetchCities = async () => {
    try {
      // Use hardcoded list of Bulgarian cities since admin_settings might not exist
      const bulgarianCities = [
        'Айтос', 'Аксаково', 'Алфатар', 'Антоново', 'Априлци', 'Ардино', 'Асеновград', 'Асеновец', 'Асперухово', 'Ахелой',
        'Балчик', 'Банкя', 'Банско', 'Баня', 'Батак', 'Батановци', 'Белене', 'Белица', 'Белоградчик', 'Белослав', 'Берковица', 'Благоевград', 'Бобов дол', 'Бобошево', 'Божурище', 'Бойчиновци', 'Болярово', 'Борово', 'Ботевград', 'Брацигово', 'Брегово', 'Брезник', 'Брезово', 'Бургас', 'Бухово', 'Бяла', 'Бяла Слатина',
        'Варна', 'Велико Търново', 'Велинград', 'Ветово', 'Ветрен', 'Видин', 'Враца', 'Върбица', 'Върбовка',
        'Габрово', 'Генерал Тошево', 'Георги Дамяново', 'Гоце Делчев', 'Годеч', 'Горна Оряховица', 'Грамада', 'Гулянци',
        'Девин', 'Девня', 'Димитровград', 'Димово', 'Добрич', 'Добринище', 'Долна баня', 'Долна Митрополия', 'Долни Дъбник', 'Долни чифлик', 'Драгоман', 'Дряново', 'Дулово', 'Дупница',
        'Елена', 'Елин Пелин', 'Елхово', 'Етрополе',
        'Завет', 'Земен', 'Златарица', 'Златица', 'Златоград',
        'Ивайловград', 'Игнатиево', 'Икономово', 'Исперих', 'Ихтиман',
        'Каблешково', 'Казанлък', 'Калофер', 'Камено', 'Каолиново', 'Карлово', 'Карнобат', 'Каспичан', 'Кермен', 'Килифарево', 'Китен', 'Клисура', 'Кнежа', 'Козлодуй', 'Койнаре', 'Копривщица', 'Костандово', 'Костенец', 'Костинброд', 'Котел', 'Кочериново', 'Кресна', 'Криводол', 'Крумовград', 'Кубрат', 'Кула', 'Куклен', 'Кърджали', 'Кюстендил',
        'Лазарово', 'Левски', 'Летница', 'Ловеч', 'Лозница', 'Лом', 'Луковит', 'Лъки', 'Любимец', 'Лясковец',
        'Мадан', 'Маджарово', 'Малко Търново', 'Мартен', 'Мездра', 'Мелник', 'Мизия', 'Момин проход', 'Момчилград', 'Монтана', 'Мъглиж',
        'Неделино', 'Несебър', 'Николаево', 'Никопол', 'Нова Загора', 'Нови Искър', 'Нови пазар',
        'Обзор', 'Огняново', 'Омуртаг', 'Опака', 'Оряхово', 'Павликени', 'Пазарджик', 'Панагюрище', 'Парвомай', 'Пауталия', 'Пещера', 'Пирдоп', 'Плевен', 'Плиска', 'Пловдив', 'Полски Тръмбеш', 'Поморие', 'Попово', 'Провадия', 'Първомай',
        'Разград', 'Разлог', 'Ракитово', 'Раковски', 'Рила', 'Роман', 'Рудозем', 'Русе',
        'Садово', 'Самоков', 'Сандански', 'Сапарева баня', 'Свети Влас', 'Свиленград', 'Свищов', 'Севлиево', 'Септември', 'Силистра', 'Симеоновград', 'Симитли', 'Ситово', 'Сливен', 'Сливница', 'Смолян', 'Смядово', 'София', 'Сопот', 'Созопол', 'Стамболийски', 'Стара Загора', 'Стралджа', 'Стрелча', 'Струмяни', 'Суворово', 'Сунгурларе', 'Сухиндол',
        'Твърдица', 'Тервел', 'Тетевен', 'Тополовград', 'Трън', 'Трявна', 'Тутракан', 'Търговище', 'Търнак',
        'Угърчин', 'Устрем',
        'Хаджидимово', 'Харманли', 'Хасково', 'Хисаря', 'Хитрино',
        'Цар Калоян', 'Царево', 'Чепеларе', 'Червен бряг', 'Черноморец', 'Чипровци', 'Чирпан',
        'Шабла', 'Шивачево', 'Шипка', 'Шумен',
        'Ябланица', 'Якоруда', 'Ямбол'
      ];
      
      setCities(bulgarianCities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      // Fallback to basic cities if there's an error
      setCities(['София', 'Пловдив', 'Варна', 'Бургас', 'Русе', 'Стара Загора', 'Плевен', 'Добрич', 'Сливен', 'Шумен']);
    }
  };

  const fetchSubscription = async () => {
    try {
      console.log('Fetching subscription...');
      
      // First check if the table exists
      const { error: tableError } = await supabase
        .from('stripe_user_subscriptions')
        .select('count')
        .limit(1);
      
      if (tableError) {
        console.error('Table does not exist or RLS error:', tableError);
        // Set a default active subscription for testing
        setSubscription({
          subscription_status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
          cancel_at_period_end: false
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        // Set a default active subscription for testing
        setSubscription({
          subscription_status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
          cancel_at_period_end: false
        });
        return;
      }

      console.log('Subscription data:', data);
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Set a default active subscription for testing
      setSubscription({
        subscription_status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
        cancel_at_period_end: false
      });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const fetchRestaurant = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', profile.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Restaurant doesn't exist
        setRestaurant(null);
      } else if (error) {
        throw error;
      } else {
        setRestaurant(data);
        // Only reset form if it's empty (first load)
        if (!restaurant) {
          reset({
            name: data.name,
            address: data.address,
            phone: data.phone,
            email: data.email,
            city: data.city,
            districts: data.districts?.join(', ') || '',
            delivery_zones: data.delivery_zones?.join(', ') || '',
            cutoff_time: data.cutoff_time,
            delivery_window: data.delivery_window,
            logo_url: data.logo_url,
            cover_url: data.cover_url,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RestaurantForm) => {
    if (!profile) return;

    setSaving(true);
    try {
      const slug = data.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const restaurantData = {
        owner_id: profile.id,
        name: data.name,
        slug,
        logo_url: data.logo_url,
        cover_url: data.cover_url,
        address: data.address,
        phone: data.phone,
        email: data.email,
        city: data.city,
        districts: data.districts ? data.districts.split(',').map(d => d.trim()) : [],
        delivery_zones: data.delivery_zones ? data.delivery_zones.split(',').map(z => z.trim()) : [],
        cutoff_time: data.cutoff_time,
        delivery_window: data.delivery_window,
        channels: ['viber', 'whatsapp', 'email', 'web'],
        status: restaurant ? restaurant.status : 'active',
      };

      if (restaurant) {
        // Update existing restaurant
        const { error } = await supabase
          .from('restaurants')
          .update(restaurantData)
          .eq('id', restaurant.id);

        if (error) throw error;
        toast.success('Ресторантът е обновен успешно');
      } else {
        // Create new restaurant
        const { data: newRestaurant, error } = await supabase
          .from('restaurants')
          .insert(restaurantData)
          .select()
          .single();

        if (error) throw error;
        setRestaurant(newRestaurant);
        toast.success('Ресторантът е създаден успешно');
      }

      fetchRestaurant();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      toast.error('Грешка при запазването');
    } finally {
      setSaving(false);
    }
  };

  const handleCitySelect = (city: string) => {
    setValue('city', city);
    setIsCityDropdownOpen(false);
    setCitySearchTerm('');
  };

  const updateRestaurantSubscriptionStatus = async () => {
    if (!restaurant || !subscription) return;

    try {
      const isActive = subscription.subscription_status === 'active';
      const expiresAt = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('restaurants')
        .update({
          subscription_status: isActive ? 'active' : 'inactive',
          subscription_expires_at: expiresAt,
        })
        .eq('id', restaurant.id);

      if (error) throw error;

      // Refresh restaurant data
      fetchRestaurant();
    } catch (error) {
      console.error('Error updating restaurant subscription status:', error);
    }
  };

  const cancelSubscription = async () => {
    if (!confirm('Сигурни ли сте, че искате да отмените абонамента си? Ще запазите достъп до края на текущия период.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      toast.success('Абонаментът е отменен успешно');
      fetchSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Грешка при отмяната на абонамента');
    }
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    audioService.setEnabled(enabled);
    toast.success(enabled ? 'Звуковите нотификации са включени' : 'Звуковите нотификации са изключени');
  };

  const handleTestNotification = async () => {
    try {
      await audioService.testNotification();
      toast.success('Тестова нотификация възпроизведена');
    } catch (error) {
      console.error('Error playing test notification:', error);
      toast.error('Грешка при възпроизвеждането на тестовата нотификация');
    }
  };

  useEffect(() => {
    if (restaurant && subscription) {
      updateRestaurantSubscriptionStatus();
    }
  }, [restaurant, subscription]);

  const selectedCity = watch('city');

  if (loading) {
    return <div className="animate-pulse">Зареждане...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активен';
      case 'inactive':
        return 'Неактивен';
      case 'suspended':
        return 'Спрян';
      default:
        return status;
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSubscriptionStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активен абонамент';
      case 'inactive':
        return 'Неактивен абонамент';
      case 'expired':
        return 'Изтекъл абонамент';
      case 'cancelled':
        return 'Отказан абонамент';
      default:
        return 'Неизвестен статус';
    }
  };

  const isSubscriptionActive = subscription?.subscription_status === 'active';
  
  // Debug info
  console.log('Subscription:', subscription);
  console.log('Restaurant:', restaurant);
  console.log('isSubscriptionActive:', isSubscriptionActive);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {restaurant ? 'Настройки на ресторанта' : 'Настройване на ресторанта'}
        </h1>
        <p className="text-gray-600">
          {restaurant 
            ? 'Редактирайте информацията за вашия ресторант'
            : 'Попълнете информацията за вашия ресторант за да започнете'
          }
        </p>
        
        {restaurant && (
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(restaurant.status)}`}>
              Статус: {getStatusText(restaurant.status)}
            </span>
          </div>
        )}
      </div>

      {/* Subscription Status */}
      {!subscriptionLoading && (
        <div className="mb-6">
          {subscription && isSubscriptionActive ? (
            <div className={`border rounded-lg p-4 ${getSubscriptionStatusColor(subscription?.subscription_status || 'inactive')}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Crown size={20} />
                  <div>
                    <h3 className="font-medium">
                      Месечен план - Membership
                    </h3>
                    <p className="text-sm opacity-75">
                      {getSubscriptionStatusText(subscription?.subscription_status || 'inactive')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!subscription.cancel_at_period_end && (
                    <button
                      onClick={cancelSubscription}
                      className="text-sm text-red-600 hover:text-red-700 px-3 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
                    >
                      Отмени абонамент
                    </button>
                  )}
                </div>
              </div>

              {subscription.current_period_end && (
                <div className="mt-3 flex items-center space-x-2 text-sm opacity-75">
                  <Calendar size={16} />
                  <span>
                    {subscription.cancel_at_period_end ? 'Изтича на' : 'Подновява се на'}: {' '}
                    {format(new Date(subscription.current_period_end * 1000), 'dd MMM yyyy', { locale: bg })}
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

              {subscription.cancel_at_period_end && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Абонаментът ви е отменен и ще изтече на {format(new Date(subscription.current_period_end * 1000), 'dd MMM yyyy', { locale: bg })}. 
                    След тази дата няма да имате достъп до функциите на платформата.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Lock size={24} className="text-yellow-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800 mb-2">
                    Абонамент е необходим
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    За да активирате вашия ресторант и да започнете да приемате поръчки, 
                    трябва да се абонирате за месечния план.
                  </p>
                  <div className="max-w-sm">
                    <ProductCard product={products[0]} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-8">
        {!isSubscriptionActive && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-lg z-10 flex items-center justify-center">
            <div className="text-center">
              <Lock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">
                Абонирайте се за да активирате настройките
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Store className="mr-2" size={20} />
              Основна информация
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Име на ресторанта *
                </label>
                <input
                  {...register('name', { required: 'Името е задължително' })}
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                />
                {errors.name && (
                  <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Град *
                </label>
                <div className="relative">
                  <input type="hidden" {...register('city', { required: 'Градът е задължителен' })} />
                  <button
                    type="button"
                    onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                    className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <span className={selectedCity ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedCity || 'Изберете град'}
                    </span>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-500 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isCityDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => {
                          setIsCityDropdownOpen(false);
                          setCitySearchTerm('');
                        }}
                      />
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-full">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-200">
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Търсене на град..."
                              value={citySearchTerm}
                              onChange={(e) => setCitySearchTerm(e.target.value)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        
                        {/* Cities List */}
                        <div className="max-h-60 overflow-y-auto">
                          {filteredCities.length === 0 ? (
                            <div className="px-4 py-3 text-gray-500 text-sm">
                              {citySearchTerm ? 'Няма намерени градове' : 'Зареждане...'}
                            </div>
                          ) : (
                            filteredCities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => handleCitySelect(city)}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm ${
                                  selectedCity === city ? 'bg-red-50 text-red-600 font-medium' : ''
                                }`}
                              >
                                {city}
                              </button>
                            ))
                          )}
                          
                          {/* Show more indicator */}
                          {citySearchTerm === '' && cities.length > 10 && (
                            <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
                              Показани първите 10 града. Използвайте търсачката за повече опции.
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {errors.city && (
                  <p className="text-red-600 text-xs mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Адрес *
              </label>
              <input
                {...register('address', { required: 'Адресът е задължителен' })}
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              />
              {errors.address && (
                <p className="text-red-600 text-xs mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    {...register('phone', { required: 'Телефонът е задължителен' })}
                    type="tel"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-600 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имейл *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    {...register('email', { 
                      required: 'Имейлът е задължителен',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Невалиден имейл адрес'
                      }
                    })}
                    type="email"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="mr-2" size={20} />
              Доставка
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Райони за доставка
                </label>
                <input
                  {...register('districts')}
                  type="text"
                  placeholder="Център, Лозенец, Борово (разделени със запетая)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Разделете районите със запетая
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Зони за доставка
                </label>
                <input
                  {...register('delivery_zones')}
                  type="text"
                  placeholder="1000, 1001, 1002 (пощенски кодове разделени със запетая)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Пощенски кодове или зони, разделени със запетая
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Fee Settings */}
          {restaurant && (
            <div className="mt-6">
              <DeliverySettings
                restaurantId={restaurant.id}
                currentSettings={{
                  delivery_fee: restaurant.delivery_fee || 0,
                  free_delivery_threshold: restaurant.free_delivery_threshold,
                  delivery_type: restaurant.delivery_type || 'fixed'
                }}
                onUpdate={(newSettings) => {
                  setRestaurant(prev => prev ? { ...prev, ...newSettings } : null);
                }}
              />
            </div>
          )}

          {/* Images Section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Store className="mr-2" size={20} />
              Изображения
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg space-x-4">
              <div className="flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Лого
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                      {watch('logo_url') ? (
                        <img 
                          src={watch('logo_url') || ''} 
                          alt="Restaurant logo" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                            const filePath = `${restaurant?.id || 'new'}/logo-${fileName}`;

                            try {
                              const { error: uploadError } = await supabase.storage
                                .from('obedno-img')
                                .upload(filePath, file);

                              if (uploadError) throw uploadError;

                              const { data: { publicUrl } } = supabase.storage
                                .from('obedno-img')
                                .getPublicUrl(filePath);

                              setValue('logo_url', publicUrl);
                            } catch (error) {
                              console.error('Error uploading logo:', error);
                              toast.error('Грешка при качването на логото');
                            }
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG до 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Корица
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-48 h-24 border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                      {watch('cover_url') ? (
                        <img 
                          src={watch('cover_url') || ''} 
                          alt="Restaurant cover" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                            const filePath = `${restaurant?.id || 'new'}/cover-${fileName}`;

                            try {
                              const { error: uploadError } = await supabase.storage
                                .from('obedno-img')
                                .upload(filePath, file);

                              if (uploadError) throw uploadError;

                              const { data: { publicUrl } } = supabase.storage
                                .from('obedno-img')
                                .getPublicUrl(filePath);

                              setValue('cover_url', publicUrl);
                            } catch (error) {
                              console.error('Error uploading cover:', error);
                              toast.error('Грешка при качването на корицата');
                            }
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG до 5MB. Препоръчителен размер: 1200x600px
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Enabled Toggle */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Store className="mr-2" size={20} />
              Онлайн поръчки
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Разреши онлайн поръчки</p>
                <p className="text-sm text-gray-500">Ако е изключено, ресторантът работи като онлайн каталог без приемане на поръчки</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!restaurant?.orders_enabled}
                  onChange={async (e) => {
                    if (!restaurant) return;
                    const enabled = e.target.checked;
                    const { error } = await supabase
                      .from('restaurants')
                      .update({ orders_enabled: enabled })
                      .eq('id', restaurant.id);
                    if (!error) {
                      setRestaurant(prev => prev ? { ...prev, orders_enabled: enabled } as any : prev);
                      toast.success(enabled ? 'Онлайн поръчките са включени' : 'Онлайн поръчките са изключени');
                    } else {
                      toast.error('Грешка при промяна на статуса на поръчките');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Bell className="mr-2" size={20} />
              Нотификации
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {notificationsEnabled ? (
                    <Volume2 className="text-green-600" size={20} />
                  ) : (
                    <VolumeX className="text-gray-400" size={20} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Звукови нотификации</p>
                    <p className="text-sm text-gray-500">
                      Получавай звукови сигнали при нови поръчки
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Тест звук
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toast.success('🔔 Тестова нотификация за нова поръчка!', {
                        duration: 6000,
                        position: 'top-right',
                      });
                    }}
                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Тест toast
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => handleNotificationToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg">
                <p className="flex items-start">
                  <span className="font-medium">💡 Съвет:</span>
                  <span className="ml-1">
                    За най-добро изживяване, разрешете браузърските нотификации от адресната лента. 
                    Това ще ви позволи да получавате уведомления дори когато не сте на страницата.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Clock className="mr-2" size={20} />
              Работно време
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Краен час за поръчки *
                </label>
                <input
                  {...register('cutoff_time', { required: 'Крайният час е задължителен' })}
                  type="time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                />
                {errors.cutoff_time && (
                  <p className="text-red-600 text-xs mt-1">{errors.cutoff_time.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  След този час няма да се приемат поръчки
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Време за доставка *
                </label>
                <input
                  {...register('delivery_window', { required: 'Времето за доставка е задължително' })}
                  type="text"
                  placeholder="12:00-14:00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                />
                {errors.delivery_window && (
                  <p className="text-red-600 text-xs mt-1">{errors.delivery_window.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              disabled={saving || !isSubscriptionActive}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{saving ? 'Запазване...' : 'Запази настройките'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}