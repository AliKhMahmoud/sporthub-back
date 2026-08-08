const express = require('express');
const router = express.Router();
const { protect, restrictTo, requireAuth } = require('../middlewares/authMiddleware'); // استخدم Middleware المصادقة الخاص بمشروعك
const WorkoutProgressController = require('../controllers/WorkoutProgressController');

// جميع المسارات هنا تتطلب أن يكون المستخدم مسجلاً دخولاً (Protected)
router.use(requireAuth);

router.post('/', authorize('athlete'), WorkoutProgressController.startPlan);

// مسار لجلب حالة التقدم النشطة للخطة الحالية
router.get('/:planId', authorize('athlete'), WorkoutProgressController.getActiveProgressByPlan);

// مسار لتحديث حالة تمرين معين (ضغط Check أو إلغاؤه)
router.patch('/:id', authorize('athlete'), WorkoutProgressController.toggleExerciseCompletion);

module.exports = router;
