import React, { useState, useEffect } from 'react';
import {
  Camera, Barcode, CheckCircle2, AlertCircle, ArrowRight,
  Sparkles, Pill, Clock, Plus, Tag, ShieldAlert, Check, Volume2, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useTranslation } from '../i18n';
import useAuthStore from '../store/useAuthStore';

export default function ScanPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Scan steps: 'capture' (front & back) -> 'quality_review' -> 'confirm_edit' -> 'success'
  const [step, setStep] = useState('capture');
  const [activeSide, setActiveSide] = useState('front'); // 'front' or 'back'

  // Front & Back Photo inputs
  const [frontText, setFrontText] = useState('DOLO 650 Paracetamol Tablets IP 650mg Micro Labs Limited');
  const [backText, setBackText] = useState('Composition: Paracetamol IP 650mg. B.No. ML-9921. Exp. 07/2027. Mfd by Micro Labs Ltd. Store in a cool dry place.');
  const [barcodeInput, setBarcodeInput] = useState('8901086001234');
  const [frontQuality, setFrontQuality] = useState({ brightness: 85, blur_score: 90, has_glare: false });
  const [backQuality, setBackQuality] = useState({ brightness: 80, blur_score: 85, has_glare: false });

  // Quality check warnings
  const [qualityWarning, setQualityWarning] = useState(null);

  // Leaving Scan Warning Modal & Beep State
  const [showLeavingModal, setShowLeavingModal] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState(null);

  // Editable confirmed fields
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    salt_composition: '',
    dosage_form: 'tablet',
    strength: '',
    manufacturer: '',
    batch_number: '',
    expiry_date: '',
    quantity: 10,
    category: 'Common',
    description: '',
    usedFor: '',
    cautions: '',
    nickname: ''
  });

  const [fieldSources, setFieldSources] = useState({});
  const [loading, setLoading] = useState(false);

  // Cabinets State
  const [cabinets, setCabinets] = useState([]);
  const [cabinetChoice, setCabinetChoice] = useState('existing'); // 'existing' | 'new' | 'none'
  const [selectedCabinetId, setSelectedCabinetId] = useState('');
  const [newCabinetName, setNewCabinetName] = useState('');
  const [newCabinetCondition, setNewCabinetCondition] = useState('Cold');

  // Meal timing slots
  const [selectedMeals, setSelectedMeals] = useState(['breakfast']);
  const [mealTimings, setMealTimings] = useState({
    breakfast: 'after_food',
    lunch: 'after_food',
    dinner: 'after_food',
    bedtime: 'after_food'
  });
  const [doseAmount, setDoseAmount] = useState('1 tablet');

  const conditionChips = ['Cold', 'Fever', 'Headache', 'Stomach', 'Diabetes', 'BP', 'Allergy'];

  // Sound generator using Web Audio API for leaving warning
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz tone
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35); // 350ms beep
      }
    } catch (_e) {
      if (navigator.vibrate) navigator.vibrate(300);
    }
  };

  // Intercept browser back navigation & beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (step === 'confirm_edit' || frontText || backText) {
        playBeep();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step, frontText, backText]);

  // Load cabinets and drafts on mount
  useEffect(() => {
    api.get('/cabinets')
      .then((res) => {
        const list = res.data?.cabinets || [];
        setCabinets(list);
        if (list.length > 0) setSelectedCabinetId(list[0]._id);
      })
      .catch(() => {});

    // Check existing draft
    api.get('/scan/draft')
      .then((res) => {
        const draft = res.data?.draft;
        if (draft && draft.autofill_data?.name) {
          setFormData(draft.autofill_data);
          setFieldSources(draft.field_sources || {});
          setStep('confirm_edit');
        }
      })
      .catch(() => {});
  }, []);

  const triggerLeaveWarning = (onLeaveConfirmed) => {
    playBeep();
    setPendingLeaveAction(() => onLeaveConfirmed);
    setShowLeavingModal(true);
  };

  const handleConfirmLeave = async () => {
    // Save draft before leaving
    try {
      await api.post('/scan/draft', {
        autofill_data: formData,
        field_sources: fieldSources
      });
    } catch (_e) {}

    setShowLeavingModal(false);
    if (pendingLeaveAction) {
      pendingLeaveAction();
    } else {
      navigate('/cabinets');
    }
  };

  // Run 2-sided analysis
  const handleProcessScan = async () => {
    // Front quality check
    if (frontQuality.brightness < 40) {
      setQualityWarning(t('scan.dark_warning', 'Front packaging is too dark. Please use better lighting.'));
      return;
    }
    if (frontQuality.blur_score < 40) {
      setQualityWarning(t('scan.blur_warning', 'Photo appears blurry. Please hold camera steady.'));
      return;
    }

    setLoading(true);
    setQualityWarning(null);

    try {
      const res = await api.post('/scan/two-sided', {
        ocr_front: frontText,
        ocr_back: backText,
        barcode: barcodeInput,
        quality_front: frontQuality,
        quality_back: backQuality
      });

      const autofill = res.data?.autofill || {};
      const sources = res.data?.field_sources || {};

      setFormData({
        name: autofill.name || '',
        generic_name: autofill.generic_name || '',
        salt_composition: autofill.salt_composition || '',
        dosage_form: autofill.dosage_form || 'tablet',
        strength: autofill.strength || '',
        manufacturer: autofill.manufacturer || '',
        batch_number: autofill.batch_number || '',
        expiry_date: autofill.expiry_date ? autofill.expiry_date.split('T')[0] : '',
        quantity: autofill.quantity || 10,
        category: autofill.category || 'Common',
        description: autofill.description || '',
        usedFor: autofill.usedFor || '',
        cautions: autofill.cautions || '',
        nickname: autofill.nickname || ''
      });

      setFieldSources(sources);
      setStep('confirm_edit');
    } catch (err) {
      alert(err.response?.data?.message || 'Packaging scan failed to process');
    } finally {
      setLoading(false);
    }
  };

  // Save medicine and assign to cabinet
  const handleSaveMedicine = async () => {
    if (!formData.name.trim()) return alert('Medicine name is required');
    setLoading(true);

    try {
      let targetCabinetId = null;

      // Handle new cabinet creation if requested
      if (cabinetChoice === 'new' && newCabinetName.trim()) {
        const cabRes = await api.post('/cabinets', {
          name: newCabinetName.trim(),
          condition: newCabinetCondition,
          color: '#0d9488'
        });
        targetCabinetId = cabRes.data?.cabinet?._id;
      } else if (cabinetChoice === 'existing') {
        targetCabinetId = selectedCabinetId;
      }

      // Prepare mealSlots
      const mealSlots = selectedMeals.map((meal) => ({
        meal,
        timing: mealTimings[meal] || 'after_food',
        dose_amount: doseAmount
      }));

      // Location audit stamp
      let locationPayload = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
          );
          locationPayload = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
        } catch (_locErr) {}
      }

      await api.post('/medicines', {
        ...formData,
        cabinet_id: targetCabinetId,
        mealSlots,
        dose_amount: doseAmount,
        field_sources: fieldSources,
        location: locationPayload
      });

      // Discard draft on successful save
      await api.delete('/scan/draft').catch(() => {});

      setStep('success');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Leave Guard */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => triggerLeaveWarning(() => navigate(-1))}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <span>📷</span>
              <span>{t('scan.title', 'Scan Medicine Packaging')}</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Two-sided verification with India National Drug Database matching
            </p>
          </div>
        </div>

        {/* User Role Badge */}
        <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full capitalize">
          {user?.role === 'pharmacist' ? 'Pharmacist Mode' : user?.role === 'doctor' ? 'Doctor Mode' : 'Patient Mode'}
        </span>
      </div>

      {/* STEP 1: Two-Sided Capture */}
      {step === 'capture' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Quality check warning if any */}
          {qualityWarning && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{qualityWarning}</span>
              </div>
              <button
                onClick={() => setQualityWarning(null)}
                className="text-amber-800 font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Two-Sided Packaging Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Front Photo Card */}
            <div
              className={`bg-white rounded-3xl p-6 border transition-all ${
                activeSide === 'front'
                  ? 'border-teal-500 shadow-md ring-2 ring-teal-100'
                  : 'border-gray-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      {t('scan.front_title', 'Front Packaging Photo')}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      {t('scan.front_desc', 'Brand name, strength, and form')}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                  Front Side
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-300 text-center space-y-2">
                  <Camera className="w-8 h-8 text-teal-600 mx-auto" />
                  <p className="text-xs font-semibold text-gray-700">Packaging Front Text / OCR</p>
                  <textarea
                    rows={4}
                    value={frontText}
                    onChange={(e) => setFrontText(e.target.value)}
                    placeholder="Capture or type text from front packaging..."
                    className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                  <span>💡 {t('scan.guidance_light', 'Good lighting, no glare')}</span>
                  <span>📐 {t('scan.guidance_fill', 'Fill frame')}</span>
                </div>
              </div>
            </div>

            {/* Back Photo Card */}
            <div
              className={`bg-white rounded-3xl p-6 border transition-all ${
                activeSide === 'back'
                  ? 'border-teal-500 shadow-md ring-2 ring-teal-100'
                  : 'border-gray-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      {t('scan.back_title', 'Back Packaging Photo')}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      {t('scan.back_desc', 'Composition, expiry date, batch number, barcode')}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                  Back Side
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-300 text-center space-y-2">
                  <Barcode className="w-8 h-8 text-blue-600 mx-auto" />
                  <p className="text-xs font-semibold text-gray-700">Packaging Back Text / OCR</p>
                  <textarea
                    rows={4}
                    value={backText}
                    onChange={(e) => setBackText(e.target.value)}
                    placeholder="Capture or type text from back packaging..."
                    className="w-full text-xs rounded-xl border border-gray-200 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Detected Barcode / GTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="e.g. 8901086001234"
                    className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleProcessScan}
              disabled={loading || (!frontText.trim() && !backText.trim())}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying Packaging & Drug Registry...</span>
              ) : (
                <>
                  <span>Verify Packaging Details</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Confirm & Edit Fields */}
      {step === 'confirm_edit' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Verify & Confirm Attributes</h3>
                <p className="text-xs text-gray-500">
                  Each attribute displays its verification source. Pharmacists can edit any field.
                </p>
              </div>

              <button
                onClick={() => setStep('capture')}
                className="text-xs font-semibold text-teal-700 hover:underline flex items-center space-x-1"
              >
                <span>← {t('scan.retake', 'Retake Scan')}</span>
              </button>
            </div>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Medicine Name</span>
                  <span className="text-[10px] text-teal-700 font-medium capitalize">
                    [{fieldSources.name || 'scanned'}]
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setFieldSources({ ...fieldSources, name: 'manual' });
                  }}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Composition / Salt</span>
                  <span className="text-[10px] text-teal-700 font-medium capitalize">
                    [{fieldSources.salt_composition || 'database'}]
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.salt_composition}
                  onChange={(e) => {
                    setFormData({ ...formData, salt_composition: e.target.value });
                    setFieldSources({ ...fieldSources, salt_composition: 'manual' });
                  }}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Batch Number</span>
                  <span className="text-[10px] text-teal-700 font-medium capitalize">
                    [{fieldSources.batch_number || 'scanned'}]
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.batch_number}
                  onChange={(e) => {
                    setFormData({ ...formData, batch_number: e.target.value });
                    setFieldSources({ ...fieldSources, batch_number: 'manual' });
                  }}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Expiry Date</span>
                  <span className="text-[10px] text-teal-700 font-medium capitalize">
                    [{fieldSources.expiry_date || 'scanned'}]
                  </span>
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => {
                    setFormData({ ...formData, expiry_date: e.target.value });
                    setFieldSources({ ...fieldSources, expiry_date: 'manual' });
                  }}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="Common">Common (Everyday)</option>
                  <option value="Chronic">Chronic (Long-term)</option>
                  <option value="Serious">Serious (Prescription / Supervision)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Used For / Purpose</label>
                <input
                  type="text"
                  value={formData.usedFor}
                  onChange={(e) => setFormData({ ...formData, usedFor: e.target.value })}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cautions / Safety</label>
                <input
                  type="text"
                  value={formData.cautions}
                  onChange={(e) => setFormData({ ...formData, cautions: e.target.value })}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Cabinet Choice Section */}
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
              <h4 className="font-bold text-gray-900 text-xs">Assign to a Cabinet</h4>

              <div className="flex space-x-3 text-xs">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="cabinetChoice"
                    value="existing"
                    checked={cabinetChoice === 'existing'}
                    onChange={() => setCabinetChoice('existing')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>Existing Cabinet</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="cabinetChoice"
                    value="new"
                    checked={cabinetChoice === 'new'}
                    onChange={() => setCabinetChoice('new')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>Create New Cabinet</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="cabinetChoice"
                    value="none"
                    checked={cabinetChoice === 'none'}
                    onChange={() => setCabinetChoice('none')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>Save without Cabinet</span>
                </label>
              </div>

              {cabinetChoice === 'existing' && (
                <select
                  value={selectedCabinetId}
                  onChange={(e) => setSelectedCabinetId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  {cabinets.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.condition || 'General'})
                    </option>
                  ))}
                </select>
              )}

              {cabinetChoice === 'new' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="New cabinet name (e.g. Cold)"
                    value={newCabinetName}
                    onChange={(e) => setNewCabinetName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <div className="flex flex-wrap gap-1">
                    {conditionChips.map((chip) => (
                      <button
                        type="button"
                        key={chip}
                        onClick={() => {
                          setNewCabinetCondition(chip);
                          setNewCabinetName(chip);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          newCabinetCondition === chip
                            ? 'bg-teal-600 text-white font-bold'
                            : 'bg-white text-gray-700'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dose Timing & Schedule */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <h4 className="font-bold text-gray-900 text-xs">When do you take it?</h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {['breakfast', 'lunch', 'dinner', 'bedtime'].map((meal) => {
                  const isSelected = selectedMeals.includes(meal);
                  return (
                    <button
                      type="button"
                      key={meal}
                      onClick={() => {
                        setSelectedMeals(
                          isSelected
                            ? selectedMeals.filter((m) => m !== meal)
                            : [...selectedMeals, meal]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl border capitalize transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 font-bold'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      {meal}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => triggerLeaveWarning(() => navigate('/cabinets'))}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSaveMedicine}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Confirm & Save Medicine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Success Screen */}
      {step === 'success' && (
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm max-w-md mx-auto space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Medicine Saved Successfully!</h2>
          <p className="text-xs text-gray-500">
            Medicine has been added to your profile, verified via the National Drug Registry, and assigned to your cabinet.
          </p>
          <div className="flex justify-center space-x-3 pt-2">
            <button
              onClick={() => {
                setStep('capture');
                setFormData({
                  name: '', generic_name: '', salt_composition: '', dosage_form: 'tablet',
                  strength: '', manufacturer: '', batch_number: '', expiry_date: '',
                  quantity: 10, category: 'Common', description: '', usedFor: '', cautions: '', nickname: ''
                });
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold"
            >
              Scan Another
            </button>
            <button
              onClick={() => navigate('/cabinets')}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Go to Cabinets
            </button>
          </div>
        </div>
      )}

      {/* Leaving Scan Warning Modal (with Beep Sound) */}
      {showLeavingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 border border-red-100">
            <div className="flex items-center space-x-2.5 text-red-600">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5 text-red-600 animate-bounce" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">
                {t('scan.leaving_title', 'You are leaving the scanning process')}
              </h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {t(
                'scan.leaving_message',
                'Your current packaging scan is in progress. If you leave now, your draft will be saved so you can resume later.'
              )}
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLeavingModal(false)}
                className="px-4 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
              >
                {t('scan.stay_and_continue', 'Stay and continue')}
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs"
              >
                {t('scan.leave_anyway', 'Leave anyway')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
