const mongoose = require('mongoose');

const APPOINTMENT_STATUSES = ['booked', 'completed', 'cancelled', 'rescheduled'];
const CONSULTATION_TYPES = ['in_person', 'video'];

const appointmentSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },
    slot_start: {
      type: Date,
      required: true,
      index: true
    },
    slot_end: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: 'booked',
      index: true
    },
    reason: {
      type: String,
      trim: true,
      default: 'General Consultation'
    },
    consultation_type: {
      type: String,
      enum: CONSULTATION_TYPES,
      default: 'in_person'
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

appointmentSchema.index({ doctor_id: 1, slot_start: 1, status: 1 });
appointmentSchema.index({ patient_id: 1, slot_start: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = {
  Appointment,
  APPOINTMENT_STATUSES,
  CONSULTATION_TYPES
};
