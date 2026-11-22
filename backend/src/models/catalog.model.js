const mongoose = require('mongoose');

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night', 'custom'];

const catalogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Catalog name is required'],
      trim: true
    },
    time_slot: {
      type: String,
      enum: TIME_SLOTS,
      default: 'Morning'
    },
    reminder_time: {
      type: String,
      default: '08:00',
      match: [/^\d{2}:\d{2}$/, 'Reminder time must be in HH:MM format']
    },
    days: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6]
    },
    color: {
      type: String,
      default: '#0d9488' // Teal
    },
    is_default: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

catalogSchema.index({ user_id: 1, name: 1 });

const Catalog = mongoose.model('Catalog', catalogSchema);

module.exports = { Catalog, TIME_SLOTS };
