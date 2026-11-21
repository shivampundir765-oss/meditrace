const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
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

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = { Prescription };
