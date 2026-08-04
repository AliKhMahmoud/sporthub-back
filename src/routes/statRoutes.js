// src/routes/statRoutes.js
const express    = require('express');
const router     = express.Router();
const statController = require('../controllers/statController');
const { requireAuth } = require('../middlewares/authMiddleware');

// GET /api/stats/me       ← إحصائياتي الكاملة (XP + Level + Badges + Activity)
router.get('/me',       requireAuth, statController.getMyStats);

// GET /api/stats/:userId  ← إحصائيات أي مستخدم (عام)
router.get('/:userId',  requireAuth, statController.getUserStats);

module.exports = router;
