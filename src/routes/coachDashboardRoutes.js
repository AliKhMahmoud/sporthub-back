const express = require('express');
const router = express.Router();

const coachDashboardController = require('../controllers/coachDashboardController');
const { requireAuth, authorize } = require('../middlewares/authMiddleware');

// كل الـ routes للـ coach approved فقط
router.use(requireAuth, authorize('coach'));

router.get('/', coachDashboardController.getDashboard);
router.get('/trainees', coachDashboardController.getMyTrainees);
router.get('/ai-plans', coachDashboardController.getPendingAIPlans);
router.get('/requests', coachDashboardController.getTrainingRequests);

module.exports = router;
