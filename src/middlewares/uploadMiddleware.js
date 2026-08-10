// src/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// استخدم memoryStorage لحفظ الملف في الذاكرة (buffer)
// بعدين الـ controller برفعه لـ Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const isImageMime = file.mimetype && file.mimetype.startsWith('image/');
  const isImageExt = imageExtensions.includes(ext);

  console.log('🔍 File:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    ext: ext,
  });

  if (isImageMime || isImageExt) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const wrapFields = (fieldsArray) => (req, res, next) => {
  upload.fields(fieldsArray)(req, res, (err) => {
    if (err) {
      console.log('❌ Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        err.statusCode = 422;
        err.message = 'Image size must not exceed 5MB';
      } else if (err.message?.includes('Only image')) {
        err.statusCode = 422;
      } else {
        err.statusCode = 400;
      }
      return next(err);
    }
    next();
  });
};

const wrapSingle = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      console.log('❌ Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        err.statusCode = 422;
        err.message = 'Image size must not exceed 5MB';
      } else if (err.message?.includes('Only image')) {
        err.statusCode = 422;
      } else {
        err.statusCode = 400;
      }
      return next(err);
    }
    next();
  });
};

module.exports = { upload, wrapSingle, wrapFields };