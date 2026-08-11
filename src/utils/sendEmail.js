const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // استخدام SSL/TLS على المنفذ 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password من حساب جوجل
  },
  family: 4, // اجبار استخدام IPv4
});

// التحقق من صحة الإعدادات عند تشغيل السيرفر
transporter.verify((error) => {
  if (error) {
    console.error("❌ Nodemailer Transport Error:", error.message);
  } else {
    console.log("🚀 Email service is ready to send messages");
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    console.log("📧 Sending email to:", to);

    const info = await transporter.sendMail({
      from: `"SportsHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || "", // النص العادي كبديل
      html: html || text, // محتوى الـ HTML
    });

    console.log("✅ Email sent successfully ID:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ Email error:", err.message);
    return false;
  }
};

module.exports = sendEmail;