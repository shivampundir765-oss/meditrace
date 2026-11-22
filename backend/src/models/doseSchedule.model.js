const mongoose = require('mongoose');

const FOOD_INSTRUCTIONS = ['before_food', 'after_food', 'with_food', 'regardless'];

const doseScheduleSchema = new mongoose.Schema(
  {
    medicine_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true
    },
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    dose_amount: {
      type: String,
      required: [true, 'Dose amount is required'],
      trim: true
    },
    times_per_day: {
      type: Number,
      required: true,
      min: 1,
      max: 24
    },
    specific_times: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.every((t) => /^\d{2}:\d{2}$/.test(t));
        },
        message: 'Each time must be in HH:MM format'
      }
    },
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      default: null
    },
    food_instruction: {
      type: String,
      enum: FOOD_INSTRUCTIONS,
      default: 'regardless'
    },
    mealSlots: [
      {
        meal: {
          type: String,
          enum: ['breakfast', 'lunch', 'dinner', 'bedtime'],
          required: true
        },
        timing: {
          type: String,
          enum: ['before_food', 'after_food', 'with_food'],
          default: 'after_food'
        },
        dose_amount: {
          type: String,
          default: '1'
        },
        do_not_take_note: {
          type: String,
          default: ''
        }
      }
    ],
    instructions: {
      type: String,
      trim: true,
      default: ''
    },
    is_active: {
      type: Boolean,
      default: true
    },
    days_of_week: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6],
      validate: {
        validator: function (arr) {
          return arr.every((d) => d >= 0 && d <= 6);
        },
        message: 'Days must be 0 (Sun) through 6 (Sat)'
      }
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

doseScheduleSchema.index({ patient_id: 1, is_active: 1 });

const DoseSchedule = mongoose.model('DoseSchedule', doseScheduleSchema);

module.exports = { DoseSchedule, FOOD_INSTRUCTIONS };
