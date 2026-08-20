// src/utils/xpService.js
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Progress = require('../models/Progress');
const AIPlan = require('../models/AIPlan');
const {
  calculateXP,
  getLevelFromXP,
  getLevelTitle,
  getEarnedBadges,
} = require('./badgeService');

const updateUserXP = async (userId) => {
  try {
    // ─── 1. إحصائيات المنشورات ────────────────────────────────────
    const userPosts = await Post.find({
      author: userId,
      isActive: true,
    }).select('likes');

    const receivedLikes = userPosts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);

    // ─── 2. إحصائيات التعليقات ────────────────────────────────────
    // التعليقات اللي كتبها المستخدم نفسه
    const userCommentsCount = await Comment.countDocuments({
      author: userId,
      isActive: true,
    });

    const postsIds = userPosts.map(p => p._id);
    const receivedComments = await Comment.countDocuments({
      post: { $in: postsIds },
      isActive: true,
    });

    const totalUserComments = userCommentsCount + receivedComments;

    // ─── 3. إحصائيات الخطط والتمارين ─────────────────────────────────
    const aiPlans = await AIPlan.find({
      athlete: userId,
      isDeleted: false,
    }).select('progress completedExercises exercises coachRating coachFeedback');

    const totalPlans = aiPlans.length;
    const completedPlans = aiPlans.filter(p => p.progress === 100).length;
    const totalPlanComments = aiPlans.filter(p => p.coachFeedback).length;
    const numberOfRatedPlans = aiPlans.filter(p => p.coachRating !== null).length;
    const hasMaxRating = aiPlans.some(p => p.coachRating === 5);

    // حساب التمارين المكتملة
    const completedExercisesTotal = aiPlans.reduce((sum, p) => {
      if (typeof p.completedExercises === 'number' && p.completedExercises > 0) {
        return sum + p.completedExercises;
      }
      if (Array.isArray(p.exercises)) {
        const completedInPlan = p.exercises.filter(ex => ex.completed || ex.isCompleted).length;
        return sum + completedInPlan;
      }
      return sum;
    }, 0);

    const averageProgress = totalPlans > 0
      ? Math.round(aiPlans.reduce((sum, p) => sum + (p.progress || 0), 0) / totalPlans)
      : 0;

    // ─── 4. سجلات التقدم ─────────────────────────────────────────────
    const totalProgressLogs = await Progress.countDocuments({ user: userId });

    // ─── 5. حساب XP والمستوى ─────────────────────────────────────────
    const xp = calculateXP({
      completedPlans,
      totalProgressLogs,
      totalPlanComments,
      numberOfRatedPlans,
      receivedLikes,
      receivedComments: totalUserComments, 
      completedExercises: completedExercisesTotal,
    });

    const level = getLevelFromXP(xp);
    const levelTitle = getLevelTitle(level);

    // ─── 6. الشارات ──────────────────────────────────────────────────
    const badges = getEarnedBadges({
      level,
      completedExercises: completedExercisesTotal,
      averageProgress,
      completedPlans,
      totalProgressLogs,
      hasMaxRating,
    });

    // ─── 7. تحديث User Document ──────────────────────────────────────
    await User.findByIdAndUpdate(userId, {
      xp,
      level,
      badges: badges.map(b => b.id),
    });

    console.log(`📊 XP Updated for ${userId}:`, {
      xp,
      level,
      levelTitle,
      stats: {
        receivedLikes,
        userCommentsCount,
        receivedComments,
        totalUserComments,
        completedPlans,
        completedExercises: completedExercisesTotal,
      },
    });

    return {
      xp,
      level,
      levelTitle,
      badges,
    };
  } catch (error) {
    console.error('❌ Error updating user XP:', error.message);
    console.error('Error details:', error);
    throw error;
  }
};

module.exports = { updateUserXP };