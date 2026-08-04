const express = require('express');
const router = express.Router();

const sportController = require('../controllers/sportController');
const { requireAuth, authorize } = require('../middlewares/authMiddleware');

// Public
router.get('/', sportController.getAllSports);
router.get('/:id', sportController.getSportById);

// Protected
router.put(
  '/:id',
  requireAuth,
  authorize('admin', 'publisher')
  ,
  sportController.updateSport
);

router.delete(
  '/:id',
  requireAuth,
  authorize('admin'),
  sportController.deleteSport
);

module.exports = router;