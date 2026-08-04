const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        'COACH_APPROVED',
        'COACH_REJECTED',
        'TRAINING_REQUEST_RECEIVED',
        'TRAINING_REQUEST_ACCEPTED',
        'TRAINING_REQUEST_REJECTED',
        'POST_LIKED',
        'POST_COMMENTED',
        'AI_PLAN_CREATED',     // ✅ جديد — إشعار للمدرب عند إنشاء خطة AI
        'AI_PLAN_REVIEWED',
        'NEW_MESSAGE',         // ✅ جديد — إشعار رسالة شات جديدة
        'GENERAL',
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // رابط اختياري للصفحة المرتبطة
    link: {
      type: String,
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);