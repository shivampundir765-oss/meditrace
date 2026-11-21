const { Appointment } = require('../models/appointment.model');
const { Doctor } = require('../models/doctor.model');
const { createNotification } = require('./notification.service');

const bookAppointment = async (patientId, data) => {
  const { doctor_id, slot_start, reason, consultation_type, notes } = data;

  const doctor = await Doctor.findById(doctor_id);
  if (!doctor) {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const slotStart = new Date(slot_start);
  const duration = doctor.slot_duration_minutes || 30;
  const slotEnd = data.slot_end ? new Date(data.slot_end) : new Date(slotStart.getTime() + duration * 60000);

  if (slotStart < new Date()) {
    const error = new Error('Cannot book appointments in the past');
    error.statusCode = 400;
    error.errorCode = 'INVALID_TIME';
    throw error;
  }

  // Double Booking Protection
  const conflict = await Appointment.findOne({
    doctor_id,
    status: { $ne: 'cancelled' },
    $or: [
      { slot_start: { $gte: slotStart, $lt: slotEnd } },
      { slot_end: { $gt: slotStart, $lte: slotEnd } },
      { slot_start: { $lte: slotStart }, slot_end: { $gte: slotEnd } }
    ]
  });

  if (conflict) {
    const error = new Error('This time slot is already booked. Please select an available slot.');
    error.statusCode = 409;
    error.errorCode = 'SLOT_ALREADY_BOOKED';
    throw error;
  }

  const appointment = await Appointment.create({
    patient_id: patientId,
    doctor_id,
    slot_start: slotStart,
    slot_end: slotEnd,
    status: 'booked',
    reason,
    consultation_type,
    notes: notes || ''
  });

  // Notify patient
  await createNotification(patientId, {
    type: 'appointment',
    title: `Appointment Confirmed: Dr. ${doctor.name}`,
    message: `Your appointment is confirmed for ${slotStart.toDateString()} at ${slotStart.toLocaleTimeString()}. Consultation fee: ₹${doctor.fee}.`,
    channel: 'push',
    action_type: 'view_appointment',
    action_url: `/appointments/${appointment._id}`,
    reference_id: appointment._id
  });

  return appointment;
};

const listAppointments = async (user, { status, page = 1, limit = 20 }) => {
  const query = {};

  if (user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user_id: user._id });
    if (!doctorProfile) {
      return { appointments: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    }
    query.doctor_id = doctorProfile._id;
  } else {
    // Default to patient viewing their appointments
    query.patient_id = user._id;
  }

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate('doctor_id', 'name specialization clinic_address fee phone')
      .populate('patient_id', 'name email phone')
      .sort({ slot_start: 1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(query)
  ]);

  return {
    appointments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getAppointmentById = async (user, appointmentId) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('doctor_id', 'name specialization clinic_address fee phone available_days')
    .populate('patient_id', 'name email phone');

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return appointment;
};

const rescheduleAppointment = async (userId, appointmentId, { slot_start, slot_end, reason }) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const doctor = await Doctor.findById(appointment.doctor_id);
  const duration = doctor ? doctor.slot_duration_minutes : 30;

  const newStart = new Date(slot_start);
  const newEnd = slot_end ? new Date(slot_end) : new Date(newStart.getTime() + duration * 60000);

  if (newStart < new Date()) {
    const error = new Error('Cannot reschedule appointments to a past date');
    error.statusCode = 400;
    error.errorCode = 'INVALID_TIME';
    throw error;
  }

  // Conflict check excluding current appointment
  const conflict = await Appointment.findOne({
    _id: { $ne: appointmentId },
    doctor_id: appointment.doctor_id,
    status: { $ne: 'cancelled' },
    $or: [
      { slot_start: { $gte: newStart, $lt: newEnd } },
      { slot_end: { $gt: newStart, $lte: newEnd } },
      { slot_start: { $lte: newStart }, slot_end: { $gte: newEnd } }
    ]
  });

  if (conflict) {
    const error = new Error('The requested new time slot is already booked');
    error.statusCode = 409;
    error.errorCode = 'SLOT_ALREADY_BOOKED';
    throw error;
  }

  appointment.slot_start = newStart;
  appointment.slot_end = newEnd;
  appointment.status = 'rescheduled';
  if (reason) appointment.reason = reason;
  await appointment.save();

  // Notify user
  await createNotification(appointment.patient_id, {
    type: 'appointment',
    title: 'Appointment Rescheduled',
    message: `Your appointment with Dr. ${doctor ? doctor.name : ''} has been moved to ${newStart.toDateString()} at ${newStart.toLocaleTimeString()}.`,
    channel: 'push',
    action_type: 'view_appointment',
    action_url: `/appointments/${appointment._id}`,
    reference_id: appointment._id
  });

  return appointment;
};

const cancelAppointment = async (userId, appointmentId, { reason } = {}) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  appointment.status = 'cancelled';
  if (reason) appointment.notes = `Cancelled reason: ${reason}`;
  await appointment.save();

  // Notify user
  await createNotification(appointment.patient_id, {
    type: 'appointment',
    title: 'Appointment Cancelled',
    message: `Your appointment scheduled for ${new Date(appointment.slot_start).toDateString()} has been cancelled.`,
    channel: 'push',
    action_type: 'view_appointment',
    action_url: `/appointments/${appointment._id}`,
    reference_id: appointment._id
  });

  return { message: 'Appointment cancelled successfully', appointment };
};

module.exports = {
  bookAppointment,
  listAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment
};
