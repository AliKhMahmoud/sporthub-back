const User = require('../models/User');
const Post = require('../models/Post');
const Plan = require('../models/Plan');
const AIPlan = require('../models/AIPlan');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');
const { createNotification } = require('../utils/notificationService');
const sendEmail = require('../utils/sendEmail');

class AdminController {

  // GET /api/admin/coach-requests
  getCoachRequests = asyncHandler(async (req, res) => {
    const { status = 'pending' } = req.query;

    const coaches = await User.find({
      role: 'coach',
      coachStatus: status,
    })
      .populate('sport', 'name slug colorTheme')
      .select('name email sport age experienceYears workingDays workingHours certificates bio avatar createdAt coachStatus')
      .sort({ createdAt: -1 });

    const resp = success(coaches, 'Coach requests fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // PUT /api/admin/coach-requests/:id/approve
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

    // إرسال إيميل بالقبول
    sendEmail({
      to: coach.email,
      subject: 'Coach Account Approved - SportsHub',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Congratulations ${coach.name}!</h2>
          <p>Your request to become a certified coach on SportsHub has been approved.</p>
          <p>You can now log in and start creating plans and training athletes.</p>
        </div>
      `,
      text: `Congratulations ${coach.name}! Your coach account has been approved.`
    }).catch((err) => logger.error("Coach approval email failed:", err.message));

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
  rejectCoach = asyncHandler(async (req, res) => {
    const { reason } = req.body;
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

    const rejectMessage = reason ? `Your request was rejected. Reason: ${reason}` : 'Your coach account request has been rejected.';

    await createNotification({
      userId: coach._id,
      type: 'COACH_REJECTED',
      title: 'Account Status Update',
      message: rejectMessage,
      link: null,
    });

    // إرسال إيميل بالرفض مباشرة للمدرب
    sendEmail({
      to: coach.email,
      subject: 'Coach Application Status - SportsHub',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello ${coach.name},</h2>
          <p>${rejectMessage}</p>
        </div>
      `,
      text: rejectMessage
    }).catch((err) => logger.error("Coach rejection email failed:", err.message));

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'REJECT_COACH',
      details: `Admin rejected coach: ${coach.name} (${coach.email}). Reason: ${reason || 'N/A'}`,
    });

    logger.info('Coach rejected', { coachId: coach._id, adminId: req.user.id });

    const resp = success(
      { id: coach._id, name: coach.name, coachStatus: coach.coachStatus },
      'Coach rejected successfully'
    );
    return res.status(resp.status).json(resp);
  });

  // GET /api/admin/users
  getAllUsers = asyncHandler(async (req, res) => {
    const { role, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('sport', 'name slug')
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
  deactivateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      const resp = error('User not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (user.role === 'admin' || user.email === process.env.SUPERADMIN_EMAIL) {
      const resp = error('Cannot deactivate admin or superadmin accounts', 403);
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
  getDashboardStats = asyncHandler(async (req, res) => {
    const [athletes, coaches, pendingCoaches, totalUsers, totalPosts, totalPlans, totalAIPlans] = await Promise.all([
      User.countDocuments({ role: 'athlete', isActive: true }),
      User.countDocuments({ role: 'coach', coachStatus: 'approved', isActive: true }),
      User.countDocuments({ role: 'coach', coachStatus: 'pending' }),
      User.countDocuments({ isActive: true }),
      Post.countDocuments({ isActive: true }),        
      Plan.countDocuments({ isActive: true }),       
      AIPlan.countDocuments({ isDeleted: false }),   
    ]);

    const resp = success(
      { 
        totalUsers, 
        athletes, 
        coaches, 
        pendingCoaches, 
        totalPosts,                         
        totalPlans: totalPlans + totalAIPlans 
      },
      'Stats fetched successfully'
    );
    return res.status(resp.status).json(resp);
  });
}

module.exports = new AdminController();