const TrainingRequest = require('../models/TrainingRequest');
const AIPlan = require('../models/AIPlan');
const User = require('../models/User');
const Post = require('../models/Post');
const Plan   = require('../models/Plan');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/responseService');

class CoachDashboardController {

  // GET /api/dashboard/coach
  // كل بيانات Dashboard المدرب دفعة وحدة
  getDashboard = asyncHandler(async (req, res) => {
    const coachId = req.user.id;

    const [
      pendingRequests,
      totalTrainees,
      pendingAIPlans,
      recentRequests,
      recentAIPlans,
    ] = await Promise.all([

      // طلبات التدريب المعلقة
      TrainingRequest.countDocuments({
        coach: coachId,
        status: 'pending',
      }),

      // عدد المتدربين المقبولين
      TrainingRequest.countDocuments({
        coach: coachId,
        status: 'accepted',
      }),

      // خطط AI تنتظر المراجعة
      AIPlan.countDocuments({
        status: 'Pending Coach Review',
        isDeleted: false,
      }),

      // آخر 5 طلبات تدريب
      TrainingRequest.find({ coach: coachId })
        .populate('athlete', 'name avatar sport')
        .select('status message createdAt')
        .sort({ createdAt: -1 })
        .limit(5),

      // آخر 5 خطط AI تنتظر المراجعة
      AIPlan.find({
        status: 'Pending Coach Review',
        isDeleted: false,
      })
        .populate('athlete', 'name avatar')
        .select('sport goal level createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const resp = success(
      {
        stats: {
          pendingRequests,
          totalTrainees,
          pendingAIPlans,
        },
        recentRequests,
        recentAIPlans,
      },
      'Coach dashboard fetched successfully'
    );
    return res.status(resp.status).json(resp);
  });

  // GET /api/dashboard/coach/trainees
  // قائمة متدربي المدرب
  getMyTrainees = asyncHandler(async (req, res) => {
    const trainees = await User.find({
      coach: req.user.id,
      isActive: true,
    })
      .populate('sport', 'name slug colorTheme')
      .select('name avatar sport xp level createdAt')
      .sort({ createdAt: -1 });

    const resp = success(trainees, 'Trainees fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // GET /api/dashboard/coach/ai-plans
  // خطط AI تنتظر مراجعة المدرب
  getPendingAIPlans = asyncHandler(async (req, res) => {
    const plans = await AIPlan.find({
      status: 'Pending Coach Review',
      isDeleted: false,
    })
      .populate('athlete', 'name avatar')
      .select('sport goal level condition createdAt')
      .sort({ createdAt: -1 });

    const resp = success(plans, 'Pending AI plans fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // GET /api/dashboard/coach/requests
  // طلبات التدريب مع فلترة
  getTrainingRequests = asyncHandler(async (req, res) => {
    const { status } = req.query;

    const filter = { coach: req.user.id };
    if (status) filter.status = status;

    const requests = await TrainingRequest.find(filter)
      .populate('athlete', 'name avatar sport')
      .populate('sport', 'name slug colorTheme')
      .select('status message rejectionReason createdAt updatedAt')
      .sort({ createdAt: -1 });

    const resp = success(requests, 'Training requests fetched successfully');
    return res.status(resp.status).json(resp);
  });
}

module.exports = new CoachDashboardController();
