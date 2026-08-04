const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: 2000,
    },

    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// فهرس للبحث السريع عن رسائل محادثة مرتبة بالوقت
messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
