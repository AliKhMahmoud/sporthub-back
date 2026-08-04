const mongoose = require('mongoose');

// ─── Exercise Schema (مسطح، بدون أيام) ──────────────────────────────────────
const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    sets: {
      type: Number,
      default: 1,
      min: 1,
    },
    reps: {
      type: Number,
      default: 1,
      min: 1,
    },
    restSeconds: {
      type: Number,
      default: 30,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

// ─── AI Plan Schema ────────────────────────────────────────────────────
const aiPlanSchema = new mongoose.Schema(
  {
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    athleteName: {
      type: String,
      trim: true,
    },

    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sport',
      required: true,
    },

    goal: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    condition: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    durationWeeks: {
      type: Number,
      default: 4,
      min: 1,
      max: 12,
    },

    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },

    // ✅ التمارين بشكل مسطح (flat array) — هذا هو المهم
    exercises: {
      type: [exerciseSchema],
      default: [],
    },

    totalExercises: {
      type: Number,
      default: 0,
    },

    completedExercises: {
      type: Number,
      default: 0,
    },

    progress: {
      type: Number,  // نسبة مئوية 0-100
      default: 0,
    },

    // ─── Coach Review ──────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Pending Coach Review', 'Approved', 'Rejected'],
      default: 'Pending Coach Review',
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    coachFeedback: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    coachRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  }
);

// فهرس للبحث السريع
aiPlanSchema.index({ athlete: 1, status: 1, isDeleted: 1 });
aiPlanSchema.index({ sport: 1, status: 1 });

module.exports = mongoose.model('AIPlan', aiPlanSchema);