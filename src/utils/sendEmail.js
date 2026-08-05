const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,        // ✅ استخدم 465 (أكثر أماناً)
  secure: true,     // ✅ true للـ 465
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