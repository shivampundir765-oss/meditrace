const mongoose = require('mongoose');

const retailerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    shop_name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true
    },
    licence_number: {
      type: String,
      required: [true, 'Drug licence number is required'],
      trim: true,
      unique: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'India' }
    },
    // GeoJSON Point for 2dsphere indexing: [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [0, 0]
      }
    },
    opening_hours: {
      type: String,
      default: '09:00 - 21:00'
    },
    is_verified: {
      type: Boolean,
      default: false,
      index: true
    },
    delivery_available: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// 2dsphere index for geospatial proximity search
retailerSchema.index({ location: '2dsphere' });
retailerSchema.index({ 'address.city': 1, is_verified: 1 });

const Retailer = mongoose.model('Retailer', retailerSchema);

module.exports = { Retailer };
