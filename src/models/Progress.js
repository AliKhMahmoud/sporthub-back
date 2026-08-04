const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },

    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sport',
      required: [true, 'Sport is required'],
      index: true,
    },

    // مين سجّل التقدم (المدرب)
    trackedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    metric: {
      type: String,
      enum: ['weight', 'reps', 'time', 'distance'],
      required: [true, 'Metric is required'],
    },

    value: {
      type: Number,
      required: [true, 'Value is required'],
      min: 0,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Progress', progressSchema);
