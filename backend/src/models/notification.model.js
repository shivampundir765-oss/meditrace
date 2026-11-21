const mongoose = require('mongoose');

const NOTIFICATION_TYPES = ['dose', 'low_stock', 'expiry', 'order', 'appointment'];
const NOTIFICATION_CHANNELS = ['in_app', 'push', 'email'];
const ACTION_TYPES = ['mark_taken', 'buy_now', 'find_chemist', 'view_order', 'view_appointment', 'none'];

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true
    },
    sent_at: {
      type: Date,
      default: Date.now
    },
    channel: {
      type: String,
      enum: NOTIFICATION_CHANNELS,
      default: 'in_app'
    },
    action_type: {
      type: String,
      enum: ACTION_TYPES,
      default: 'none'
    },
    action_url: {
      type: String,
      default: null
    },
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
  Notification,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  ACTION_TYPES
};
