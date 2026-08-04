const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { startConversationSchema, sendMessageSchema } = require('../validations/chatValidation');

// كلها محمية — لازم تكون مسجل دخول
router.post('/conversations',           requireAuth, validate(startConversationSchema), chatController.startConversation);
router.get('/conversations',            requireAuth, chatController.getMyConversations);
router.get('/messages/:conversationId', requireAuth, chatController.getMessages);
router.post('/messages',                requireAuth, validate(sendMessageSchema), chatController.sendMessage);

module.exports = router;
