const { Doctor } = require('../models/doctor.model');
const { Appointment } = require('../models/appointment.model');

const getProfile = async (userId) => {
  const doctor = await Doctor.findOne({ user_id: userId });
  if (!doctor) {
    const error = new Error('Doctor profile not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }
  return doctor;
};

const upsertProfile = async (userId, data) => {
  const doctor = await Doctor.findOneAndUpdate(
    { user_id: userId },
    { $set: { ...data, user_id: userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return doctor;
};

const searchDoctors = async ({ name, specialization, city, page = 1, limit = 20 }) => {
  const query = {};

  if (specialization) {
    query.specialization = { $regex: specialization, $options: 'i' };
  }

  if (city) {
    query['clinic_address.city'] = { $regex: city, $options: 'i' };
  }

  if (name) {
    query.name = { $regex: name, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const [doctors, total] = await Promise.all([
    Doctor.find(query).sort({ rating: -1, created_at: -1 }).skip(skip).limit(limit),
    Doctor.countDocuments(query)
  ]);

  return {
    doctors,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getDoctorById = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }
  return doctor;
};

/**
 * Compute all free time slots for a doctor on a specific date
 */
const getFreeSlots = async (doctorId, dateString) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const targetDate = dateString ? new Date(dateString) : new Date();
  const dayOfWeek = targetDate.getDay();

  // Check if doctor works on this day
  if (!doctor.available_days.includes(dayOfWeek)) {
    return {
      doctorId,
      doctorName: doctor.name,
      date: targetDate.toISOString().split('T')[0],
      dayOfWeek,
      isAvailableDay: false,
      message: 'Doctor is not available on this day of the week',
      freeSlots: []
    };
  }

  // Define start and end of target day
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all active bookings for this doctor on target day
  const bookedAppointments = await Appointment.find({
    doctor_id: doctorId,
    status: { $ne: 'cancelled' },
    slot_start: { $gte: startOfDay, $lte: endOfDay }
  });

  const bookedStarts = new Set(
    bookedAppointments.map((a) => new Date(a.slot_start).toISOString())
  );

  const durationMinutes = doctor.slot_duration_minutes || 30;
  const slots = [];

  for (const timeWindow of doctor.available_time_slots) {
    const [startHour, startMin] = timeWindow.start_time.split(':').map(Number);
    const [endHour, endMin] = timeWindow.end_time.split(':').map(Number);

    const slotCursor = new Date(targetDate);
    slotCursor.setHours(startHour, startMin, 0, 0);

    const windowEnd = new Date(targetDate);
    windowEnd.setHours(endHour, endMin, 0, 0);

    while (slotCursor < windowEnd) {
      const slotStart = new Date(slotCursor);
      const slotEnd = new Date(slotCursor.getTime() + durationMinutes * 60000);

      if (slotEnd > windowEnd) break;

      const isBooked = bookedStarts.has(slotStart.toISOString());
      slots.push({
        slot_start: slotStart.toISOString(),
        slot_end: slotEnd.toISOString(),
        time_display: `${slotStart.toTimeString().slice(0, 5)} - ${slotEnd.toTimeString().slice(0, 5)}`,
        is_available: !isBooked
      });

      slotCursor.setTime(slotCursor.getTime() + durationMinutes * 60000);
    }
  }

  const freeSlots = slots.filter((s) => s.is_available);

  return {
    doctorId,
    doctorName: doctor.name,
    date: targetDate.toISOString().split('T')[0],
    dayOfWeek,
    isAvailableDay: true,
    totalSlots: slots.length,
    availableSlotsCount: freeSlots.length,
    freeSlots,
    allSlots: slots
  };
};

module.exports = {
  getProfile,
  upsertProfile,
  searchDoctors,
  getDoctorById,
  getFreeSlots
};
