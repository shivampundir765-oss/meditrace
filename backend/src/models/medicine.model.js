const mongoose = require('mongoose');

const DOSAGE_FORMS = [
  'tablet', 'capsule', 'syrup', 'injection', 'cream',
  'ointment', 'drops', 'inhaler', 'patch', 'powder',
  'suspension', 'gel', 'spray', 'suppository', 'other'
];

const ADDED_VIA = ['manual', 'scan', 'prescription'];

const medicineSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    prescription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null
    },
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true
    },
    generic_name: {
      type: String,
      trim: true,
      default: ''
    },
    salt_composition: {
      type: String,
      trim: true,
      default: ''
    },
    dosage_form: {
      type: String,
      enum: DOSAGE_FORMS,
      default: 'tablet'
    },
    nickname: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    usedFor: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      enum: ['Common', 'Chronic', 'Serious'],
      default: 'Common'
    },
    cautions: {
      type: String,
      trim: true,
      default: ''
    },
    source: {
      type: String,
      enum: ['scan', 'manual', 'database'],
      default: 'manual'
    },
    strength: {
      type: String,
      trim: true,
      default: ''
    },
    manufacturer: {
      type: String,
      trim: true,
      default: ''
    },
    batch_number: {
      type: String,
      trim: true,
      default: ''
    },
    expiry_date: {
      type: Date,
      default: null,
      index: true
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    low_stock_threshold: {
      type: Number,
      default: 5,
      min: 0
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired', 'discontinued'],
      default: 'active'
    },
    added_via: {
      type: String,
      enum: ADDED_VIA,
      default: 'manual'
    },
    requires_prescription: {
      type: Boolean,
      default: false
    },
    abdm_drug_code: {
      type: String,
      default: ''
    },
    therapeutic_class: {
      type: String,
      default: ''
    },
    schedule_classification: {
      type: String,
      default: 'OTC'
    },
    schedule_warning: {
      type: String,
      default: ''
    },
    cdsco_approval_status: {
      type: String,
      default: ''
    },
    storage_guidelines: {
      type: String,
      default: ''
    },
    dosage_instructions: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

medicineSchema.index({ patient_id: 1, status: 1 });
medicineSchema.index({ patient_id: 1, expiry_date: 1 });
medicineSchema.index({ name: 'text', generic_name: 'text', salt_composition: 'text' });

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = { Medicine, DOSAGE_FORMS, ADDED_VIA };
