const mongoose = require('mongoose');

const DOSE_STATUSES = ['scheduled', 'taken', 'missed', 'skipped'];

const doseLogSchema = new mongoose.Schema(
  {
    schedule_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoseSchedule',
      required: true,
      index: true
    },
    medicine_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true
    },
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      index: true,
      default: null
    },
    scheduled_time: {
      type: Date,
      required: true,
      index: true
    },
    taken_time: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: DOSE_STATUSES,
      default: 'scheduled'
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    audit_stamp: {
      type: Object,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

doseLogSchema.index({ patient_id: 1, scheduled_time: 1, status: 1 });
doseLogSchema.index({ profile_id: 1, scheduled_time: 1, status: 1 });
doseLogSchema.index({ schedule_id: 1, scheduled_time: 1 });

const DoseLog = mongoose.model('DoseLog', doseLogSchema);

module.exports = { DoseLog, DOSE_STATUSES };
