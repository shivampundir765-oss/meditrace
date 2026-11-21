const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'cod'];

const orderItemSchema = new mongoose.Schema({
  inventory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RetailerInventory',
    required: true
  },
  medicine_name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  requires_prescription: {
    type: Boolean,
    default: false
  }
});

const deliveryTrackingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ORDER_STATUSES,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    default: ''
  }
});

const orderSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    retailer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Retailer',
      required: true,
      index: true
    },
    order_items: [orderItemSchema],
    total_amount: {
      type: Number,
      required: true,
      min: 0
    },
    payment_status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
      index: true
    },
    order_status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'placed',
      index: true
    },
    payment_method: {
      type: String,
      enum: ['online', 'cod'],
      default: 'online'
    },
    delivery_address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      phone: { type: String, required: true }
    },
    prescription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null
    },
    delivery_tracking: [deliveryTrackingSchema],
    placed_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

orderSchema.index({ patient_id: 1, created_at: -1 });
orderSchema.index({ retailer_id: 1, order_status: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = {
  Order,
  ORDER_STATUSES,
  PAYMENT_STATUSES
};
