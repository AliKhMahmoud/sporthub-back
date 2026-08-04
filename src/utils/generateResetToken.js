const crypto = require("crypto");

const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex"); // نرسل للعميل
  const hashed = crypto.createHash("sha256").update(token).digest("hex"); // نحتفظ به في DB
  const expiresAt = Date.now() + 15 * 60 * 1000; // صلاحية 15 دقيقة

  return { token, hashed, expiresAt };
};

module.exports = generateResetToken;
