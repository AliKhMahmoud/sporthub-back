const express = require('express');
const router = express.Router();

const trainingRequestController = require('../controllers/trainingRequestController');
const { requireAuth, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { sendRequestSchema } = require('../validations/trainingRequestValidation');

// Athlete — يرسل طلب
router.post('/', requireAuth, authorize('athlete'), validate(sendRequestSchema), trainingRequestController.sendRequest);

// Athlete — يشوف طلباته
router.get('/my', requireAuth, authorize('athlete'), trainingRequestController.getMyRequests);

// Coach — يشوف الطلبات الواردة
router.get('/coach', requireAuth, authorize('coach'), trainingRequestController.getCoachRequests);

// Coach — يقبل أو يرفض
router.put('/:id/accept', requireAuth, authorize('coach'), trainingRequestController.acceptRequest);
router.put('/:id/reject', requireAuth, authorize('coach'), trainingRequestController.rejectRequest);

module.exports = router;