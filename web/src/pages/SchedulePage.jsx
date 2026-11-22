import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Check
} from 'lucide-react';
import api from '../api/client';
import { useTranslation } from '../i18n';
import { useProfile } from '../context/ProfileContext';

export default function SchedulePage() {
  const { t } = useTranslation();
  const { activeProfile } = useProfile();
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Monthly Calendar Modal State
  const [selectedMedicineForCalendar, setSelectedMedicineForCalendar] = useState(null);
  const [currentMonthStr, setCurrentMonthStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyHistory, setMonthlyHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

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
  }, [selectedDate, activeProfile]);

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

  // Open Monthly Calendar for a medicine
  const openMonthlyCalendar = async (medicineId, medicineName) => {
    setSelectedMedicineForCalendar({ id: medicineId, name: medicineName });
    fetchMonthlyHistory(medicineId, currentMonthStr);
  };

  const fetchMonthlyHistory = async (medId, month) => {
    setLoadingHistory(true);
    setSelectedDayDetails(null);
    try {
      const res = await api.get(`/medicines/${medId}/dose-history?month=${month}`);
      setMonthlyHistory(res.data);
    } catch (err) {
      console.error('Error fetching monthly history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const navigateMonth = (direction) => {
    const [y, m] = currentMonthStr.split('-').map(Number);
    let newYear = y;
    let newMonth = m + direction;
    if (newMonth > 12) {
      newYear++;
      newMonth = 1;
    } else if (newMonth < 1) {
      newYear--;
      newMonth = 12;
    }
    const newStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setCurrentMonthStr(newStr);
    if (selectedMedicineForCalendar) {
      fetchMonthlyHistory(selectedMedicineForCalendar.id, newStr);
    }
  };

  const handleMarkLate = async (doseId) => {
    try {
      await api.post(`/history/doses/${doseId}/late`, { note: 'Taken late by patient' });
      if (selectedMedicineForCalendar) {
        fetchMonthlyHistory(selectedMedicineForCalendar.id, currentMonthStr);
      }
      fetchSchedule(selectedDate);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark dose taken late');
    }
  };

  const stateColors = {
    taken: 'bg-emerald-500 text-white',
    missed: 'bg-rose-500 text-white',
    partly_taken: 'bg-amber-400 text-white',
    upcoming: 'bg-gray-200 text-gray-700',
    not_scheduled: 'bg-gray-50 text-gray-300'
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span>📅</span>
            <span>{t('schedule.title', 'Dose Schedule & History')}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Tap any medicine to view its monthly adherence calendar and dose history.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs rounded-xl border border-gray-200 px-3 py-2 bg-gray-50 font-semibold text-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Daily Doses Timeline */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs animate-pulse h-24"></div>
          ))}
        </div>
      ) : scheduleData?.doses?.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs max-w-md mx-auto space-y-3">
          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-900 text-sm">No Doses Scheduled for this Day</h3>
          <p className="text-xs text-gray-500">
            You do not have any doses scheduled for {selectedDate}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduleData?.doses?.map((dose) => {
            const isTaken = dose.status === 'taken';
            const isMissed = dose.status === 'missed';
            const isSkipped = dose.status === 'skipped';
            const med = dose.medicine_id || {};

            return (
              <div
                key={dose._id}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div
                  className="flex items-center space-x-4 cursor-pointer flex-1"
                  onClick={() => openMonthlyCalendar(med._id, med.name)}
                  title="Click to view monthly adherence calendar"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isTaken
                        ? 'bg-emerald-50 text-emerald-600'
                        : isMissed
                        ? 'bg-rose-50 text-rose-600'
                        : isSkipped
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-teal-50 text-teal-700'
                    }`}
                  >
                    {isTaken ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : isMissed ? (
                      <XCircle className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-gray-900 text-sm hover:text-teal-700 transition-colors">
                        {med.name}
                      </h3>
                      {med.nickname && (
                        <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
                          {med.nickname}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Dose: {dose.dose_amount || '1 tablet'} • Scheduled at {new Date(dose.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className="text-[10px] text-teal-600 font-semibold hover:underline mt-1 inline-block">
                      📊 Tap to view monthly calendar
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {isTaken ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      Taken at {new Date(dose.taken_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : isMissed ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200">
                        Missed
                      </span>
                      <button
                        onClick={() => handleMarkLate(dose._id)}
                        className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-xl shadow-xs"
                      >
                        {t('schedule.mark_late', 'Mark Late')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSkipDose(dose._id)}
                        disabled={actionLoading === dose._id}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => handleTakeDose(dose._id)}
                        disabled={actionLoading === dose._id}
                        className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Take Dose</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MONTHLY CALENDAR MODAL */}
      {selectedMedicineForCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
                  <span>📅</span>
                  <span>{selectedMedicineForCalendar.name}</span>
                </h3>
                <p className="text-xs text-gray-500">
                  {t('schedule.monthly_calendar', 'Monthly Adherence Calendar')}
                </p>
              </div>

              <button
                onClick={() => setSelectedMedicineForCalendar(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Month Navigation & Metrics */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-1.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm text-gray-800 min-w-[100px] text-center">
                  {currentMonthStr}
                </span>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-1.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {monthlyHistory?.summary && (
                <div className="flex items-center space-x-4 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Adherence Rate</span>
                    <span className="font-bold text-teal-700 text-sm">
                      {monthlyHistory.summary.adherence_percentage}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Missed Doses</span>
                    <span className="font-bold text-rose-600 text-sm">
                      {monthlyHistory.summary.total_missed}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Taken Doses</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      {monthlyHistory.summary.total_taken}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Calendar Grid */}
            {loadingHistory ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading month data...</div>
            ) : (
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600">
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span>Taken</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span>Missed</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span>Partly Taken</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full bg-gray-200"></span>
                    <span>Upcoming</span>
                  </span>
                </div>

                {/* Day Blocks */}
                <div className="grid grid-cols-7 gap-2">
                  {monthlyHistory?.days?.map((dayRecord) => {
                    const isSelected = selectedDayDetails?.date === dayRecord.date;
                    const bgClass = stateColors[dayRecord.state] || stateColors.not_scheduled;

                    return (
                      <button
                        key={dayRecord.date}
                        onClick={() => setSelectedDayDetails(dayRecord)}
                        className={`p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all ${bgClass} ${
                          isSelected ? 'ring-3 ring-teal-500 scale-105' : 'hover:opacity-90'
                        }`}
                      >
                        <span className="font-bold text-xs">{dayRecord.day}</span>
                        <span className="text-[9px] mt-0.5 opacity-90 capitalize">
                          {dayRecord.state === 'not_scheduled' ? '-' : dayRecord.state.replace('_', ' ')}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Day Details Box */}
                {selectedDayDetails && (
                  <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-2 animate-in fade-in">
                    <h4 className="font-bold text-xs text-teal-950">
                      Doses on {selectedDayDetails.date} ({selectedDayDetails.total} scheduled)
                    </h4>
                    {selectedDayDetails.doses?.length === 0 ? (
                      <p className="text-xs text-gray-500">No doses scheduled on this day.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedDayDetails.doses.map((d) => (
                          <div
                            key={d._id}
                            className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-medium text-gray-800">
                                Time: {new Date(d.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {d.taken_time && (
                                <p className="text-[10px] text-emerald-600">
                                  Taken at: {new Date(d.taken_time).toLocaleTimeString()}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  d.status === 'taken'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : d.status === 'missed'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {d.status}
                              </span>

                              {d.status === 'missed' && (
                                <button
                                  onClick={() => handleMarkLate(d._id)}
                                  className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded-lg shadow-xs"
                                >
                                  Mark Late
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
