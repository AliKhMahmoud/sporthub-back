const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ─── Basic Info ───────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      minlength: 3,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "password is required"],
      minlength: 6,
      select: false,
    },

    // ─── Roles ───────────────────────────────────────────────────
    role: {
      type: String,
      enum: ["athlete", "coach", "admin"],
      default: "athlete",
    },

    // ─── Coach Specific ──────────────────────────────────────────
    // لما حدا يسجل كـ coach، يروح pending حتى Admin يوافق
    coachStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: null, // null لو مو coach
    },

    age: {
      type: Number,
      min: 16,
      max: 100,
      default: null,
    },

    experienceYears: {
      type: Number,
      min: 0,
      max: 50,
      default: null,
    },

    workingDays: {
      type: [String], // ['Monday', 'Wednesday', 'Friday']
      default: [],
    },

    workingHours: {
      type: String, // '9AM - 5PM'
      default: null,
    },

    certificates: {
      type: [String],
      default: [],
    },

    // ─── Profile ─────────────────────────────────────────────────
    avatar: {
      type: String,
      default: null,
    },

    cover: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    about: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    phone: {
      type: String,
      default: null,
    },

    height: {
      type: Number,
      min: 50,
      max: 300,
      default: null,
    },

    weight: {
      type: Number,
      min: 20,
      max: 500,
      default: null,
    },

    // ─── Sport & Coach Relation ───────────────────────────────────
    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sport",
      default: null,
    },

    // المدرب المرتبط بالـ athlete
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─── Online Status ────────────────────────────────────────────
    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: null,
    },

    // ─── Account Status ───────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    xp: {
      type:    Number,
      default: 0,
      min:     0,
    },
    
    level: {
      type:    Number,
      default: 1,
      min:     1,
    },
    
    badges: {
      type:    [String],   // نخزن الـ IDs: ['FIRST_WORKOUT', 'PLAN_FINISHER', ...]
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);