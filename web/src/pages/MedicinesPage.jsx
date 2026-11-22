import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill,
  Plus,
  Search,
  Filter,
  Calendar,
  Trash2,
  Edit,
  Clock,
  AlertTriangle,
  X,
  Check,
  History,
  MapPin
} from 'lucide-react';
import api from '../api/client';
import { useTranslation } from '../i18n';
import { useProfile } from '../context/ProfileContext';

export default function MedicinesPage() {
  const { t } = useTranslation();
  const { activeProfile } = useProfile();
  const [medicines, setMedicines] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, expired
  const [categoryFilter, setCategoryFilter] = useState('All'); // All, Common, Chronic, Serious
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  // Revisions Modal State
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [selectedMedRevisions, setSelectedMedRevisions] = useState([]);
  const [revisionMedName, setRevisionMedName] = useState('');
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState('tablet');
  const [quantity, setQuantity] = useState(30);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [expiryDate, setExpiryDate] = useState('');
  const [saltComposition, setSaltComposition] = useState('');
  const [category, setCategory] = useState('Common');
  const [usedFor, setUsedFor] = useState('');
  const [cautions, setCautions] = useState('');

  // Optional embedded schedule creation
  const [addSchedule, setAddSchedule] = useState(true);
  const [doseAmount, setDoseAmount] = useState('1 tablet');
  const [timesPerDay, setTimesPerDay] = useState(2);
  const [specificTimes, setSpecificTimes] = useState('09:00, 21:00');
  const [foodInstruction, setFoodInstruction] = useState('after_food');

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      let url = `/medicines?search=${search}`;
      if (filter === 'active') url += '&filter=active';
      if (filter === 'expired') url += '&filter=expired';
      if (categoryFilter !== 'All') url += `&category=${categoryFilter}`;
      const res = await api.get(url);
      setMedicines(res.data.medicines || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openRevisionsModal = async (medId, medName) => {
    setRevisionMedName(medName);
    setShowRevisionsModal(true);
    setLoadingRevisions(true);
    try {
      const res = await api.get(`/medicines/${medId}/revisions`);
      setSelectedMedRevisions(res.data?.revisions || []);
    } catch (err) {
      console.error('Error fetching revisions:', err);
    } finally {
      setLoadingRevisions(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [filter, categoryFilter, search, activeProfile]);

  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    try {
      const medRes = await api.post('/medicines', {
        name,
        nickname,
        strength,
        dosage_form: dosageForm,
        quantity: Number(quantity),
        low_stock_threshold: Number(lowStockThreshold),
        expiry_date: expiryDate ? expiryDate : null,
        salt_composition: saltComposition,
        category,
        usedFor,
        cautions
      });

      const newMedId = medRes.data.medicine._id;

      // Create schedule if checked
      if (addSchedule && newMedId) {
        const timesArray = specificTimes.split(',').map((t) => t.trim());
        await api.post(`/medicines/${newMedId}/schedule`, {
          dose_amount: doseAmount,
          times_per_day: Number(timesPerDay),
          specific_times: timesArray,
          start_date: new Date().toISOString().split('T')[0],
          food_instruction: foodInstruction
        });
      }

      setShowAddModal(false);
      resetForm();
      fetchMedicines();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (!confirm('Are you sure you want to remove this medicine and all its dose schedules?')) return;
    try {
      await api.delete(`/medicines/${id}`);
      fetchMedicines();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setStrength('');
    setDosageForm('tablet');
    setQuantity(30);
    setLowStockThreshold(5);
    setExpiryDate('');
    setSaltComposition('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Medicine Cabinet</h1>
          <p className="text-xs text-slate-500">Manage all prescribed and OTC medications in your personal inventory.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center space-x-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medicine</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by medicine name, salt or composition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Category & Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['all', 'active', 'expired'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  filter === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex bg-teal-50 p-1 rounded-xl text-xs font-semibold border border-teal-100">
            {['All', 'Common', 'Chronic', 'Serious'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  categoryFilter === cat ? 'bg-teal-600 text-white shadow-xs' : 'text-teal-800 hover:text-teal-950'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Medicine Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading medicines...</div>
      ) : medicines.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <Pill className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No medicines found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add medicines manually or use the camera scanner to auto-fill medicine strips.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700"
          >
            Add Your First Medicine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((med) => {
            const isOutOfStock = med.quantity <= 0;
            const isLowStock = !isOutOfStock && med.quantity <= (med.low_stock_threshold || 5);
            const isExpired = med.expiry_date && new Date(med.expiry_date) < new Date();
            const isExpanded = !!expandedCards[med._id];

            return (
              <div
                key={med._id}
                className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-teal-300 shadow-sm flex flex-col justify-between space-y-3 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-snug">
                        {med.nickname || med.name}
                      </h3>
                      {med.nickname && (
                        <p className="text-xs text-slate-400 font-medium">{med.name}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">
                        {med.strength || 'Standard'} • <span className="capitalize">{med.dosage_form}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          med.category === 'Chronic'
                            ? 'bg-amber-100 text-amber-800'
                            : med.category === 'Serious'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {med.category || 'Common'}
                      </span>
                      <button
                        onClick={() => handleDeleteMedicine(med._id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        title="Delete medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {med.usedFor && (
                    <p className="text-xs text-slate-600 mt-2 font-medium">
                      <span className="text-slate-400 font-normal">Used for: </span>
                      {med.usedFor}
                    </p>
                  )}

                  {/* Expandable description & cautions */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600 animate-in fade-in">
                      {med.description && <p className="text-slate-500">{med.description}</p>}
                      {med.cautions && (
                        <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 text-[11px]">
                          <strong>Caution: </strong>{med.cautions}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Stock Status</span>
                      <span
                        className={`font-bold ${
                          isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-emerald-700'
                        }`}
                      >
                        {isOutOfStock ? 'Out of stock' : isLowStock ? `Low stock (${med.quantity} left)` : `${med.quantity} in stock`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Expiry</span>
                      <span className={`font-medium ${isExpired ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                        {med.expiry_date
                          ? new Date(med.expiry_date).toLocaleDateString([], { month: 'short', year: 'numeric' })
                          : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setExpandedCards((prev) => ({ ...prev, [med._id]: !prev[med._id] }))}
                      className="text-teal-600 font-semibold text-[11px] hover:underline"
                    >
                      {isExpanded ? 'Less info ↑' : 'More info ↓'}
                    </button>
                    <button
                      onClick={() => openRevisionsModal(med._id, med.name)}
                      className="text-slate-500 hover:text-teal-700 font-medium text-[11px] flex items-center space-x-1"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>History</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOutOfStock && (
                      <Link
                        to={`/shop?query=${encodeURIComponent(med.name)}`}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold"
                      >
                        Buy Refill
                      </Link>
                    )}
                    <Link
                      to="/schedule"
                      className="text-slate-500 hover:text-slate-800 font-medium text-[11px]"
                    >
                      Schedule →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Medicine & Schedule</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg, Amoxicillin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Strength</label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 10ml"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dosage Form</label>
                  <select
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="syrup">Syrup</option>
                    <option value="injection">Injection</option>
                    <option value="drops">Drops</option>
                    <option value="inhaler">Inhaler</option>
                    <option value="ointment">Ointment / Cream</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Salt / Generic Composition</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol (650mg) — used for generic alternatives"
                  value={saltComposition}
                  onChange={(e) => setSaltComposition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Embedded Dosage Schedule Section */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-900 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={addSchedule}
                      onChange={(e) => setAddSchedule(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>Set Daily Dosage Schedule Now</span>
                  </label>
                </div>

                {addSchedule && (
                  <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Dose Amount</label>
                        <input
                          type="text"
                          value={doseAmount}
                          onChange={(e) => setDoseAmount(e.target.value)}
                          placeholder="e.g. 1 tablet"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Times Per Day</label>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={timesPerDay}
                          onChange={(e) => setTimesPerDay(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Daily Times (HH:MM)</label>
                        <input
                          type="text"
                          value={specificTimes}
                          onChange={(e) => setSpecificTimes(e.target.value)}
                          placeholder="09:00, 21:00"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Meal Timing</label>
                        <select
                          value={foodInstruction}
                          onChange={(e) => setFoodInstruction(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                        >
                          <option value="after_food">After Food</option>
                          <option value="before_food">Before Food</option>
                          <option value="with_food">With Food</option>
                          <option value="regardless">Regardless of meals</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revisions History Modal */}
      {showRevisionsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <History className="w-5 h-5 text-teal-600" />
                  <span>Audit & Revision Timeline</span>
                </h3>
                <p className="text-xs text-slate-500">{revisionMedName}</p>
              </div>
              <button onClick={() => setShowRevisionsModal(false)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">
                &times;
              </button>
            </div>

            {loadingRevisions ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading revision audit trail...</p>
            ) : selectedMedRevisions.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No revision history found.</p>
            ) : (
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-teal-200">
                {selectedMedRevisions.map((rev) => (
                  <div key={rev._id} className="relative flex items-start space-x-3 text-xs">
                    <span className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 z-10">
                      v{rev.revision_number}
                    </span>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {rev.entry_label || (rev.revision_number === 1 ? 'Added' : 'Edited')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.timestamp || rev.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{rev.change_summary}</p>
                      {rev.audit_stamp?.location && (
                        <p className="text-[10px] text-teal-700 flex items-center space-x-1 pt-1">
                          <MapPin className="w-3 h-3" />
                          <span>Location: {rev.audit_stamp.location.place_name || rev.audit_stamp.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
