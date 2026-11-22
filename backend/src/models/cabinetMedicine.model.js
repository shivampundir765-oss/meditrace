const mongoose = require('mongoose');

const cabinetMedicineSchema = new mongoose.Schema(
  {
    cabinet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cabinet',
      required: true,
      index: true
    },
    medicine_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true
    },
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
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
    },
    audit_stamp: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

cabinetMedicineSchema.index({ cabinet_id: 1, medicine_id: 1 }, { unique: true });
cabinetMedicineSchema.index({ profile_id: 1, cabinet_id: 1 });

const CabinetMedicine = mongoose.model('CabinetMedicine', cabinetMedicineSchema);

module.exports = { CabinetMedicine };
