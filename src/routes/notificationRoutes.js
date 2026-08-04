const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middlewares/authMiddleware');

// كلها محمية
router.use(requireAuth);

router.get('/',                    notificationController.getNotifications);
router.put('/read-all',            notificationController.markAllAsRead);
router.put('/:id/read',            notificationController.markAsRead);
router.delete('/',                 notificationController.deleteAllNotifications);
router.delete('/:id',              notificationController.deleteNotification);

module.exports = router;
