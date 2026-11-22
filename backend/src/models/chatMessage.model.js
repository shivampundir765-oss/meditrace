const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
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
    sender: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    language: {
      type: String,
      default: 'en'
    },
    cards: {
      type: Array,
      default: []
    },
    disclaimer: {
      type: String,
      default: ''
    },
    is_emergency: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

chatMessageSchema.index({ user_id: 1, profile_id: 1, created_at: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = { ChatMessage };
