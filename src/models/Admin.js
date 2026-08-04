const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
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
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "password is required"],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      default: "admin",
      enum: ["admin"],
    },

    avatar: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isSuperAdmin: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    lockedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", adminSchema);