const WorkoutProgress = require('../models/WorkoutProgress');
const Plan = require('../models/Plan');
const Sport = require('../models/Sport');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');

class WorkoutProgressController {

  // POST /api/workout-progress/start
  // الرياضي يضغط "Begin Workout" لبدء الخطة
  startPlan = asyncHandler(async (req, res) => {
    const { planId } = req.body;
    const athleteId = req.user.id;

    // 1. التأكد أن الخطة موجودة ونشطة
    const plan = await Plan.findOne({ _id: planId, isActive: true });
    if (!plan) {
      const resp = error('Plan not found', 404);
      return res.status(resp.status).json(resp);
    }

    // 2. التحقق إن كان الرياضي قد بدأ نفس الخطة ولديه سجل "قيد التنفيذ" مسبقاً
    const existingProgress = await WorkoutProgress.findOne({
      athlete: athleteId,
      plan: planId,
      status: 'in-progress',
    });

    if (existingProgress) {
      const resp = error('You have already started this plan and it is still in progress', 400);
      return res.status(resp.status).json(resp);
    }

    // 3. إنشاء سجل تتبع جديد للخطة
    const workoutProgress = await WorkoutProgress.create({
      athlete: athleteId,
      plan: plan._id,
      sport: plan.sport,
      status: 'in-progress',
      completedExercises: [],
      progressPercentage: 0,
      startedAt: new Date(),
    });

    // 4. تسجيل النشاط (Activity Log)
    await createLog({
      userId: athleteId,
      role: req.user.role,
      action: 'START_WORKOUT_PLAN',
      details: `Athlete started workout plan: ${plan.title}`,
    });

    logger.info('Workout plan started', { athleteId, planId: plan._id });

    const resp = success(workoutProgress, 'Workout plan started successfully');
    return res.status(201).json({ ...resp, status: 201 });
  });

  // GET /api/workout-progress/active/:planId
  // جلب حالة التقدم الحالية للرياضي في خطة معينة
  getActiveProgressByPlan = asyncHandler(async (req, res) => {
    const { planId } = req.params;

    const progress = await WorkoutProgress.findOne({
      athlete: req.user.id,
      plan: planId,
      status: { $in: ['in-progress', 'completed'] }, // ✅ يبحث عن الحالتين معاً
    }).sort({ createdAt: -1 }).populate('plan', 'title description exercises'); // يجلب الأحدث

    if (!progress) {
      const resp = error('No active progress found for this plan', 404);
      return res.status(resp.status).json(resp);
    }

    const resp = success(progress, 'Active progress fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // PATCH /api/workout-progress/:id/exercise
  // الرياضي يضغط على تمرين معين ليضع عليه "صح" (Check) أو يلغيه
  toggleExerciseCompletion = asyncHandler(async (req, res) => {
    const { exerciseName } = req.body; // أو الـ index حسب ما تفضل بالفرونت
    const progressId = req.params.id;

    const workoutProgress = await WorkoutProgress.findById(progressId).populate('plan');

    if (!workoutProgress) {
      const resp = error('Workout progress record not found', 404);
      return res.status(resp.status).json(resp);
    }

    // التأكد أن السجل يخص نفس الرياضي المسجل حالياً
    if (workoutProgress.athlete.toString() !== req.user.id.toString()) {
      const resp = error('Not authorized to update this progress', 403);
      return res.status(resp.status).json(resp);
    }

    if (workoutProgress.status !== 'in-progress') {
      const resp = error('This plan is no longer in progress', 400);
      return res.status(resp.status).json(resp);
    }

    // تبديل حالة التمرين (إذا موجود نحذفه، إذا غير موجود نضيفه)
    const index = workoutProgress.completedExercises.indexOf(exerciseName);
    if (index > -1) {
      workoutProgress.completedExercises.splice(index, 1);
    } else {
      workoutProgress.completedExercises.push(exerciseName);
    }

    // حساب نسبة الإنجاز تلقائياً بناءً على عدد التمارين الكلي في الخطة
    const totalExercises = workoutProgress.plan.exercises.length;
    if (totalExercises > 0) {
      const completedCount = workoutProgress.completedExercises.length;
      workoutProgress.progressPercentage = Math.round((completedCount / totalExercises) * 100);
    } else {
      workoutProgress.progressPercentage = 0;
    }

    // إذا اكتملت كل التمارين، يمكننا تحديث الحالة تلقائياً إلى completed (اختياري)
    if (workoutProgress.progressPercentage === 100) {
      workoutProgress.status = 'completed';
      workoutProgress.completedAt = new Date();
    }

    await workoutProgress.save();

    const resp = success(workoutProgress, 'Exercise progress updated successfully');
    return res.status(resp.status).json(resp);
  });
}

module.exports = new WorkoutProgressController();