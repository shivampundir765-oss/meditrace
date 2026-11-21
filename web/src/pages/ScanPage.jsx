import React, { useState } from 'react';
import {
  Scan as ScanIcon,
  Camera,
  Barcode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Pill,
  Calendar,
  Layers,
  Building
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

  const handleOcrScan = async (textToScan) => {
    const text = textToScan || ocrText;
    if (!text.trim()) return alert('Please enter or paste OCR text from the medicine packaging.');

    setLoading(true);
    setScanResult(null);
    setSavedSuccess(false);

    try {
      const res = await api.post('/scan/image', { raw_text: text });
      setScanResult(res.data);
    } catch (err) {
      alert(err.message);
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
      setScanResult(res.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAddMedicine = async () => {
    if (!scanResult?.autofill) return;

    setLoading(true);
    try {
      await api.post('/medicines', {
        ...scanResult.autofill,
        added_via: 'scan'
      });
      setSavedSuccess(true);
      setTimeout(() => {
        navigate('/medicines');
      }, 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <span>AI Medicine Scanner</span>
          <span className="px-2.5 py-0.5 bg-brand-100 text-brand-800 text-[10px] font-bold rounded-full">
            OCR & Barcode
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Scan your medicine box or strip to auto-fill its name, expiry date, batch number, and manufacturer.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold max-w-md">
        <button
          onClick={() => { setActiveTab('ocr'); setScanResult(null); }}
          className={`py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'ocr' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Label / Strip OCR</span>
        </button>

        <button
          onClick={() => { setActiveTab('barcode'); setScanResult(null); }}
          className={`py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'barcode' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Barcode className="w-4 h-4" />
          <span>Barcode GTIN Lookup</span>
        </button>
      </div>

      {/* OCR Scanner Input */}
      {activeTab === 'ocr' ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Captured Packaging Text (OCR)
            </label>
            <textarea
              rows="4"
              placeholder="Paste or edit OCR text from camera (e.g. Paracetamol 500mg, Exp: 12/2027, Batch: B101)..."
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 font-mono"
            ></textarea>
          </div>

          {/* Quick preset buttons */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Or test with sample pharmaceutical strips:
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
                  className="px-3 py-1.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleOcrScan()}
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Processing OCR Algorithms...' : 'Extract Medicine Details'}</span>
          </button>
        </div>
      ) : (
        /* Barcode Scanner Input */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Enter Barcode Number / GTIN
            </label>
            <div className="relative">
              <Barcode className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. 8901086001234 (Dolo) or 8901234567890 (Augmentin)"
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold"
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
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
                  className="px-3 py-1.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors"
                >
                  {b.name} ({b.code.slice(-5)})
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleBarcodeScan()}
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
          >
            <Barcode className="w-4 h-4" />
            <span>{loading ? 'Searching Barcode Registry...' : 'Look Up Barcode'}</span>
          </button>
        </div>
      )}

      {/* Extracted Details & Auto-Fill Confirmation Form */}
      {scanResult && (
        <div className="bg-white rounded-3xl p-6 border-2 border-brand-500 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                Extraction Complete
              </span>
              <h2 className="text-xl font-black text-slate-900">
                {scanResult.scan?.extracted_name || 'Scanned Medicine'}
              </h2>
            </div>

            {/* Confidence Score Meter */}
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Confidence:</span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
                  scanResult.scan?.confidence >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {scanResult.scan?.confidence || 0}%
              </span>
            </div>
          </div>

          {/* Extracted Fields Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Medicine Name</span>
              <span className="font-bold text-slate-900 block mt-0.5">
                {scanResult.scan?.extracted_name || 'Not detected'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Batch Number</span>
              <span className="font-bold text-slate-900 block mt-0.5">
                {scanResult.scan?.extracted_batch || 'Not detected'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Expiry Date</span>
              <span className="font-bold text-slate-900 block mt-0.5">
                {scanResult.scan?.extracted_expiry
                  ? new Date(scanResult.scan.extracted_expiry).toLocaleDateString([], { month: 'short', year: 'numeric' })
                  : 'Not detected'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Manufacturer</span>
              <span className="font-bold text-slate-900 block mt-0.5 line-clamp-1">
                {scanResult.scan?.extracted_manufacturer || 'Not detected'}
              </span>
            </div>
          </div>

          {/* Auto-Fill Confirmation Action */}
          <div className="bg-brand-50 p-4 rounded-2xl border border-brand-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-brand-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Ready to Add to Cabinet</span>
              </h4>
              <p className="text-xs text-brand-700 mt-0.5">
                Confirming will add this medicine directly into your personal medicine cabinet with stock tracking.
              </p>
            </div>

            <button
              onClick={handleConfirmAddMedicine}
              disabled={loading || savedSuccess}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center space-x-2 flex-shrink-0 disabled:opacity-50"
            >
              <span>{savedSuccess ? 'Added Successfully!' : 'Confirm & Add Medicine'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
