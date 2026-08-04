require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const app = express();

// Middlewares
 const xssSanitize = require("./src/middlewares/xssMiddleware");
 const { apiLimiter } = require("./src/middlewares/limiter");
 const notFound = require("./src/middlewares/notFoundMiddleware");


// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security
 app.use(helmet());

// // CORS
 app.use(
   cors({
     origin: [
      process.env.CLIENT_URL,
      
      "https://sporthub-orcin.vercel.app"

    ],
     credentials: true,
   })
 );

// ROUTES
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/training-requests',require('./src/routes/trainingRequestRoutes'));
app.use('/api/notifications',require('./src/routes/notificationRoutes'))
app.use('/api/sports', require('./src/routes/sportRoutes'));
app.use('/api/plans', require('./src/routes/planRoutes'));
app.use('/api/posts',    require('./src/routes/postRoutes'));
app.use('/api/comments', require('./src/routes/commentRoutes'));
app.use('/api/profile', require('./src/routes/profileRoutes'));
app.use('/api/progress', require('./src/routes/progressRoutes'));
app.use('/api/ai-plans', require('./src/routes/aiPlanRoutes'));
app.use('/api/stats', require('./src/routes/statRoutes'));
app.use('/api/coaches', require('./src/routes/coachRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));
app.use('/api/home', require('./src/routes/homeRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/dashboard/coach', require('./src/routes/coachDashboardRoutes'));

// 404 HANDLER (ONLY ONCE)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ERROR HANDLER 
const errorHandler = require("./src/middlewares/errorMiddleware");
app.use(errorHandler);

// DATABASE + SERVER
const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_URL;

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("✅ Connected to database");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ Database error:", err.message);
  });