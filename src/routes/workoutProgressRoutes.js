const express = require('express');
const router = express.Router();
const { protect, restrictTo, requireAuth } = require('../middlewares/authMiddleware'); // استخدم Middleware المصادقة الخاص بمشروعك
const WorkoutProgressController = require('../controllers/WorkoutProgressController');

// جميع المسارات هنا تتطلب أن يكون المستخدم مسجلاً دخولاً (Protected)
router.use(requireAuth);

// مسار لبدء الخطة (متاح للـ athlete فقط أو حسب صلاحيات النظام عندك)
router.post('/start', restrictTo('athlete'), WorkoutProgressController.startPlan);

// مسار لجلب حالة التقدم النشطة للخطة الحالية
router.get('/active/:planId', restrictTo('athlete'), WorkoutProgressController.getActiveProgressByPlan);

// مسار لتحديث حالة تمرين معين (ضغط Check أو إلغاؤه)
router.patch('/:id/exercise', restrictTo('athlete'), workoutProgressController.toggleExerciseCompletion);

module.exports = router;