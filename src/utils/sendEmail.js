const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,            // 🔑 التغيير هنا: استخدام 587 بدلاً من 465
  secure: false,        // 🔑 تجعلها false لأن المنفذ 587 يترقى لـ TLS تلقائياً
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: true, // الحفاظ على أمان الاتصال
  },
});

// التحقق من صحة الاتصال عند التشغيل
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
      text: text || "",
      html: html || text,
    });

    console.log("✅ Email sent successfully ID:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ Email error:", err.message);
    return false;
  }
};

module.exports = sendEmail;