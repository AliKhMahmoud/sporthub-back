const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  role: String,
  action: String,
  details: String
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);