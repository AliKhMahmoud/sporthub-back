const mongoose = require('mongoose');

const workoutProgressSchema = new mongoose.Schema(
  {
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Athlete is required'],
      index: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan is required'],
      index: true,
    },

    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sport',
      required: [true, 'Sport is required'],
      index: true,
    },

    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
    },

    // سنخزن هنا مؤشرات أو أسماء أو نصوص التمارين التي أنجزها المتدرب (Check)
    completedExercises: {
      type: [String],
      default: [],
    },

    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WorkoutProgress', workoutProgressSchema);