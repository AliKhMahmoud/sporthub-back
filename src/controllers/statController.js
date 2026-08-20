// src/controllers/statController.js
const AIPlan          = require('../models/AIPlan');
const WorkoutProgress = require('../models/WorkoutProgress');
const Progress        = require('../models/Progress');
const Post            = require('../models/Post');
const Comment         = require('../models/Comment');
const User            = require('../models/User');
const ActivityLog     = require('../models/ActivityLog');
const asyncHandler    = require('../utils/asyncHandler');
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
    return 100; // Max level
  }

  return Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
};

class StatController {

  // GET /api/stats/me
  // يرجع كل إحصائيات المستخدم الحالي دفعة واحدة
  getMyStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // ─── 1. إحصائيات المنشورات والتعليقات والإعجابات ─────────────────────────
    const userPosts = await Post.find({
      author:   userId,
      isActive: true,
    }).select('likes');

    const totalPosts    = userPosts.length;
    const receivedLikes = userPosts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);

    const userPostIds = userPosts.map(p => p._id);
    const receivedComments = await Comment.countDocuments({
      post:     { $in: userPostIds },
      isActive: true,
    });

    const givenLikes = await Post.countDocuments({
      likes:    userId,
      isActive: true,
    });

    const userCommentsCount = await Comment.countDocuments({
      author:   userId,
      isActive: true,
    });

    // ─── 2. إحصائيات الخطط والتمارين (AIPlan + WorkoutProgress) ──────────────
    
    // أ) جلب خطط الـ AI
    const aiPlans = await AIPlan.find({
      athlete:   userId,
      isDeleted: false,
    }).select('progress completedExercises exercises totalExercises coachRating coachFeedback status');

    // ب) جلب خطط وسجلات الـ WorkoutProgress العادية
    const workoutProgresses = await WorkoutProgress.find({
      athlete: userId,
    }).select('progressPercentage completedExercises status');

    // حساب إجمالي عدد الخطط المكتملة من النوعين
    const completedAIPlans      = aiPlans.filter(p => p.progress === 100).length;
    const completedRegularPlans = workoutProgresses.filter(p => p.status === 'completed' || p.progressPercentage === 100).length;
    
    const totalPlans     = aiPlans.length + workoutProgresses.length;
    const completedPlans = completedAIPlans + completedRegularPlans;

    const totalPlanComments  = aiPlans.filter(p => p.coachFeedback).length;
    const numberOfRatedPlans = aiPlans.filter(p => p.coachRating !== null).length;
    const hasMaxRating       = aiPlans.some(p => p.coachRating === 5);

    // حساب التمارين المكتملة من الـ AI Plans
    const aiCompletedExercises = aiPlans.reduce((sum, p) => {
      if (typeof p.completedExercises === 'number' && p.completedExercises > 0) {
        return sum + p.completedExercises;
      }
      if (Array.isArray(p.exercises)) {
        return sum + p.exercises.filter(ex => ex.completed || ex.isCompleted).length;
      }
      return sum;
    }, 0);

    // حساب التمارين المكتملة من الـ WorkoutProgress
    const regularCompletedExercises = workoutProgresses.reduce((sum, p) => {
      return sum + (Array.isArray(p.completedExercises) ? p.completedExercises.length : 0);
    }, 0);

    // إجمالي التمارين المكتملة للطرفين
    const completedExercisesTotal = aiCompletedExercises + regularCompletedExercises;

    // حساب متوسط التقدم العام
    const totalProgressSum = 
      aiPlans.reduce((sum, p) => sum + (p.progress || 0), 0) +
      workoutProgresses.reduce((sum, p) => sum + (p.progressPercentage || 0), 0);

    const averageProgress = totalPlans > 0
      ? Math.round(totalProgressSum / totalPlans)
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

    // ─── 4. حساب XP والمستوى بشكل ديناميكي ───────────────────────────────
    const xp = calculateXP({
      completedPlans,
      totalProgressLogs,
      totalPlanComments,
      numberOfRatedPlans,
      receivedLikes,
      receivedComments,
      completedExercises: completedExercisesTotal,
      createdPosts:       totalPosts,
      givenLikes:         givenLikes,
      writtenComments:    userCommentsCount,
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
      totalPosts,
      receivedLikes,
      receivedComments,
      givenLikes,
      writtenComments: userCommentsCount,

      totalPlans,
      completedPlans,
      averageProgress,
      averageRating,
      totalPlanComments,
      numberOfRatedPlans,

      totalProgressLogs,

      xp,
      level,
      levelTitle,
      xpForNextLevel: xpForNext,
      xpProgress,

      badges,
      recentActivity,
    }, 'Stats fetched successfully');

    return res.status(resp.status).json(resp);
  });

  // GET /api/stats/:userId
  getUserStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId).select('name avatar role xp level badges');
    if (!user) {
      const resp = error('User not found', 404);
      return res.status(resp.status).json(resp);
    }

    const aiPlans = await AIPlan.find({ athlete: userId, isDeleted: false }).select('progress');
    const workoutProgresses = await WorkoutProgress.find({ athlete: userId }).select('progressPercentage status');

    const totalPlans = aiPlans.length + workoutProgresses.length;
    const completedPlans = 
      aiPlans.filter(p => p.progress === 100).length + 
      workoutProgresses.filter(p => p.status === 'completed' || p.progressPercentage === 100).length;

    const totalProgressSum = 
      aiPlans.reduce((sum, p) => sum + (p.progress || 0), 0) +
      workoutProgresses.reduce((sum, p) => sum + (p.progressPercentage || 0), 0);

    const averageProgress = totalPlans > 0 ? Math.round(totalProgressSum / totalPlans) : 0;

    const userPosts = await Post.find({ author: userId, isActive: true }).select('likes');
    const receivedLikes = userPosts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);

    const userLevel  = user.level || 1;
    const userXP     = user.xp || 0;
    const xpForNext  = getXPForNextLevel(userLevel);
    const xpProgress = calculateXPProgress(userXP, userLevel);

    const resp = success({
      user:           { id: user._id, name: user.name, avatar: user.avatar, role: user.role },
      xp:             userXP,
      level:          userLevel,
      levelTitle:     getLevelTitle(userLevel),
      badges:         user.badges || [],
      xpForNextLevel: xpForNext,
      xpProgress,
      totalPlans,
      completedPlans,
      averageProgress,
      receivedLikes,
    }, 'User stats fetched successfully');

    return res.status(resp.status).json(resp);
  });
}

module.exports = new StatController();