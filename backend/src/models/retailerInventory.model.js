const mongoose = require('mongoose');

const retailerInventorySchema = new mongoose.Schema(
  {
    retailer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Retailer',
      required: true,
      index: true
    },
    medicine_name: {
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
      default: 'tablet'
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
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0
    },
    discount_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    requires_prescription: {
      type: Boolean,
      default: false
    },
    is_available: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

retailerInventorySchema.index({ retailer_id: 1, medicine_name: 1 });
retailerInventorySchema.index({ medicine_name: 'text', generic_name: 'text', salt_composition: 'text' });

const RetailerInventory = mongoose.model('RetailerInventory', retailerInventorySchema);

module.exports = { RetailerInventory };
