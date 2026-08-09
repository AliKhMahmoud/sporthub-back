// src/controllers/statController.js
const AIPlan   = require('../models/AIPlan');
const Progress = require('../models/Progress');
const Post     = require('../models/Post');
const User     = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/responseService');
const {
  calculateXP,
  getLevelFromXP,
  getLevelTitle,
  getXPForNextLevel,
  getEarnedBadges,
  LEVEL_THRESHOLDS,
} = require('../utils/badgeService');

// ─── Helper: حساب XP Progress نسبة للـ level ──────────────────────────────
const calculateXPProgress = (xp, level) => {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 1000;

  if (nextThreshold === currentThreshold) {
    // Max level
    return 100;
  }

  return Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
};

class StatController {

  // GET /api/stats/me
  // يرجع كل إحصائيات المستخدم الحالي دفعة وحدة
  getMyStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // ─── 1. إحصائيات المنشورات ────────────────────────────────────────────
    const userPosts = await Post.find({
      author:    userId,
      isActive:  true,
    }).select('likes comments');

    const totalPosts      = userPosts.length;
    const receivedLikes   = userPosts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
    const receivedComments = userPosts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);

    // ─── 2. إحصائيات الخطط ───────────────────────────────────────────────
    const aiPlans = await AIPlan.find({
      athlete:   userId,
      isDeleted: false,
    }).select('progress completedExercises totalExercises coachRating coachFeedback status');

    const totalPlans        = aiPlans.length;
    const completedPlans    = aiPlans.filter(p => p.progress === 100).length;
    const totalPlanComments = aiPlans.filter(p => p.coachFeedback).length;
    const numberOfRatedPlans = aiPlans.filter(p => p.coachRating !== null).length;
    const hasMaxRating      = aiPlans.some(p => p.coachRating === 5);

    const completedExercisesTotal = aiPlans.reduce(
      (sum, p) => sum + (p.completedExercises || 0), 0
    );

    const averageProgress = totalPlans > 0
      ? Math.round(aiPlans.reduce((sum, p) => sum + (p.progress || 0), 0) / totalPlans)
      : 0;

    const averageRating = numberOfRatedPlans > 0
      ? parseFloat(
          (aiPlans
            .filter(p => p.coachRating !== null)
            .reduce((sum, p) => sum + p.coachRating, 0) / numberOfRatedPlans
          ).toFixed(1)
        )
      : null;

    // ─── 3. سجلات التقدم ─────────────────────────────────────────────────
    const totalProgressLogs = await Progress.countDocuments({ user: userId });

    // ─── 4. حساب XP والمستوى ─────────────────────────────────────────────
    const xp = calculateXP({
      completedPlans,
      totalProgressLogs,
      totalPlanComments,
      numberOfRatedPlans,
      receivedLikes,
      receivedComments,
      completedExercises: completedExercisesTotal,
    });

    const level      = getLevelFromXP(xp);
    const levelTitle = getLevelTitle(level);
    const xpForNext  = getXPForNextLevel(level);
    const xpProgress = calculateXPProgress(xp, level);

    // ─── 5. الشارات ──────────────────────────────────────────────────────
    const badges = getEarnedBadges({
      level,
      completedExercises: completedExercisesTotal,
      averageProgress,
      completedPlans,
      totalProgressLogs,
      hasMaxRating,
    });

    // ─── 6. آخر النشاطات ────────────────────────────────────────────────
    const recentActivity = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action details createdAt');

    // ─── 7. تحديث XP و Level على الـ User (للقراءة السريعة) ─────────────
    await User.findByIdAndUpdate(userId, { 
      xp, 
      level, 
      badges: badges.map(b => b.id) 
    });

    // ─── Response ─────────────────────────────────────────────────────────
    const resp = success({
      // إحصائيات المنشورات
      totalPosts,
      receivedLikes,
      receivedComments,

      // إحصائيات الخطط
      totalPlans,
      completedPlans,
      averageProgress,
      averageRating,
      totalPlanComments,
      numberOfRatedPlans,

      // سجلات التقدم
      totalProgressLogs,

      // XP والمستوى
      xp,
      level,
      levelTitle,
      xpForNextLevel: xpForNext,
      xpProgress,          // نسبة التقدم نحو المستوى الجاي (0-100)

      // الشارات
      badges,

      // النشاطات الأخيرة
      recentActivity,
    }, 'Stats fetched successfully');

    return res.status(resp.status).json(resp);
  });

  // GET /api/stats/:userId
  // عام — إحصائيات أي مستخدم (بدون recentActivity)
  getUserStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId).select('name avatar role xp level badges');
    if (!user) {
      const resp = error('User not found', 404);
      return res.status(resp.status).json(resp);
    }

    // نفس المنطق بس مبسط بدون نشاطات خاصة
    const aiPlans = await AIPlan.find({ athlete: userId, isDeleted: false })
      .select('progress completedExercises coachRating coachFeedback');

    const totalPlans     = aiPlans.length;
    const completedPlans = aiPlans.filter(p => p.progress === 100).length;
    const averageProgress = totalPlans > 0
      ? Math.round(aiPlans.reduce((sum, p) => sum + (p.progress || 0), 0) / totalPlans)
      : 0;

    const userPosts = await Post.find({ author: userId, isActive: true }).select('likes');
    const receivedLikes = userPosts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);

    // حساب xpProgress
    const userLevel = user.level || 1;
    const userXP = user.xp || 0;
    const xpForNext = getXPForNextLevel(userLevel);
    const xpProgress = calculateXPProgress(userXP, userLevel);

    const resp = success({
      user:          { id: user._id, name: user.name, avatar: user.avatar, role: user.role },
      xp:            userXP,
      level:         userLevel,
      levelTitle:    getLevelTitle(userLevel),
      badges:        user.badges || [],
      xpForNextLevel: xpForNext,
      xpProgress,              // نسبة التقدم نحو المستوى الجاي (0-100)
      totalPlans,
      completedPlans,
      averageProgress,
      receivedLikes,
    }, 'User stats fetched successfully');

    return res.status(resp.status).json(resp);
  });
}

module.exports = new StatController();