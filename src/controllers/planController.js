const Plan = require('../models/Plan');
const Sport = require('../models/Sport');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');

class PlanController {

  // Public — جلب الخطط برياضة معينة مع فلترة اختيارية
 getPlans = asyncHandler(async (req, res) => {
  const { sport: sportSlug, level } = req.query;

  const filter = { isActive: true };

  // إذا في sport slug → نفلتر حسبه
  if (sportSlug) {
    const sport = await Sport.findOne({
      slug: sportSlug,
      isActive: true,
    });

    if (!sport) {
      const resp = error('Sport not found', 404);
      return res.status(resp.status).json(resp);
    }

    filter.sport = sport._id;
  }

  // فلتر level اختياري
  if (level) {
    filter.level = level;
  }

  const plans = await Plan.find(filter)
    .populate('createdBy', 'name avatar')
    .select('-__v')
    .sort({ createdAt: -1 });

  const resp = success(plans, 'Plans fetched successfully');
  return res.status(resp.status).json(resp);
});


  // Public — جلب خطة وحدة بتفاصيلها
  getPlanById = asyncHandler(async (req, res) => {
    const plan = await Plan.findOne({ _id: req.params.id, isActive: true })
      .populate('createdBy', 'name avatar')
      .populate('sport', 'name slug colorTheme')
      .select('-__v');

    if (!plan) {
      const resp = error('Plan not found', 404);
      return res.status(resp.status).json(resp);
    }

    const resp = success(plan, 'Plan fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // coach فقط — ينشر خطة برياضته
  createPlan = asyncHandler(async (req, res) => {
    const coach = req.user;

    // ✅ دعم كل من sport و coachSport
    const sportId = coach.sport || coach.coachSport;
    
    if (!sportId) {
      const resp = error('You are not assigned to any sport', 403);
      return res.status(resp.status).json(resp);
    }

    const { title, description, level, durationWeeks, exercises } = req.body;

    const plan = await Plan.create({
      sport: sportId,  // ✅ استخدم sportId اللي جبناه
      createdBy: coach.id,
      title,
      description,
      level,
      durationWeeks,
      exercises: exercises || [],
    });

    await createLog({
      userId: coach.id,
      role: coach.role,
      action: 'CREATE_PLAN',
      details: `coach created plan: ${plan.title}`,
    });

    logger.info('Plan created', { planId: plan._id, coachId: coach.id });

    const resp = success(plan, 'Plan created successfully');
    return res.status(201).json({ ...resp, status: 201 });
  });

  // coach صاحب الخطة فقط
  updatePlan = asyncHandler(async (req, res) => {
    const plan = await Plan.findOne({ _id: req.params.id, isActive: true });

    if (!plan) {
      const resp = error('Plan not found', 404);
      return res.status(resp.status).json(resp);
    }

    // تأكد إنو هو صاحب الخطة
    if (plan.createdBy.toString() !== req.user.id.toString()) {
      const resp = error('You are not authorized to update this plan', 403);
      return res.status(resp.status).json(resp);
    }

    const { title, description, level, durationWeeks, exercises } = req.body;

    if (title !== undefined) plan.title = title;
    if (description !== undefined) plan.description = description;
    if (level !== undefined) plan.level = level;
    if (durationWeeks !== undefined) plan.durationWeeks = durationWeeks;
    if (exercises !== undefined) plan.exercises = exercises;

    await plan.save();

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE_PLAN',
      details: `Plan updated: ${plan.title}`,
    });

    const resp = success(plan, 'Plan updated successfully');
    return res.status(resp.status).json(resp);
  });

  // coach صاحبها أو Admin
  deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (!plan || !plan.isActive) {
    const resp = error('Plan not found or already deleted', 404);
    return res.status(resp.status).json(resp);
  }

   const isOwner = plan.createdBy.toString() === req.user.id.toString();
   const isAdmin = req.user.role === 'admin';

   if (!isOwner && !isAdmin) {
    const resp = error('You are not authorized to delete this plan', 403);
    return res.status(resp.status).json(resp);
   }

  //  delete
  plan.isActive = false;
  await plan.save();

  await createLog({
    userId: req.user.id,
    role: req.user.role,
    action: 'DELETE_PLAN',
    details: `Plan deleted: ${plan.title}`,
  });

  const resp = success(null, 'Plan deleted successfully');
  return res.status(resp.status).json(resp);
  });
}

module.exports = new PlanController();
