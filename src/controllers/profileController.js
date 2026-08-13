const User = require('../models/User');
const Sport = require('../models/Sport'); 
const Post = require('../models/Post');
const Plan = require('../models/Plan');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');

class ProfileController {

  // GET /api/profile/me
  getMyProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
      .populate('sport', 'name slug colorTheme')
      .select(`
        name email role phone avatar cover bio height weight sport isActive isVerified createdAt updatedAt lastLogin
      `);

    if (!user) {
      const resp = error('User not found', 404);
      return res.status(resp.status).json(resp);
    }

    const formattedProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      cover: user.cover,
      sport: user.sport,
      profile: {
        bio: user.bio,
        height: user.height,
        weight: user.weight,
      },
      meta: {
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
      },
    };

    const resp = success(formattedProfile, 'Profile fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // GET /api/profile/:id
  getProfileById = asyncHandler(async (req, res) => {
    const user = await User.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .populate('sport', 'name slug colorTheme')
      .select('name avatar cover bio sport role height weight createdAt');

    if (!user) {
      const resp = error('User not found', 404);
      return res.status(resp.status).json(resp);
    }

    const posts = await Post.find({
      author: user._id,
      isActive: true,
    })
      .populate('sport', 'name slug colorTheme')
      .select('title body likes views createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedProfile = {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      cover: user.cover,
      role: user.role,
      sport: user.sport,
      profile: {
        bio: user.bio,
        height: user.height,
        weight: user.weight,
      },
      meta: {
        createdAt: user.createdAt,
      },
    };

    const resp = success(
      { user: formattedProfile, posts },
      'Profile fetched successfully'
    );

    return res.status(resp.status).json(resp);
  });

  // PUT /api/profile/me
  // المستخدم يعدل بياناته الشخصية
  updateMyProfile = asyncHandler(async (req, res) => {
    // 1. دعم استقبال bio أو about سواء أتت مباشرة أو داخل كائن profile
    const { name, about, bio, profile, phone, height, weight } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      const resp = error('User not found', 404);
      return res.status(resp.status).json(resp);
    }

    // تحديد قيمة bio المطلوبة مع التأكد من مختلف الاحتمالات
    const updatedBio = bio ?? about ?? profile?.bio;

    if (name !== undefined) user.name = name;
    if (updatedBio !== undefined) user.bio = updatedBio;
    if (phone !== undefined) user.phone = phone;
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;

    await user.save();

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE_PROFILE',
      details: 'User updated their profile information',
    });

    // 2. توحيد الهيكلية المرجعة مع getMyProfile لتسهيل التعامل في Frontend
    const resp = success(
      {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        cover: user.cover,
        profile: {
          bio: user.bio,
          height: user.height,
          weight: user.weight,
        },
      },
      'Profile updated successfully'
    );
    return res.status(resp.status).json(resp);
  });

  // GET /api/profile/me/activity
  getMyActivity = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const posts = await Post.find({ author: userId, isActive: true })
      .populate('sport', 'name slug colorTheme')
      .select('title likes views createdAt')
      .sort({ createdAt: -1 });

    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

    let plans = [];
    if (req.user.role === 'coach') {
      plans = await Plan.find({ createdBy: userId, isActive: true })
        .populate('sport', 'name slug')
        .select('title level durationWeeks createdAt')
        .sort({ createdAt: -1 });
    }

    const resp = success(
      {
        stats: { totalPosts, totalLikes, totalViews },
        posts,
        plans,
      },
      'Activity fetched successfully'
    );
    return res.status(resp.status).json(resp);
  });

  // PUT /api/profile/assign-coach
  assigncoach = asyncHandler(async (req, res) => {
    const { coachId } = req.body;

    const coach = await User.findOne({ 
      _id: coachId, 
      role: 'coach',
      isActive: true 
    });

    if (!coach) {
      const resp = error('coach not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (coachId === req.user.id.toString()) {
      const resp = error('You cannot assign yourself', 400);
      return res.status(resp.status).json(resp);
    }

    if (req.user.coach?.toString() === coachId) {
      const resp = error('Already assigned to this coach', 400);
      return res.status(resp.status).json(resp);
    }

    await User.findByIdAndUpdate(req.user.id, { 
      coach: coach._id 
    });

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'ASSIGN_coach',
      details: `User assigned to coach: ${coach.name}`,
    });

    const resp = success(
      { coach: { id: coach._id, name: coach.name } },
      'coach assigned successfully'
    );
    return res.status(resp.status).json(resp);
  });

  // PUT /api/profile/assign-sport
  assignSport = asyncHandler(async (req, res) => {
    const { sportId } = req.body;

    if (req.user.sport?.toString() === sportId) {
      const resp = error('Already assigned to this sport', 400);
      return res.status(resp.status).json(resp);
    }
    
    if (req.user.coach) {
      const resp = error('Cannot change sport while assigned to a coach', 400);
      return res.status(resp.status).json(resp);
    }

    const sport = await Sport.findOne({ _id: sportId, isActive: true });
    if (!sport) {
      const resp = error('Sport not found', 404);
      return res.status(resp.status).json(resp);
    }

    await User.findByIdAndUpdate(req.user.id, { sport: sport._id });

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'ASSIGN_SPORT',
      details: `User assigned to sport: ${sport.name}`,
    });

    const resp = success(
      { sport: { id: sport._id, name: sport.name, slug: sport.slug } },
      'Sport assigned successfully'
    );
    return res.status(resp.status).json(resp);
  });

}

module.exports = new ProfileController();