import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import api from '../api/client';
import { useProfile } from '../context/ProfileContext';

export default function CabinetsPage() {
  const { t } = useTranslation();
  const { activeProfile } = useProfile();
  const [cabinets, setCabinets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCabinet, setSelectedCabinet] = useState(null);

  // Create Cabinet Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCabinetName, setNewCabinetName] = useState('');
  const [newCabinetCondition, setNewCabinetCondition] = useState('Cold');
  const [newCabinetColor, setNewCabinetColor] = useState('#0d9488');
  const [creating, setCreating] = useState(false);

  // Inside Cabinet Quick-Add Medicine Modal
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [allMedicines, setAllMedicines] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [doseAmount, setDoseAmount] = useState('1 tablet');
  const [timing, setTiming] = useState('after_food');
  const [notes, setNotes] = useState('');
  const [addingMed, setAddingMed] = useState(false);

  // Inside Cabinet Quick-Add Prescription Modal
  const [showAddRxModal, setShowAddRxModal] = useState(false);
  const [rxDoctor, setRxDoctor] = useState('');
  const [rxHospital, setRxHospital] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxImageUrl, setRxImageUrl] = useState('');
  const [addingRx, setAddingRx] = useState(false);

  const conditionChips = [
    { label: t('cabinet.conditions.cold', 'Cold'), value: 'Cold', color: '#0d9488' },
    { label: t('cabinet.conditions.fever', 'Fever'), value: 'Fever', color: '#0284c7' },
    { label: t('cabinet.conditions.headache', 'Headache'), value: 'Headache', color: '#8b5cf6' },
    { label: t('cabinet.conditions.stomach', 'Stomach'), value: 'Stomach', color: '#f59e0b' },
    { label: t('cabinet.conditions.diabetes', 'Diabetes'), value: 'Diabetes', color: '#ef4444' },
    { label: t('cabinet.conditions.bp', 'BP'), value: 'Blood Pressure', color: '#ec4899' },
    { label: t('cabinet.conditions.allergy', 'Allergy'), value: 'Allergy', color: '#10b981' }
  ];

  const fetchCabinets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cabinets');
      const list = res.data?.cabinets || [];
      setCabinets(list);
      if (selectedCabinet) {
        const updated = list.find((c) => String(c._id) === String(selectedCabinet._id));
        if (updated) setSelectedCabinet(updated);
      }
    } catch (err) {
      console.error('Error fetching cabinets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMedicines = async () => {
    try {
      const res = await api.get('/medicines');
      setAllMedicines(res.data?.medicines || []);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  useEffect(() => {
    fetchCabinets();
    fetchAvailableMedicines();
  }, [activeProfile]);

  const handleCreateCabinet = async (e) => {
    e.preventDefault();
    if (!newCabinetName.trim()) return;
    setCreating(true);
    try {
      await api.post('/cabinets', {
        name: newCabinetName.trim(),
        condition: newCabinetCondition,
        color: newCabinetColor,
        time_slot: 'Morning',
        reminder_time: '08:00'
      });
      setNewCabinetName('');
      setShowCreateModal(false);
      await fetchCabinets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create cabinet');
    } finally {
      setCreating(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!selectedMedId || !selectedCabinet) return;
    setAddingMed(true);
    try {
      await api.post(`/cabinets/${selectedCabinet._id}/medicines`, {
        medicine_id: selectedMedId,
        dose_amount: doseAmount,
        timing,
        notes
      });
      // Allow adding multiple medicines without leaving screen
      setSelectedMedId('');
      setNotes('');
      await fetchCabinets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add medicine');
    } finally {
      setAddingMed(false);
    }
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    if (!selectedCabinet) return;
    setAddingRx(true);
    try {
      await api.post(`/cabinets/${selectedCabinet._id}/prescriptions`, {
        doctor_name: rxDoctor,
        hospital_name: rxHospital,
        image_url: rxImageUrl || null,
        notes: rxNotes
      });
      setShowAddRxModal(false);
      setRxDoctor('');
      setRxHospital('');
      setRxNotes('');
      setRxImageUrl('');
      await fetchCabinets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add prescription');
    } finally {
      setAddingRx(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span>🗄️</span>
            <span>{t('cabinet.title', 'Medicine Cabinets')}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {t('cabinet.subtitle', 'Group your medications by health condition, symptom, or routine')}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs hover:shadow transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>{t('cabinet.create', 'Create New Cabinet')}</span>
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              <div className="h-20 bg-gray-50 rounded-2xl"></div>
            </div>
          ))}
        </div>
      ) : cabinets.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-3xl mx-auto flex items-center justify-center text-3xl">
            🗄️
          </div>
          <h3 className="font-bold text-gray-900 text-base">{t('cabinet.empty')}</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Create cabinets like "Cold", "Diabetes", or "Fever" to easily track doses and stock.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold shadow-xs"
          >
            {t('cabinet.create', 'Create New Cabinet')}
          </button>
        </div>
      ) : (
        /* Cabinets Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cabinets.map((cab) => {
            const summary = cab.stock_summary || {};
            const isWarning = summary.has_warnings;

            return (
              <div
                key={cab._id}
                className="bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: cab.color || '#0d9488' }}
                      />
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{cab.name}</h3>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                          {cab.condition || 'General'}
                        </span>
                      </div>
                    </div>

                    {isWarning && (
                      <span className="inline-flex items-center space-x-1 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        <span>⚠️</span>
                        <span>{t('cabinet.check_this', 'Check This')}</span>
                      </span>
                    )}
                  </div>

                  {/* Stock Summary Badge Line */}
                  <div className="bg-gray-50 rounded-2xl p-2.5 border border-gray-100 text-[11px] flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Stock:</span>
                    <span className="font-semibold text-gray-800">{summary.text || `${cab.medicine_count} medicines`}</span>
                  </div>

                  {/* Medicine items preview */}
                  <div className="space-y-1.5 pt-1">
                    {cab.medicines && cab.medicines.slice(0, 3).map((m) => {
                      const stockInfo = m.stock_info || {};
                      return (
                        <div
                          key={m._id}
                          className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-none"
                        >
                          <span className="truncate max-w-[140px] font-medium text-gray-700">
                            {m.name}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                            style={{ backgroundColor: stockInfo.color || '#10b981' }}
                          >
                            {stockInfo.label || 'In Stock'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cabinet Actions Footer */}
                <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedCabinet(cab);
                      setShowAddMedModal(true);
                    }}
                    className="flex-1 py-1.5 px-3 bg-white hover:bg-teal-50 border border-gray-200 hover:border-teal-300 text-teal-800 rounded-xl text-xs font-semibold transition-colors"
                  >
                    + {t('cabinet.add_medicine', 'Add Medicine')}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCabinet(cab);
                      setShowAddRxModal(true);
                    }}
                    className="flex-1 py-1.5 px-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-blue-800 rounded-xl text-xs font-semibold transition-colors"
                  >
                    + {t('cabinet.add_prescription', 'Prescription')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Create New Cabinet */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">
                {t('cabinet.create', 'Create New Cabinet')}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Quick condition chips */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t('cabinet.quick_conditions', 'Common Medical Conditions')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {conditionChips.map((chip) => (
                  <button
                    type="button"
                    key={chip.value}
                    onClick={() => {
                      setNewCabinetCondition(chip.value);
                      setNewCabinetName(chip.value);
                      setNewCabinetColor(chip.color);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                      newCabinetCondition === chip.value
                        ? 'bg-teal-600 text-white border-teal-600 font-bold'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateCabinet} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('cabinet.name_label', 'Cabinet Name')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cold & Cough, Daily Vitamins"
                  value={newCabinetName}
                  onChange={(e) => setNewCabinetName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Color Tag</label>
                <div className="flex space-x-2">
                  {['#0d9488', '#0284c7', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewCabinetColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newCabinetColor === c ? 'scale-125 ring-2 ring-gray-400' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Create Cabinet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Medicine to Cabinet */}
      {showAddMedModal && selectedCabinet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Add Medicine to "{selectedCabinet.name}"
                </h3>
                <p className="text-[11px] text-gray-500">
                  You can add multiple medicines continuously without closing this screen.
                </p>
              </div>
              <button
                onClick={() => setShowAddMedModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Medicine</label>
                <select
                  required
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="">-- Choose from your medicines --</option>
                  {allMedicines.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.strength || 'Standard'}) - Qty: {m.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dose Amount</label>
                  <input
                    type="text"
                    value={doseAmount}
                    onChange={(e) => setDoseAmount(e.target.value)}
                    placeholder="e.g. 1 tablet"
                    className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Timing</label>
                  <select
                    value={timing}
                    onChange={(e) => setTiming(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 px-2 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="after_food">After Food</option>
                    <option value="before_food">Before Food</option>
                    <option value="with_food">With Food</option>
                    <option value="regardless">Regardless</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Take with warm water"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-teal-700 font-medium">
                  {selectedCabinet.medicine_count} medicines currently in cabinet
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMedModal(false)}
                    className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Done
                  </button>
                  <button
                    type="submit"
                    disabled={addingMed || !selectedMedId}
                    className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {addingMed ? 'Adding...' : '+ Add & Add More'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Prescription to Cabinet */}
      {showAddRxModal && selectedCabinet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">
                Attach Prescription to "{selectedCabinet.name}"
              </h3>
              <button
                onClick={() => setShowAddRxModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddPrescription} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh Sharma"
                  value={rxDoctor}
                  onChange={(e) => setRxDoctor(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hospital / Clinic</label>
                <input
                  type="text"
                  placeholder="e.g. Apollo Clinic"
                  value={rxHospital}
                  onChange={(e) => setRxHospital(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Prescription Image URL / Document</label>
                <input
                  type="text"
                  placeholder="https://... or upload link"
                  value={rxImageUrl}
                  onChange={(e) => setRxImageUrl(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes from doctor's consultation"
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRxModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingRx}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {addingRx ? 'Attaching...' : 'Save Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
