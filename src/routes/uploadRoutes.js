// src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();

const uploadController = require('../controllers/uploadController');
const { wrapSingle } = require('../middlewares/uploadMiddleware');
const { requireAuth } = require('../middlewares/authMiddleware');

// Form-data field name لازم يكون 'image' بالطلب
router.post('/avatar', requireAuth, wrapSingle('image'), uploadController.uploadAvatar);
router.post('/cover',  requireAuth, wrapSingle('image'), uploadController.uploadCover);

module.exports = router;
