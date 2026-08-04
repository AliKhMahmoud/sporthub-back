const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} = require('../validations/authValidation');

// Public
router.post('/register',       validate(registerSchema),       authController.register);
router.post('/login',          validate(loginSchema),          authController.login);
router.get('/verify-email/:token',                             authController.verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), authController.resetPassword);
router.post('/refresh-token',                                  authController.refreshToken);

// Protected
router.get('/me',              requireAuth,                    authController.getMe);
router.post('/logout',         requireAuth,                    authController.logout);
router.put('/update-password', requireAuth, validate(updatePasswordSchema), authController.updatePassword);

module.exports = router;