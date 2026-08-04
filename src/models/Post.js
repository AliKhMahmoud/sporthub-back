const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sport',
      required: [true, 'Sport is required'],
      index: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    body: {
      type: String,
      required: [true, 'Body is required'],
      trim: true,
      maxlength: 5000,
    },

    media: {
      type: [String], // URLs
      default: [],
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    views: {
      type: Number,
      default: 0,
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

module.exports = mongoose.model('Post', postSchema);
