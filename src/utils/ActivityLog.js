const ActivityLog = require('../models/ActivityLog');

const createLog = async (data) => {
  try {
    await ActivityLog.create(data);
  } catch (err) {
    console.log("log failed :", err.message);
  }
};

module.exports = { createLog };