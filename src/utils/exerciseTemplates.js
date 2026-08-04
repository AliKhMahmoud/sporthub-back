// src/utils/exerciseTemplates.js
const exerciseTemplates = {

  boxing: {
    beginner: [
      { name: 'Shadow Boxing',    description: 'لكمات هوائية بدون مقاومة',         sets: 3, reps: 15, restSeconds: 30 },
      { name: 'Jump Rope',        description: 'نط الحبل — 60 ثانية لكل جولة',     sets: 3, reps: 60, restSeconds: 15 },
      { name: 'Heavy Bag Basics', description: 'لكم كيس الملاكمة بتقنية أساسية',   sets: 3, reps: 20, restSeconds: 45 },
      { name: 'Footwork Drills',  description: 'تمارين حركة القدمين',               sets: 3, reps: 30, restSeconds: 20 },
      { name: 'Jab-Cross Combo',  description: 'تسلسل جاب وكروس',                  sets: 3, reps: 12, restSeconds: 30 },
      { name: 'Guard Defense',    description: 'تمارين الدفاع والحماية',            sets: 3, reps: 10, restSeconds: 30 },
    ],
    intermediate: [
      { name: 'Combination Drills',  description: 'لكمات متتالية 3-4 تسلسل',      sets: 4, reps: 20, restSeconds: 30 },
      { name: 'Speed Bag',           description: 'كيس السرعة',                    sets: 4, reps: 60, restSeconds: 15 },
      { name: 'Sparring Drills',     description: 'تمارين النزال التقني',           sets: 3, reps: 10, restSeconds: 60 },
      { name: 'Body Shots Training', description: 'لكمات على الجسم',               sets: 4, reps: 15, restSeconds: 30 },
      { name: 'Slip & Counter',      description: 'التهرب والرد',                  sets: 3, reps: 12, restSeconds: 45 },
      { name: 'Interval Rounds',     description: 'جولات متقطعة 2 دقيقة عمل',     sets: 4, reps: 1,  restSeconds: 60 },
    ],
    advanced: [
      { name: 'High Intensity Sparring',  description: 'نزال عالي الكثافة',        sets: 5, reps: 5,  restSeconds: 90 },
      { name: 'Strength & Conditioning', description: 'تقوية عامة للملاكم',        sets: 4, reps: 12, restSeconds: 45 },
      { name: 'Defensive Head Movement', description: 'حركة الرأس الدفاعية',       sets: 4, reps: 15, restSeconds: 30 },
      { name: 'Power Punching',          description: 'لكمات قوة على الكيس',       sets: 5, reps: 10, restSeconds: 60 },
      { name: 'Full Round Simulation',   description: 'محاكاة جولة كاملة',         sets: 6, reps: 1,  restSeconds: 90 },
    ],
  },

  taekwondo: {
    beginner: [
      { name: 'Basic Kicks',       description: 'ركلات أساسية: Front Kick, Roundhouse', sets: 3, reps: 20, restSeconds: 30 },
      { name: 'Stretching',        description: 'تمارين إطالة وليونة',                  sets: 3, reps: 30, restSeconds: 15 },
      { name: 'Poomsae Basic',     description: 'الكاتا الأساسية Taegeuk 1',            sets: 3, reps: 5,  restSeconds: 45 },
      { name: 'Stance Training',   description: 'تدريب على المواقف الأساسية',           sets: 3, reps: 10, restSeconds: 20 },
      { name: 'Block Drills',      description: 'تمارين الدفع والدرع',                  sets: 3, reps: 15, restSeconds: 25 },
      { name: 'Balance Exercises', description: 'تمارين التوازن على قدم وحدة',          sets: 3, reps: 30, restSeconds: 20 },
    ],
    intermediate: [
      { name: 'Advanced Kicks',    description: 'Side Kick, Hook Kick, Back Kick',  sets: 4, reps: 15, restSeconds: 30 },
      { name: 'Sparring Drills',   description: 'تمارين نزال تكتيكي',               sets: 3, reps: 10, restSeconds: 60 },
      { name: 'Poomsae Advanced',  description: 'كاتا متقدمة Taegeuk 4-5',         sets: 4, reps: 5,  restSeconds: 45 },
      { name: 'Kick Combinations', description: 'تسلسلات ركلات مركبة',             sets: 4, reps: 12, restSeconds: 40 },
      { name: 'Speed Kicking',     description: 'ركلات سرعة على الهدف',            sets: 3, reps: 20, restSeconds: 30 },
    ],
    advanced: [
      { name: 'Jump Kicks',           description: 'ركلات طيران: Flying Side Kick', sets: 4, reps: 10, restSeconds: 60  },
      { name: 'Competition Training', description: 'تدريب المنافسات الكامل',        sets: 5, reps: 5,  restSeconds: 90  },
      { name: 'Spinning Kicks',       description: 'ركلات دوران: Tornado Kick',     sets: 4, reps: 8,  restSeconds: 60  },
      { name: 'Full Sparring',        description: 'نزال كامل بالمعدات',            sets: 5, reps: 1,  restSeconds: 120 },
      { name: 'Breaking Training',    description: 'تدريب كسر الألواح',             sets: 3, reps: 5,  restSeconds: 90  },
    ],
  },

  karate: {
    beginner: [
      { name: 'Kihon Basics',     description: 'حركات كاراتيه الأساسية',          sets: 3, reps: 20, restSeconds: 30 },
      { name: 'Basic Kata',       description: 'كاتا أساسية: Heian Shodan',        sets: 3, reps: 5,  restSeconds: 45 },
      { name: 'Punch Drills',     description: 'تمارين اللكم المستقيم Tsuki',     sets: 3, reps: 15, restSeconds: 25 },
      { name: 'Block Techniques', description: 'تقنيات الدفع: Age-uke, Gedan',    sets: 3, reps: 15, restSeconds: 25 },
      { name: 'Stance Drills',    description: 'مواقف: Zenkutsu, Kiba-dachi',     sets: 3, reps: 10, restSeconds: 20 },
      { name: 'Stretching',       description: 'إطالة عامة قبل وبعد التدريب',     sets: 2, reps: 30, restSeconds: 15 },
    ],
    intermediate: [
      { name: 'Kata Practice',     description: 'كاتا متوسطة: Bassai Dai',         sets: 4, reps: 5,  restSeconds: 45 },
      { name: 'Kumite Drills',     description: 'تمارين النزال التقني',             sets: 3, reps: 10, restSeconds: 60 },
      { name: 'Kick Techniques',   description: 'ركلات: Mae-geri, Yoko-geri',      sets: 4, reps: 15, restSeconds: 30 },
      { name: 'Combination Kata',  description: 'تسلسل حركات كاتا مركبة',         sets: 4, reps: 8,  restSeconds: 40 },
      { name: 'Speed & Power',     description: 'تمارين السرعة والقوة',            sets: 3, reps: 15, restSeconds: 35 },
    ],
    advanced: [
      { name: 'Advanced Kata',       description: 'كاتا متقدمة: Unsu, Gankaku',   sets: 5, reps: 5, restSeconds: 60  },
      { name: 'Free Sparring',       description: 'Jiyu-Kumite — نزال حر',        sets: 4, reps: 5, restSeconds: 90  },
      { name: 'Breaking Techniques', description: 'تقنيات الكسر بالقوة',          sets: 3, reps: 5, restSeconds: 90  },
      { name: 'Competition Prep',    description: 'تحضير للمنافسات الكاملة',      sets: 5, reps: 3, restSeconds: 120 },
    ],
  },

  bodybuilding: {
    beginner: [
      { name: 'Bench Press',    description: 'ضغط الصدر بالبار',                  sets: 3, reps: 10, restSeconds: 60 },
      { name: 'Squat',          description: 'القرفصاء بالوزن الحر',               sets: 3, reps: 12, restSeconds: 60 },
      { name: 'Dumbbell Curl',  description: 'رفع الدمبل لثنائي الذراع',          sets: 3, reps: 12, restSeconds: 45 },
      { name: 'Lat Pulldown',   description: 'سحب العمود الفقري من الأعلى',       sets: 3, reps: 12, restSeconds: 60 },
      { name: 'Shoulder Press', description: 'ضغط الكتف بالدمبل',                 sets: 3, reps: 10, restSeconds: 60 },
      { name: 'Plank',          description: 'تمرين البلانك للبطن',                sets: 3, reps: 30, restSeconds: 30 },
    ],
    intermediate: [
      { name: 'Deadlift',        description: 'الرفعة الميتة',                     sets: 4, reps: 8,  restSeconds: 90 },
      { name: 'Incline Press',   description: 'ضغط صدر علوي مائل',                sets: 4, reps: 10, restSeconds: 60 },
      { name: 'Pull-ups',        description: 'عقلة بالوزن الزائد',                sets: 4, reps: 8,  restSeconds: 60 },
      { name: 'Leg Press',       description: 'ضغط الأرجل بالجهاز',               sets: 4, reps: 12, restSeconds: 60 },
      { name: 'Cable Rows',      description: 'سحب الكيبل للظهر',                 sets: 4, reps: 12, restSeconds: 60 },
      { name: 'Tricep Pushdown', description: 'ضغط الكيبل لثلاثي الذراع',         sets: 3, reps: 15, restSeconds: 45 },
    ],
    advanced: [
      { name: 'Heavy Deadlift',    description: 'رفعة ميتة بأوزان ثقيلة',         sets: 5, reps: 5,  restSeconds: 120 },
      { name: 'Bulgarian Split',   description: 'قرفصاء بلغارية أحادية',           sets: 4, reps: 10, restSeconds: 90  },
      { name: 'Weighted Pull-ups', description: 'عقلة بأثقال إضافية',             sets: 5, reps: 6,  restSeconds: 90  },
      { name: 'Superset Chest',    description: 'سوبرسيت صدر كامل',               sets: 4, reps: 12, restSeconds: 45  },
      { name: 'Isolation Day',     description: 'يوم عزل عضلي كامل',              sets: 5, reps: 15, restSeconds: 45  },
    ],
  },

  // ✅ slug متطابق مع الـ seed: 'cardio-fitness'
  'cardio-fitness': {
    beginner: [
      { name: 'Brisk Walking',     description: 'مشي سريع 20 دقيقة',              sets: 1, reps: 20, restSeconds: 0  },
      { name: 'Light Jogging',     description: 'ركض خفيف 10 دقائق',              sets: 2, reps: 10, restSeconds: 60 },
      { name: 'Jumping Jacks',     description: 'قفز البحر',                      sets: 3, reps: 30, restSeconds: 30 },
      { name: 'High Knees',        description: 'رفع الركب عالياً',               sets: 3, reps: 20, restSeconds: 30 },
      { name: 'Step Ups',          description: 'صعود الدرج أو الخطوة',           sets: 3, reps: 15, restSeconds: 30 },
      { name: 'Mountain Climbers', description: 'تسلق الجبل بوضع البلانك',        sets: 3, reps: 20, restSeconds: 30 },
    ],
    intermediate: [
      { name: 'Interval Running', description: 'ركض متقطع: دقيقة شديد / دقيقة خفيف', sets: 6, reps: 1,  restSeconds: 60 },
      { name: 'Burpees',          description: 'بيربيز كاملة',                        sets: 4, reps: 15, restSeconds: 45 },
      { name: 'Cycling',          description: 'ركوب دراجة 20 دقيقة',                sets: 1, reps: 20, restSeconds: 0  },
      { name: 'Jump Rope HIIT',   description: 'نط الحبل عالي الكثافة',              sets: 5, reps: 60, restSeconds: 30 },
      { name: 'Box Jumps',        description: 'قفز على الصندوق',                    sets: 4, reps: 10, restSeconds: 45 },
    ],
    advanced: [
      { name: 'Sprint Intervals',    description: 'جري سريع 30 ثانية / راحة 30 ثانية', sets: 10, reps: 1,  restSeconds: 30 },
      { name: 'HIIT Full Body',      description: 'تمرين كامل عالي الكثافة 30 دقيقة',  sets: 1,  reps: 30, restSeconds: 0  },
      { name: 'Long Run',            description: 'ركض مستمر 5-10 كيلو',               sets: 1,  reps: 45, restSeconds: 0  },
      { name: 'Tabata Circuits',     description: 'دوائر تابيتا 4 دقائق',              sets: 8,  reps: 20, restSeconds: 10 },
      { name: 'Plyometric Training', description: 'تمارين بليومترية متقدمة',           sets: 5,  reps: 12, restSeconds: 60 },
    ],
  },

};

const getLevelFromWeeks = (durationWeeks) => {
  if (durationWeeks <= 4) return 'beginner';
  if (durationWeeks <= 8) return 'intermediate';
  return 'advanced';
};

const generateExercises = (sportSlug, level, durationWeeks) => {
  const sportTemplates = exerciseTemplates[sportSlug];

  if (!sportTemplates) {
    return [
      { name: 'Warm Up',   description: 'إحماء عام 5-10 دقائق',       sets: 2, reps: 10, restSeconds: 30, completed: false },
      { name: 'Main Work', description: 'تمرين رئيسي حسب الرياضة',    sets: 3, reps: 12, restSeconds: 45, completed: false },
      { name: 'Cool Down', description: 'تهدئة وإطالة 5 دقائق',       sets: 2, reps: 10, restSeconds: 30, completed: false },
    ];
  }

  const pool = sportTemplates[level] || sportTemplates.beginner;

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const count = Math.min(
    pool.length,
    durationWeeks <= 4 ? 3 : durationWeeks <= 8 ? 4 : 5
  );

  return shuffled.slice(0, count).map(ex => ({
    name:        ex.name,
    description: ex.description,
    sets:        ex.sets,
    reps:        ex.reps,
    restSeconds: ex.restSeconds,
    completed:   false,
  }));
};

module.exports = { exerciseTemplates, generateExercises, getLevelFromWeeks };