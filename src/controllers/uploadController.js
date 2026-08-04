// src/controllers/uploadController.js
const cloudinary = require('../config/cloudinaryConfig');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { success, error } = require('../utils/responseService');
const { createLog } = require('../utils/ActivityLog');

// يحوّل الـ buffer (من multer) إلى stream ويرفعه لـ Cloudinary
const streamUpload = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,                       // مثلاً: 'sportshub/avatars'
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

class UploadController {

  // POST /api/upload/avatar
  // Auth — يرفع صورة شخصية ويحدّث avatar بالـ User
  uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
      const resp = error('No image file provided', 422);
      return res.status(resp.status).json(resp);
    }

    const result = await streamUpload(req.file.buffer, 'sportshub/avatars');

    // احذف الصورة القديمة من Cloudinary لو موجودة (تنظيف)
    const user = await User.findById(req.user.id).select('avatar');
    if (user.avatar) {
      const oldPublicId = extractPublicId(user.avatar, 'sportshub/avatars');
      if (oldPublicId) {
        cloudinary.uploader.destroy(oldPublicId).catch(err =>
          logger.error('Failed to delete old avatar', { error: err.message })
        );
      }
    }

    await User.findByIdAndUpdate(req.user.id, { avatar: result.secure_url });

    await createLog({
      userId:  req.user.id,
      role:    req.user.role,
      action:  'UPLOAD_AVATAR',
      details: 'User uploaded a new avatar',
    });

    logger.info('Avatar uploaded', { userId: req.user.id, url: result.secure_url });

    const resp = success({ avatar: result.secure_url }, 'Avatar uploaded successfully');
    return res.status(resp.status).json(resp);
  });

  // POST /api/upload/cover
  // Auth — يرفع صورة غلاف ويحدّث cover بالـ User
  uploadCover = asyncHandler(async (req, res) => {
    if (!req.file) {
      const resp = error('No image file provided', 422);
      return res.status(resp.status).json(resp);
    }

    const result = await streamUpload(req.file.buffer, 'sportshub/covers');

    const user = await User.findById(req.user.id).select('cover');
    if (user.cover) {
      const oldPublicId = extractPublicId(user.cover, 'sportshub/covers');
      if (oldPublicId) {
        cloudinary.uploader.destroy(oldPublicId).catch(err =>
          logger.error('Failed to delete old cover', { error: err.message })
        );
      }
    }

    await User.findByIdAndUpdate(req.user.id, { cover: result.secure_url });

    await createLog({
      userId:  req.user.id,
      role:    req.user.role,
      action:  'UPLOAD_COVER',
      details: 'User uploaded a new cover image',
    });

    logger.info('Cover uploaded', { userId: req.user.id, url: result.secure_url });

    const resp = success({ cover: result.secure_url }, 'Cover uploaded successfully');
    return res.status(resp.status).json(resp);
  });
}

// يستخرج public_id من رابط Cloudinary عشان نحذف الصورة القديمة
// مثال رابط: https://res.cloudinary.com/xxx/image/upload/v123/sportshub/avatars/abc123.jpg
// public_id المطلوب: sportshub/avatars/abc123
const extractPublicId = (url, folder) => {
  try {
    const regex = new RegExp(`${folder}/([^./]+)`);
    const match = url.match(regex);
    return match ? `${folder}/${match[1]}` : null;
  } catch {
    return null;
  }
};

module.exports = new UploadController();
