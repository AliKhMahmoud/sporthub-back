const cloudinary = require('cloudinary').v2;

// تهيئة Cloudinary من متغيرات البيئة
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// تحقق من التهيئة
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️ CLOUDINARY_CLOUD_NAME is not set in environment variables');
}

if (!process.env.CLOUDINARY_API_KEY) {
  console.warn('⚠️ CLOUDINARY_API_KEY is not set in environment variables');
}

if (!process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️ CLOUDINARY_API_SECRET is not set in environment variables');
}

// تصدير Cloudinary بعد التهيئة
module.exports = cloudinary;