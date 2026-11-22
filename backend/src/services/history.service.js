const { DoseLog } = require('../models/doseLog.model');
const { Medicine } = require('../models/medicine.model');
const { DoseSchedule } = require('../models/doseSchedule.model');
const { Cabinet } = require('../models/cabinet.model');
const { CabinetMedicine } = require('../models/cabinetMedicine.model');
const { generateDoseLogsForDate } = require('./schedule.service');

class HistoryService {
  /**
   * Compute N-day adherence history matrix for a patient
   * @param {string} patientId 
   * @param {Object} options 
   */
  async getAdherenceHistory(patientId, { days = 7, catalogId = null, cabinetId = null, profileId = null } = {}) {
    const numDays = Math.min(Math.max(parseInt(days, 10) || 7, 1), 30);
    const now = new Date();

    // 1. Build list of date strings (YYYY-MM-DD) from (today - (numDays-1)) to today
    const dates = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const startDate = new Date(dates[0]);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(dates[dates.length - 1]);
    endDate.setHours(23, 59, 59, 999);

    // 2. Fetch user's cabinets and cabinet mappings
    const cabinetFilter = { user_id: patientId };
    if (profileId) {
      cabinetFilter.$or = [{ profile_id: profileId }, { profile_id: null }];
    }
    const cabinets = await Cabinet.find(cabinetFilter).lean();
    const cabinetMedicines = await CabinetMedicine.find({ user_id: patientId }).lean();

    const medToCabinetMap = {};
    cabinetMedicines.forEach(cm => {
      const cab = cabinets.find(c => String(c._id) === String(cm.cabinet_id));
      if (cab) {
        medToCabinetMap[String(cm.medicine_id)] = {
          cabinet_id: cab._id,
          cabinet_name: cab.name,
          time_slot: cab.time_slot,
          color: cab.color
        };
      }
    });

    // 3. Fetch active medicines
    const medicineQuery = { patient_id: patientId, status: { $ne: 'discontinued' } };
    const medicines = await Medicine.find(medicineQuery).sort({ name: 1 }).lean();

    // Filter by cabinetId or catalogId if provided
    let filteredMedicines = medicines;
    const targetCabId = cabinetId || catalogId;
    if (targetCabId) {
      const allowedMedIds = cabinetMedicines
        .filter(cm => String(cm.cabinet_id || cm.catalog_id) === String(targetCabId))
        .map(cm => String(cm.medicine_id));
      filteredMedicines = medicines.filter(m => allowedMedIds.includes(String(m._id)));
    }

    // 4. Ensure dose logs exist for all days in range for active schedules
    const schedules = await DoseSchedule.find({
      patient_id: patientId,
      is_active: true
    });

    for (const dateStr of dates) {
      const targetDate = new Date(dateStr);
      for (const schedule of schedules) {
        await generateDoseLogsForDate(schedule, targetDate);
      }
    }

    // Auto-mark passed doses as missed if older than current time and still 'scheduled'
    await DoseLog.updateMany(
      {
        patient_id: patientId,
        status: 'scheduled',
        scheduled_time: { $lt: now }
      },
      { $set: { status: 'missed' } }
    );

    // 5. Fetch all logs in the period
    const logs = await DoseLog.find({
      patient_id: patientId,
      scheduled_time: { $gte: startDate, $lte: endDate }
    }).lean();

    // 6. Build the adherence matrix rows
    let totalScheduledCount = 0;
    let totalTakenCount = 0;
    const medMissedCounts = {};

    const matrix = filteredMedicines.map(med => {
      const medIdStr = String(med._id);
      const catInfo = medToCabinetMap[medIdStr] || {
        cabinet_id: null,
        cabinet_name: 'General',
        time_slot: 'Morning',
        color: '#0d9488'
      };

      medMissedCounts[med.name] = 0;

      const dailyRecords = dates.map(dateStr => {
        const dayLogs = logs.filter(l => {
          const lDateStr = new Date(l.scheduled_time).toISOString().split('T')[0];
          return String(l.medicine_id) === medIdStr && lDateStr === dateStr;
        });

        if (dayLogs.length === 0) {
          return {
            date: dateStr,
            state: 'not_scheduled', // grey dash
            doses: []
          };
        }

        totalScheduledCount += dayLogs.length;

        const takenDoses = dayLogs.filter(l => l.status === 'taken');
        const missedDoses = dayLogs.filter(l => l.status === 'missed');
        const scheduledUpcoming = dayLogs.filter(l => l.status === 'scheduled');

        totalTakenCount += takenDoses.length;
        medMissedCounts[med.name] += missedDoses.length;

        let state = 'not_scheduled';
        if (takenDoses.length === dayLogs.length) {
          state = 'taken'; // green tick
        } else if (missedDoses.length === dayLogs.length) {
          state = 'missed'; // red cross
        } else if (takenDoses.length > 0) {
          state = 'partly_taken'; // amber
        } else if (scheduledUpcoming.length > 0) {
          state = 'upcoming'; // empty / upcoming
        } else {
          state = 'missed';
        }

        return {
          date: dateStr,
          state,
          total: dayLogs.length,
          taken: takenDoses.length,
          missed: missedDoses.length,
          doses: dayLogs.map(l => ({
            _id: l._id,
            scheduled_time: l.scheduled_time,
            taken_time: l.taken_time,
            status: l.status,
            notes: l.notes
          }))
        };
      });

      return {
        medicine: {
          _id: med._id,
          name: med.name,
          nickname: med.nickname || '',
          dosage_form: med.dosage_form,
          strength: med.strength,
          category: med.category || 'Common',
          usedFor: med.usedFor || '',
          quantity: med.quantity,
          cabinet: catInfo
        },
        days: dailyRecords
      };
    });

    // 7. Calculate summary metrics
    const adherencePercentage = totalScheduledCount > 0
      ? Math.round((totalTakenCount / totalScheduledCount) * 100)
      : 100;

    // Calculate current streak of full days (from yesterday backwards to day 0)
    let currentStreak = 0;
    const sortedDatesReverse = [...dates].reverse();
    for (const dStr of sortedDatesReverse) {
      const dayLogs = logs.filter(l => new Date(l.scheduled_time).toISOString().split('T')[0] === dStr);
      if (dayLogs.length === 0) continue; // Skip non-scheduled days
      const allTaken = dayLogs.every(l => l.status === 'taken');
      if (allTaken) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Most missed medicine
    let mostMissedMedicine = 'None';
    let maxMissed = 0;
    Object.entries(medMissedCounts).forEach(([name, count]) => {
      if (count > maxMissed) {
        maxMissed = count;
        mostMissedMedicine = name;
      }
    });

    return {
      dateRange: {
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        totalDays: numDays
      },
      dates,
      summary: {
        totalScheduled: totalScheduledCount,
        totalTaken: totalTakenCount,
        adherencePercentage,
        currentStreakDays: currentStreak,
        mostMissedMedicine: maxMissed > 0 ? mostMissedMedicine : 'None (All on track)'
      },
      matrix
    };
  }

  /**
   * Get complete monthly calendar view for a specific medicine
   * Month format: 'YYYY-MM' (defaults to current month)
   */
  async getMonthlyMedicineHistory(patientId, profileId, medicineId, monthStr) {
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth(); // 0-indexed

    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
      const [y, m] = monthStr.split('-').map(Number);
      targetYear = y;
      targetMonth = m - 1;
    }

    const firstDay = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const lastDay = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    const totalDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    const formattedMonth = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

    // Verify medicine exists
    const medicine = await Medicine.findById(medicineId).lean();
    if (!medicine || medicine.is_deleted) {
      throw new Error('Medicine not found');
    }

    // Active dose schedule
    const schedule = await DoseSchedule.findOne({
      medicine_id: medicineId,
      patient_id: patientId,
      is_active: true
    }).lean();

    // Auto-generate dose logs for all days in this month up to today
    const dates = [];
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(targetYear, targetMonth, day);
      dates.push(d.toISOString().split('T')[0]);
      if (schedule && d <= now) {
        await generateDoseLogsForDate(schedule, d);
      }
    }

    // Auto-mark passed doses as missed if older than current time by > 2 hours and still scheduled
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    await DoseLog.updateMany(
      {
        patient_id: patientId,
        medicine_id: medicineId,
        status: 'scheduled',
        scheduled_time: { $lt: twoHoursAgo }
      },
      { $set: { status: 'missed' } }
    );

    // Fetch all logs for this medicine within month
    const logs = await DoseLog.find({
      patient_id: patientId,
      medicine_id: medicineId,
      scheduled_time: { $gte: firstDay, $lte: lastDay }
    }).sort({ scheduled_time: 1 }).lean();

    let monthlyScheduledCount = 0;
    let monthlyTakenCount = 0;
    let monthlyMissedCount = 0;

    const days = dates.map((dateStr, index) => {
      const dayNum = index + 1;

      const dayLogs = logs.filter((l) => {
        const lStr = new Date(l.scheduled_time).toISOString().split('T')[0];
        return lStr === dateStr;
      });

      if (dayLogs.length === 0) {
        return {
          date: dateStr,
          day: dayNum,
          state: 'not_scheduled',
          total: 0,
          taken: 0,
          missed: 0,
          doses: []
        };
      }

      monthlyScheduledCount += dayLogs.length;

      const takenDoses = dayLogs.filter((l) => l.status === 'taken');
      const missedDoses = dayLogs.filter((l) => l.status === 'missed');
      const upcomingDoses = dayLogs.filter((l) => l.status === 'scheduled');

      monthlyTakenCount += takenDoses.length;
      monthlyMissedCount += missedDoses.length;

      let state = 'not_scheduled';
      if (takenDoses.length === dayLogs.length) {
        state = 'taken'; // Green
      } else if (missedDoses.length === dayLogs.length) {
        state = 'missed'; // Red
      } else if (takenDoses.length > 0) {
        state = 'partly_taken'; // Amber
      } else if (upcomingDoses.length > 0) {
        state = 'upcoming'; // Grey
      } else {
        state = 'missed';
      }

      return {
        date: dateStr,
        day: dayNum,
        state,
        total: dayLogs.length,
        taken: takenDoses.length,
        missed: missedDoses.length,
        doses: dayLogs.map((l) => ({
          _id: l._id,
          scheduled_time: l.scheduled_time,
          taken_time: l.taken_time,
          status: l.status,
          notes: l.notes
        }))
      };
    });

    const adherencePercentage =
      monthlyScheduledCount > 0
        ? Math.round((monthlyTakenCount / monthlyScheduledCount) * 100)
        : 100;

    return {
      month: formattedMonth,
      medicine: {
        _id: medicine._id,
        name: medicine.name,
        nickname: medicine.nickname || '',
        dosage_form: medicine.dosage_form,
        strength: medicine.strength,
        category: medicine.category,
        usedFor: medicine.usedFor
      },
      treatment_period: {
        start_date: schedule ? schedule.start_date : medicine.created_at,
        end_date: schedule ? schedule.end_date : null
      },
      summary: {
        total_scheduled: monthlyScheduledCount,
        total_taken: monthlyTakenCount,
        total_missed: monthlyMissedCount,
        adherence_percentage: adherencePercentage
      },
      days
    };
  }

  /**
   * Summary overview of dose adherence for a medicine
   */
  async getMedicineDoseSummary(patientId, profileId, medicineId) {
    const medicine = await Medicine.findById(medicineId).lean();
    if (!medicine || medicine.is_deleted) {
      throw new Error('Medicine not found');
    }

    const allLogs = await DoseLog.find({
      patient_id: patientId,
      medicine_id: medicineId
    }).lean();

    const total = allLogs.length;
    const taken = allLogs.filter((l) => l.status === 'taken').length;
    const missed = allLogs.filter((l) => l.status === 'missed').length;
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 100;

    return {
      medicine_id: medicine._id,
      name: medicine.name,
      total_doses: total,
      taken_doses: taken,
      missed_doses: missed,
      adherence_percentage: adherence
    };
  }

  /**
   * Mark an old dose taken late within window and record the edit
   */
  async markLateDose(patientId, doseId, { note = 'Marked taken late' } = {}) {
    const log = await DoseLog.findOne({ _id: doseId, patient_id: patientId });
    if (!log) throw new Error('Dose record not found');

    const wasMissedOrScheduled = log.status !== 'taken';
    log.status = 'taken';
    log.taken_time = new Date();
    log.notes = log.notes ? `${log.notes}; ${note}` : note;
    await log.save();

    if (wasMissedOrScheduled && log.medicine_id) {
      await Medicine.findByIdAndUpdate(
        log.medicine_id,
        { $inc: { quantity: -1 } },
        { new: true }
      );
    }

    return log;
  }
}

module.exports = new HistoryService();
