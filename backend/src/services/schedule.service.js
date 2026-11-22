const { DoseSchedule } = require('../models/doseSchedule.model');
const { Medicine } = require('../models/medicine.model');
const { DoseLog } = require('../models/doseLog.model');

const createSchedule = async (patientId, medicineId, data) => {
  const medicine = await Medicine.findOne({
    _id: medicineId,
    patient_id: patientId
  });

  if (!medicine) {
    const error = new Error('Medicine not found or access denied');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const schedule = await DoseSchedule.create({
    ...data,
    medicine_id: medicineId,
    patient_id: patientId
  });

  // Generate today's dose logs immediately if schedule is active today
  await generateDoseLogsForDate(schedule, new Date());

  return schedule;
};

/**
 * Generate dose logs for a given schedule on a specific date (if matching day of week & date range)
 */
const generateDoseLogsForDate = async (schedule, targetDate = new Date()) => {
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const start = new Date(schedule.start_date);
  start.setHours(0, 0, 0, 0);

  if (target < start) return [];

  if (schedule.end_date) {
    const end = new Date(schedule.end_date);
    end.setHours(23, 59, 59, 999);
    if (target > end) return [];
  }

  const dayOfWeek = target.getDay();
  if (!schedule.days_of_week.includes(dayOfWeek)) return [];

  const createdLogs = [];
  for (const timeStr of schedule.specific_times) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const scheduledTime = new Date(target);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // Check if log already exists
    const existing = await DoseLog.findOne({
      schedule_id: schedule._id,
      scheduled_time: scheduledTime
    });

    if (!existing) {
      const log = await DoseLog.create({
        schedule_id: schedule._id,
        medicine_id: schedule.medicine_id,
        patient_id: schedule.patient_id,
        scheduled_time: scheduledTime,
        status: 'scheduled'
      });
      createdLogs.push(log);
    }
  }

  return createdLogs;
};

const getScheduleToday = async (patientId, queryDate) => {
  const today = queryDate ? new Date(queryDate) : new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Find all active schedules for the patient
  const schedules = await DoseSchedule.find({
    patient_id: patientId,
    is_active: true,
    start_date: { $lte: endOfDay },
    $or: [
      { end_date: null },
      { end_date: { $gte: startOfDay } }
    ]
  }).populate('medicine_id', 'name generic_name dosage_form strength quantity');

  // Ensure logs exist for today for all matching schedules
  for (const schedule of schedules) {
    await generateDoseLogsForDate(schedule, today);
  }

  // Fetch all dose logs for today
  const logs = await DoseLog.find({
    patient_id: patientId,
    scheduled_time: { $gte: startOfDay, $lte: endOfDay }
  })
    .populate('medicine_id', 'name nickname generic_name dosage_form strength quantity low_stock_threshold category usedFor description cautions expiry_date')
    .populate('schedule_id', 'dose_amount food_instruction instructions mealSlots specific_times')
    .sort({ scheduled_time: 1 })
    .lean();

  // Helper to determine meal category
  const determineMeal = (scheduledTime, schedule) => {
    const d = new Date(scheduledTime);
    const hours = d.getHours();
    if (schedule?.mealSlots && schedule.mealSlots.length > 0) {
      // Find matching mealSlot if time roughly corresponds
      if (hours < 11) return 'breakfast';
      if (hours < 16) return 'lunch';
      if (hours < 21) return 'dinner';
      return 'bedtime';
    }
    if (hours < 11) return 'breakfast';
    if (hours < 16) return 'lunch';
    if (hours < 21) return 'dinner';
    return 'bedtime';
  };

  const enrichedLogs = logs.map(l => {
    const meal = determineMeal(l.scheduled_time, l.schedule_id);
    const med = l.medicine_id || {};
    let statusLine = 'In stock';
    let statusColor = 'green';
    const qty = typeof med.quantity === 'number' ? med.quantity : 0;
    const threshold = med.low_stock_threshold || 5;

    if (qty <= 0) {
      statusLine = 'Out of stock';
      statusColor = 'red';
    } else if (qty <= threshold) {
      statusLine = `Low stock (${qty} left)`;
      statusColor = 'amber';
    }

    return {
      ...l,
      meal,
      statusLine,
      statusColor
    };
  });

  const byMeal = {
    breakfast: enrichedLogs.filter(l => l.meal === 'breakfast'),
    lunch: enrichedLogs.filter(l => l.meal === 'lunch'),
    dinner: enrichedLogs.filter(l => l.meal === 'dinner'),
    bedtime: enrichedLogs.filter(l => l.meal === 'bedtime')
  };

  return {
    date: today.toISOString().split('T')[0],
    totalDoses: enrichedLogs.length,
    takenCount: enrichedLogs.filter(l => l.status === 'taken').length,
    pendingCount: enrichedLogs.filter(l => l.status === 'scheduled').length,
    missedCount: enrichedLogs.filter(l => l.status === 'missed').length,
    skippedCount: enrichedLogs.filter(l => l.status === 'skipped').length,
    doses: enrichedLogs,
    byMeal
  };
};

const updateSchedule = async (patientId, scheduleId, data) => {
  const schedule = await DoseSchedule.findOneAndUpdate(
    { _id: scheduleId, patient_id: patientId },
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!schedule) {
    const error = new Error('Dose schedule not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return schedule;
};

const deleteSchedule = async (patientId, scheduleId) => {
  const schedule = await DoseSchedule.findOneAndDelete({
    _id: scheduleId,
    patient_id: patientId
  });

  if (!schedule) {
    const error = new Error('Dose schedule not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  // Remove future scheduled logs
  await DoseLog.deleteMany({
    schedule_id: scheduleId,
    status: 'scheduled'
  });

  return { message: 'Dose schedule deleted successfully' };
};

module.exports = {
  createSchedule,
  generateDoseLogsForDate,
  getScheduleToday,
  updateSchedule,
  deleteSchedule
};
