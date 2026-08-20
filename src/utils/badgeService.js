// src/utils/badgeService.js

// ─── تعريف الشارات ─────────────────────────────────────────────────────────
const BADGES = {
  FIRST_WORKOUT: {
    id:          'FIRST_WORKOUT',
    name:        'First Workout',
    description: 'Completed your first exercise',
    icon:        '🥊',
  },
  PROGRESS_MAKER: {
    id:          'PROGRESS_MAKER',
    name:        'Progress Maker',
    description: 'Reached 50% average progress across plans',
    icon:        '📈',
  },
  PLAN_FINISHER: {
    id:          'PLAN_FINISHER',
    name:        'Plan Finisher',
    description: 'Completed your first full training plan',
    icon:        '🎯',
  },
  DEDICATED: {
    id:          'DEDICATED',
    name:        'Dedicated',
    description: 'Completed 5 training plans',
    icon:        '💪',
  },
  RISING_STAR: {
    id:          'RISING_STAR',
    name:        'Rising Star',
    description: 'Reached Level 5',
    icon:        '⭐',
  },
  ELITE: {
    id:          'ELITE',
    name:        'Elite',
    description: 'Reached Level 10',
    icon:        '🏆',
  },
  COACHES_PICK: {
    id:          'COACHES_PICK',
    name:        'Coachs Pick',
    description: 'Received a 5-star rating from a coach',
    icon:        '👑',
  },
  CONSISTENT_ATHLETE: {
    id:          'CONSISTENT_ATHLETE',
    name:        'Consistent Athlete',
    description: 'Logged progress 3 or more times',
    icon:        '🔥',
  },
};

// ─── نظام المستويات ──────────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

const LEVEL_TITLES = {
  1:  'Rookie',
  2:  'Rookie',
  3:  'Active Athlete',
  4:  'Active Athlete',
  5:  'Champion',
  6:  'Champion',
  7:  'Elite Athlete',
  8:  'Elite Athlete',
  9:  'Elite Athlete',
  10: 'Legend',
};

// ─── حساب المستوى من XP ──────────────────────────────────────────────────────
const getLevelFromXP = (xp = 0) => {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, 10);
};

const getLevelTitle = (level) => LEVEL_TITLES[level] || 'Legend';

const getXPForNextLevel = (currentLevel) => {
  if (currentLevel >= 10) return LEVEL_THRESHOLDS[9];
  return LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
};

// ─── حساب XP ديناميكي دقيق وشامل ──────────────────────────────────────────────
const calculateXP = (stats = {}) => {
  const {
    completedPlans      = 0,
    totalProgressLogs   = 0,
    totalPlanComments   = 0,
    numberOfRatedPlans  = 0,
    receivedLikes       = 0,
    receivedComments    = 0,
    completedExercises  = 0,
    createdPosts        = 0, // 🔥 عدد المنشورات المنشورة (10 XP)
    givenLikes          = 0, // 🔥 عدد الإعجابات التي وضعها (2 XP)
    writtenComments     = 0, // 🔥 عدد التعليقات المكتوبة (5 XP)
  } = stats;

  return (
    completedExercises  * 15 +   // 15 XP لكل تمرين منفذ
    completedPlans      * 80 +   // 80 XP لكل خطة مكتملة
    totalProgressLogs   * 15 +   // 15 XP لكل تسجيل تقدم يومي
    totalPlanComments   * 10 +   // 10 XP لملاحظات الكوتش
    numberOfRatedPlans  * 20 +   // 20 XP عند تقييم الخطة
    receivedLikes       * 10 +   // 10 XP لكل لايك مستلم بالمنتدى
    receivedComments    * 15 +   // 15 XP لكل تعليق مستلم بالمنتدى
    createdPosts        * 10 +   // 🔥 10 XP لكل منشور مكتوب
    givenLikes          * 2  +   // 🔥 2 XP لكل لايك يعطيه
    writtenComments     * 5      // 🔥 5 XP لكل تعليق يكتبه
  );
};

// ─── تحديد الشارات المستحقة ───────────────────────────────────────────────────
const getEarnedBadges = (stats = {}) => {
  const {
    level              = 1,
    completedExercises = 0,
    averageProgress    = 0,
    completedPlans     = 0,
    totalProgressLogs  = 0,
    hasMaxRating       = false,
  } = stats;

  const earned = [];

  if (completedExercises >= 1)   earned.push(BADGES.FIRST_WORKOUT);
  if (averageProgress    >= 50)  earned.push(BADGES.PROGRESS_MAKER);
  if (completedPlans     >= 1)   earned.push(BADGES.PLAN_FINISHER);
  if (completedPlans     >= 5)   earned.push(BADGES.DEDICATED);
  if (level              >= 5)   earned.push(BADGES.RISING_STAR);
  if (level              >= 10)  earned.push(BADGES.ELITE);
  if (hasMaxRating)              earned.push(BADGES.COACHES_PICK);
  if (totalProgressLogs  >= 3)   earned.push(BADGES.CONSISTENT_ATHLETE);

  return earned;
};

module.exports = {
  BADGES,
  LEVEL_THRESHOLDS,
  LEVEL_TITLES,
  getLevelFromXP,
  getLevelTitle,
  getXPForNextLevel,
  calculateXP,
  getEarnedBadges,
};