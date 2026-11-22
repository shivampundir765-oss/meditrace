const mongoose = require('mongoose');

const FACILITY_TYPES = ['chemist', 'hospital', 'clinic'];

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: FACILITY_TYPES,
      required: true,
      index: true
    },
    phone: {
      type: String,
      trim: true
    },
    emergency_phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    opening_hours: {
      type: String,
      default: '24 Hours Open'
    },
    is_emergency_24x7: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      default: 4.8
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: 'Bangalore' },
      state: { type: String, default: 'Karnataka' },
      zipCode: { type: String, default: '560001' }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    services: {
      type: [String],
      default: []
    },
    specialties: {
      type: [String],
      default: []
    },
    total_beds: {
      type: Number,
      default: 0
    },
    google_maps_url: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

facilitySchema.index({ location: '2dsphere' });
facilitySchema.index({ type: 1, is_emergency_24x7: 1 });

const Facility = mongoose.model('Facility', facilitySchema);

module.exports = { Facility, FACILITY_TYPES };
