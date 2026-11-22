const mongoose = require('mongoose');

const RELATIONSHIPS = ['self', 'mother', 'father', 'spouse', 'child', 'other'];
const ACCESS_LEVELS = ['owner', 'caregiver_edit', 'caregiver_view'];

const profileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Profile name is required'],
      trim: true
    },
    relationship: {
      type: String,
      enum: RELATIONSHIPS,
      default: 'self'
    },
    date_of_birth: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', null],
      default: null
    },
    photo_url: {
      type: String,
      default: null
    },
    is_default: {
      type: Boolean,
      default: false
    },
    access_level: {
      type: String,
      enum: ACCESS_LEVELS,
      default: 'owner'
    },
    // Authorized caregivers for this profile
    authorized_caregivers: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        access_level: {
          type: String,
          enum: ['caregiver_edit', 'caregiver_view'],
          default: 'caregiver_view'
        },
        status: {
          type: String,
          enum: ['pending', 'active', 'revoked'],
          default: 'active'
        },
        added_at: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

profileSchema.index({ user_id: 1, is_default: 1 });
profileSchema.index({ 'authorized_caregivers.user_id': 1 });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = { Profile, RELATIONSHIPS, ACCESS_LEVELS };
