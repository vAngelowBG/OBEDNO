import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold">OBEDNO</span>
            </div>
            <p className="text-gray-300">
              Платформата за обедни менюта в България
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">За клиенти</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/" className="hover:text-white transition-colors">Начало</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Поръчки</Link></li>
              <li><Link to="/saved-addresses" className="hover:text-white transition-colors">Адреси</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">За ресторанти</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/restaurant" className="hover:text-white transition-colors">Портал</Link></li>
              <li><Link to="/auth" className="hover:text-white transition-colors">Регистрация</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Абонамент</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Информация</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/terms" className="hover:text-white transition-colors">Условия</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Поверителност</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Контакт</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2024 OBEDNO. Всички права запазени.</p>
        </div>
      </div>
    </footer>
  );
}