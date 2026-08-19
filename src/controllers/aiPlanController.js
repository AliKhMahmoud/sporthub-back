const AIPlan = require('../models/AIPlan');
const Sport = require('../models/Sport');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');
const { createNotification } = require('../utils/notificationService');
const { generateExercises, getLevelFromWeeks } = require('../utils/exerciseTemplates'); // ✅ جديد

class AIPlanController {

  // POST /api/ai-plans
  // Athlete — ينشئ خطة AI بتمارين مولدة تلقائياً
  createPlan = asyncHandler(async (req, res) => {
    const { sport: sportId, goal, condition, durationWeeks, level } = req.body;

    // 1. تحقق من الرياضة واجيب الـ slug
    const sport = await Sport.findOne({ _id: sportId, isActive: true }).select('name slug');
    if (!sport) {
      const resp = error('Sport not found', 404);
      return res.status(resp.status).json(resp);
    }

    // 2. حدد المستوى — لو ما حدد، احسبه من عدد الأسابيع
    const resolvedLevel = level || getLevelFromWeeks(durationWeeks || 4);

    // 3. ولّد التمارين تلقائياً من المكتبة
    const exercises = generateExercises(sport.slug, resolvedLevel, durationWeeks || 4);
    const totalExercises = exercises.length;

    // 4. احفظ الخطة
    const plan = await AIPlan.create({
      athlete:            req.user.id,
      athleteName:        req.user.name,
      sport:              sport._id,
      goal:               goal || 'Improve overall performance',
      condition:          condition || null,
      durationWeeks:      durationWeeks || 4,
      level:              resolvedLevel,
      exercises,                    // ✅ مولدة تلقائياً
      totalExercises,
      completedExercises: 0,
      progress:           0,
      status:             'Pending Coach Review',
    });

    // 5. سجّل النشاط
    await createLog({
      userId:  req.user.id,
      role:    req.user.role,
      action:  'CREATE_AI_PLAN',
      details: `AI plan created for sport: ${sport.name} | level: ${resolvedLevel} | ${totalExercises} exercises`,
    });

    logger.info('AI plan created', {
      planId:    plan._id,
      athleteId: req.user.id,
      sport:     sport.slug,
      level:     resolvedLevel,
      exercises: totalExercises,
    });

    // 6. إشعار للمدرب لو موجود
    if (req.user.coach) {
      await createNotification({
        userId:  req.user.coach,
        type:    'AI_PLAN_CREATED',
        title:   'New AI Plan Submitted',
        message: `${req.user.name || 'An athlete'} submitted a new training plan for your review`,
        link:    `/ai-plans/${plan._id}`,
      });
    }

    const resp = success(plan, 'AI plan created successfully');
    return res.status(201).json({ ...resp, status: 201 });
  });

  // GET /api/ai-plans
  // Athlete — يجيب خططه | Coach — يجيب الخطط pending | Admin — الكل
  // GET /api/ai-plans
// Athlete — يجيب خططه | Coach — يجيب الخطط all (مو بس pending) | Admin — الكل
  getPlans = asyncHandler(async (req, res) => {
      const { status } = req.query;
      let filter = { isDeleted: false };

      if (req.user.role === 'athlete') {
        filter.athlete = req.user.id;
        if (status) filter.status = status;

      } else if (req.user.role === 'coach') {
        // ✅ جديد: يجيب كل الخطط (pending + approved + rejected)
        // بس اللي بتاعتو أو pending ما حتها أحد
        filter.reviewedBy = { $in: [null, req.user.id] };
        // ❌ حذفنا الـ default status!
        if (status) filter.status = status; // لو مرّى status فقط بعدها

      } else if (req.user.role === 'admin') {
        if (status) filter.status = status;
      }

      const plans = await AIPlan.find(filter)
        .populate('athlete',    'name avatar')
        .populate('sport',      'name slug')
        .populate('reviewedBy', 'name')
        .select('-__v')
        .sort({ createdAt: -1 });

      const resp = success(plans, 'AI plans fetched successfully');
      return res.status(resp.status).json(resp);
  });

  // GET /api/ai-plans/:id
  // جلب خطة وحدة بتفاصيلها الكاملة
  getPlanById = asyncHandler(async (req, res) => {
    const plan = await AIPlan.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate('athlete',    'name avatar')
      .populate('sport',      'name slug colorTheme')  // ✅ جديد
      .populate('reviewedBy', 'name avatar')
      .select('-__v');

    if (!plan) {
      const resp = error('Plan not found', 404);
      return res.status(resp.status).json(resp);
    }

    // Athlete يشوف خططه بس
    if (
      req.user.role === 'athlete' &&
      plan.athlete._id.toString() !== req.user.id.toString()
    ) {
      const resp = error('Not authorized', 403);
      return res.status(resp.status).json(resp);
    }

    const resp = success(plan, 'AI plan fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // PUT /api/ai-plans/:id/approve
  // Coach — يوافق على خطة
  approvePlan = asyncHandler(async (req, res) => {
    const plan = await AIPlan.findOne({
      _id: req.params.id,
      isDeleted: false,
      status: 'Pending Coach Review',
    });

    if (!plan) {
      const resp = error('Plan not found or already reviewed', 404);
      return res.status(resp.status).json(resp);
    }

    plan.status     = 'Approved';
    plan.reviewedBy = req.user.id;
    plan.reviewedAt = new Date();
    await plan.save();

    await createNotification({
      userId:  plan.athlete,
      type:    'AI_PLAN_REVIEWED',
      title:   'AI Plan Approved ✅',
      message: 'Your AI training plan has been approved by your coach!',
      link:    `/ai-plans/${plan._id}`,
    });

    await createLog({
      userId:  req.user.id,
      role:    req.user.role,
      action:  'APPROVE_AI_PLAN',
      details: `Coach approved AI plan: ${plan._id}`,
    });

    const resp = success(plan, 'Plan approved successfully');
    return res.status(resp.status).json(resp);
  });

  // PUT /api/ai-plans/:id/reject
  // Coach — يرفض خطة
  rejectPlan = asyncHandler(async (req, res) => {
    const plan = await AIPlan.findOne({
      _id: req.params.id,
      isDeleted: false,
      status: 'Pending Coach Review',
    });

    if (!plan) {
      const resp = error('Plan not found or already reviewed', 404);
      return res.status(resp.status).json(resp);
    }

    plan.status     = 'Rejected';
    plan.reviewedBy = req.user.id;
    plan.reviewedAt = new Date();
    await plan.save();

    await createNotification({
      userId:  plan.athlete,
      type:    'AI_PLAN_REVIEWED',
      title:   'AI Plan Rejected',
      message: 'Your AI training plan has been reviewed. Please check the feedback.',
      link:    `/ai-plans/${plan._id}`,
    });

    await createLog({
      userId:  req.user.id,
      role:    req.user.role,
      action:  'REJECT_AI_PLAN',
      details: `Coach rejected AI plan: ${plan._id}`,
    });

    const resp = success(plan, 'Plan rejected successfully');
    return res.status(resp.status).json(resp);
  });

  // PUT /api/ai-plans/:id/feedback
  // Coach — يضيف تعليق وتقييم
  addFeedback = asyncHandler(async (req, res) => {
    const { coachFeedback, coachRating } = req.body;

    const plan = await AIPlan.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!plan) {
      const resp = error('Plan not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (
      plan.reviewedBy &&
      plan.reviewedBy.toString() !== req.user.id.toString()
    ) {
      const resp = error('Not authorized to add feedback to this plan', 403);
      return res.status(resp.status).json(resp);
    }

    if (coachFeedback !== undefined) plan.coachFeedback = coachFeedback;
    if (coachRating   !== undefined) plan.coachRating   = coachRating;
    if (!plan.reviewedBy)            plan.reviewedBy    = req.user.id;

    await plan.save();

    await createLog({
      userId:  req.user.id,
      role:    req.user.role,
      action:  'ADD_AI_PLAN_FEEDBACK',
      details: `Coach added feedback to plan: ${plan._id}`,
    });

    const resp = success(plan, 'Feedback added successfully');
    return res.status(resp.status).json(resp);
  });

  // PUT /api/ai-plans/:id/exercise/:exerciseId/toggle
  // Athlete — يكمل/يلغي تمرين ويحسب نسبة الإنجاز تلقائياً
  toggleExercise = asyncHandler(async (req, res) => {
    const plan = await AIPlan.findOne({
      _id:      req.params.id,
      athlete:  req.user.id,
      isDeleted: false,
    });

    if (!plan) {
      const resp = error('Plan not found', 404);
      return res.status(resp.status).json(resp);
    }

    // ✅ هلق التمارين مسطحة (flat array) مش متداخلة بأيام
    const exercise = plan.exercises.id(req.params.exerciseId);
    if (!exercise) {
      const resp = error('Exercise not found', 404);
      return res.status(resp.status).json(resp);
    }

    exercise.completed = !exercise.completed;

    // احسب نسبة الإنجاز
    const totalExercises     = plan.exercises.length;
    const completedExercises = plan.exercises.filter(e => e.completed).length;
    const progress           = totalExercises > 0
      ? Math.round((completedExercises / totalExercises) * 100)
      : 0;

    plan.completedExercises = completedExercises;
    plan.progress           = progress;

    await plan.save();

    const resp = success(
      { plan, progress, completedExercises, totalExercises },
      'Exercise updated successfully'
    );
    return res.status(resp.status).json(resp);
  });

  // DELETE /api/ai-plans/:id
  // Athlete — يحذف خطته (Soft Delete)
  deletePlan = asyncHandler(async (req, res) => {
    const plan = await AIPlan.findOne({
      _id:      req.params.id,
      athlete:  req.user.id,
      isDeleted: false,
    });

    if (!plan) {
      const resp = error('Plan not found', 404);
      return res.status(resp.status).json(resp);
    }

    plan.isDeleted = true;
    await plan.save();

    await createLog({
      userId:  req.user.id,
      role:    req.user.role,
      action:  'DELETE_AI_PLAN',
      details: `AI plan deleted: ${plan._id}`,
    });

    const resp = success(null, 'AI plan deleted successfully');
    return res.status(resp.status).json(resp);
  });
}

module.exports = new AIPlanController();
