import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Save, X, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface MenuItemForm {
  name: string;
  description?: string;
  price: number;
  category: string;
  stock?: number;
}

interface WeeklyMenu {
  [date: string]: {
    menu: Tables<'menus'> | null;
    items: Tables<'menu_items'>[];
  };
}

export function WeeklyMenuPlanner() {
  const { profile } = useAuthContext();
  const [restaurant, setRestaurant] = useState<Tables<'restaurants'> | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenu>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Tables<'menu_items'> | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MenuItemForm>();

  useEffect(() => {
    fetchRestaurant();
  }, [profile]);

  useEffect(() => {
    if (restaurant) {
      fetchWeeklyMenus();
    }
  }, [restaurant, currentWeek]);

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

  const fetchWeeklyMenus = async () => {
    if (!restaurant) return;

    setLoading(true);
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
      
      const dates = [];
      for (let i = 0; i < 7; i++) {
        dates.push(format(addDays(weekStart, i), 'yyyy-MM-dd'));
      }

      const { data, error } = await supabase
        .from('menus')
        .select(`
          *,
          menu_items(*)
        `)
        .eq('restaurant_id', restaurant.id)
        .in('menu_date', dates)
        .order('menu_date');

      if (error) throw error;

      const weeklyData: WeeklyMenu = {};
      dates.forEach(date => {
        const menuData = data?.find(menu => menu.menu_date === date);
        weeklyData[date] = {
          menu: menuData || null,
          items: menuData?.menu_items || []
        };
      });

      setWeeklyMenus(weeklyData);
    } catch (error) {
      console.error('Error fetching weekly menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMenuForDate = async (date: string) => {
    if (!restaurant) return;

    try {
      const validFrom = new Date(date);
      validFrom.setHours(0, 0, 0, 0);
      const validTo = new Date(date);
      validTo.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('menus')
        .insert({
          restaurant_id: restaurant.id,
          menu_date: date,
          valid_from: validFrom.toISOString(),
          valid_to: validTo.toISOString(),
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;

      setWeeklyMenus(prev => ({
        ...prev,
        [date]: {
          menu: data,
          items: []
        }
      }));

      toast.success('Менюто е създадено');
    } catch (error) {
      console.error('Error creating menu:', error);
      toast.error('Грешка при създаването на менюто');
    }
  };

  const toggleMenuPublish = async (date: string, isPublished: boolean) => {
    const menuData = weeklyMenus[date];
    if (!menuData?.menu) return;

    try {
      const { error } = await supabase
        .from('menus')
        .update({ is_published: !isPublished })
        .eq('id', menuData.menu.id);

      if (error) throw error;

      setWeeklyMenus(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          menu: prev[date].menu ? { ...prev[date].menu, is_published: !isPublished } : null
        }
      }));

      toast.success(isPublished ? 'Менюто е скрито' : 'Менюто е публикувано');
    } catch (error) {
      console.error('Error updating menu:', error);
      toast.error('Грешка при актуализацията');
    }
  };

  const onSubmitItem = async (data: MenuItemForm) => {
    if (!selectedDate || !weeklyMenus[selectedDate]?.menu) return;

    try {
      const menuId = weeklyMenus[selectedDate].menu!.id;

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
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Ястието е обновено');
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu_items')
          .insert({
            menu_id: menuId,
            name: data.name,
            description: data.description,
            price: Number(data.price),
            category: data.category,
            stock: data.stock ? Number(data.stock) : 0,
          });

        if (error) throw error;
        toast.success('Ястието е добавено');
      }

      setShowAddItem(false);
      setEditingItem(null);
      reset();
      fetchWeeklyMenus();
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
      fetchWeeklyMenus();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Грешка при изтриването');
    }
  };

  const copyMenuFromDate = async (fromDate: string, toDate: string) => {
    const fromMenu = weeklyMenus[fromDate];
    const toMenu = weeklyMenus[toDate];

    if (!fromMenu?.items.length) {
      toast.error('Няма ястия за копиране');
      return;
    }

    try {
      // Create menu if it doesn't exist
      let targetMenuId = toMenu?.menu?.id;
      if (!targetMenuId) {
        await createMenuForDate(toDate);
        // Refresh data to get the new menu ID
        await fetchWeeklyMenus();
        const updatedMenu = weeklyMenus[toDate];
        targetMenuId = updatedMenu?.menu?.id;
      }

      if (!targetMenuId) {
        toast.error('Грешка при създаването на менюто');
        return;
      }

      // Copy items
      const itemsToInsert = fromMenu.items.map(item => ({
        menu_id: targetMenuId,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        stock: item.stock,
      }));

      const { error } = await supabase
        .from('menu_items')
        .insert(itemsToInsert);

      if (error) throw error;

      toast.success('Менюто е копирано успешно');
      fetchWeeklyMenus();
    } catch (error) {
      console.error('Error copying menu:', error);
      toast.error('Грешка при копирането на менюто');
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
    });
    setShowAddItem(true);
  };

  const cancelEdit = () => {
    setShowAddItem(false);
    setEditingItem(null);
    setSelectedDate(null);
    reset();
  };

  const getWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  const dayNames = ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'];

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

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h3 className="text-lg font-medium text-gray-900">
            Седмица {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd MMM', { locale: bg })} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: bg })}
          </h3>
          
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button
          onClick={() => setCurrentWeek(new Date())}
          className="text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          Днешна седмица
        </button>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {getWeekDays().map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const menuData = weeklyMenus[dateStr];
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={dateStr}
              className={`bg-white rounded-lg border p-4 min-h-96 ${
                isToday ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            >
              {/* Day Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-medium ${isToday ? 'text-red-700' : 'text-gray-900'}`}>
                    {dayNames[index]}
                  </h4>
                  {isToday && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      Днес
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {format(day, 'dd MMM', { locale: bg })}
                </p>
              </div>

              {/* Menu Status */}
              {menuData?.menu ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      menuData.menu.is_published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {menuData.menu.is_published ? 'Публикувано' : 'Скрито'}
                    </span>
                    
                    <button
                      onClick={() => toggleMenuPublish(dateStr, menuData.menu!.is_published)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      {menuData.menu.is_published ? 'Скрий' : 'Публикувай'}
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {menuData.items.length} ястия
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <button
                    onClick={() => createMenuForDate(dateStr)}
                    className="w-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg transition-colors"
                  >
                    + Създай меню
                  </button>
                </div>
              )}

              {/* Menu Items */}
              <div className="space-y-2 mb-4">
                {menuData?.items.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded p-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.price.toFixed(2)} лв
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => {
                            setSelectedDate(dateStr);
                            startEditItem(item);
                          }}
                          className="text-gray-400 hover:text-blue-600 p-1"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {menuData?.menu && (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setShowAddItem(true);
                    }}
                    className="w-full text-sm bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <Plus size={14} />
                    <span>Добави ястие</span>
                  </button>

                  {/* Copy Menu Dropdown */}
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          copyMenuFromDate(e.target.value, dateStr);
                          e.target.value = '';
                        }
                      }}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                      defaultValue=""
                    >
                      <option value="">Копирай от...</option>
                      {getWeekDays().map((otherDay, otherIndex) => {
                        const otherDateStr = format(otherDay, 'yyyy-MM-dd');
                        const otherMenuData = weeklyMenus[otherDateStr];
                        
                        if (otherDateStr === dateStr || !otherMenuData?.items.length) {
                          return null;
                        }

                        return (
                          <option key={otherDateStr} value={otherDateStr}>
                            {dayNames[otherIndex]} ({otherMenuData.items.length} ястия)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Item Modal */}
      {showAddItem && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-full overflow-y-auto">
            <div className="p-6">
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
          </div>
        </div>
      )}
    </div>
  );
}