const mongoose = require('mongoose');

const PAYMENT_METHODS = ['card', 'upi', 'netbanking', 'wallet', 'cod'];
const PAYMENT_RECORDS_STATUSES = ['created', 'authorized', 'captured', 'failed', 'cod'];

const paymentSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    gateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'cod'],
      default: 'razorpay'
    },
    gateway_order_id: {
      type: String,
      default: null
    },
    gateway_payment_id: {
      type: String,
      default: null
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: PAYMENT_RECORDS_STATUSES,
      default: 'created',
      index: true
    },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'upi'
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = {
  Payment,
  PAYMENT_METHODS,
  PAYMENT_RECORDS_STATUSES
};
