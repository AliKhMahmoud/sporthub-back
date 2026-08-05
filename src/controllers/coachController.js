const User = require('../models/User');
const TrainingRequest = require('../models/TrainingRequest');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/responseService');

class CoachController {


  getCoaches = asyncHandler(async (req, res) => {
    const { sport } = req.query;

    const filter = {
      role:        'coach',
      coachStatus: 'approved',
      isActive:    true,
    };

    if (sport) {
      const Sport = require('../models/Sport');
      const mongoose = require('mongoose');

      let sportDoc;
      // نتحقق إذا كان ما تم إرساله هو ObjectId حقيقي أو slug نصي
      if (mongoose.Types.ObjectId.isValid(sport)) {
        sportDoc = await Sport.findOne({ _id: sport, isActive: true }).select('_id');
      } else {
        sportDoc = await Sport.findOne({ slug: sport, isActive: true }).select('_id');
      }

      if (!sportDoc) {
        const resp = success([], 'No coaches found for this sport');
        return res.status(resp.status).json(resp);
      }
      
      // ✅ البحث في كلا الحقلين (sport و coachSport) لضمان جلب جميع المدربين بغض النظر عن اختلاف تسمية الحقل في الداتا بيز
      filter.$or = [
        { sport: sportDoc._id },
        { coachSport: sportDoc._id }
      ];
    }

    const coaches = await User.find(filter)
      .select('name avatar bio cover sport coachSport age experienceYears workingDays workingHours certificates isOnline lastSeen createdAt')
      .populate('sport', 'name slug colorTheme')
      .populate('coachSport', 'name slug colorTheme')
      .sort({ experienceYears: -1 });

    const resp = success(coaches, 'Coaches fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // GET /api/coaches/:id
  // Public — تفاصيل مدرب وحد + إحصائياته
  getCoachById = asyncHandler(async (req, res) => {
    const coach = await User.findOne({
      _id:         req.params.id,
      role:        'coach',
      coachStatus: 'approved',
      isActive:    true,
    })
      .select('name avatar bio cover sport age experienceYears workingDays workingHours certificates isOnline lastSeen createdAt')
      .populate('sport', 'name slug colorTheme');

    if (!coach) {
      const resp = error('Coach not found', 404);
      return res.status(resp.status).json(resp);
    }

    // إحصائيات سريعة
    const totalTrainees = await TrainingRequest.countDocuments({
      coach:  coach._id,
      status: 'accepted',
    });

    const totalRequests = await TrainingRequest.countDocuments({
      coach: coach._id,
    });

    const resp = success({
      ...coach.toObject(),
      stats: {
        totalTrainees,
        totalRequests,
      },
    }, 'Coach fetched successfully');

    return res.status(resp.status).json(resp);
  });
}

module.exports = new CoachController();