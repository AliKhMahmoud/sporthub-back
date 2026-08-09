const express = require('express');
const router = express.Router();

const progressController = require('../controllers/progressController');
const { requireAuth,authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { addProgressSchema } = require('../validations/progressValidation');

// للمتدرب نفسه
router.get('/me', requireAuth, authorize('athlete'), progressController.getMyProgress);
router.get('/me/stats', requireAuth, authorize('athlete'), progressController.getMyStats);

// للكوتش
router.post('/', requireAuth, validate(addProgressSchema), progressController.addProgress);
router.get('/', requireAuth, authorize('coach'), progressController.getAllTraineesProgress);
router.get('/trainee/:traineeId', requireAuth, authorize('coach'), progressController.getProgressByTrainee);

router.delete('/:id', requireAuth, progressController.deleteProgress);
module.exports = router;
