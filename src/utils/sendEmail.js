const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
  family: 4, 
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