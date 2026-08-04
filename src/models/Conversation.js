const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    lastMessage: {
      type: String,
      trim: true,
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    lastMessageBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// منع تكرار محادثة بين نفس اللاعب ونفس المدرب
conversationSchema.index({ athlete: 1, coach: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
