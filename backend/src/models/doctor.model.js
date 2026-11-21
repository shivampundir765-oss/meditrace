const mongoose = require('mongoose');

const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Orthopedic',
  'Neurologist',
  'Gynecologist',
  'ENT Specialist',
  'Psychiatrist',
  'Dentist',
  'Ophthalmologist',
  'Other'
];

const doctorSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
      index: true
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required (e.g. MBBS, MD)'],
      trim: true
    },
    experience_years: {
      type: Number,
      default: 1,
      min: 0
    },
    clinic_address: {
      clinic_name: { type: String, default: '' },
      street: { type: String, default: '' },
      city: { type: String, required: true, trim: true, index: true },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' }
    },
    fee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: 0
    },
    available_days: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6], // Mon-Sat by default
      validate: {
        validator: function (arr) {
          return arr.every((d) => d >= 0 && d <= 6);
        },
        message: 'Days must be 0 (Sun) to 6 (Sat)'
      }
    },
    available_time_slots: [
      {
        start_time: { type: String, default: '09:00' }, // HH:MM
        end_time: { type: String, default: '17:00' }    // HH:MM
      }
    ],
    slot_duration_minutes: {
      type: Number,
      default: 30,
      min: 10,
      max: 120
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5
    },
    is_verified: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

doctorSchema.index({ specialization: 1, 'clinic_address.city': 1 });
doctorSchema.index({ name: 'text', specialization: 'text' });

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = { Doctor, SPECIALIZATIONS };
