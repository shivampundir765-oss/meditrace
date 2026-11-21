import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Utensils,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function SchedulePage() {
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchSchedule = async (date) => {
    setLoading(true);
    try {
      const res = await api.get(`/schedule/today?date=${date}`);
      setScheduleData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate]);

  const handleTakeDose = async (doseId) => {
    setActionLoading(doseId);
    try {
      await api.post(`/doses/${doseId}/take`);
      fetchSchedule(selectedDate);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkipDose = async (doseId) => {
    setActionLoading(doseId);
    try {
      await api.post(`/doses/${doseId}/skip`);
      fetchSchedule(selectedDate);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatFoodInstruction = (inst) => {
    switch (inst) {
      case 'before_food': return 'Take before food';
      case 'after_food': return 'Take after food';
      case 'with_food': return 'Take with meals';
      default: return 'With or without food';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daily Dosage Schedule</h1>
          <p className="text-xs text-slate-500">Track and log your medication doses in real time.</p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-sm focus:ring-2 focus:ring-brand-500"
          />
          <Link
            to="/medicines"
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </Link>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Scheduled</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{scheduleData?.totalDoses || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase">Doses Taken</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{scheduleData?.takenCount || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-blue-600 uppercase">Pending</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{scheduleData?.pendingCount || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-rose-500 uppercase">Missed / Skipped</p>
          <p className="text-2xl font-black text-rose-500 mt-1">
            {(scheduleData?.missedCount || 0) + (scheduleData?.skippedCount || 0)}
          </p>
        </div>
      </div>

      {/* Dose Cards Timeline */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading schedule...</div>
      ) : scheduleData?.doses?.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">No Doses Scheduled for this Date</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add medicines and define their dosage schedules to get daily reminders and track stock automatically.
          </p>
          <Link
            to="/medicines"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Medicine</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduleData?.doses?.map((dose) => {
            const med = dose.medicine_id;
            const sched = dose.schedule_id;
            const isTaken = dose.status === 'taken';
            const isSkipped = dose.status === 'skipped';
            const isMissed = dose.status === 'missed';
            const isScheduled = dose.status === 'scheduled';

            const timeStr = new Date(dose.scheduled_time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={dose._id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isTaken
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isMissed
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                {/* Left details */}
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isTaken
                        ? 'bg-emerald-100 text-emerald-800'
                        : isMissed
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-brand-100 text-brand-800'
                    }`}
                  >
                    {timeStr}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-900">
                        {med?.name || 'Medicine'}
                      </h4>
                      {med?.strength && (
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                          {med.strength}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Dose: <strong>{sched?.dose_amount || '1 unit'}</strong>
                      {med?.dosage_form && ` (${med.dosage_form})`}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center space-x-1 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        <Utensils className="w-3 h-3 text-slate-400" />
                        <span>{formatFoodInstruction(sched?.food_instruction)}</span>
                      </span>

                      {/* Stock badge */}
                      {med?.quantity !== undefined && (
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium ${
                            med.quantity <= (med.low_stock_threshold || 5)
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Stock: {med.quantity} left
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  {isTaken ? (
                    <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Taken</span>
                    </span>
                  ) : isSkipped ? (
                    <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">
                      <XCircle className="w-4 h-4 text-slate-400" />
                      <span>Skipped</span>
                    </span>
                  ) : isMissed ? (
                    <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span>Missed</span>
                    </span>
                  ) : null}

                  {/* If scheduled or missed, allow marking taken or skipped */}
                  {(isScheduled || isMissed) && (
                    <>
                      <button
                        onClick={() => handleTakeDose(dose._id)}
                        disabled={actionLoading === dose._id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Taken</span>
                      </button>

                      <button
                        onClick={() => handleSkipDose(dose._id)}
                        disabled={actionLoading === dose._id}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
                      >
                        Skip
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
