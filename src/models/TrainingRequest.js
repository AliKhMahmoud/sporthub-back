const mongoose = require('mongoose');

const trainingRequestSchema = new mongoose.Schema(
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

    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sport',
      required: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },

    rejectionReason: {
    type: String,
    default: null,
  },

    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TrainingRequest', trainingRequestSchema);