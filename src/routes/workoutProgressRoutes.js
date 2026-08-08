const express = require('express');
const router = express.Router();
// ✅ أضفنا authorize هنا مع أخواتها
const { requireAuth, authorize } = require('../middlewares/authMiddleware'); 
const WorkoutProgressController = require('../controllers/WorkoutProgressController');

// جميع المسارات تتطلب مصادقة
router.use(requireAuth);

// مسار البدء (POST /api/workout-progress)
router.post('/', authorize('athlete'), WorkoutProgressController.startPlan);

// مسار الجلب (GET /api/workout-progress/:planId)
router.get('/:planId', authorize('athlete'), WorkoutProgressController.getActiveProgressByPlan);

// مسار التحديث (PATCH /api/workout-progress/:id)
router.patch('/:id', authorize('athlete'), WorkoutProgressController.toggleExerciseCompletion);

module.exports = router;