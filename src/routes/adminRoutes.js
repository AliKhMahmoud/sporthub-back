const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { requireAuth, authorize } = require('../middlewares/authMiddleware');

// كل الـ routes تحتاج Admin فقط
router.use(requireAuth, authorize('admin'));

// Coach requests
router.get('/coach-requests', adminController.getCoachRequests);
router.put('/coach-requests/:id/approve', adminController.approveCoach);
router.put('/coach-requests/:id/reject', adminController.rejectCoach);

// Users management
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deactivateUser);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

module.exports = router;
