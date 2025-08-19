import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { Store, Users, Settings, CheckCircle, XCircle, Edit2, User, Mail, Phone, MapPin, Calendar, Search, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface UserWithAuth extends Tables<'profiles'> {
  email?: string;
}

interface EditUserForm {
  name: string;
  phone: string;
  city: string;
  role: 'client' | 'restaurant' | 'admin';
}


export function AdminDashboard() {
  const { isAuthenticated, isAdmin, loading } = useAuthContext();
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState<Tables<'restaurants'>[]>([]);
  const [users, setUsers] = useState<UserWithAuth[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithAuth[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [userFilter, setUserFilter] = useState<'all' | 'client' | 'restaurant' | 'admin'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [restaurantSearchTerm, setRestaurantSearchTerm] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState<Tables<'restaurants'>[]>([]);
  const [editingUser, setEditingUser] = useState<UserWithAuth | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Tables<'restaurants'> | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditUserForm>();

  useEffect(() => {
    if (isAdmin) {
      fetchRestaurants();
      if (activeTab === 'users') {
        fetchUsers();
      }
    }
  }, [isAdmin, filter, activeTab, userFilter]);

  useEffect(() => {
    if (searchTerm.trim() === '' && emailSearchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => {
        const nameMatch = searchTerm.trim() === '' || user.name.toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = emailSearchTerm.trim() === '' || (user.email && user.email.toLowerCase().includes(emailSearchTerm.toLowerCase()));
        return nameMatch && emailMatch;
      });
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm, emailSearchTerm]);

  useEffect(() => {
    if (restaurantSearchTerm.trim() === '') {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(restaurant => {
        const nameMatch = restaurant.name.toLowerCase().includes(restaurantSearchTerm.toLowerCase());
        const emailMatch = restaurant.email.toLowerCase().includes(restaurantSearchTerm.toLowerCase());
        return nameMatch || emailMatch;
      });
      setFilteredRestaurants(filtered);
    }
  }, [restaurants, restaurantSearchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  const fetchRestaurants = async () => {
    setRestaurantsLoading(true);
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRestaurants(data || []);
      setFilteredRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Грешка при зареждането на ресторантите');
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      // Get current user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      // Call our edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-list-users`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const { users } = await response.json();
      
      // Transform data to match expected format
      const transformedUsers = users.map((user: any) => ({
        id: user.profile?.id || user.id,
        user_id: user.id,
        name: user.profile?.name || 'Unknown',
        phone: user.profile?.phone || null,
        city: user.profile?.city || null,
        role: user.profile?.role || 'client',
        created_at: user.profile?.created_at || user.created_at,
        updated_at: user.profile?.updated_at || user.created_at,
        email: user.email || ''
      }));

      // Apply role filter
      const filteredUsers = userFilter === 'all' 
        ? transformedUsers
        : transformedUsers.filter((u: any) => u.role === userFilter);
        
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Грешка при зареждането на потребителите');
    } finally {
      setUsersLoading(false);
    }
  };

  const updateRestaurantStatus = async (restaurantId: string, status: Tables<'restaurants'>['status']) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status })
        .eq('id', restaurantId);

      if (error) throw error;

      setRestaurants(prev =>
        prev.map(restaurant =>
          restaurant.id === restaurantId
            ? { ...restaurant, status }
            : restaurant
        )
      );

      toast.success('Статусът на ресторанта е обновен');
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      toast.error('Грешка при обновяването на статуса');
    }
  };

  const updateUserRole = async (userId: string, role: Tables<'profiles'>['role']) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, role }
            : user
        )
      );

      toast.success('Ролята на потребителя е обновена');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Грешка при обновяването на ролята');
    }
  };

  const onEditUser = async (data: EditUserForm) => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.phone || null,
          city: data.city || null,
          role: data.role,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setUsers(prev =>
        prev.map(user =>
          user.id === editingUser.id
            ? { ...user, name: data.name, phone: data.phone, city: data.city, role: data.role }
            : user
        )
      );

      setShowEditModal(false);
      setEditingUser(null);
      reset();
      toast.success('Потребителят е обновен');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Грешка при обновяването на потребителя');
    }
  };

  const startEditUser = (user: UserWithAuth) => {
    setEditingUser(user);
    reset({
      name: user.name,
      phone: user.phone || '',
      city: user.city || '',
      role: user.role,
    });
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingUser(null);
    reset();
  };

  const startEditRestaurant = (restaurant: Tables<'restaurants'>) => {
    setEditingRestaurant(restaurant);
    setShowRestaurantModal(true);
  };

  const cancelEditRestaurant = () => {
    setShowRestaurantModal(false);
    setEditingRestaurant(null);
  };

  const updateRestaurantDetails = async (restaurantId: string, updates: Partial<Tables<'restaurants'>>) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', restaurantId);

      if (error) throw error;

      setRestaurants(prev =>
        prev.map(restaurant =>
          restaurant.id === restaurantId
            ? { ...restaurant, ...updates }
            : restaurant
        )
      );

      toast.success('Ресторантът е обновен успешно');
      setShowRestaurantModal(false);
      setEditingRestaurant(null);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error('Грешка при обновяването');
    }
  };

  const deleteRestaurant = async (restaurantId: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този ресторант? Това действие не може да бъде отменено.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);

      if (error) throw error;

      setRestaurants(prev => prev.filter(restaurant => restaurant.id !== restaurantId));
      toast.success('Ресторантът е изтрит успешно');
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error('Грешка при изтриването');
    }
  };

  const getStatusColor = (status: Tables<'restaurants'>['status']) => {
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

  const getStatusText = (status: Tables<'restaurants'>['status']) => {
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

  const getRoleColor = (role: Tables<'profiles'>['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'restaurant':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: Tables<'profiles'>['role']) => {
    switch (role) {
      case 'admin':
        return 'Админ';
      case 'restaurant':
        return 'Ресторант';
      case 'client':
        return 'Клиент';
      default:
        return role;
    }
  };

  const tabs = [
    { id: 'restaurants', label: 'Ресторанти', icon: Store },
    { id: 'users', label: 'Потребители', icon: Users },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const statusFilters = [
    { key: 'all', label: 'Всички', count: restaurants.length },
    { key: 'active', label: 'Активни', count: restaurants.filter(r => r.status === 'active').length },
    { key: 'inactive', label: 'Неактивни', count: restaurants.filter(r => r.status === 'inactive').length },
    { key: 'suspended', label: 'Спрени', count: restaurants.filter(r => r.status === 'suspended').length },
  ];

  const userFilters = [
    { key: 'all', label: 'Всички', count: users.length },
    { key: 'client', label: 'Клиенти', count: users.filter(u => u.role === 'client').length },
    { key: 'restaurant', label: 'Ресторанти', count: users.filter(u => u.role === 'restaurant').length },
    { key: 'admin', label: 'Админи', count: users.filter(u => u.role === 'admin').length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Админ панел
          </h1>
          <p className="text-gray-600">
            Управление на платформата
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Restaurants Tab */}
            {activeTab === 'restaurants' && (
              <div className="space-y-6">
                {/* Filter Tabs */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  {statusFilters.map((filterItem) => (
                    <button
                      key={filterItem.key}
                      onClick={() => setFilter(filterItem.key as any)}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        filter === filterItem.key
                          ? 'bg-white text-red-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {filterItem.label}
                      {filterItem.count > 0 && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          filter === filterItem.key
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {filterItem.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Търсене по име или имейл..."
                      value={restaurantSearchTerm}
                      onChange={(e) => setRestaurantSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                    {restaurantSearchTerm && (
                      <button
                        onClick={() => setRestaurantSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Restaurants Table */}
                <div className="bg-white rounded-lg border overflow-hidden">
                  {restaurantsLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    </div>
                  ) : filteredRestaurants.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Store size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>{restaurantSearchTerm ? 'Няма намерени ресторанти' : 'Няма ресторанти'}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ресторант
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Контакт
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Статус
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Създаден
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Действия
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredRestaurants.map((restaurant) => (
                            <tr key={restaurant.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 bg-red-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold">
                                      {restaurant.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {restaurant.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {restaurant.city} • {restaurant.address}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{restaurant.phone}</div>
                                <div className="text-sm text-gray-500">{restaurant.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(restaurant.status)}`}>
                                  {getStatusText(restaurant.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(restaurant.created_at), 'dd MMM yyyy', { locale: bg })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  {restaurant.status !== 'active' && (
                                    <button
                                      onClick={() => updateRestaurantStatus(restaurant.id, 'active')}
                                      className="text-green-600 hover:text-green-900 p-1 rounded"
                                      title="Активирай"
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                  )}
                                  {restaurant.status !== 'suspended' && (
                                    <button
                                      onClick={() => updateRestaurantStatus(restaurant.id, 'suspended')}
                                      className="text-red-600 hover:text-red-900 p-1 rounded"
                                      title="Спри"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  )}
                                  <a
                                    href={`/restaurant/${restaurant.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                    title="Виж ресторанта"
                                  >
                                    <Eye size={16} />
                                  </a>
                                  <button
                                    onClick={() => startEditRestaurant(restaurant)}
                                    className="text-gray-600 hover:text-gray-900 p-1 rounded"
                                    title="Редактирай"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => deleteRestaurant(restaurant.id)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded"
                                    title="Изтрий"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Filter Tabs */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  {userFilters.map((filterItem) => (
                    <button
                      key={filterItem.key}
                      onClick={() => setUserFilter(filterItem.key as any)}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        userFilter === filterItem.key
                          ? 'bg-white text-red-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {filterItem.label}
                      {filterItem.count > 0 && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          userFilter === filterItem.key
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {filterItem.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Търсене по име..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Търсене по имейл..."
                      value={emailSearchTerm}
                      onChange={(e) => setEmailSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                    {emailSearchTerm && (
                      <button
                        onClick={() => setEmailSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg border overflow-hidden">
                  {usersLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Users size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>{searchTerm || emailSearchTerm ? 'Няма намерени потребители' : 'Няма потребители'}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Потребител
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Контакт
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Роля
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Регистриран
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Действия
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 bg-gray-600 rounded-lg flex items-center justify-center">
                                    <User className="text-white" size={20} />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {user.name}
                                    </div>
                                    {user.city && (
                                      <div className="text-sm text-gray-500 flex items-center">
                                        <MapPin size={12} className="mr-1" />
                                        {user.city}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {user.phone && (
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <Phone size={12} className="mr-1" />
                                    {user.phone}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                                  {getRoleText(user.role)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Calendar size={12} className="mr-1" />
                                  {format(new Date(user.created_at), 'dd MMM yyyy', { locale: bg })}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => startEditUser(user)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                    title="Редактирай"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <select
                                    value={user.role}
                                    onChange={(e) => updateUserRole(user.id, e.target.value as Tables<'profiles'>['role'])}
                                    className="text-xs border border-gray-300 rounded px-2 py-1"
                                  >
                                    <option value="client">Клиент</option>
                                    <option value="restaurant">Ресторант</option>
                                    <option value="admin">Админ</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Редактиране на потребител
                      </h3>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit(onEditUser)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Име и фамилия *
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
                          Телефон
                        </label>
                        <input
                          {...register('phone')}
                          type="tel"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Град
                        </label>
                        <input
                          {...register('city')}
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Роля *
                        </label>
                        <select
                          {...register('role', { required: 'Ролята е задължителна' })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="client">Клиент</option>
                          <option value="restaurant">Ресторант</option>
                          <option value="admin">Админ</option>
                        </select>
                        {errors.role && (
                          <p className="text-red-600 text-xs mt-1">{errors.role.message}</p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Отказ
                        </button>
                        <button
                          type="submit"
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Запази
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Restaurant Modal */}
            {showRestaurantModal && editingRestaurant && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Редактиране на ресторант: {editingRestaurant.name}
                      </h3>
                      <button
                        onClick={cancelEditRestaurant}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Основна информация</h4>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Име</label>
                          <input
                            type="text"
                            defaultValue={editingRestaurant.name}
                            onChange={(e) => editingRestaurant.name = e.target.value}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                          <select
                            defaultValue={editingRestaurant.status}
                            onChange={(e) => editingRestaurant.status = e.target.value as any}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          >
                            <option value="active">Активен</option>
                            <option value="inactive">Неактивен</option>
                            <option value="suspended">Приостановен</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Град</label>
                          <input
                            type="text"
                            defaultValue={editingRestaurant.city}
                            onChange={(e) => editingRestaurant.city = e.target.value}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
                          <input
                            type="text"
                            defaultValue={editingRestaurant.address}
                            onChange={(e) => editingRestaurant.address = e.target.value}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                          <input
                            type="tel"
                            defaultValue={editingRestaurant.phone}
                            onChange={(e) => editingRestaurant.phone = e.target.value}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Имейл</label>
                          <input
                            type="email"
                            defaultValue={editingRestaurant.email}
                            onChange={(e) => editingRestaurant.email = e.target.value}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                      </div>

                      {/* Delivery & Operating */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Доставка и работно време</h4>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Краен час за поръчки</label>
                          <input
                            type="time"
                            defaultValue={editingRestaurant.cutoff_time}
                            onChange={(e) => editingRestaurant.cutoff_time = e.target.value}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Време за доставка</label>
                          <input
                            type="text"
                            defaultValue={editingRestaurant.delivery_window}
                            onChange={(e) => editingRestaurant.delivery_window = e.target.value}
                            placeholder="12:00-14:00"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Райони за доставка</label>
                          <input
                            type="text"
                            defaultValue={editingRestaurant.districts?.join(', ')}
                            onChange={(e) => editingRestaurant.districts = e.target.value.split(',').map(d => d.trim())}
                            placeholder="Център, Лозенец, Борово"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Зони за доставка</label>
                          <input
                            type="text"
                            defaultValue={editingRestaurant.delivery_zones?.join(', ')}
                            onChange={(e) => editingRestaurant.delivery_zones = e.target.value.split(',').map(z => z.trim())}
                            placeholder="1000, 1001, 1002"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Тип доставка</label>
                          <select
                            defaultValue={editingRestaurant.delivery_type || 'fixed'}
                            onChange={(e) => editingRestaurant.delivery_type = e.target.value as any}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                          >
                            <option value="fixed">Фиксирана такса</option>
                            <option value="conditional">Условна безплатна</option>
                            <option value="free">Безплатна</option>
                          </select>
                        </div>

                        {editingRestaurant.delivery_type !== 'free' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Такса за доставка (лв)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              defaultValue={editingRestaurant.delivery_fee || 0}
                              onChange={(e) => editingRestaurant.delivery_fee = parseFloat(e.target.value) || 0}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                        )}

                        {editingRestaurant.delivery_type === 'conditional' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Праг за безплатна доставка (лв)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              defaultValue={editingRestaurant.free_delivery_threshold || ''}
                              onChange={(e) => editingRestaurant.free_delivery_threshold = parseFloat(e.target.value) || null}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex justify-end space-x-3 pt-6 border-t">
                      <button
                        type="button"
                        onClick={cancelEditRestaurant}
                        className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Отказ
                      </button>
                      <button
                        onClick={() => updateRestaurantDetails(editingRestaurant.id, editingRestaurant)}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Запази промените
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="text-center py-8">
                <Settings size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Системни настройки
                </h3>
                <p className="text-gray-600">
                  Тази функция ще бъде налична скоро
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}