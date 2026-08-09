const express = require('express');
const router = express.Router();

const planController = require('../controllers/planController');
const { requireAuth, authorize } = require('../middlewares/authMiddleware');

// Get all plan
router.get('/', planController.getPlans);


// Create plan
router.post('/', requireAuth, authorize('coach'), planController.createPlan);

// Get plan by ID
router.get('/:id', planController.getPlanById);

// Update plan
router.put('/:id', requireAuth, authorize('admin','coach'), planController.updatePlan);

// Delete plan
router.delete('/:id', requireAuth, authorize('admin','coach'), planController.deletePlan);

module.exports = router;