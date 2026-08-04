// // src/middlewares/uploadMiddleware.js
// const multer = require('multer');
// const path = require('path');

// // نخزن الملف بالـ memory مؤقتاً (buffer)
// const storage = multer.memoryStorage();

// const fileFilter = (req, file, cb) => {
//   // 1. قائمة الامتدادات المدعومة
//   const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.tiff', '.avif', '.ico', '.jfif', '.pjpeg', '.pjp'];
  
//   // 2. استخراج الامتداد من اسم الملف (بغض النظر عن mimetype)
//   const ext = path.extname(file.originalname).toLowerCase();
  
//   // 3. التحقق: إما mimetype يبدأ بـ image/ أو الامتداد في القائمة
//   const isImageMime = file.mimetype && file.mimetype.startsWith('image/');
//   const isImageExt = imageExtensions.includes(ext);
  
//   console.log('🔍 File:', {
//     originalname: file.originalname,
//     mimetype: file.mimetype,
//     ext: ext,
//     isImageMime,
//     isImageExt
//   });

//   if (isImageMime || isImageExt) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed (JPG, PNG, WEBP, GIF, SVG, BMP, TIFF, AVIF)'), false);
//   }
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB
//   },
// });

// const wrapSingle = (fieldName) => (req, res, next) => {
//   upload.single(fieldName)(req, res, (err) => {
//     if (err) {
//       console.log('❌ Multer error:', err);
//       if (err.code === 'LIMIT_FILE_SIZE') {
//         err.statusCode = 422;
//         err.message = 'Image size must not exceed 5MB';
//       } else if (err.message?.includes('Only image')) {
//         err.statusCode = 422;
//       } else {
//         err.statusCode = 400;
//       }
//       return next(err);
//     }
//     next();
//   });
// };
// const wrapFields = (fieldsArray) => (req, res, next) => {
//   upload.fields(fieldsArray)(req, res, (err) => {
//     if (err) {
//       console.log('❌ Multer fields error:', err);
//       if (err.code === 'LIMIT_FILE_SIZE') {
//         err.statusCode = 422;
//         err.message = 'Image size must not exceed 5MB';
//       } else if (err.message?.includes('Only image')) {
//         err.statusCode = 422;
//       } else {
//         err.statusCode = 400;
//       }
//       return next(err);
//     }
//     next();
//   });
// };

// // ولا تنسَ تصديره مع البقية:
// module.exports = { upload, wrapSingle, wrapFields };








// src/middlewares/uploadMiddleware.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// تهيئة Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sportshub/profiles', // المجلد في Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'],
    quality: 'auto',
    fetch_format: 'auto',
  },
});

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

module.exports = { upload, wrapSingle, wrapFields }; // ✅ صدّر wrapSingle
