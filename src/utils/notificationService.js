const Notification = require('../models/Notification');
const logger = require('./logger');

/**
 * إنشاء إشعار — يستخدم من أي controller
 * @param {Object} data - { userId, type, title, message, link }
 */
const createNotification = async ({ userId, type, title, message, link = null }) => {
  try {
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
    });
  } catch (err) {
    logger.error('Failed to create notification', { error: err.message, userId, type });
  }
};

module.exports = { createNotification };
