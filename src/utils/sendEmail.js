const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,        // ✅ من env
  port: parseInt(process.env.EMAIL_PORT), // ✅ 587 من env
  secure: false, // ✅ false للـ port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
  family: 4
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
  } catch (err) {
    console.error("❌ Email error:", err.message);
    return false; 
  }
};

module.exports = sendEmail;