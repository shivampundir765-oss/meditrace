const mongoose = require('mongoose');

const medicineRevisionSchema = new mongoose.Schema(
  {
    medicine_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true
    },
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: false,
      index: true,
      default: null
    },
    revision_number: {
      type: Number,
      required: true,
      min: 1
    },
    editor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    editor_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
    editor_name: {
      type: String,
      default: 'User'
    },
    editor_role: {
      type: String,
      enum: ['pharmacist', 'doctor', 'patient', 'admin', 'caregiver', 'retailer'],
      default: 'patient'
    },
    entry_label: {
      type: String,
      required: true
    },
    action_label: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      place_name: { type: String, default: 'Location not shared' },
      is_shared: { type: Boolean, default: false }
    },
    audit_stamp: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    previous_values: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    new_values: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    changed_fields: {
      type: [String],
      default: []
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

medicineRevisionSchema.index({ medicine_id: 1, revision_number: 1 }, { unique: true });

// Block updates or deletes on revisions to ensure append-only immutability
medicineRevisionSchema.pre('findOneAndUpdate', function () {
  throw new Error('Medicine revisions are append-only and cannot be modified');
});
medicineRevisionSchema.pre('updateOne', function () {
  throw new Error('Medicine revisions are append-only and cannot be modified');
});
medicineRevisionSchema.pre('deleteOne', function () {
  throw new Error('Medicine revisions are immutable and cannot be deleted');
});
medicineRevisionSchema.pre('findOneAndDelete', function () {
  throw new Error('Medicine revisions are immutable and cannot be deleted');
});

const MedicineRevision = mongoose.model('MedicineRevision', medicineRevisionSchema);

module.exports = { MedicineRevision };
