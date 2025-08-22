import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Save, X, Lock, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { format, addDays, startOfWeek } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { WeeklyMenuPlanner } from '../components/WeeklyMenuPlanner';

interface MenuManagerProps {
  mode: 'today' | 'weekly';
}

export function MenuManager({ mode }: MenuManagerProps) {
  const { profile } = useAuthContext();
  const [restaurant, setRestaurant] = useState<Tables<'restaurants'> | null>(null);
  const [menus, setMenus] = useState<(Tables<'menus'> & { menu_items: Tables<'menu_items'>[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Tables<'menu_items'> | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [autoAddItems, setAutoAddItems] = useState<Tables<'menu_items'>[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    name: string;
    description?: string;
    price: number;
    category: string;
    stock?: number;
    auto_add?: boolean;
  }>();

  useEffect(() => {
    fetchRestaurant();
    fetchSubscription();
  }, [profile]);

  useEffect(() => {
    if (restaurant) {
      fetchMenus();
      fetchAutoAddItems();
    }
  }, [restaurant, selectedDate, mode]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
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

      if (error) throw error;
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const fetchMenus = async () => {
    if (!restaurant) return;

    setLoading(true);
    try {
      let dateFilter;
      if (mode === 'today') {
        dateFilter = format(new Date(), 'yyyy-MM-dd');
      } else {
        // Weekly mode - get week starting from today
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const dates = Array.from({ length: 7 }, (_, i) => 
          format(addDays(weekStart, i), 'yyyy-MM-dd')
        );
        dateFilter = dates;
      }

      const query = supabase
        .from('menus')
        .select(`
          *,
          menu_items(*)
        `)
        .eq('restaurant_id', restaurant.id);

      if (mode === 'today') {
        query.eq('menu_date', dateFilter);
      } else {
        query.in('menu_date', dateFilter as string[]);
      }

      const { data, error } = await query.order('menu_date');

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoAddItems = async () => {
    if (!restaurant) return;
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('auto_add', true)
        .is('template_id', null);
      
      if (error) throw error;
      setAutoAddItems(data || []);
    } catch (error) {
      console.error('Error fetching auto-add items:', error);
    }
  };

  const copyYesterdayMenu = async () => {
    if (!restaurant) return;
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

      // Fetch yesterday's menu
      const { data: yesterdayMenu, error: menuError } = await supabase
        .from('menus')
        .select('*, menu_items(*)')
        .eq('restaurant_id', restaurant.id)
        .eq('menu_date', yesterdayStr)
        .single();

      if (menuError) throw menuError;
      if (!yesterdayMenu?.menu_items?.length) {
        toast.error('Няма меню за вчера');
        return;
      }

      // Create today's menu if it doesn't exist
      if (!menus[0]) {
        await createTodayMenu();
      }

      // Copy items
      const todayMenu = menus[0];
      const items = yesterdayMenu.menu_items.map((item: any) => ({
        menu_id: todayMenu.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        stock: item.stock,
        template_id: item.template_id || item.id,
        auto_add: item.auto_add
      }));

      const { error: insertError } = await supabase
        .from('menu_items')
        .insert(items);

      if (insertError) throw insertError;

      toast.success('Менюто от вчера е копирано успешно');
      fetchMenus();
    } catch (error) {
      console.error('Error copying yesterday menu:', error);
      toast.error('Грешка при копиране на менюто');
    }
  };

  const toggleAutoAdd = async (item: Tables<'menu_items'>) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ auto_add: !item.auto_add })
        .eq('id', item.id);

      if (error) throw error;

      if (!item.auto_add) {
        setAutoAddItems(prev => [...prev, item]);
      } else {
        setAutoAddItems(prev => prev.filter(i => i.id !== item.id));
      }

      toast.success(item.auto_add ? 'Премахнато от автоматични' : 'Добавено към автоматични');
      fetchMenus();
    } catch (error) {
      console.error('Error toggling auto-add:', error);
      toast.error('Грешка при промяна на автоматично добавяне');
    }
  };

  const createTodayMenu = async () => {
    if (!restaurant) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const validFrom = new Date();
      validFrom.setHours(0, 0, 0, 0);
      const validTo = new Date();
      validTo.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('menus')
        .insert({
          restaurant_id: restaurant.id,
          menu_date: today,
          valid_from: validFrom.toISOString(),
          valid_to: validTo.toISOString(),
          is_published: false,
        })
        .select(`
          *,
          menu_items(*)
        `)
        .single();

      if (error) throw error;
      
      // Add auto-add items if any
      if (autoAddItems.length > 0) {
        const items = autoAddItems.map(item => ({
          menu_id: data.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          stock: item.stock,
          template_id: item.id,
          auto_add: true
        }));

        await supabase.from('menu_items').insert(items);
      }

      setMenus([data]);
      toast.success('Менюто за днес е създадено');
    } catch (error) {
      console.error('Error creating menu:', error);
      toast.error('Грешка при създаването на менюто');
    }
  };

  const toggleMenuPublish = async (menuId: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('menus')
        .update({ is_published: !isPublished })
        .eq('id', menuId);

      if (error) throw error;

      setMenus(prev => 
        prev.map(menu => 
          menu.id === menuId 
            ? { ...menu, is_published: !isPublished }
            : menu
        )
      );

      toast.success(isPublished ? 'Менюто е скрито' : 'Менюто е публикувано');
    } catch (error) {
      console.error('Error updating menu:', error);
      toast.error('Грешка при актуализацията');
    }
  };

  const onSubmitItem = async (data: any) => {
    try {
      const todayMenu = menus.find(m => m.menu_date === format(new Date(), 'yyyy-MM-dd'));
      if (!todayMenu) return;

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: data.name,
            description: data.description,
            price: Number(data.price),
            category: data.category,
            stock: data.stock ? Number(data.stock) : 0,
            auto_add: data.auto_add || false
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Ястието е обновено');
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu_items')
          .insert({
            menu_id: todayMenu.id,
            name: data.name,
            description: data.description,
            price: Number(data.price),
            category: data.category,
            stock: data.stock ? Number(data.stock) : 0,
            auto_add: data.auto_add || false
          });

        if (error) throw error;
        toast.success('Ястието е добавено');
      }

      setShowAddItem(false);
      setEditingItem(null);
      reset();
      fetchMenus();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Грешка при запазването');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете това ястие?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Ястието е изтрито');
      fetchMenus();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Грешка при изтриването');
    }
  };

  const startEditItem = (item: Tables<'menu_items'>) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      stock: item.stock,
      auto_add: item.auto_add
    });
    setShowAddItem(true);
  };

  const cancelEdit = () => {
    setShowAddItem(false);
    setEditingItem(null);
    reset();
  };

  const isSubscriptionActive = subscription?.subscription_status === 'active';

  if (loading) {
    return <div className="animate-pulse">Зареждане...</div>;
  }

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
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Абонамент е необходим
        </h3>
        <p className="text-gray-600 mb-4">
          За да управлявате менютата си, трябва да имате активен абонамент.
        </p>
        <p className="text-sm text-gray-500">
          Отидете в раздел "Настройки" за да се абонирате.
        </p>
      </div>
    );
  }

  if (mode === 'today') {
    const todayMenu = menus[0];

    if (!todayMenu) {
      return (
        <div className="text-center py-8">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Няма меню за днес
          </h3>
          <p className="text-gray-600 mb-4">
            Създайте меню за днес и добавете ястия
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={createTodayMenu}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Създай празно меню
            </button>
            <button
              onClick={copyYesterdayMenu}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Copy size={16} className="mr-2" />
              Използвай вчерашното меню
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Menu Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Меню за днес ({format(new Date(), 'dd MMMM yyyy', { locale: bg })})
            </h3>
            <p className="text-sm text-gray-600">
              {todayMenu.menu_items.length} ястия
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => toggleMenuPublish(todayMenu.id, todayMenu.is_published)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                todayMenu.is_published
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {todayMenu.is_published ? 'Публикувано' : 'Скрито'}
            </button>
            
            <button
              onClick={() => setShowAddItem(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Добави ястие</span>
            </button>
          </div>
        </div>

        {/* Add/Edit Item Form */}
        {showAddItem && (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                {editingItem ? 'Редактиране на ястие' : 'Добавяне на ястие'}
              </h4>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitItem)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Име на ястието *
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
                    Цена (лв) *
                  </label>
                  <input
                    {...register('price', { required: 'Цената е задължителна' })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                  />
                  {errors.price && (
                    <p className="text-red-600 text-xs mt-1">{errors.price.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория
                  </label>
                  <select
                    {...register('category')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="main">Основно ястие</option>
                    <option value="soup">Супа</option>
                    <option value="salad">Салата</option>
                    <option value="dessert">Десерт</option>
                    <option value="drink">Напитка</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Количество
                  </label>
                  <input
                    {...register('stock')}
                    type="number"
                    min="0"
                    placeholder="0 = неограничено"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('auto_add')}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Добавяй автоматично всеки ден</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отказ
                </button>
                <button
                  type="submit"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>{editingItem ? 'Запази' : 'Добави'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-4">
          {todayMenu.menu_items.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-600">Няма добавени ястия за днес</p>
            </div>
          ) : (
            todayMenu.menu_items.map((item) => (
              <div key={item.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {item.category}
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      {item.price.toFixed(2)} лв
                    </span>
                    {item.auto_add && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Автоматично
                      </span>
                    )}
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  
                  {item.stock > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Количество: {item.stock}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAutoAdd(item); }}
                    className={`p-2 rounded ${item.auto_add ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                    title={item.auto_add ? 'Премахни от автоматични' : 'Добавяй автоматично'}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => startEditItem(item)}
                    className="text-gray-600 hover:text-blue-600 p-2 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-gray-600 hover:text-red-600 p-2 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Weekly mode - placeholder for now
  return (
    <WeeklyMenuPlanner />
  );
}