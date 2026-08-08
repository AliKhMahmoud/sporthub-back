const express = require('express');
const router = express.Router();

const progressController = require('../controllers/progressController');
const { requireAuth,authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { addProgressSchema } = require('../validations/progressValidation');

// كلها محمية — لازم تكون مسجل
router.post('/', requireAuth, authorize('coach'), validate(addProgressSchema), progressController.addProgress);
router.get('/me', requireAuth, progressController.getMyProgress);
router.get('/me/stats', requireAuth, progressController.getMyStats);
router.delete('/:id', requireAuth, progressController.deleteProgress);
module.exports = router;
