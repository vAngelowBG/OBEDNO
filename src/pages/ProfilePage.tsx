import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Phone, MapPin, Save, Plus, Edit2, Trash2, ChevronDown, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface ProfileForm {
  name: string;
  phone: string;
  city: string;
}

interface AddressForm {
  label: string;
  address_line: string;
  extra?: string;
}

export function ProfilePage() {
  const { isAuthenticated, profile, loading } = useAuthContext();
  const [cities, setCities] = useState<string[]>([]);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<Tables<'saved_addresses'>[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Tables<'saved_addresses'> | null>(null);

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      name: profile?.name || '',
      phone: profile?.phone || '',
      city: profile?.city || '',
    }
  });

  const addressForm = useForm<AddressForm>();

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name,
        phone: profile.phone || '',
        city: profile.city || '',
      });
    }
    fetchCities();
    fetchAddresses();
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
      // Use hardcoded list of Bulgarian cities
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
      setCities(['София', 'Пловдив', 'Варна', 'Бургас', 'Русе']);
    }
  };

  const fetchAddresses = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const onSubmitProfile = async (data: ProfileForm) => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.phone,
          city: data.city,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Профилът е обновен успешно');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Грешка при обновяването на профила');
    } finally {
      setSaving(false);
    }
  };

  const onSubmitAddress = async (data: AddressForm) => {
    if (!profile) return;

    try {
      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('saved_addresses')
          .update({
            label: data.label,
            address_line: data.address_line,
            extra: data.extra || null,
          })
          .eq('id', editingAddress.id);

        if (error) throw error;
        toast.success('Адресът е обновен');
      } else {
        // Create new address
        const { error } = await supabase
          .from('saved_addresses')
          .insert({
            profile_id: profile.id,
            label: data.label,
            address_line: data.address_line,
            extra: data.extra || null,
          });

        if (error) throw error;
        toast.success('Адресът е добавен');
      }

      setShowAddAddress(false);
      setEditingAddress(null);
      addressForm.reset();
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Грешка при запазването на адреса');
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този адрес?')) return;

    try {
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      toast.success('Адресът е изтрит');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Грешка при изтриването на адреса');
    }
  };

  const startEditAddress = (address: Tables<'saved_addresses'>) => {
    setEditingAddress(address);
    addressForm.reset({
      label: address.label,
      address_line: address.address_line,
      extra: address.extra || '',
    });
    setShowAddAddress(true);
  };

  const cancelAddressEdit = () => {
    setShowAddAddress(false);
    setEditingAddress(null);
    addressForm.reset();
  };

  const handleCitySelect = (city: string) => {
    profileForm.setValue('city', city);
    setIsCityDropdownOpen(false);
    setCitySearchTerm('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const selectedCity = profileForm.watch('city');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Моят профил</h1>
          <p className="text-gray-600">Управлявайте вашата лична информация и адреси</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <User className="mr-3" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">Лична информация</h2>
            </div>

            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Име и фамилия *
                </label>
                <input
                  {...profileForm.register('name', { required: 'Името е задължително' })}
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                />
                {profileForm.formState.errors.name && (
                  <p className="text-red-600 text-xs mt-1">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    {...profileForm.register('phone')}
                    type="tel"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="0888 123 456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Град
                </label>
                <div className="relative">
                  <input type="hidden" {...profileForm.register('city')} />
                  <button
                    type="button"
                    onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                    className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <div className="flex items-center">
                      <MapPin className="mr-2 text-gray-400" size={16} />
                      <span className={selectedCity ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedCity || 'Изберете град'}
                      </span>
                    </div>
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
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save size={16} />
                <span>{saving ? 'Запазване...' : 'Запази промените'}</span>
              </button>
            </form>
          </div>

          {/* Delivery Addresses */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <MapPin className="mr-3" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Адреси за доставка</h2>
              </div>
              <button
                onClick={() => setShowAddAddress(true)}
                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1 text-sm"
              >
                <Plus size={16} />
                <span>Добави</span>
              </button>
            </div>

            {/* Add/Edit Address Form */}
            {showAddAddress && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">
                  {editingAddress ? 'Редактиране на адрес' : 'Добавяне на адрес'}
                </h3>
                
                <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Етикет *
                    </label>
                    <input
                      {...addressForm.register('label', { required: 'Етикетът е задължителен' })}
                      type="text"
                      placeholder="Дом, Офис, и др."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {addressForm.formState.errors.label && (
                      <p className="text-red-600 text-xs mt-1">
                        {addressForm.formState.errors.label.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Адрес *
                    </label>
                    <input
                      {...addressForm.register('address_line', { required: 'Адресът е задължителен' })}
                      type="text"
                      placeholder="ул. Витоша 1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {addressForm.formState.errors.address_line && (
                      <p className="text-red-600 text-xs mt-1">
                        {addressForm.formState.errors.address_line.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Допълнителни указания
                    </label>
                    <input
                      {...addressForm.register('extra')}
                      type="text"
                      placeholder="Вход А, ет. 3, ап. 15"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={cancelAddressEdit}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Отказ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {editingAddress ? 'Запази' : 'Добави'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Addresses List */}
            <div className="space-y-3">
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Няма запазени адреси</p>
                  <p className="text-sm">Добавете адрес за по-бързо поръчване</p>
                </div>
              ) : (
                addresses.map((address) => (
                  <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{address.label}</span>
                        </div>
                        <p className="text-gray-600">{address.address_line}</p>
                        {address.extra && (
                          <p className="text-sm text-gray-500">{address.extra}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditAddress(address)}
                          className="text-gray-600 hover:text-blue-600 p-1 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteAddress(address.id)}
                          className="text-gray-600 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}