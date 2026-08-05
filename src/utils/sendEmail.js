const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
  // فرض استخدام IPv4 وحل مشاكل الاتصال
  family: 4,
  tls: {
    rejectUnauthorized: false // لتجنب مشاكل الشهادات الوهمية أو قيود الشبكة المؤقتة
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    console.log("📧 Sending email to:", to);
    
    await transporter.sendMail({
      from: `"SportsHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: text,
    });

    console.log("✅ Email sent successfully");
    return true;
  } catch (err) {
    console.error("❌ Email error:", err.message);
    return false; 
  }
};

module.exports = sendEmail;