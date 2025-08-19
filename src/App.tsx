import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { RestaurantPage } from './pages/RestaurantPage';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { PricingPage } from './pages/PricingPage';
import { SuccessPage } from './pages/SuccessPage';
import { OrdersPage } from './pages/OrdersPage';
import { MyRestaurantsPage } from './pages/MyRestaurantsPage';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="App">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/success" element={<SuccessPage />} />
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/restaurant/:slug" element={<RestaurantPage />} />
                    <Route path="/restaurant" element={<RestaurantDashboard />} />
                    <Route path="/account/profile" element={<ProfilePage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/my-restaurants" element={<MyRestaurantsPage />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;