import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Pill,
  Calendar,
  Clock,
  Scan,
  MapPin,
  UserCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Shield,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Schedule', path: '/schedule', icon: Calendar, public: false },
    { name: 'Medicines', path: '/medicines', icon: Pill, public: false },
    { name: 'Stock', path: '/stock', icon: Clock, public: false },
    { name: 'Scan', path: '/scan', icon: Scan, public: false },
    { name: 'Chemists', path: '/chemists', icon: MapPin, public: true },
    { name: 'Doctors', path: '/doctors', icon: UserCheck, public: true },
    { name: 'Shop', path: '/shop', icon: ShoppingBag, public: true },
  ];

  if (user?.role === 'retailer' || user?.role === 'admin') {
    navLinks.push({ name: 'Retailer Hub', path: '/retailer', icon: Store, public: false });
  }

  if (user?.role === 'admin') {
    navLinks.push({ name: 'Admin', path: '/admin', icon: Shield, public: false });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm">
              <Pill className="w-5 h-5 transform -rotate-45" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">
              Medi<span className="text-brand-600">trace</span>
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Header: Cart, Notifications & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Cart Link */}
            <Link
              to="/cart"
              className="p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-full relative transition-colors"
              aria-label="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-brand-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <NotificationBell />

                <div className="h-5 w-px bg-slate-200 mx-1" />

                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline font-medium">{user?.name?.split(' ')[0]}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-brand-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
