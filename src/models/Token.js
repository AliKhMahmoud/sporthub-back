const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },

    token: {
      type: String,
      required: [true, "token is required"],
    },

    type: {
      type: String,
      enum: ["refresh", "passwordReset", "emailVerify"],
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Token', tokenSchema);
