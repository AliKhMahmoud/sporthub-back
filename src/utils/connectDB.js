const mongoose = require("mongoose");

const connectDB = async () => {
  const MONGOURL = process.env.MONGO_URL;

  if (!MONGOURL) {
    throw new Error("MONGO_URL is not defined");
  }

  const conn = await mongoose.connect(MONGOURL);
  
  // اطبع اسم قاعدة البيانات الحالية في التيرمنال
  console.log(`Connected to Database: ${conn.connection.name}`);
};

module.exports = connectDB;