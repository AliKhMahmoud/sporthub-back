const express = require('express');
const router  = express.Router();
const coachController = require('../controllers/coachController');

// كلها عامة — ما تحتاج تسجيل دخول
router.get('/',     coachController.getCoaches);
router.get('/:id',  coachController.getCoachById);

module.exports = router;
