const mongoose = require('mongoose');

const SCHEDULE_TYPES = ['OTC', 'Schedule H', 'Schedule H1', 'Schedule G', 'Schedule X'];

const abdmDrugSchema = new mongoose.Schema(
  {
    abdm_drug_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    brand_name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    generic_name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    salt_composition: {
      type: String,
      required: true,
      trim: true
    },
    dosage_form: {
      type: String,
      required: true,
      trim: true
    },
    strength: {
      type: String,
      required: true,
      trim: true
    },
    therapeutic_class: {
      type: String,
      required: true,
      trim: true
    },
    schedule_classification: {
      type: String,
      enum: SCHEDULE_TYPES,
      default: 'OTC'
    },
    schedule_warning: {
      type: String,
      default: ''
    },
    cdsco_approval_status: {
      type: String,
      default: 'Approved - CDSCO National Formulary 2024'
    },
    is_essential_nlem: {
      type: Boolean,
      default: false
    },
    standard_pack_size: {
      type: String,
      default: 'Strip of 10 Tablets'
    },
    storage_guidelines: {
      type: String,
      default: 'Store below 25°C in a dry place. Protect from direct sunlight.'
    },
    dosage_instructions: {
      type: String,
      default: 'As directed by the physician.'
    },
    contraindications_and_warnings: {
      type: String,
      default: ''
    },
    common_side_effects: {
      type: [String],
      default: []
    },
    barcodes: {
      type: [String],
      index: true,
      default: []
    },
    manufacturer_name: {
      type: String,
      required: true,
      trim: true
    },
    verified_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

abdmDrugSchema.index({ brand_name: 'text', generic_name: 'text', salt_composition: 'text' });

const AbdmDrug = mongoose.model('AbdmDrug', abdmDrugSchema);

module.exports = { AbdmDrug, SCHEDULE_TYPES };
