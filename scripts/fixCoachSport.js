// scripts/fixSport.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const connectDB = require("../src/utils/connectDB");

const fixSport = async () => {
  try {
    await connectDB();

    console.log("🔍 جاري البحث عن المدربين الذين يحتاجون تعديل...");

    // 1. جلب كل المدربين اللي عندهم coachSport لكن sport فارغ
    const coaches = await User.find({
      role: "coach",
      sport: null,
      coachSport: { $ne: null }
    });

    console.log(`📊 تم العثور على ${coaches.length} مدرب يحتاج تعديل`);

    // 2. تحديث كل مدرب
    let updatedCount = 0;
    for (const coach of coaches) {
      coach.sport = coach.coachSport;
      await coach.save();
      updatedCount++;
      console.log(`✅ تم تحديث: ${coach.name} (${coach.email})`);
    }

    console.log(`🎉 تم تحديث ${updatedCount} مدرب بنجاح`);

    // 3. عرض النتيجة للتأكد
    const sample = await User.findOne({ email: "mjd24693@gmail.com" });
    if (sample) {
      console.log("📋 بيانات المدرب بعد التعديل:");
      console.log(`  - sport: ${sample.sport}`);
      console.log(`  - coachSport: ${sample.coachSport}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ فشل التعديل:", error.message);
    process.exit(1);
  }
};

fixSport();