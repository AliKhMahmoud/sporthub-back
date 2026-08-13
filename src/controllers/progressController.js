const User = require('../models/User');
const Progress = require('../models/Progress');
const Sport = require('../models/Sport');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');

class ProgressController {

  // POST /api/progress
  // الكوتش يسجل تقدم لمتدرب تابع له
  addProgress = asyncHandler(async (req, res) => {
    const { sportId, metric, value, note, recordedAt, userId: traineeId } = req.body;

    // ✅ check sport
    const sport = await Sport.findOne({ _id: sportId, isActive: true });
    if (!sport) {
      const resp = error('Sport not found', 404);
      return res.status(resp.status).json(resp);
    }

    // ✅ جلب المستخدم والتحقق
    const trainee = await User.findById(traineeId);

    if (!trainee) {
      const resp = error('User not found', 404);
      return res.status(resp.status).json(resp);
    }

    if (!trainee.coach) {
      const resp = error('User has no assigned coach', 403);
      return res.status(resp.status).json(resp);
    }

    // ✅ تم إعادة تفعيل الشرط مع إعطاء صلاحية للـ Admin إذا احتاج الإضافة
    if (trainee.coach.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      const resp = error('This user is not assigned to you', 403);
      return res.status(resp.status).json(resp);
    }

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
      value,
    });

    const resp = success(progress, 'Progress recorded successfully');
    return res.status(201).json({ ...resp, status: 201 });
  });

  // GET /api/progress
  getAllTraineesProgress = asyncHandler(async (req, res) => {
    // 1. جلب كل المستخدمين (المتدربين) التابعين لهذا الكوتش
    const trainees = await User.find({ coach: req.user.id }).select('_id');
    const traineeIds = trainees.map((t) => t._id);

    // 2. جلب كل سجلات التقدم الخاصة بهؤلاء المتدربين
    const records = await Progress.find({ user: { $in: traineeIds } })
      .populate('user', 'name email avatar')
      .populate('sport', 'name slug colorTheme')
      .populate('trackedBy', 'name role')
      .select('-__v')
      .sort({ recordedAt: -1 });

    const resp = success(records, 'All trainees progress fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // GET /api/progress/me?sport=slug&metric=weight
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
      .sort({ recordedAt: 1 });

    const resp = success(records, 'Progress fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // GET /api/progress/trainee/:traineeId
  getProgressByTrainee = asyncHandler(async (req, res) => {
    const { traineeId } = req.params;

    const trainee = await User.findOne({ _id: traineeId, coach: req.user.id });
    if (!trainee) {
      const resp = error('Trainee not found or not assigned to you', 404);
      return res.status(resp.status).json(resp);
    }

    const records = await Progress.find({ user: traineeId })
      .populate('sport', 'name slug colorTheme')
      .populate('trackedBy', 'name role')
      .select('-__v')
      .sort({ recordedAt: 1 });

    const resp = success(records, 'Trainee progress fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // GET /api/progress/me/stats?sport=slug
  getMyStats = asyncHandler(async (req, res) => {
    const { sport: sportSlug } = req.query;

    // ✅ تم تحويل الـ user.id لـ ObjectId صراحة ليعمل مع aggregate
    const filter = { user: new mongoose.Types.ObjectId(req.user.id) };

    if (sportSlug) {
      const sport = await Sport.findOne({ slug: sportSlug, isActive: true });
      if (!sport) {
        const resp = error('Sport not found', 404);
        return res.status(resp.status).json(resp);
      }
      // ✅ تم تحويل sport._id أيضاً لـ ObjectId
      filter.sport = new mongoose.Types.ObjectId(sport._id);
    }

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
  deleteProgress = asyncHandler(async (req, res) => {
    const progress = await Progress.findById(req.params.id);

    if (!progress) {
      const resp = error('Progress record not found', 404);
      return res.status(resp.status).json(resp);
    }

    const isOwner = progress.user.toString() === req.user.id.toString();
    const isTrackerCoach =
      progress.trackedBy && progress.trackedBy.toString() === req.user.id.toString();

    if (!isOwner && !isTrackerCoach) {
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