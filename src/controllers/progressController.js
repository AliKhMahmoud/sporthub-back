const User = require('../models/User'); // ✅ ناقص هاد
const Progress = require('../models/Progress');
const Sport = require('../models/Sport');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');

class ProgressController {

  // POST /api/progress
  // المستخدم يسجل تقدم جديد
   addProgress = asyncHandler(async (req, res) => {

    const { sportId, metric, value, note, recordedAt, userId: traineeId } = req.body;

    // ✅ check sport
    const sport = await Sport.findOne({ _id: sportId, isActive: true });
    if (!sport) {
      const resp = error('Sport not found', 404);
      return res.status(resp.status).json(resp);
    }

    // ✅ FIXED: جلب المستخدم أولاً ثم التحقق
    const trainee = await User.findById(traineeId);

    if (!trainee) {
      const resp = error('User not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (!trainee.coach) {
      const resp = error('User has no assigned coach', 403);
      return res.status(resp.status).json(resp);
    }

    // if (trainee.coach.toString() !== req.user.id.toString()) {
    //   const resp = error('This user is not your trainee', 403);
    //   return res.status(resp.status).json(resp);
    // }

    const progress = await Progress.create({
      user: trainee._id,
      trackedBy: req.user.id,
      sport: sport._id,
      metric,
      value,
      note: note || null,
      recordedAt: recordedAt || Date.now(),
    });

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'ADD_PROGRESS',
      details: `Progress recorded for trainee ${trainee._id}: ${metric} = ${value} in ${sport.name}`,
    });

    logger.info('Progress added', {
      coachId: req.user.id,
      traineeId: trainee._id,
      metric,
      value
    });

    const resp = success(progress, 'Progress recorded successfully');
    return res.status(201).json({ ...resp, status: 201 });
  });


  // GET /api/progress/me?sport=slug&metric=weight
  // المستخدم يجيب كل تقدمه مع فلترة اختيارية
  getMyProgress = asyncHandler(async (req, res) => {
    const { sport: sportSlug, metric } = req.query;

    const filter = { user: req.user.id };

    if (sportSlug) {
      const sport = await Sport.findOne({ slug: sportSlug, isActive: true });
      if (!sport) {
        const resp = error('Sport not found', 404);
        return res.status(resp.status).json(resp);
      }
      filter.sport = sport._id;
    }

    if (metric) filter.metric = metric;

    const records = await Progress.find(filter)
      .populate('sport', 'name slug colorTheme')
      .select('-__v')
      .sort({ recordedAt: 1 }); // تصاعدي للرسم البياني

    const resp = success(records, 'Progress fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // GET /api/progress/sport/:sportSlug
  // جلب تقدم المستخدم أو الرياضة حسب الـ slug
  getProgressBySport = asyncHandler(async (req, res) => {
    try {
      console.log("Fetching progress for sport slug:", req.params.sportSlug);
      const { sportSlug } = req.params;

      const sport = await Sport.findOne({ slug: sportSlug, isActive: true });
      if (!sport) {
        console.log("Sport not found for slug:", sportSlug);
        const resp = error('Sport not found', 404);
        return res.status(resp.status).json(resp);
      }

      const records = await Progress.find({
        user: req.user.id,
        sport: sport._id,
      })
        .populate('sport', 'name slug colorTheme')
        .select('-__v')
        .sort({ recordedAt: 1 });

      const resp = success(records, 'Sport progress fetched successfully');
      return res.status(resp.status).json(resp);
    } catch (err) {
      console.error("ERROR in getProgressBySport:", err);
      throw err;
    }
  });

  // GET /api/progress/me/stats?sport=slug
  // إحصائيات للرسوم البيانية بالـ Profile
  getMyStats = asyncHandler(async (req, res) => {
    const { sport: sportSlug } = req.query;

    const filter = { user: req.user.id };

    if (sportSlug) {
      const sport = await Sport.findOne({ slug: sportSlug, isActive: true });
      if (!sport) {
        const resp = error('Sport not found', 404);
        return res.status(resp.status).json(resp);
      }
      filter.sport = sport._id;
    }

    // تجميع البيانات حسب الـ metric
    const stats = await Progress.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$metric',
          latest: { $last: '$value' },
          best: { $max: '$value' },
          average: { $avg: '$value' },
          count: { $sum: 1 },
          history: {
            $push: {
              value: '$value',
              recordedAt: '$recordedAt',
            },
          },
        },
      },
    ]);

    const resp = success(stats, 'Stats fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // DELETE /api/progress/:id
  // المستخدم يحذف سجل تقدمه
  deleteProgress = asyncHandler(async (req, res) => {
    const progress = await Progress.findById(req.params.id);

    if (!progress) {
      const resp = error('Progress record not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (progress.user.toString() !== req.user.id.toString()) {
      const resp = error('You are not authorized to delete this record', 403);
      return res.status(resp.status).json(resp);
    }

    await progress.deleteOne();

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE_PROGRESS',
      details: `Progress record deleted: ${progress._id}`,
    });

    const resp = success(null, 'Progress record deleted successfully');
    return res.status(resp.status).json(resp);
  });
}

module.exports = new ProgressController();
