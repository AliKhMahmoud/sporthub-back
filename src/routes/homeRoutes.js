const express = require('express');
const router  = express.Router();
const homeController = require('../controllers/homeController');

// عام بالكامل — صفحة landing
router.get('/', homeController.getHomeStats);

module.exports = router;
