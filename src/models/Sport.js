const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sport name is required'],
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 500,
    },

    colorTheme: {
      type: String,
      required: true,
      match: [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color'],
    },

    image: {
      type: String,
      default: null,
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

module.exports = mongoose.model('Sport', sportSchema);