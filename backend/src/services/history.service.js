const { DoseLog } = require('../models/doseLog.model');
const { Medicine } = require('../models/medicine.model');
const { DoseSchedule } = require('../models/doseSchedule.model');
const { Catalog } = require('../models/catalog.model');
const { CatalogMedicine } = require('../models/catalogMedicine.model');
const { generateDoseLogsForDate } = require('./schedule.service');

class HistoryService {
  /**
   * Compute N-day adherence history matrix for a patient
   * @param {string} patientId 
   * @param {Object} options 
   */
  async getAdherenceHistory(patientId, { days = 7, catalogId = null } = {}) {
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

    // 2. Fetch user's catalogs and catalog mappings
    const catalogs = await Catalog.find({ user_id: patientId }).lean();
    const catalogMedicines = await CatalogMedicine.find({ user_id: patientId }).lean();

    const medToCatalogMap = {};
    catalogMedicines.forEach(cm => {
      const cat = catalogs.find(c => String(c._id) === String(cm.catalog_id));
      if (cat) {
        medToCatalogMap[String(cm.medicine_id)] = {
          catalog_id: cat._id,
          catalog_name: cat.name,
          time_slot: cat.time_slot,
          color: cat.color
        };
      }
    });

    // 3. Fetch active medicines
    const medicineQuery = { patient_id: patientId, status: { $ne: 'discontinued' } };
    const medicines = await Medicine.find(medicineQuery).sort({ name: 1 }).lean();

    // Filter by catalogId if provided
    let filteredMedicines = medicines;
    if (catalogId) {
      const allowedMedIds = catalogMedicines
        .filter(cm => String(cm.catalog_id) === String(catalogId))
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
      const catInfo = medToCatalogMap[medIdStr] || {
        catalog_id: null,
        catalog_name: 'General',
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
          catalog: catInfo
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
