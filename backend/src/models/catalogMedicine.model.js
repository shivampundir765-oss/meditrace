const mongoose = require('mongoose');

const catalogMedicineSchema = new mongoose.Schema(
  {
    catalog_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Catalog',
      required: true,
      index: true
    },
    medicine_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    dose_amount: {
      type: String,
      default: '1 tablet'
    },
    timing: {
      type: String,
      enum: ['before_food', 'after_food', 'with_food', 'regardless'],
      default: 'after_food'
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

catalogMedicineSchema.index({ catalog_id: 1, medicine_id: 1 }, { unique: true });

const CatalogMedicine = mongoose.model('CatalogMedicine', catalogMedicineSchema);

module.exports = { CatalogMedicine };
