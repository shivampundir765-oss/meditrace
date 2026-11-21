import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Pill,
  Clock,
  Scan,
  MapPin,
  UserCheck,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [stockSummary, setStockSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      Promise.all([
        api.get('/schedule/today').catch(() => null),
        api.get('/stock').catch(() => null),
      ])
        .then(([schedRes, stockRes]) => {
          if (schedRes?.data) setTodaySchedule(schedRes.data);
          if (stockRes?.data) setStockSummary(stockRes.data);
        })
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-teal-800 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3 tracking-wide">
            {isAuthenticated ? `Welcome back, ${user?.name}` : 'Welcome to Meditrace'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Managing your medicines shouldn’t be complicated.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-brand-100">
            Automated dosage reminders, stock depletion predictions, intelligent OCR strip scanning, nearby chemist search, and affordable home delivery.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/schedule"
                  className="px-5 py-2.5 bg-white text-brand-800 rounded-xl font-semibold text-xs sm:text-sm hover:bg-brand-50 shadow transition-colors flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Today's Doses</span>
                </Link>
                <Link
                  to="/scan"
                  className="px-5 py-2.5 bg-brand-500/30 border border-white/30 text-white rounded-xl font-semibold text-xs sm:text-sm hover:bg-brand-500/40 transition-colors flex items-center space-x-2"
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan Medicine Strip</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-white text-brand-800 rounded-xl font-bold text-sm hover:bg-brand-50 shadow transition-colors"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/chemists"
                  className="px-6 py-2.5 bg-brand-500/30 border border-white/30 text-white rounded-xl font-bold text-sm hover:bg-brand-500/40 transition-colors"
                >
                  Find Nearby Chemists
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Patient Dashboard Metrics (If logged in) */}
      {isAuthenticated && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Your Health Dashboard</h2>
            <Link to="/schedule" className="text-xs text-brand-600 font-semibold hover:underline flex items-center space-x-1">
              <span>View Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's doses card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Today's Doses</p>
                <p className="text-2xl font-bold text-slate-900">
                  {todaySchedule?.takenCount || 0} / {todaySchedule?.totalDoses || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {todaySchedule?.pendingCount || 0} doses pending
                </p>
              </div>
            </div>

            {/* Total Active Medicines */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Active Medicines</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stockSummary?.totalMedicines || 0}
                </p>
                <Link to="/medicines" className="text-[11px] text-brand-600 font-medium hover:underline">
                  Manage inventory
                </Link>
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Low Stock Items</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stockSummary?.lowStockCount || 0}
                </p>
                <Link to="/stock" className="text-[11px] text-amber-600 font-medium hover:underline">
                  Reorder medicines
                </Link>
              </div>
            </div>

            {/* Expiring Soon */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Expiring Soon (30d)</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stockSummary?.expiringSoonCount || 0}
                </p>
                <Link to="/stock" className="text-[11px] text-rose-600 font-medium hover:underline">
                  Review expiry
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Feature Highlights Grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Explore Platform Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link
            to="/scan"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-brand-600 flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <Scan className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Instant OCR Scan</h3>
              <p className="text-xs text-slate-500 mt-1">
                Scan medicine strips, barcodes or upload photos. Auto-extracts name, batch, expiry, and manufacturer.
              </p>
            </div>
            <span className="text-xs font-semibold text-brand-600 mt-4 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>Start Scanning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/chemists"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Nearby Chemist Finder</h3>
              <p className="text-xs text-slate-500 mt-1">
                Geospatial 2dsphere search. Locate pharmacies around you, check who has your medicine in stock, and get directions.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 mt-4 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>Find Pharmacies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/doctors"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Doctor Appointments</h3>
              <p className="text-xs text-slate-500 mt-1">
                Search verified doctors by specialization and city. View real-time slots with strict double-booking protection.
              </p>
            </div>
            <span className="text-xs font-semibold text-purple-600 mt-4 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>Book Appointment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/shop"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Online Medicine Store</h3>
              <p className="text-xs text-slate-500 mt-1">
                Buy online at lower cost with automated cheaper generic alternatives matching your exact salt composition.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 mt-4 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>Browse Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/stock"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Predictive Stock Engine</h3>
              <p className="text-xs text-slate-500 mt-1">
                Know the exact date your medication runs out based on daily dose schedules. Timely refill reminders prevent missed doses.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-600 mt-4 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>View Stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/schedule"
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Daily Dosage Tracker</h3>
              <p className="text-xs text-slate-500 mt-1">
                Mark doses as taken or skipped with a single click. Every taken dose automatically decrements your active inventory.
              </p>
            </div>
            <span className="text-xs font-semibold text-rose-600 mt-4 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>View Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
