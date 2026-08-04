const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const TrainingRequest = require('../models/TrainingRequest');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createNotification } = require('../utils/notificationService');

class ChatController {

  // POST /api/conversations
  // إنشاء أو جلب محادثة موجودة — بشرط وجود TrainingRequest حالته accepted
  // Body: { coachId } لو athlete، أو { athleteId } لو coach
  startConversation = asyncHandler(async (req, res) => {
    const { coachId, athleteId } = req.body;

    let athlete, coach;

    if (req.user.role === 'athlete') {
      if (!coachId) {
        const resp = error('coachId is required', 422);
        return res.status(resp.status).json(resp);
      }
      athlete = req.user.id;
      coach = coachId;

    } else if (req.user.role === 'coach') {
      if (!athleteId) {
        const resp = error('athleteId is required', 422);
        return res.status(resp.status).json(resp);
      }
      athlete = athleteId;
      coach = req.user.id;

    } else {
      const resp = error('Only athletes and coaches can start a conversation', 403);
      return res.status(resp.status).json(resp);
    }

    // ✅ الشرط الأساسي — لازم يكون في طلب تدريب accepted بين الطرفين
    const acceptedRequest = await TrainingRequest.findOne({
      athlete,
      coach,
      status: 'accepted',
    });

    if (!acceptedRequest) {
      const resp = error(
        'Chat is only available after the coach accepts a training request',
        403
      );
      return res.status(resp.status).json(resp);
    }

    // جلب المحادثة لو موجودة، أو إنشاء وحدة جديدة
    let conversation = await Conversation.findOne({ athlete, coach });

    if (!conversation) {
      conversation = await Conversation.create({ athlete, coach });
      logger.info('Conversation created', { conversationId: conversation._id, athlete, coach });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate('athlete', 'name avatar isOnline lastSeen')
      .populate('coach', 'name avatar isOnline lastSeen');

    const resp = success(populated, 'Conversation ready');
    return res.status(resp.status).json(resp);
  });

  // GET /api/conversations
  // كل محادثاتي (athlete أو coach)
  getMyConversations = asyncHandler(async (req, res) => {
    const filter = req.user.role === 'coach'
      ? { coach: req.user.id }
      : { athlete: req.user.id };

    const conversations = await Conversation.find(filter)
      .populate('athlete', 'name avatar isOnline lastSeen')
      .populate('coach', 'name avatar isOnline lastSeen')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    // عدد الرسائل غير المقروءة لكل محادثة
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user.id },
          read: false,
        });
        return { ...conv.toObject(), unreadCount };
      })
    );

    const resp = success(withUnread, 'Conversations fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // GET /api/messages/:conversationId
  // رسائل محادثة معينة + تعليمها كمقروءة
  getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const resp = error('Conversation not found', 404);
      return res.status(resp.status).json(resp);
    }

    // تأكد إنو المستخدم طرف بالمحادثة
    const isParticipant =
      conversation.athlete.toString() === req.user.id.toString() ||
      conversation.coach.toString() === req.user.id.toString();

    if (!isParticipant) {
      const resp = error('Not authorized to view this conversation', 403);
      return res.status(resp.status).json(resp);
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    // علّم رسائل الطرف الآخر كمقروءة
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user.id }, read: false },
      { read: true, readAt: new Date() }
    );

    const resp = success(messages, 'Messages fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // POST /api/messages
  // إرسال رسالة — Body: { conversationId, content }
  sendMessage = asyncHandler(async (req, res) => {
    const { conversationId, content } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const resp = error('Conversation not found', 404);
      return res.status(resp.status).json(resp);
    }

    const isParticipant =
      conversation.athlete.toString() === req.user.id.toString() ||
      conversation.coach.toString() === req.user.id.toString();

    if (!isParticipant) {
      const resp = error('Not authorized to send messages in this conversation', 403);
      return res.status(resp.status).json(resp);
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      content,
    });

    // تحديث آخر رسالة بالمحادثة (للقراءة السريعة بقائمة المحادثات)
    conversation.lastMessage   = content;
    conversation.lastMessageAt = new Date();
    conversation.lastMessageBy = req.user.id;
    await conversation.save();

    // إشعار للطرف الآخر
    const recipientId =
      conversation.athlete.toString() === req.user.id.toString()
        ? conversation.coach
        : conversation.athlete;

    await createNotification({
      userId:  recipientId,
      type:    'NEW_MESSAGE',
      title:   'New message',
      message: `${req.user.name || 'Someone'} sent you a message`,
      link:    `/messages/${conversation._id}`,
    });

    const populated = await Message.findById(message._id).populate('sender', 'name avatar');

    const resp = success(populated, 'Message sent successfully');
    return res.status(201).json({ ...resp, status: 201 });
  });
}

module.exports = new ChatController();
