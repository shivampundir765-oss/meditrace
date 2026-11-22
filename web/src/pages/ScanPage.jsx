import React, { useState, useEffect } from 'react';
import {
  Camera, Barcode, CheckCircle2, AlertCircle, ArrowRight,
  Sparkles, Pill, Clock, Plus, Tag, ShieldAlert, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function ScanPage() {
  const [activeTab, setActiveTab] = useState('ocr'); // 'ocr' or 'barcode'
  const [ocrText, setOcrText] = useState('');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const navigate = useNavigate();

  // Catalogs & Selection state
  const [catalogs, setCatalogs] = useState([]);
  const [catalogChoice, setCatalogChoice] = useState('existing'); // 'existing' | 'new' | 'none'
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [newCatalogName, setNewCatalogName] = useState('');
  const [newCatalogTimeSlot, setNewCatalogTimeSlot] = useState('Morning');
  const [newCatalogReminder, setNewCatalogReminder] = useState('08:00');

  // Meal timing slots
  const [selectedMeals, setSelectedMeals] = useState(['breakfast']);
  const [mealTimings, setMealTimings] = useState({
    breakfast: 'after_food',
    lunch: 'after_food',
    dinner: 'after_food',
    bedtime: 'after_food'
  });
  const [doseAmount, setDoseAmount] = useState('1 tablet');
  const [doNotTakeNote, setDoNotTakeNote] = useState('');

  // Nickname
  const [nickname, setNickname] = useState('');

  const nicknameSuggestions = [
    'Headache', 'Leg pain', 'Stomach pain', 'Cough',
    'Normal cold', 'Fever', 'Acidity', 'Allergy', 'Serious issue'
  ];

  // Preset sample strips for quick testing
  const sampleStrips = [
    {
      title: 'Paracetamol 500mg Strip',
      text: "PARACETAMOL 500mg TABLETS IP\nBatch No: B240918\nMfg Date: 01/2024\nEXPIRY DATE: 12/2027\nMFD BY: SUN PHARMACEUTICAL INDUSTRIES LTD\nKeep in a cool dry place."
    },
    {
      title: 'Augmentin 625 Duo Strip',
      text: "Augmentin 625 Duo\nBATCH: AG-4011\nEXP: OCT 2028\nMFD BY: GLAXOSMITHKLINE PHARMACEUTICALS\nRx only. Schedule H Prescription Drug."
    },
    {
      title: 'Pan 40 Gastro Tablet',
      text: "Pan 40 Tablet\nB.NO: ALK-331\nEXP: 06/2027\nMFD BY: ALKEM LABORATORIES LTD\nStore below 25°C."
    }
  ];

  // Load catalogs on mount
  useEffect(() => {
    api.get('/catalogs')
      .then(res => {
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) {
          setCatalogs(data);
          if (data.length > 0) setSelectedCatalogId(data[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  const handleOcrScan = async (textToScan) => {
    const text = textToScan || ocrText;
    if (!text.trim()) return alert('Please enter or paste OCR text from the medicine packaging.');

    setLoading(true);
    setScanResult(null);
    setSavedSuccess(false);

    try {
      const res = await api.post('/scan/image', { raw_text: text });
      const data = res.data?.data || res.data;
      setScanResult(data);
      if (data.autofill?.nickname) setNickname(data.autofill.nickname);
    } catch (err) {
      alert(err.message || 'OCR processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = async (barcode) => {
    const val = barcode || barcodeValue;
    if (!val.trim()) return alert('Please enter a barcode number.');

    setLoading(true);
    setScanResult(null);
    setSavedSuccess(false);

    try {
      const res = await api.post('/scan/barcode', { barcode: val });
      const data = res.data?.data || res.data;
      setScanResult(data);
      if (data.autofill?.nickname) setNickname(data.autofill.nickname);
    } catch (err) {
      alert(err.message || 'Barcode scan failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMeal = (mealKey) => {
    if (selectedMeals.includes(mealKey)) {
      if (selectedMeals.length > 1) {
        setSelectedMeals(selectedMeals.filter(m => m !== mealKey));
      }
    } else {
      setSelectedMeals([...selectedMeals, mealKey]);
    }
  };

  const handleConfirmAddMedicine = async () => {
    if (!scanResult?.autofill) return;

    setLoading(true);
    try {
      let catalogIdToUse = null;

      // 1. Create new catalog if requested
      if (catalogChoice === 'new') {
        if (!newCatalogName.trim()) {
          alert('Please enter a name for your new catalog');
          setLoading(false);
          return;
        }
        const newCatRes = await api.post('/catalogs', {
          name: newCatalogName.trim(),
          time_slot: newCatalogTimeSlot,
          reminder_time: newCatalogReminder,
          color: '#0d9488'
        });
        const createdCat = newCatRes.data?.data || newCatRes.data;
        catalogIdToUse = createdCat._id;
      } else if (catalogChoice === 'existing') {
        catalogIdToUse = selectedCatalogId || (catalogs[0]?._id);
      }

      // 2. Prepare mealSlots
      const mealSlots = selectedMeals.map(m => ({
        meal: m,
        timing: mealTimings[m] || 'after_food',
        dose_amount: doseAmount,
        do_not_take_note: doNotTakeNote
      }));

      // 3. Post medicine with metadata, nickname, catalog, and meal timing
      await api.post('/medicines', {
        ...scanResult.autofill,
        nickname: nickname.trim(),
        catalog_id: catalogIdToUse,
        mealSlots,
        dose_amount: doseAmount,
        do_not_take_note: doNotTakeNote,
        added_via: 'scan'
      });

      setSavedSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err) {
      alert(err.message || 'Failed to save medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-teal-50 text-teal-800 text-xs font-bold rounded-full border border-teal-200">
            Smart Strip & Barcode OCR
          </span>
          <span className="text-xs text-gray-400">ABDM Registry Integrated</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
          Scan Medicine Packaging
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Instant OCR extraction of pharmaceutical name, batch number, expiry date, ABDM classification, and clinical purpose.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 bg-gray-100 p-1.5 rounded-2xl text-xs font-bold max-w-md shadow-2xs">
        <button
          onClick={() => { setActiveTab('ocr'); setScanResult(null); }}
          className={`py-2.5 rounded-xl flex items-center justify-center space-x-2 transition ${
            activeTab === 'ocr' ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Label / Strip OCR</span>
        </button>

        <button
          onClick={() => { setActiveTab('barcode'); setScanResult(null); }}
          className={`py-2.5 rounded-xl flex items-center justify-center space-x-2 transition ${
            activeTab === 'barcode' ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Barcode className="w-4 h-4" />
          <span>Barcode GTIN Lookup</span>
        </button>
      </div>

      {/* OCR Scanner Input */}
      {activeTab === 'ocr' ? (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Captured Packaging Text (OCR)
            </label>
            <textarea
              rows="4"
              placeholder="Paste or enter OCR text from packaging (e.g. Paracetamol 500mg, Exp: 12/2027, Batch: B101)..."
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-gray-200 text-xs focus:ring-2 focus:ring-teal-500 font-mono text-gray-800 shadow-2xs"
            />
          </div>

          {/* Quick preset buttons */}
          <div>
            <span className="text-[11px] font-semibold text-gray-400 block mb-2">
              Or test with sample Indian pharmaceutical strips:
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleStrips.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setOcrText(s.text);
                    handleOcrScan(s.text);
                  }}
                  className="px-3.5 py-1.5 bg-gray-50 hover:bg-teal-50 hover:text-teal-800 border border-gray-200 rounded-xl text-xs font-semibold transition"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleOcrScan()}
            disabled={loading}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-md shadow-teal-600/20 transition flex items-center justify-center space-x-2 text-xs sm:text-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Processing OCR & ABDM Database...' : 'Extract Medicine Details'}</span>
          </button>
        </div>
      ) : (
        /* Barcode Scanner Input */
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Enter Barcode Number / GTIN
            </label>
            <div className="relative">
              <Barcode className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. 8901086001234 (Dolo) or 8901234567890 (Augmentin)"
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 text-xs font-mono font-semibold text-gray-800 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-gray-400 block mb-2">
              Quick test barcode samples:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Dolo 650mg', code: '8901086001234' },
                { name: 'Augmentin 625 Duo', code: '8901234567890' },
                { name: 'Pan 40 Tablet', code: '8903000000022' }
              ].map((b) => (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => {
                    setBarcodeValue(b.code);
                    handleBarcodeScan(b.code);
                  }}
                  className="px-3.5 py-1.5 bg-gray-50 hover:bg-teal-50 hover:text-teal-800 border border-gray-200 rounded-xl text-xs font-semibold transition"
                >
                  {b.name} ({b.code.slice(-5)})
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleBarcodeScan()}
            disabled={loading}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-md shadow-teal-600/20 transition flex items-center justify-center space-x-2 text-xs sm:text-sm disabled:opacity-50"
          >
            <Barcode className="w-4 h-4" />
            <span>{loading ? 'Searching Barcode Registry...' : 'Look Up Barcode'}</span>
          </button>
        </div>
      )}

      {/* Extracted Details, Catalog Selection & Meal Timing Flow */}
      {scanResult && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-500 shadow-xl space-y-8 animate-in fade-in duration-200">
          {/* Header & Confidence */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                Extraction Complete
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
                {scanResult.scan?.extracted_name || scanResult.autofill?.name || 'Scanned Medicine'}
              </h2>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200 self-start sm:self-auto">
              <span className="text-xs text-gray-500 font-medium">Confidence:</span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
                  scanResult.scan?.confidence >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {scanResult.scan?.confidence || 96}%
              </span>
            </div>
          </div>

          {/* 1. Clinical Description, Purpose & Category Card */}
          <div className="bg-gradient-to-br from-teal-50/50 via-sky-50/40 to-white p-5 rounded-2xl border border-teal-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">
                  {scanResult.autofill?.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    scanResult.autofill?.category === 'Chronic'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : scanResult.autofill?.category === 'Serious'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-teal-100 text-teal-800 border border-teal-200'
                  }`}
                >
                  {scanResult.autofill?.category || 'Common'}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                Form: <strong className="capitalize text-gray-800">{scanResult.autofill?.dosage_form || 'Tablet'}</strong> • Strength: <strong className="text-gray-800">{scanResult.autofill?.strength || 'Std'}</strong>
              </span>
            </div>

            {/* Description & Used For */}
            {scanResult.autofill?.description && (
              <p className="text-xs text-gray-600 leading-relaxed">
                {scanResult.autofill.description}
              </p>
            )}

            {scanResult.autofill?.usedFor && (
              <div className="text-xs text-gray-700">
                <span className="text-gray-400 font-medium">Used for: </span>
                <span className="font-semibold">{scanResult.autofill.usedFor}</span>
              </div>
            )}

            {/* Cautions */}
            {scanResult.autofill?.cautions && (
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Caution: </strong>{scanResult.autofill.cautions}</span>
              </div>
            )}
          </div>

          {/* 2. Optional Nickname Field with Suggestion Chips */}
          <div className="space-y-3 bg-gray-50/60 p-5 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-teal-600" />
                <span>Nickname (optional)</span>
              </label>
              <span className="text-[11px] text-gray-400">Easy label to remember purpose</span>
            </div>

            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Headache, Morning sugar, Leg pain..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 bg-white shadow-2xs focus:ring-2 focus:ring-teal-500"
            />

            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-gray-400 self-center mr-1">Suggestions:</span>
              {nicknameSuggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setNickname(sug)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    nickname === sug
                      ? 'bg-teal-600 text-white'
                      : 'bg-white hover:bg-teal-50 text-gray-600 border border-gray-200'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Catalog Choice Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Add to a Catalog</h3>
              <p className="text-xs text-gray-500">Group this medicine by daily routine or time slot</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCatalogChoice('existing')}
                className={`p-4 rounded-2xl border text-left transition ${
                  catalogChoice === 'existing'
                    ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-xs text-gray-900">Existing Catalog</div>
                <div className="text-[11px] text-gray-500 mt-1">Select from your existing routines</div>
              </button>

              <button
                type="button"
                onClick={() => setCatalogChoice('new')}
                className={`p-4 rounded-2xl border text-left transition ${
                  catalogChoice === 'new'
                    ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-xs text-gray-900">+ Create New Catalog</div>
                <div className="text-[11px] text-gray-500 mt-1">Define custom slot & reminders</div>
              </button>

              <button
                type="button"
                onClick={() => setCatalogChoice('none')}
                className={`p-4 rounded-2xl border text-left transition ${
                  catalogChoice === 'none'
                    ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-xs text-gray-900">Save Without Catalog</div>
                <div className="text-[11px] text-gray-500 mt-1">Keep in general cabinet</div>
              </button>
            </div>

            {/* Existing Catalog Selection Cards */}
            {catalogChoice === 'existing' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {catalogs.map((cat) => (
                  <div
                    key={cat._id}
                    onClick={() => setSelectedCatalogId(cat._id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      selectedCatalogId === cat._id
                        ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/30'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#0d9488' }} />
                      <span className="text-xs font-bold text-gray-900 truncate">{cat.name}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{cat.time_slot} ({cat.reminder_time})</p>
                  </div>
                ))}
              </div>
            )}

            {/* Create New Catalog Fields */}
            {catalogChoice === 'new' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Catalog Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Work Desk Routine"
                    value={newCatalogName}
                    onChange={(e) => setNewCatalogName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Time Slot</label>
                  <select
                    value={newCatalogTimeSlot}
                    onChange={(e) => setNewCatalogTimeSlot(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Reminder Time</label>
                  <input
                    type="time"
                    value={newCatalogReminder}
                    onChange={(e) => setNewCatalogReminder(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. "When do you take it?" Section */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">When do you take it?</h3>
              <p className="text-xs text-gray-500">Select daily meal times and food instructions</p>
            </div>

            {/* Multi-select Meals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'breakfast', label: 'Breakfast', time: '08:00', icon: '🌅' },
                { id: 'lunch', label: 'Lunch', time: '13:00', icon: '☀️' },
                { id: 'dinner', label: 'Dinner', time: '20:00', icon: '🌆' },
                { id: 'bedtime', label: 'Bedtime', time: '22:00', icon: '🌙' }
              ].map((m) => {
                const isSelected = selectedMeals.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMeal(m.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition space-y-2 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{m.icon}</span>
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isSelected ? 'bg-teal-600 text-white' : 'border border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">{m.label}</div>
                      <div className="text-[10px] text-gray-400">{m.time}</div>
                    </div>

                    {/* Before or After food toggle */}
                    {isSelected && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-2 border-t border-teal-200/60 flex text-[10px] font-bold"
                      >
                        <button
                          type="button"
                          onClick={() => setMealTimings({ ...mealTimings, [m.id]: 'before_food' })}
                          className={`flex-1 py-1 rounded-l-lg transition ${
                            mealTimings[m.id] === 'before_food'
                              ? 'bg-teal-700 text-white'
                              : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                        >
                          Before
                        </button>
                        <button
                          type="button"
                          onClick={() => setMealTimings({ ...mealTimings, [m.id]: 'after_food' })}
                          className={`flex-1 py-1 rounded-r-lg transition ${
                            mealTimings[m.id] === 'after_food'
                              ? 'bg-teal-700 text-white'
                              : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                        >
                          After
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dose Amount & "Do not take at" note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-1">Dose Amount</label>
                <input
                  type="text"
                  value={doseAmount}
                  onChange={(e) => setDoseAmount(e.target.value)}
                  placeholder="e.g. 1 tablet, 5 ml"
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-800 block mb-1">"Do not take at" Note</label>
                <input
                  type="text"
                  value={doNotTakeNote}
                  onChange={(e) => setDoNotTakeNote(e.target.value)}
                  placeholder="e.g. Not on an empty stomach, avoid with dairy"
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Confirm & Save Button */}
          <div className="bg-gradient-to-r from-teal-50 to-white p-5 rounded-2xl border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Ready to Add to Catalog & Daily Tracker</span>
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Will create automated daily dose logs, inventory stock alerts, and reminder timers.
              </p>
            </div>

            <button
              onClick={handleConfirmAddMedicine}
              disabled={loading || savedSuccess}
              className="w-full sm:w-auto px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
            >
              <span>{savedSuccess ? 'Added Successfully!' : 'Confirm & Save Medicine'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
