const User = require('../models/User');
const Post   = require('../models/Post');
const Plan   = require('../models/Plan');
const AIPlan = require('../models/AIPlan');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');
const { createNotification } = require('../utils/notificationService');

class AdminController {

  // GET /api/admin/coach-requests
  // Admin — جلب كل طلبات المدربين
  getCoachRequests = asyncHandler(async (req, res) => {
    const { status = 'pending' } = req.query;

    const coaches = await User.find({
      role: 'coach',
      coachStatus: status,
    })
      .select('name email coachSport age experienceYears workingDays workingHours certificates bio avatar createdAt coachStatus')
      .sort({ createdAt: -1 });

    const resp = success(coaches, 'Coach requests fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // PUT /api/admin/coach-requests/:id/approve
  // Admin — يوافق على مدرب
  approveCoach = asyncHandler(async (req, res) => {
    const coach = await User.findOne({ _id: req.params.id, role: 'coach' });

    if (!coach) {
      const resp = error('Coach not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (coach.coachStatus === 'approved') {
      const resp = error('Coach is already approved', 400);
      return res.status(resp.status).json(resp);
    }

    coach.coachStatus = 'approved';
    await coach.save();

    await createNotification({
      userId: coach._id,
      type: 'COACH_APPROVED',
      title: 'Account Approved',
      message: 'Congratulations! Your coach account has been approved.',
      link: '/dashboard',
    });

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'APPROVE_COACH',
      details: `Admin approved coach: ${coach.name} (${coach.email})`,
    });

    logger.info('Coach approved', { coachId: coach._id, adminId: req.user.id });

    const resp = success(
      { id: coach._id, name: coach.name, coachStatus: coach.coachStatus },
      'Coach approved successfully'
    );
    return res.status(resp.status).json(resp);
  });

  // PUT /api/admin/coach-requests/:id/reject
  // Admin — يرفض مدرب
  rejectCoach = asyncHandler(async (req, res) => {
    const coach = await User.findOne({ _id: req.params.id, role: 'coach' });

    if (!coach) {
      const resp = error('Coach not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (coach.coachStatus === 'rejected') {
      const resp = error('Coach is already rejected', 400);
      return res.status(resp.status).json(resp);
    }

    coach.coachStatus = 'rejected';
    await coach.save();

    await createNotification({
      userId: coach._id,
      type: 'COACH_REJECTED',
      title: 'Account Rejected',
      message: 'Your coach account request has been rejected.',
      link: null,
    });

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'REJECT_COACH',
      details: `Admin rejected coach: ${coach.name} (${coach.email})`,
    });

    logger.info('Coach rejected', { coachId: coach._id, adminId: req.user.id });

    const resp = success(
      { id: coach._id, name: coach.name, coachStatus: coach.coachStatus },
      'Coach rejected successfully'
    );
    return res.status(resp.status).json(resp);
  });

  // GET /api/admin/users
  // Admin — جلب كل المستخدمين
  getAllUsers = asyncHandler(async (req, res) => {
    const { role, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const resp = success(
      {
        users,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit),
        },
      },
      'Users fetched successfully'
    );
    return res.status(resp.status).json(resp);
  });

  // DELETE /api/admin/users/:id
  // Admin — تعطيل مستخدم (Soft delete)
  deactivateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      const resp = error('User not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (user.role === 'admin') {
      const resp = error('Cannot deactivate admin', 403);
      return res.status(resp.status).json(resp);
    }

    user.isActive = false;
    await user.save();

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'DEACTIVATE_USER',
      details: `Admin deactivated user: ${user.name} (${user.email})`,
    });

    const resp = success(null, 'User deactivated successfully');
    return res.status(resp.status).json(resp);
  });

  // GET /api/admin/stats
  // Admin — إحصائيات لوحة التحكم
  getDashboardStats = asyncHandler(async (req, res) => {
    const [athletes, coaches, pendingCoaches, totalUsers , totalPosts, totalPlans, totalAIPlans] = await Promise.all([
      User.countDocuments({ role: 'athlete', isActive: true }),
      User.countDocuments({ role: 'coach', coachStatus: 'approved', isActive: true }),
      User.countDocuments({ role: 'coach', coachStatus: 'pending' }),
      User.countDocuments({ isActive: true }),
      Post.countDocuments({ isActive: true }),        
      Plan.countDocuments({ isActive: true }),       
      AIPlan.countDocuments({ isDeleted: false }),   
    ]);

    const resp = success(
      { totalUsers, athletes, coaches, pendingCoaches,totalPosts,                                     // ✅ جديد
      totalPlans: totalPlans + totalAIPlans },
      'Stats fetched successfully'
    );
    return res.status(resp.status).json(resp);
  });
}

module.exports = new AdminController();
