const express = require('express');
const router = express.Router();

const aiPlanController = require('../controllers/aiPlanController');
const { requireAuth, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { createAIPlanSchema, feedbackSchema } = require('../validations/aiPlanValidation');

// ─── Athlete ──────────────────────────────────────────────────────────
router.post('/',
  requireAuth,
  authorize('athlete'),
  validate(createAIPlanSchema),
  aiPlanController.createPlan
);

router.delete('/:id',
  requireAuth,
  authorize('athlete'),
  aiPlanController.deletePlan
);

router.put('/:id/exercise/:exerciseId/toggle',
  
  requireAuth,
  authorize('athlete'),
  aiPlanController.toggleExercise
);

// ─── Coach ────────────────────────────────────────────────────────────
router.put('/:id/approve',
  requireAuth,
  authorize('coach'),
  aiPlanController.approvePlan
);

router.put('/:id/reject',
  requireAuth,
  authorize('coach'),
  aiPlanController.rejectPlan
);

router.put('/:id/feedback',
  requireAuth,
  authorize('coach'),
  validate(feedbackSchema),
  aiPlanController.addFeedback
);

// ─── Shared (athlete + coach + admin) ────────────────────────────────
router.get('/',   requireAuth, aiPlanController.getPlans);
router.get('/:id', requireAuth, aiPlanController.getPlanById);

module.exports = router;
