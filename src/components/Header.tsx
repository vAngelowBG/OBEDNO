import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, ShoppingBag, Store, Settings, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthContext } from '../contexts/AuthContext';
import { Logo } from './Logo';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, profile, signOut } = useAuthContext();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      setIsMenuOpen(false);
      await signOut();
      toast.success('Успешно излязохте от акаунта си');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Грешка при излизане от акаунта');
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold text-red-600">OBEDNO</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`text-gray-700 hover:text-red-600 transition-colors ${
                isActive('/') ? 'text-red-600 font-medium' : ''
              }`}
            >
              Начало
            </Link>
            <Link
              to="/pricing"
              className={`text-gray-700 hover:text-red-600 transition-colors ${
                isActive('/pricing') ? 'text-red-600 font-medium' : ''
              }`}
            >
              {profile?.role === 'restaurant' ? 'Абонамент' : 'Планове'}
            </Link>
            {isAuthenticated && profile?.role === 'client' && (
              <>
                <Link
                  to="/orders"
                  className={`text-gray-700 hover:text-red-600 transition-colors ${
                    isActive('/orders') ? 'text-red-600 font-medium' : ''
                  }`}
                >
                  Поръчки
                </Link>
                <Link
                  to="/my-restaurants"
                  className={`text-gray-700 hover:text-red-600 transition-colors ${
                    isActive('/my-restaurants') ? 'text-red-600 font-medium' : ''
                  }`}
                >
                  Моите ресторанти
                </Link>
                <Link
                  to="/saved-addresses"
                  className={`text-gray-700 hover:text-red-600 transition-colors ${
                    isActive('/saved-addresses') ? 'text-red-600 font-medium' : ''
                  }`}
                >
                  Адреси
                </Link>
              </>
            )}
            {isAuthenticated && profile?.role === 'restaurant' && (
              <Link
                to="/restaurant"
                className={`text-gray-700 hover:text-red-600 transition-colors ${
                  isActive('/restaurant') ? 'text-red-600 font-medium' : ''
                }`}
              >
                Ресторант
              </Link>
            )}
            {isAuthenticated && profile?.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className={`text-gray-700 hover:text-red-600 transition-colors ${
                    isActive('/admin') ? 'text-red-600 font-medium' : ''
                  }`}
                >
                  Админ
                </Link>
                <Link
                  to="/admin/restaurants"
                  className={`text-gray-700 hover:text-red-600 transition-colors ${
                    isActive('/admin/restaurants') ? 'text-red-600 font-medium' : ''
                  }`}
                >
                  Ресторанти
                </Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && profile ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="text-gray-700">Здравей,</span>
                  <Link
                    to="/account/profile"
                    className="font-bold text-gray-900 hover:text-red-600 transition-colors"
                  >
                    {profile?.name}
                  </Link>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Изход
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/auth"
                  className="text-gray-700 hover:text-red-600 transition-colors"
                >
                  Вход
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  to="/auth"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Регистрация
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-red-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Начало
              </Link>
              <Link
                to="/pricing"
                className="text-gray-700 hover:text-red-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Планове
              </Link>
              {isAuthenticated && profile?.role === 'client' && (
                <>
                  <Link
                    to="/orders"
                    className="text-gray-700 hover:text-red-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Поръчки
                  </Link>
                  <Link
                    to="/my-restaurants"
                    className="text-gray-700 hover:text-red-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Моите ресторанти
                  </Link>
                  <Link
                    to="/saved-addresses"
                    className="text-gray-700 hover:text-red-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Адреси
                  </Link>
                </>
              )}
              {isAuthenticated && profile?.role === 'restaurant' && (
                <Link
                  to="/restaurant"
                  className="text-gray-700 hover:text-red-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Ресторант
                </Link>
              )}
              {isAuthenticated && profile?.role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-red-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Админ
                  </Link>
                  <Link
                    to="/admin/restaurants"
                    className="text-gray-700 hover:text-red-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Ресторанти
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <>
                  <Link
                    to="/account/profile"
                    className="text-gray-700 hover:text-red-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Профил
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-left bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Изход
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <Link
                  to="/auth"
                  className="text-gray-700 hover:text-red-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Вход / Регистрация
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}