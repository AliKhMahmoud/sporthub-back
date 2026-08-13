const WorkoutProgress = require('../models/WorkoutProgress');
const Plan = require('../models/Plan');
const Sport = require('../models/Sport');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');

class WorkoutProgressController {

  // POST /api/workout-progress/start
  // الرياضي يضغط "Begin Workout" أو "Restart Workout"
  startPlan = asyncHandler(async (req, res) => {
    const { planId } = req.body;
    const athleteId = req.user.id;

    // 1. التأكد أن الخطة موجودة ونشطة
    const plan = await Plan.findOne({ _id: planId, isActive: true });
    if (!plan) {
      const resp = error('Plan not found', 404);
      return res.status(resp.status).json(resp);
    }

    // 2. البحث عن سجل تقدم سابق (In-progress أو Completed) لعمل إعادة تعيين (Reset)
    let workoutProgress = await WorkoutProgress.findOne({
      athlete: athleteId,
      plan: planId,
    }).sort({ createdAt: -1 });

    if (workoutProgress) {
      // إذا كان يوجد تقدم سابق، نقوم بإعادة ضبط السجل (Restart)
      workoutProgress.status = 'in-progress';
      workoutProgress.completedExercises = [];
      workoutProgress.progressPercentage = 0;
      workoutProgress.startedAt = new Date();
      workoutProgress.completedAt = null;

      await workoutProgress.save();

      // تسجيل النشاط (Restart)
      await createLog({
        userId: athleteId,
        role: req.user.role,
        action: 'RESTART_WORKOUT_PLAN',
        details: `Athlete restarted workout plan: ${plan.title}`,
      });

      logger.info('Workout plan restarted', { athleteId, planId: plan._id });

      const resp = success(workoutProgress, 'Workout plan restarted successfully');
      return res.status(200).json(resp);
    }

    // 3. إنشاء سجل تتبع جديد إذا لم يكن هناك سجل سابق
    workoutProgress = await WorkoutProgress.create({
      athlete: athleteId,
      plan: plan._id,
      sport: plan.sport,
      status: 'in-progress',
      completedExercises: [],
      progressPercentage: 0,
      startedAt: new Date(),
    });

    // 4. تسجيل النشاط (Start)
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
      status: { $in: ['in-progress', 'completed'] },
    }).sort({ createdAt: -1 }).populate('plan', 'title description exercises');

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
    const { exerciseName } = req.body;
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

    // التبديل بين إكمال التمرين وإلغائه
    const index = workoutProgress.completedExercises.indexOf(exerciseName);
    if (index > -1) {
      workoutProgress.completedExercises.splice(index, 1);
    } else {
      workoutProgress.completedExercises.push(exerciseName);
    }

    // حساب نسبة الإنجاز
    const totalExercises = workoutProgress.plan.exercises.length;
    if (totalExercises > 0) {
      const completedCount = workoutProgress.completedExercises.length;
      workoutProgress.progressPercentage = Math.round((completedCount / totalExercises) * 100);
    } else {
      workoutProgress.progressPercentage = 0;
    }

    // تحديث الحالة بحسب النسبة
    if (workoutProgress.progressPercentage === 100) {
      workoutProgress.status = 'completed';
      workoutProgress.completedAt = new Date();
    } else {
      workoutProgress.status = 'in-progress';
      workoutProgress.completedAt = null;
    }

    await workoutProgress.save();

    const resp = success(workoutProgress, 'Exercise progress updated successfully');
    return res.status(resp.status).json(resp);
  });
}

module.exports = new WorkoutProgressController();