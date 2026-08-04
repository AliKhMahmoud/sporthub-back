// src/utils/badgeService.js
// منطق منح الشارات — كل شارة عندها شرط واضح

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
    name:        "Coach's Pick",
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
const getLevelFromXP = (xp) => {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
};

const getLevelTitle = (level) => LEVEL_TITLES[level] || 'Legend';

const getXPForNextLevel = (currentLevel) => {
  return LEVEL_THRESHOLDS[currentLevel] || null; // null = max level
};

// ─── حساب XP من الإحصائيات ───────────────────────────────────────────────────
/**
 * @param {Object} stats
 * @param {number} stats.completedPlans      - خطط مكتملة (progress = 100)
 * @param {number} stats.totalProgressLogs   - عدد سجلات التقدم
 * @param {number} stats.totalPlanComments   - تعليقات المدرب على الخطط
 * @param {number} stats.numberOfRatedPlans  - خطط حصلت على تقييم
 * @param {number} stats.receivedLikes       - إعجابات على المنشورات
 * @param {number} stats.receivedComments    - تعليقات على المنشورات
 * @param {number} stats.completedExercises  - إجمالي التمارين المكتملة
 */
const calculateXP = (stats) => {
  const {
    completedPlans      = 0,
    totalProgressLogs   = 0,
    totalPlanComments   = 0,
    numberOfRatedPlans  = 0,
    receivedLikes       = 0,
    receivedComments    = 0,
    completedExercises  = 0,
  } = stats;

  return (
    completedExercises  * 10  +   // كل تمرين مكتمل
    completedPlans      * 50  +   // كل خطة مكتملة
    totalProgressLogs   * 5   +   // كل سجل تقدم
    totalPlanComments   * 5   +   // تعليقات المدرب
    numberOfRatedPlans  * 10  +   // خطط مُقيَّمة
    receivedLikes       * 2   +   // إعجابات
    receivedComments    * 3       // تعليقات
  );
};

// ─── تحديد الشارات المستحقة ───────────────────────────────────────────────────
/**
 * @param {Object} stats — نفس object الـ calculateXP + حقول إضافية
 * @param {number} stats.level               - المستوى الحالي
 * @param {number} stats.completedExercises  - إجمالي التمارين المكتملة
 * @param {number} stats.averageProgress     - متوسط التقدم (0-100)
 * @param {number} stats.completedPlans
 * @param {boolean} stats.hasMaxRating       - هل عنده تقييم 5 نجوم
 */
const getEarnedBadges = (stats) => {
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
  if (hasMaxRating)               earned.push(BADGES.COACHES_PICK);
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
