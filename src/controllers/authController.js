const User = require('../models/User');
const Token = require('../models/Token');
const Sport = require('../models/Sport');
const mongoose = require('mongoose');
const cookieService = require('../utils/cookieService');
const passwordService = require('../utils/passwordService');
const tokenService = require('../utils/generateToken');
const generateResetToken = require('../utils/generateResetToken');
const asyncHandler = require('../utils/asyncHandler');
const sendEmail = require('../utils/sendEmail');

const cache = require('../utils/cacheService');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');

const crypto = require('crypto');

// ─── Helper Functions ──────────────────────────────────────────────────
const handleFailedLogin = async (user) => {
  user.failedLoginAttempts += 1;
  if (user.failedLoginAttempts >= 5) {
    user.isLocked = true;
    user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    logger.warn(`User locked: ${user.email}`);
  }
  await user.save();
};

const resetFailedLoginAttempts = async (user) => {
  user.failedLoginAttempts = 0;
  user.isLocked = false;
  user.lockedUntil = null;
  await user.save();
};

class AuthController {

  // ─── REGISTER ────────────────────────────────────────────────────────
  register = asyncHandler(async (req, res) => {
    const {
      name, email, password, phone, role,
      sport, age, experienceYears,
      workingDays, workingHours, certificates, bio,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const resp = error('Email already exists', 400);
      return res.status(resp.status).json(resp);
    }

    if (role === 'coach' && !sport) {
      const resp = error('Sport is required for coach', 400);
      return res.status(resp.status).json(resp);
    }

    passwordService.validatePasswordStrength(password);
    const hashedPassword = await passwordService.hashPassword(password);

    let sportId = null;
    if (role === 'coach' && sport) {
      if (mongoose.Types.ObjectId.isValid(sport)) {
        sportId = sport;
      } else {
        const sportDoc = await Sport.findOne({ 
          $or: [
            { name: { $regex: new RegExp(`^${sport}$`, 'i') } }, 
            { slug: sport.toLowerCase() }
          ] 
        });
        
        if (sportDoc) {
          sportId = sportDoc._id;
        } else {
          const resp = error('Selected sport does not exist in the database', 400);
          return res.status(resp.status).json(resp);
        }
      }
    }

    const userData = {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: role || 'athlete',
      sport: sportId,
    };

    if (role === 'coach') {
      userData.coachStatus = 'pending';
      userData.age = age || null;
      userData.experienceYears = experienceYears || null;
      userData.workingDays = workingDays || [];
      userData.workingHours = workingHours || null;
      userData.certificates = certificates || [];
      userData.bio = bio || null;
    }

    const user = await User.create(userData);

    const verifyToken = crypto.randomBytes(32).toString('hex');
    await Token.create({
      userId: user._id,
      token: verifyToken,
      type: 'emailVerify',
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    // إرسال رابط يتجه للفرونت إند للتوثيق
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${verifyToken}`;

    // 🔴 التعديل هنا: تمرير Object بدلاً من القيم المتتالية مع قالب HTML
    sendEmail({
      to: email,
      subject: 'Verify your email - SportsHub',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to SportsHub, ${name}!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          <p>Or copy and paste this link in your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        </div>
      `,
      text: `Click the link to verify your email: ${verificationUrl}`
    }).catch((err) => {
      console.error("Background email failed:", err.message);
    });

    logger.info('User registered', { userId: user._id, role: user.role });

    const message = role === 'coach'
      ? 'Registered successfully. Your account is pending admin approval.'
      : 'Registered successfully, verification email sent';

    const userResponse = user.toObject();
    delete userResponse.password;

    const resp = success(userResponse, message);
    return res.status(resp.status).json(resp);
  });

  // ─── LOGIN ────────────────────────────────────────────────────────────
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const cacheKey = `login-attempts:${email}`;
    const attempts = cache.get(cacheKey) || 0;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      cache.set(cacheKey, attempts + 1, 900);
      await createLog({
        userId: null,
        role: 'UNKNOWN',
        action: 'FAILED_LOGIN',
        details: `Login attempt with invalid email: ${email}`,
      });
      const resp = error('Invalid email or password', 401);
      return res.status(resp.status).json(resp);
    }

    if (user.isLocked && user.lockedUntil && user.lockedUntil < Date.now()) {
      user.isLocked = false;
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await user.save();
      logger.info(`User auto-unlocked: ${user.email}`);
    }

    if (user.isLocked && user.lockedUntil > Date.now()) {
      const resp = error(`Account locked until ${user.lockedUntil.toLocaleTimeString()}`, 403);
      return res.status(resp.status).json(resp);
    }

    if (attempts >= 5) {
      logger.warn('Too many login attempts', { email });
      const resp = error('Too many login attempts, try later', 429);
      return res.status(resp.status).json(resp);
    }

    const isValid = await passwordService.verifyPassword(password, user.password);
    if (!isValid) {
      cache.set(cacheKey, attempts + 1, 900);
      await handleFailedLogin(user);
      await createLog({
        userId: user._id,
        role: user.role,
        action: 'FAILED_LOGIN',
        details: 'Invalid password',
      });
      const resp = error('Invalid email or password', 401);
      return res.status(resp.status).json(resp);
    }

    if (user.role === 'coach' && user.coachStatus === 'pending') {
      const resp = error('Your account is pending admin approval', 403);
      return res.status(resp.status).json(resp);
    }

    if (user.role === 'coach' && user.coachStatus === 'rejected') {
      const resp = error('Your coach request has been rejected', 403);
      return res.status(resp.status).json(resp);
    }

    cache.clear(cacheKey);
    await resetFailedLoginAttempts(user);

    const payload = { id: user._id, role: user.role };
    const accessToken  = tokenService.genrateAccessToken(payload);
    const refreshToken = tokenService.genrateRefreshToken(payload);

    cookieService.setAccessToken(res, accessToken);
    cookieService.setRefreshToken(res, refreshToken);

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date(), isOnline: true } }
    );

    await createLog({
      userId: user._id,
      role: user.role,
      action: 'LOGIN',
      details: 'User logged in successfully',
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    const resp = success(
      userResponse,
      'Login successful'
    );
    return res.status(resp.status).json(resp);
  });

  // ─── LOGOUT ───────────────────────────────────────────────────────────
  logout = asyncHandler(async (req, res) => {
    cookieService.clearTokens(res);

    await User.updateOne(
      { _id: req.user.id },
      { $set: { isOnline: false, lastSeen: new Date() } }
    );

    await createLog({
      userId: req.user.id,
      role: req.user.role,
      action: 'LOGOUT',
      details: 'User logged out',
    });

    const resp = success(null, 'Logged out successfully');
    return res.status(resp.status).json(resp);
  });

  // ─── GET ME ───────────────────────────────────────────────────────────
  getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
      .populate('sport', 'name slug colorTheme')
      .populate('coach', 'name avatar sport')
      .select('-password -__v');

    if (!user) {
      const resp = error('User not found', 404);
      return res.status(resp.status).json(resp);
    }

    const resp = success(user, 'User fetched successfully');
    return res.status(resp.status).json(resp);
  });

  // ─── REFRESH TOKEN ────────────────────────────────────────────────────
  refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = cookieService.getRefreshToken(req);
    if (!refreshToken) {
      const resp = error('Refresh token required', 401);
      return res.status(resp.status).json(resp);
    }

    const decoded = tokenService.verifyRefreshToken(refreshToken);
    const payload = { id: decoded.id, role: decoded.role };

    cookieService.setAccessToken(res, tokenService.genrateAccessToken(payload));
    cookieService.setRefreshToken(res, tokenService.genrateRefreshToken(payload));

    const resp = success(null, 'Token refreshed');
    return res.status(resp.status).json(resp);
  });

  // ─── VERIFY EMAIL ─────────────────────────────────────────────────────
  verifyEmail = asyncHandler(async (req, res) => {
    const tokenString = req.params.token;

    const token = await Token.findOne({
      token: tokenString,
      type: 'emailVerify',
      expiresAt: { $gt: Date.now() },
    });

    if (!token) {
      const resp = error('Invalid or expired token', 400);
      return res.status(resp.status).json(resp);
    }

    await User.findByIdAndUpdate(token.userId, { isVerified: true });
    await token.deleteOne();

    await createLog({
      userId: token.userId,
      role: 'athlete',
      action: 'EMAIL_VERIFIED',
      details: 'Email verified successfully',
    });

    logger.info('Email verified', { userId: token.userId });

    const resp = success(null, 'Email verified successfully');
    return res.status(resp.status).json(resp);
  });

  // ─── FORGOT PASSWORD ──────────────────────────────────────────────────
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      const resp = error('User not found', 404);
      return res.status(resp.status).json(resp);
    }

    const { token: rawToken, hashed: hashedToken } = generateResetToken();

    await Token.create({
      userId: user._id,
      type: 'passwordReset',
      token: hashedToken,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;

    // 🔴 التعديل هنا: استخدام Object مع قالب HTML
    await sendEmail({
      to: email,
      subject: 'Reset Your Password - SportsHub',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetLink}" style="background-color: #008CBA; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>This link is valid for 15 minutes only.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
      text: `Click this link to reset your password:\n\n${resetLink}`
    });

    logger.info('Password reset requested', { userId: user._id });

    const resp = success(null, 'Password reset email sent');
    return res.status(resp.status).json(resp);
  });

  // ─── RESET PASSWORD ───────────────────────────────────────────────────
  resetPassword = asyncHandler(async (req, res) => {
    const rawToken = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const tokenDoc = await Token.findOne({
      token: hashedToken,
      type: 'passwordReset',
      expiresAt: { $gt: Date.now() },
    });

    if (!tokenDoc) {
      const resp = error('Invalid or expired token', 400);
      return res.status(resp.status).json(resp);
    }

    passwordService.validatePasswordStrength(req.body.newPassword);
    const hashedPassword = await passwordService.hashPassword(req.body.newPassword);

    await User.findByIdAndUpdate(tokenDoc.userId, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });

    await tokenDoc.deleteOne();

    await createLog({
      userId: tokenDoc.userId,
      role: 'athlete',
      action: 'PASSWORD_RESET',
      details: 'Password reset via email token',
    });

    logger.info('Password reset completed', { userId: tokenDoc.userId });

    const resp = success(null, 'Password updated successfully');
    return res.status(resp.status).json(resp);
  });

  // ─── UPDATE PASSWORD ──────────────────────────────────────────────────
  updatePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const user = await User.findById(userId).select('+password');

    const isValid = await passwordService.verifyPassword(
      req.body.currentPassword,
      user.password
    );

    if (!isValid) {
      const resp = error('Current password incorrect', 400);
      return res.status(resp.status).json(resp);
    }

    passwordService.validatePasswordStrength(req.body.newPassword);
    const hashedPassword = await passwordService.hashPassword(req.body.newPassword);

    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });

    await createLog({
      userId,
      role: req.user.role,
      action: 'UPDATE_PASSWORD',
      details: 'User updated password',
    });

    logger.info('Password updated', { userId });

    const resp = success(null, 'Password updated');
    return res.status(resp.status).json(resp);
  });
}

module.exports = new AuthController();