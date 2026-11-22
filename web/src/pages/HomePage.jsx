import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Pill, Clock, Scan, MapPin, UserCheck, ShoppingBag,
  ArrowRight, AlertCircle, CheckCircle2, ChevronDown, ChevronUp,
  Search, ShieldAlert, Award, Flame, ExternalLink, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [catalogs, setCatalogs] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [historySummary, setHistorySummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedMeds, setExpandedMeds] = useState({});
  const [markingDoseId, setMarkingDoseId] = useState(null);

  const loadDashboardData = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [catRes, schedRes, histRes] = await Promise.all([
        api.get('/cabinets').catch(() => api.get('/catalogs')).catch(() => ({ data: [] })),
        api.get('/schedule/today').catch(() => ({ data: null })),
        api.get('/history?days=7').catch(() => ({ data: null }))
      ]);

      const catData = catRes.data?.cabinets || catRes.data?.data || catRes.data;
      if (Array.isArray(catData)) setCatalogs(catData);

      const schedData = schedRes.data?.data || schedRes.data;
      if (schedData) setTodaySchedule(schedData);

      const histData = histRes.data?.data || histRes.data;
      if (histData) setHistorySummary(histData.summary);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isAuthenticated]);

  const toggleExpand = (id) => {
    setExpandedMeds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMarkDoseTaken = async (doseId) => {
    try {
      setMarkingDoseId(doseId);
      await api.post(`/doses/${doseId}/take`, { taken_time: new Date() });
      await loadDashboardData();
    } catch (err) {
      alert('Unable to mark dose as taken. Please try again.');
    } finally {
      setMarkingDoseId(null);
    }
  };

  // Filter medicines by search and category
  const filterMedicine = (med) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q || 
      (med.name && med.name.toLowerCase().includes(q)) ||
      (med.nickname && med.nickname.toLowerCase().includes(q)) ||
      (med.usedFor && med.usedFor.toLowerCase().includes(q)) ||
      (med.salt_composition && med.salt_composition.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
    return matchesSearch && matchesCategory;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome / Hero Banner */}
      <section className="bg-gradient-to-br from-teal-700 via-teal-800 to-sky-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {isAuthenticated ? `Welcome back, ${user?.name}` : 'Welcome to Meditrace'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Clear medication tracking, verified safety.
          </h1>
          <p className="text-sm sm:text-base text-teal-100">
            Intelligent strip OCR scanning, ABDM drug registry classification, automated meal dose schedules, and real-time pharmacy inventory discovery.
          </p>

          <div className="pt-3 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/scan"
                  className="px-5 py-2.5 bg-white text-teal-900 rounded-2xl font-bold text-xs sm:text-sm hover:bg-teal-50 shadow-md transition flex items-center space-x-2"
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan Medicine Strip</span>
                </Link>
                <Link
                  to="/history"
                  className="px-5 py-2.5 bg-teal-600/40 border border-white/30 text-white rounded-2xl font-bold text-xs sm:text-sm hover:bg-teal-600/60 transition flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>7-Day Adherence Matrix</span>
                </Link>
                <Link
                  to="/chemists"
                  className="px-5 py-2.5 bg-teal-600/40 border border-white/30 text-white rounded-2xl font-bold text-xs sm:text-sm hover:bg-teal-600/60 transition flex items-center space-x-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Nearby Healthcare</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-white text-teal-900 rounded-2xl font-bold text-sm hover:bg-teal-50 shadow-md transition"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/chemists"
                  className="px-6 py-2.5 bg-teal-600/40 border border-white/30 text-white rounded-2xl font-bold text-sm hover:bg-teal-600/60 transition"
                >
                  Find Nearby Chemists
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Prominent Medical Awareness Disclaimer */}
      <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl flex items-center gap-3 text-sky-900 text-xs font-medium">
        <ShieldAlert className="w-4 h-4 text-sky-600 shrink-0" />
        <span>
          <strong>General Awareness Note:</strong> Information is for personal adherence tracking and awareness and does not replace a doctor’s advice.
        </span>
      </div>

      {isAuthenticated && (
        <>
          {/* Quick Metrics & Compact 7-Day Adherence Card */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's doses card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Today's Doses</p>
                <p className="text-2xl font-black text-gray-900">
                  {todaySchedule?.takenCount || 0} / {todaySchedule?.totalDoses || 0}
                </p>
                <p className="text-[11px] text-gray-400">
                  {todaySchedule?.pendingCount || 0} doses pending
                </p>
              </div>
            </div>

            {/* Weekly Adherence % */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">7-Day Adherence</p>
                <p className="text-2xl font-black text-gray-900">
                  {historySummary?.adherencePercentage ?? 100}%
                </p>
                <Link to="/history" className="text-[11px] text-teal-600 font-semibold hover:underline">
                  View full matrix →
                </Link>
              </div>
            </div>

            {/* Adherence Streak */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Current Streak</p>
                <p className="text-2xl font-black text-gray-900">
                  {historySummary?.currentStreakDays ?? 0} days
                </p>
                <p className="text-[11px] text-gray-400">Full compliance streak</p>
              </div>
            </div>

            {/* Quick Scan Action */}
            <Link
              to="/scan"
              className="bg-gradient-to-br from-teal-50 to-white p-5 rounded-2xl border border-teal-100 shadow-sm hover:border-teal-300 transition flex items-center space-x-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Scan className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-teal-800 uppercase">Smart Scan</p>
                <p className="text-sm font-bold text-gray-900">Add Medicine</p>
                <span className="text-[11px] text-teal-600 font-medium">Strip OCR & ABDM →</span>
              </div>
            </Link>
          </section>

          {/* Today's Schedule by Meal (Breakfast, Lunch, Dinner, Bedtime) */}
          {todaySchedule?.byMeal && (
            <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Today's Meal Doses</h2>
                  <p className="text-xs text-gray-500">Scheduled intake grouped by daily meal periods</p>
                </div>
                <button
                  onClick={loadDashboardData}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                  title="Refresh schedule"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {['breakfast', 'lunch', 'dinner', 'bedtime'].map((mealKey) => {
                  const doses = todaySchedule.byMeal[mealKey] || [];
                  const titles = {
                    breakfast: { name: 'Breakfast (08:00)', icon: '🌅', color: 'teal' },
                    lunch: { name: 'Lunch (13:00)', icon: '☀️', color: 'sky' },
                    dinner: { name: 'Dinner (20:00)', icon: '🌆', color: 'amber' },
                    bedtime: { name: 'Bedtime (22:00)', icon: '🌙', color: 'indigo' }
                  };
                  const meta = titles[mealKey];

                  return (
                    <div key={mealKey} className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span className="flex items-center gap-1.5">
                          <span>{meta.icon}</span>
                          <span className="capitalize">{meta.name}</span>
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-gray-500 font-semibold border border-gray-100">
                          {doses.length}
                        </span>
                      </div>

                      {doses.length === 0 ? (
                        <p className="text-xs text-gray-400 py-4 text-center italic">No doses scheduled</p>
                      ) : (
                        <div className="space-y-2">
                          {doses.map((d) => {
                            const isTaken = d.status === 'taken';
                            const med = d.medicine_id || {};
                            return (
                              <div
                                key={d._id}
                                className={`p-3 rounded-xl border text-xs transition ${
                                  isTaken
                                    ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900'
                                    : 'bg-white border-gray-100 text-gray-800 shadow-2xs'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <p className="font-bold">{med.nickname || med.name}</p>
                                    {med.nickname && <p className="text-[11px] text-gray-400">{med.name}</p>}
                                    <p className="text-[11px] text-gray-500">
                                      {d.schedule_id?.dose_amount || '1 dose'} • {d.schedule_id?.food_instruction?.replace('_', ' ') || 'after food'}
                                    </p>
                                    {d.statusLine && (
                                      <span className={`inline-block text-[10px] font-bold ${
                                        d.statusColor === 'red' ? 'text-red-600' : 
                                        d.statusColor === 'amber' ? 'text-amber-600' : 'text-emerald-600'
                                      }`}>
                                        {d.statusLine}
                                      </span>
                                    )}
                                  </div>

                                  {!isTaken ? (
                                    <button
                                      disabled={markingDoseId === d._id}
                                      onClick={() => handleMarkDoseTaken(d._id)}
                                      className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-semibold transition shrink-0 disabled:opacity-50"
                                    >
                                      Take
                                    </button>
                                  ) : (
                                    <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px] shrink-0">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Search and Category Filter Bar */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Your Medicine Catalogs</h2>
                <p className="text-xs text-gray-500">Grouped by time of day with stock and expiry alerts</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Search Box */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, nickname, purpose..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  />
                </div>

                {/* Category Chips */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-semibold">
                  {['All', 'Common', 'Chronic', 'Serious'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl transition ${
                        selectedCategory === cat
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Catalogs List */}
            {catalogs.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 space-y-3">
                <Pill className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-gray-800">No Catalogs Setup Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Add medicines or scan packaging strips to automatically group them into catalogs.
                </p>
                <Link
                  to="/scan"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition shadow-sm"
                >
                  <Scan className="w-4 h-4" />
                  Scan First Medicine
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {catalogs.map((catalog) => {
                  const filteredMedicines = (catalog.medicines || []).filter(filterMedicine);
                  if (filteredMedicines.length === 0 && (searchTerm || selectedCategory !== 'All')) {
                    return null;
                  }

                  const hasAlertInCatalog = filteredMedicines.some(
                    (m) => m.quantity <= 0 || m.quantity <= (m.low_stock_threshold || 5)
                  );

                  return (
                    <div
                      key={catalog._id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      {/* Catalog Section Header */}
                      <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-gray-50/50 to-white">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-xs"
                            style={{ backgroundColor: catalog.color || '#0d9488' }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-gray-900">{catalog.name}</h3>
                              <span className="text-xs text-gray-400 font-medium">({catalog.time_slot})</span>
                              {hasAlertInCatalog && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertCircle className="w-3 h-3" /> Alert
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              Reminder: {catalog.reminder_time || '08:00'} • {filteredMedicines.length} medicine{filteredMedicines.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>

                        <Link
                          to="/medicines"
                          className="text-xs text-teal-600 hover:underline font-semibold"
                        >
                          Manage Medicines →
                        </Link>
                      </div>

                      {/* Medicine Cards Grid */}
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMedicines.length === 0 ? (
                          <div className="col-span-full py-8 text-center text-xs text-gray-400 italic">
                            No medicines match current search or category filter in this catalog.
                          </div>
                        ) : (
                          filteredMedicines.map((med) => {
                            const isExpanded = !!expandedMeds[med._id];
                            const isOutOfStock = med.quantity <= 0;
                            const isLowStock = !isOutOfStock && med.quantity <= (med.low_stock_threshold || 5);

                            return (
                              <div
                                key={med._id}
                                className={`rounded-2xl border p-4 transition-all space-y-3 ${
                                  isOutOfStock
                                    ? 'bg-red-50/20 border-red-200'
                                    : isLowStock
                                      ? 'bg-amber-50/20 border-amber-200'
                                      : 'bg-white border-gray-100 hover:border-gray-200 shadow-2xs'
                                }`}
                              >
                                {/* Card Header: Nickname / Name & Category Chip */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <h4 className="text-sm font-bold text-gray-900 leading-snug">
                                      {med.nickname || med.name}
                                    </h4>
                                    {med.nickname && (
                                      <p className="text-xs text-gray-500 font-medium">{med.name}</p>
                                    )}
                                  </div>

                                  {/* Category Chip in 3 Colors */}
                                  <span
                                    className={`shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                      med.category === 'Chronic'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : med.category === 'Serious'
                                          ? 'bg-red-100 text-red-800 border border-red-200'
                                          : 'bg-teal-100 text-teal-800 border border-teal-200'
                                    }`}
                                  >
                                    {med.category || 'Common'}
                                  </span>
                                </div>

                                {/* "Used for" line */}
                                {med.usedFor && (
                                  <p className="text-xs text-gray-600 font-medium">
                                    <span className="text-gray-400 font-normal">Used for: </span>
                                    {med.usedFor}
                                  </p>
                                )}

                                {/* Collapsible Details (Description & Cautions) */}
                                {isExpanded && (
                                  <div className="pt-2 border-t border-gray-100 space-y-2 text-xs text-gray-600 animate-in fade-in duration-150">
                                    {med.description && (
                                      <p className="text-gray-500 leading-relaxed">{med.description}</p>
                                    )}
                                    {med.cautions && (
                                      <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-900">
                                        <strong>Caution: </strong>{med.cautions}
                                      </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 pt-1">
                                      <div>Strength: <strong className="text-gray-700">{med.strength || 'Standard'}</strong></div>
                                      <div>Form: <strong className="text-gray-700 capitalize">{med.dosage_form || 'Tablet'}</strong></div>
                                      <div>Batch: <strong className="text-gray-700">{med.batch_number || 'N/A'}</strong></div>
                                      <div>Expiry: <strong className="text-gray-700">{med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : 'N/A'}</strong></div>
                                    </div>
                                  </div>
                                )}

                                {/* Status Line & Quick Action Buttons */}
                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        isOutOfStock
                                          ? 'bg-red-500'
                                          : isLowStock
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                      }`}
                                    />
                                    <span
                                      className={`text-xs font-bold ${
                                        isOutOfStock
                                          ? 'text-red-700'
                                          : isLowStock
                                            ? 'text-amber-700'
                                            : 'text-gray-700'
                                      }`}
                                    >
                                      {isOutOfStock
                                        ? 'Out of stock'
                                        : isLowStock
                                          ? `Low stock (${med.quantity} left)`
                                          : `${med.quantity || 0} in stock`}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Action button if out of stock or low stock */}
                                    {isOutOfStock && (
                                      <Link
                                        to={`/shop?query=${encodeURIComponent(med.name)}`}
                                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                                      >
                                        Buy Refill
                                      </Link>
                                    )}
                                    {isLowStock && (
                                      <Link
                                        to={`/chemists?search=${encodeURIComponent(med.name)}`}
                                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                                      >
                                        Refill
                                      </Link>
                                    )}

                                    {/* Expand/Collapse toggle button */}
                                    <button
                                      onClick={() => toggleExpand(med._id)}
                                      className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                                      title={isExpanded ? 'Collapse' : 'Expand description'}
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Explore Platform Features Section (Available for all) */}
      <section className="space-y-4 pt-4 border-t border-gray-100">
        <h2 className="text-xl font-extrabold text-gray-900">Explore Platform Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link
            to="/scan"
            className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition">
                <Scan className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900">Instant OCR & Strip Scan</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Extract medicine name, batch number, expiry date, ABDM drug registry code, and schedule warnings in seconds.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-600 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Start Scanning</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            to="/chemists"
            className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900">Nearby Chemist & Hospital Finder</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Geospatial 2dsphere search. Discover open pharmacies, check live medicine stock, and get turn-by-turn directions.
              </p>
            </div>
            <span className="text-xs font-bold text-sky-600 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Find Healthcare Places</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            to="/history"
            className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900">7-Day Adherence Matrix</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Visual matrix tracking taken and missed doses. Export weekly reports to PDF or record late doses.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>View Adherence</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            to="/doctors"
            className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900">Doctor Consultations</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Search verified cardiologists, dermatologists, and specialists. Reserve verified appointment slots with zero clash.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-600 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Book Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            to="/shop"
            className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900">Online Medicine Store</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Order prescription and OTC medicines online. Find generic alternatives matching the exact active salt composition.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-600 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Order Medicines</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            to="/stock"
            className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900">Inventory & Expiry Tracker</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Automated depletion estimations and expiry countdowns ensure your household cabinet never runs out.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Manage Cabinet</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
