const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
    },

    sets: {
      type: Number,
      min: 1,
    },

    reps: {
      type: Number,
      min: 1,
    },

    durationMinutes: {
      type: Number,
      min: 1,
    },

    notes: {
      type: String,
      trim: true,
      default: null,
    },
    
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sport',
      required: [true, 'Sport is required'],
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Publisher is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000,
    },

    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: [true, 'Level is required'],
    },

    durationWeeks: {
      type: Number,
      required: [true, 'Duration is required'],
      min: 1,
      max: 52,
    },

    exercises: {
      type: [exerciseSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Plan', planSchema);
