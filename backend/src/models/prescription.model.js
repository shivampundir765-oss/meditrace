const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
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
    cabinet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cabinet',
      index: true,
      default: null
    },
    source: {
      type: String,
      enum: ['camera', 'upload'],
      default: 'upload'
    },
    audit_stamp: {
      type: Object,
      default: null
    },
    image_url: {
      type: String,
      default: null
    },
    doctor_name: {
      type: String,
      trim: true,
      default: ''
    },
    hospital_name: {
      type: String,
      trim: true,
      default: ''
    },
    prescription_date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    is_approved: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'archived'],
      default: 'active'
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

prescriptionSchema.index({ patient_id: 1, status: 1 });
prescriptionSchema.index({ profile_id: 1, status: 1 });
prescriptionSchema.index({ cabinet_id: 1, status: 1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = { Prescription };
