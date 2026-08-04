const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/responseService');

class NotificationController {

  // GET /api/notifications
  // جلب كل إشعارات المستخدم
  getNotifications = asyncHandler(async (req, res) => {
    const { read, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user.id };
    if (read !== undefined) filter.read = read === 'true';

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      read: false,
    });

    const resp = success(
      {
        notifications,
        unreadCount,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit),
        },
      },
      'Notifications fetched successfully'
    );
    return res.status(resp.status).json(resp);
  });

  // PUT /api/notifications/:id/read
  // تعيين إشعار كمقروء
  markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!notification) {
      const resp = error('Notification not found', 404);
      return res.status(resp.status).json(resp);
    }

    notification.read = true;
    await notification.save();

    const resp = success(null, 'Notification marked as read');
    return res.status(resp.status).json(resp);
  });

  // PUT /api/notifications/read-all
  // تعيين كل الإشعارات كمقروءة
  markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );

    const resp = success(null, 'All notifications marked as read');
    return res.status(resp.status).json(resp);
  });

  // DELETE /api/notifications/:id
  // حذف إشعار
  deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!notification) {
      const resp = error('Notification not found', 404);
      return res.status(resp.status).json(resp);
    }

    const resp = success(null, 'Notification deleted successfully');
    return res.status(resp.status).json(resp);
  });

  // DELETE /api/notifications
  // حذف كل الإشعارات
  deleteAllNotifications = asyncHandler(async (req, res) => {
    await Notification.deleteMany({ user: req.user.id });

    const resp = success(null, 'All notifications deleted');
    return res.status(resp.status).json(resp);
  });
}

module.exports = new NotificationController();
