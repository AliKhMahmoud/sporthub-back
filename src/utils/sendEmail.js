const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // يجب أن تكون false مع المنفذ 587
  family: 4,     // 🔑 هذا هو الحل: الإجبار على استخدام IPv4 فقط وتجاهل IPv6
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // يمنع مشاكل الشهادات مع Render
  },
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