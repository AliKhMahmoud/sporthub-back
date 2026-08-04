const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { updateProfileSchema } = require('../validations/profileValidation');
const { wrapFields } = require('../middlewares/uploadMiddleware'); // استدعاء المغلف الجديد

// Protected — المستخدم نفسه
router.get('/me', requireAuth, profileController.getMyProfile);

router.put(
  '/me',
  requireAuth,
  // استقبال avatar و cover معا (بحد أقصى ملف واحد لكل منهما)
  wrapFields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  validate(updateProfileSchema), 
  profileController.updateMyProfile
);

router.get('/me/activity', requireAuth, profileController.getMyActivity);
router.put('/assign-coach', requireAuth, profileController.assigncoach);
router.put('/assign-sport', requireAuth, profileController.assignSport);

// Public — بروفايل مستخدم ثاني
router.get('/:id', profileController.getProfileById);

module.exports = router;