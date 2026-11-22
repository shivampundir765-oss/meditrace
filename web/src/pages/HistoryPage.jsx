import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle2, XCircle, AlertCircle, Clock, 
  Download, Filter, Award, Flame, TrendingUp, RefreshCw, ChevronRight, X
} from 'lucide-react';
import apiClient from '../api/client';

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState('all');
  const [activeCellModal, setActiveCellModal] = useState(null); // { medicine, dayRecord }
  const [submittingLateDose, setSubmittingLateDose] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = selectedCatalog === 'all' 
        ? '/history?days=7' 
        : `/history?days=7&catalogId=${selectedCatalog}`;
      
      const res = await apiClient.get(url);
      const data = res.data?.data || res.data;
      setHistoryData(data);

      // Also fetch catalogs for filter if not yet loaded
      if (catalogs.length === 0) {
        const catRes = await apiClient.get('/catalogs');
        const catData = catRes.data?.data || catRes.data;
        if (Array.isArray(catData)) {
          setCatalogs(catData);
        }
      }
    } catch (err) {
      console.error('Failed to load adherence history:', err);
      setError('Unable to load dose history. Please verify your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedCatalog]);

  const handleMarkLate = async (doseId) => {
    try {
      setSubmittingLateDose(true);
      await apiClient.post(`/history/mark-late/${doseId}`, {
        note: 'Marked taken late via intake matrix'
      });
      // Refresh matrix
      await fetchHistory();
      setActiveCellModal(null);
    } catch (err) {
      alert('Failed to record dose. Please try again.');
    } finally {
      setSubmittingLateDose(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const getStatusBadge = (state) => {
    switch (state) {
      case 'taken':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 mx-auto transition hover:scale-110 shadow-sm" title="Taken on time">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
        );
      case 'missed':
        return (
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 mx-auto transition hover:scale-110 shadow-sm" title="Missed dose">
            <XCircle className="w-5 h-5 stroke-[2.5]" />
          </div>
        );
      case 'partly_taken':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 mx-auto transition hover:scale-110 shadow-sm" title="Partially taken">
            <AlertCircle className="w-5 h-5 stroke-[2.5]" />
          </div>
        );
      case 'upcoming':
        return (
          <div className="w-8 h-8 rounded-xl bg-teal-50/50 text-teal-600 flex items-center justify-center border border-dashed border-teal-300 mx-auto" title="Scheduled today">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'not_scheduled':
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center border border-gray-100 mx-auto">
            <span className="text-base font-bold">-</span>
          </div>
        );
    }
  };

  const formatDateHeader = (dateStr) => {
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    return { dayName, dayNum, isToday };
  };

  return (
    <div className="space-y-8 print:p-0">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              7-Day Adherence Matrix
            </span>
            <span className="text-xs text-gray-400">Clinical Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">Medicine Intake History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track daily doses, inspect completion timestamps, and record late intakes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Catalog Filter */}
          <div className="relative">
            <select
              value={selectedCatalog}
              onChange={(e) => setSelectedCatalog(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Catalogs</option>
              {catalogs.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name} ({cat.time_slot})
                </option>
              ))}
            </select>
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
          </div>

          <button
            onClick={fetchHistory}
            className="p-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition shadow-md shadow-teal-600/20"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Print View Header (Visible only when printing) */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meditrace Patient Intake Adherence Report</h1>
        <p className="text-xs text-gray-500">
          Generated for: {historyData?.dateRange?.startDate} to {historyData?.dateRange?.endDate} | Medical Awareness Aid
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && !historyData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-28 bg-gray-100 rounded-3xl" />
          <div className="h-28 bg-gray-100 rounded-3xl" />
          <div className="h-28 bg-gray-100 rounded-3xl" />
          <div className="h-96 md:col-span-3 bg-gray-100 rounded-3xl" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl flex items-center justify-between text-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {historyData && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 print:grid-cols-3">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Weekly Adherence</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-gray-900">
                    {historyData.summary?.adherencePercentage ?? 100}%
                  </span>
                  <span className="text-xs font-medium text-emerald-600">
                    {historyData.summary?.totalTaken} of {historyData.summary?.totalScheduled} taken
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Flame className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Streak</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-gray-900">
                    {historyData.summary?.currentStreakDays ?? 0}
                  </span>
                  <span className="text-xs font-medium text-gray-500">consecutive days</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attention Needed</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5 truncate">
                  {historyData.summary?.mostMissedMedicine || 'None (All on track)'}
                </p>
                <p className="text-xs text-gray-400">Most missed in 7 days</p>
              </div>
            </div>
          </div>

          {/* Adherence Matrix Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-teal-50/50 to-white border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">7-Day Dose Verification Matrix</h3>
                <p className="text-xs text-gray-500">
                  Tap any status pill to view exact dose times or record late taken doses.
                </p>
              </div>
              {/* Legend */}
              <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-gray-500">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Taken</span>
                <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-red-600" /> Missed</span>
                <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-600" /> Partial</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-teal-600" /> Scheduled</span>
              </div>
            </div>

            {historyData.matrix?.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-base font-semibold text-gray-700">No active medicines found in this catalog.</p>
                <p className="text-xs text-gray-400">Add medicines to track your daily adherence.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold text-gray-500">
                      <th className="py-4 px-6 min-w-[220px]">Medicine & Catalog</th>
                      {historyData.dates?.map((dateStr) => {
                        const { dayName, dayNum, isToday } = formatDateHeader(dateStr);
                        return (
                          <th key={dateStr} className={`py-4 px-3 text-center min-w-[70px] ${isToday ? 'bg-teal-50/70 text-teal-800' : ''}`}>
                            <div className="font-semibold text-xs">{dayName}</div>
                            <div className={`text-sm font-extrabold mt-0.5 ${isToday ? 'text-teal-700' : 'text-gray-900'}`}>{dayNum}</div>
                            {isToday && <span className="inline-block text-[10px] px-1.5 py-0.2 bg-teal-200/60 text-teal-900 rounded-full font-bold">Today</span>}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyData.matrix?.map((row) => {
                      const med = row.medicine;
                      return (
                        <tr key={med._id} className="hover:bg-gray-50/60 transition">
                          {/* Medicine Info Column */}
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-sm">{med.nickname || med.name}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  med.category === 'Chronic' 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : med.category === 'Serious' 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-teal-100 text-teal-800'
                                }`}>
                                  {med.category || 'Common'}
                                </span>
                              </div>
                              {med.nickname && (
                                <p className="text-xs text-gray-400">{med.name} • {med.strength || 'Std'}</p>
                              )}
                              <div className="flex items-center gap-2 text-xs">
                                <span 
                                  className="inline-block w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: med.catalog?.color || '#0d9488' }} 
                                />
                                <span className="text-gray-500 font-medium">{med.catalog?.catalog_name || 'General'}</span>
                                {med.usedFor && <span className="text-gray-400 truncate max-w-[150px]">• {med.usedFor}</span>}
                              </div>
                            </div>
                          </td>

                          {/* Day Columns */}
                          {row.days?.map((dayRec) => (
                            <td 
                              key={dayRec.date} 
                              className="py-4 px-3 text-center cursor-pointer hover:bg-teal-50/30 transition"
                              onClick={() => {
                                if (dayRec.doses?.length > 0) {
                                  setActiveCellModal({ medicine: med, dayRecord: dayRec });
                                }
                              }}
                            >
                              {getStatusBadge(dayRec.state)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Cell Detail / Late Dose Modal */}
      {activeCellModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {activeCellModal.medicine.nickname || activeCellModal.medicine.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Dose details for {new Date(activeCellModal.dayRecord.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => setActiveCellModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {activeCellModal.dayRecord.doses?.map((dose, idx) => (
                <div key={dose._id || idx} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-bold text-gray-800">
                        {new Date(dose.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: <strong className={
                        dose.status === 'taken' ? 'text-emerald-600 capitalize' : 
                        dose.status === 'missed' ? 'text-red-600 capitalize' : 'text-gray-600 capitalize'
                      }>{dose.status}</strong>
                      {dose.taken_time && (
                        <span> (Taken at {new Date(dose.taken_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                      )}
                    </div>
                    {dose.notes && <p className="text-[11px] text-gray-400">{dose.notes}</p>}
                  </div>

                  {dose.status !== 'taken' && (
                    <button
                      disabled={submittingLateDose}
                      onClick={() => handleMarkLate(dose._id)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 shrink-0"
                    >
                      Mark Taken Late
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveCellModal(null)}
                className="px-5 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medical Disclaimer */}
      <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 text-center">
        <p className="text-xs text-teal-800 font-medium">
          Note: Meditrace adherence logs are for personal tracking and general awareness. They do not replace professional medical judgment. Consult your physician before adjusting any prescription schedule.
        </p>
      </div>
    </div>
  );
}
