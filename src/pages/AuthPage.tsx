import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, ChevronDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  city: string;
  role: 'client' | 'restaurant';
}

export function AuthPage() {
  const { isAuthenticated, profile, loading } = useAuthContext();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>({
    defaultValues: {
      role: 'client',
      city: 'София'
    }
  });

  useEffect(() => {
    fetchCities();
  }, []);

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

  const handleCitySelect = (city: string) => {
    registerForm.setValue('city', city);
    setIsCityDropdownOpen(false);
    setCitySearchTerm('');
  };

  // Redirect authenticated users
  if (isAuthenticated && profile) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    if (profile.role === 'restaurant') return <Navigate to="/restaurant" replace />;
    return <Navigate to="/" replace />;
  }


  const onLogin = async (data: LoginForm) => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Грешен имейл или парола');
        } else {
          toast.error('Грешка при влизане: ' + error.message);
        }
        return;
      }

      toast.success('Успешно влизане!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Възникна грешка при влизане');
    } finally {
      setAuthLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Паролите не съвпадат');
      return;
    }

    if (data.password.length < 6) {
      toast.error('Паролата трябва да е поне 6 символа');
      return;
    }

    setAuthLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Този имейл вече е регистриран');
        } else {
          toast.error('Грешка при регистрация: ' + authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error('Грешка при създаване на потребител');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          name: data.name,
          phone: data.phone,
          city: data.city,
          role: data.role,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        toast.error('Грешка при създаване на профил');
        return;
      }

      // If restaurant role, create initial restaurant record
      if (data.role === 'restaurant') {
        const slug = data.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const { error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            owner_id: profileData.id, // Use profile.id, not auth.user.id
            name: data.name,
            slug,
            address: data.city, // Use city as initial address
            phone: data.phone,
            email: data.email,
            city: data.city,
            status: 'inactive', // Start as inactive until setup is complete
          });

        if (restaurantError) {
          console.error('Restaurant creation error:', restaurantError);
          // Don't fail registration, just log the error
        }
      }

      toast.success('Успешна регистрация! Моля влезте в акаунта си.');
      setView('login');
      registerForm.reset();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Възникна грешка при регистрация');
    } finally {
      setAuthLoading(false);
    }
  };

  const selectedCity = registerForm.watch('city');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">OBEDNO</h2>
          <p className="text-gray-600">
            {view === 'login' ? 'Влезте във вашия акаунт' : 'Създайте нов акаунт'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Tab Navigation */}
          <div className="flex mb-6 border-b">
            <button
              onClick={() => setView('login')}
              className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${
                view === 'login'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setView('register')}
              className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${
                view === 'register'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Login Form */}
          {view === 'login' && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имейл адрес
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    {...loginForm.register('email', { 
                      required: 'Имейлът е задължителен',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Невалиден имейл адрес'
                      }
                    })}
                    type="email"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="your@email.com"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-red-600 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Парола
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    {...loginForm.register('password', { required: 'Паролата е задължителна' })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="Вашата парола"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-red-600 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {authLoading ? 'Влизане...' : 'Влезте'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {view === 'register' && (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Име и фамилия
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      {...registerForm.register('name', { required: 'Името е задължително' })}
                      type="text"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="Иван Петров"
                    />
                  </div>
                  {registerForm.formState.errors.name && (
                    <p className="text-red-600 text-xs mt-1">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      {...registerForm.register('phone', { required: 'Телефонът е задължителен' })}
                      type="tel"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="0888 123 456"
                    />
                  </div>
                  {registerForm.formState.errors.phone && (
                    <p className="text-red-600 text-xs mt-1">{registerForm.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Град
                </label>
                <div className="relative">
                  <input type="hidden" {...registerForm.register('city', { required: 'Градът е задължителен' })} />
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
                {registerForm.formState.errors.city && (
                  <p className="text-red-600 text-xs mt-1">{registerForm.formState.errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имейл адрес
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    {...registerForm.register('email', { 
                      required: 'Имейлът е задължителен',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Невалиден имейл адрес'
                      }
                    })}
                    type="email"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    placeholder="your@email.com"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-red-600 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Парола
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      {...registerForm.register('password', { 
                        required: 'Паролата е задължителна',
                        minLength: {
                          value: 6,
                          message: 'Паролата трябва да е поне 6 символа'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="Поне 6 символа"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-600 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Потвърди парола
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      {...registerForm.register('confirmPassword', { required: 'Потвърдете паролата' })}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="Повторете паролата"
                    />
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-red-600 text-xs mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип акаунт
                </label>
                <select
                  {...registerForm.register('role')}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                  <option value="client">Клиент</option>
                  <option value="restaurant">Ресторант</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {authLoading ? 'Регистриране...' : 'Регистрирайте се'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Влизайки, се съгласявате с нашите{' '}
            <a href="/terms" className="text-red-600 hover:text-red-700">
              Условия за ползване
            </a>{' '}
            и{' '}
            <a href="/privacy" className="text-red-600 hover:text-red-700">
              Политика за поверителност
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}