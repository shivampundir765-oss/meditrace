import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import DisclaimerBanner from './components/common/DisclaimerBanner';
import ErrorBoundary from './components/common/ErrorBoundary';
import FloatingChatbot from './components/common/FloatingChatbot';
import { I18nProvider } from './i18n';
import { ProfileProvider } from './context/ProfileContext';

// Pages
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import SchedulePage from './pages/SchedulePage';
import MedicinesPage from './pages/MedicinesPage';
import CabinetsPage from './pages/CabinetsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import StockPage from './pages/StockPage';
import ScanPage from './pages/ScanPage';
import ChemistFinderPage from './pages/ChemistFinderPage';
import HistoryPage from './pages/HistoryPage';
import DoctorsPage from './pages/DoctorsPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import RetailerDashboardPage from './pages/RetailerDashboardPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto my-12 space-y-3">
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-sm text-gray-500">
          This portal requires role permissions ({allowedRoles.join(', ')}). Your current role is <strong>{user?.role}</strong>.
        </p>
      </div>
    );
  }

  return children;
};

export default function App() {
  const { fetchCurrentUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser();
    }
  }, [isAuthenticated]);

  return (
    <ErrorBoundary>
      <I18nProvider>
        <ProfileProvider>
          <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 selection:bg-teal-500 selection:text-white">
            <DisclaimerBanner />
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
                <Route path="/chemists" element={<ChemistFinderPage />} />
                <Route path="/nearby" element={<ChemistFinderPage />} />
                <Route path="/places" element={<ChemistFinderPage />} />
                <Route path="/shop" element={<ShopPage />} />

                {/* Protected Patient / General Routes */}
                <Route
                  path="/cabinets"
                  element={
                    <ProtectedRoute>
                      <CabinetsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/catalogs"
                  element={
                    <ProtectedRoute>
                      <CabinetsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schedule"
                  element={
                    <ProtectedRoute>
                      <SchedulePage />
                    </ProtectedRoute>
                  }
                />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
          <Route
            path="/medicines"
            element={
              <ProtectedRoute>
                <MedicinesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescriptions"
            element={
              <ProtectedRoute>
                <PrescriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock"
            element={
              <ProtectedRoute>
                <StockPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <ScanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors"
            element={
              <ProtectedRoute>
                <DoctorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Role-Specific Portals */}
          <Route
            path="/retailer"
            element={
              <ProtectedRoute allowedRoles={['retailer', 'admin']}>
                <RetailerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <FloatingChatbot />
    </div>
        </ProfileProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
