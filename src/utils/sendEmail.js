const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // <--- غيرناها لـ true واستخدمنا منفذ 465 الآمن
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
  family: 4 // <--- لتجبر السيرفر على استخدام IPv4 وتتجاوز مشكلة Render
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"SportsHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("📧 Email sent successfully");
  } catch (err) {
    console.log("❌ Email error:", err.message);
    return false; 
  }
};

module.exports = sendEmail;