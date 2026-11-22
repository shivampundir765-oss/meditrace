const mongoose = require('mongoose');

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night', 'Custom'];

const cabinetSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Cabinet name is required'],
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
      default: '#0d9488'
    },
    is_default: {
      type: Boolean,
      default: false
    },
    // Prescriptions uploaded or scanned into this cabinet
    prescriptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
      }
    ],
    audit_stamp: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

cabinetSchema.index({ profile_id: 1, name: 1 });
cabinetSchema.index({ user_id: 1, profile_id: 1 });

const Cabinet = mongoose.model('Cabinet', cabinetSchema);

module.exports = { Cabinet, TIME_SLOTS };
