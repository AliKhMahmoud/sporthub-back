const TrainingRequest = require('../models/TrainingRequest');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');
const { createNotification } = require('../utils/notificationService');

class TrainingRequestController {

  sendRequest = asyncHandler(async (req, res) => {
    const { coachId, message } = req.body;
    const athleteId = req.user.id;

    // تأكد إنو المدرب موجود ومعتمد
    const coach = await User.findOne({
      _id: coachId,
      role: 'coach',
      coachStatus: 'approved',
      isActive: true,
    });

    if (!coach) {
      const resp = error('Coach not found or not approved', 404);
      return res.status(resp.status).json(resp);
    }

    // منع إرسال طلب لنفس المدرب مرتين
    const existingRequest = await TrainingRequest.findOne({
      athlete: athleteId,
      coach: coachId,
      status: 'pending',
    });

    if (existingRequest) {
      const resp = error('You already sent a request to this coach', 400);
      return res.status(resp.status).json(resp);
    }

    // منع إرسال طلب لو عنده مدرب مقبول مع نفس الكوتش
    const acceptedRequest = await TrainingRequest.findOne({
      athlete: athleteId,
      coach: coachId,
      status: 'accepted',
    });

    if (acceptedRequest) {
      const resp = error('You are already training with this coach', 400);
      return res.status(resp.status).json(resp);
    }

    // جلب الرياضة من الـ coach
    const request = await TrainingRequest.create({
      athlete: athleteId,
      coach: coachId,
      sport: coach.sport,
      message: message || null,
    });

    await createNotification({
      userId: request.coach,
      type: 'TRAINING_REQUEST_RECEIVED',
      title: 'New Training Request',
      message: `You have a new training request from ${req.user.name || 'an athlete'}.`,
      link: '/training-requests',
    });

    await createLog({
      userId: athleteId,
      role: req.user.role,
      action: 'SEND_TRAINING_REQUEST',
      details: `Athlete sent training request to coach: ${coach.name}`,
    });

    logger.info('Training request sent', { athleteId, coachId });

    const resp = success(request, 'Training request sent successfully');
    return res.status(201).json({ ...resp, status: 201 });
  });

  getMyRequests = asyncHandler(async (req, res) => {
    const requests = await TrainingRequest.find({ athlete: req.user.id })
      .populate('coach', 'name avatar coachSport experienceYears')
      .populate('sport', 'name slug colorTheme')
      .select('-__v')
      .sort({ createdAt: -1 });

    const resp = success(requests, 'Requests fetched successfully');
    return res.status(resp.status).json(resp);
  });

  getCoachRequests = asyncHandler(async (req, res) => {
    const { status } = req.query;

    const filter = { coach: req.user.id };
    if (status) filter.status = status;

    const requests = await TrainingRequest.find(filter)
      .populate('athlete', 'name avatar sport')
      .populate('sport', 'name slug colorTheme')
      .select('-__v')
      .sort({ createdAt: -1 });

    const resp = success(requests, 'Requests fetched successfully');
    return res.status(resp.status).json(resp);
  });

  acceptRequest = asyncHandler(async (req, res) => {
    const request = await TrainingRequest.findOne({
      _id: req.params.id,
      coach: req.user.id,
      status: 'pending',
    });

    if (!request) {
      const resp = error('Request not found or already processed', 404);
      return res.status(resp.status).json(resp);
    }

    request.status = 'accepted';
    await request.save();

    await createNotification({
      userId: request.athlete,
      type: 'TRAINING_REQUEST_ACCEPTED',
      title: 'Training Request Accepted',
      message: 'Your training request has been accepted by the coach!',
      link: '/profile',
    });

    // تحديث الـ athlete — ربطه بالمدرب
    await User.findByIdAndUpdate(request.athlete, {
      coach: req.user.id,
    });

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'ACCEPT_TRAINING_REQUEST',
      details: `Coach accepted training request from athlete: ${request.athlete}`,
    });

    logger.info('Training request accepted', {
      requestId: request._id,
      coachId: req.user.id,
      athleteId: request.athlete,
    });

    const resp = success(request, 'Training request accepted');
    return res.status(resp.status).json(resp);
  });

  rejectRequest = asyncHandler(async (req, res) => {
    const { reason } = req.body; 
    
    const request = await TrainingRequest.findOne({
        _id: req.params.id,
        coach: req.user.id,
        status: 'pending',
    });

    if (!request) {
        const resp = error('Request not found or already processed', 404);
        return res.status(resp.status).json(resp);
    }

    request.status = 'rejected';
    request.rejectionReason = reason || null; // ✅ سبب الرفض
    request.rejectedAt = new Date(); // ✅ وقت الرفض
    await request.save();

    await createNotification({
      userId: request.athlete,
      type: 'TRAINING_REQUEST_REJECTED',
      title: 'Training Request Rejected',
      message: 'Your training request has been rejected by the coach.',
      link: '/coaches',
    });

    await createLog({
        userId: req.user.id,
        role: req.user.role,
        action: 'REJECT_TRAINING_REQUEST',
        details: `Coach rejected training request from athlete: ${request.athlete}. Reason: ${reason || 'No reason provided'}`,
    });

    logger.info('Training request rejected', {
        requestId: request._id,
        coachId: req.user.id,
        athleteId: request.athlete,
        reason: reason || null,
    });

    const resp = success(request, 'Training request rejected');
    return res.status(resp.status).json(resp);
    });
}

module.exports = new TrainingRequestController();