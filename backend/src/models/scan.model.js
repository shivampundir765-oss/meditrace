const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    scan_type: {
      type: String,
      enum: ['ocr', 'barcode'],
      required: true
    },
    image_url: {
      type: String,
      default: null
    },
    barcode: {
      type: String,
      trim: true,
      default: null,
      index: true
    },
    raw_text: {
      type: String,
      default: ''
    },
    extracted_name: {
      type: String,
      trim: true,
      default: ''
    },
    extracted_expiry: {
      type: Date,
      default: null
    },
    extracted_batch: {
      type: String,
      trim: true,
      default: ''
    },
    extracted_manufacturer: {
      type: String,
      trim: true,
      default: ''
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    autofill_data: {
      name: { type: String, default: '' },
      generic_name: { type: String, default: '' },
      salt_composition: { type: String, default: '' },
      dosage_form: { type: String, default: 'tablet' },
      strength: { type: String, default: '' },
      manufacturer: { type: String, default: '' },
      batch_number: { type: String, default: '' },
      expiry_date: { type: Date, default: null },
      quantity: { type: Number, default: 10 },
      low_stock_threshold: { type: Number, default: 5 },
      requires_prescription: { type: Boolean, default: false },
      abdm_drug_code: { type: String, default: '' },
      therapeutic_class: { type: String, default: '' },
      schedule_classification: { type: String, default: 'OTC' },
      schedule_warning: { type: String, default: '' },
      cdsco_approval_status: { type: String, default: '' },
      storage_guidelines: { type: String, default: '' },
      dosage_instructions: { type: String, default: '' },
      nickname: { type: String, default: '' },
      description: { type: String, default: '' },
      usedFor: { type: String, default: '' },
      category: { type: String, default: 'Common' },
      cautions: { type: String, default: '' },
      source: { type: String, default: 'scan' }
    },
    abdm_registry: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

scanSchema.index({ patient_id: 1, created_at: -1 });

const Scan = mongoose.model('Scan', scanSchema);

module.exports = { Scan };
