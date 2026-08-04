// scripts/updateSportImages.js
require("dotenv").config();
const mongoose = require("mongoose");
const Sport = require("../src/models/Sport");
const connectDB = require("../src/utils/connectDB");

const sportImages = {
  boxing: "https://res.cloudinary.com/dtetfjqgb/image/upload/v1783506104/photo_2026-07-08_13-19-26_ufdlvg.jpg",
  taekwondo: "https://res.cloudinary.com/dtetfjqgb/image/upload/v1783506104/photo_2026-07-08_13-19-30_as2wlj.jpg",
  karate: "https://res.cloudinary.com/dtetfjqgb/image/upload/v1783506103/photo_2026-07-08_13-19-35_gfrkne.jpg",
  bodybuilding: "https://res.cloudinary.com/dtetfjqgb/image/upload/v1783506103/photo_2026-07-08_13-19-32_h3azyn.jpg",
  'cardio-fitness': "https://res.cloudinary.com/dtetfjqgb/image/upload/v1783506103/photo_2026-07-08_13-19-24_izonb0.jpg",
};

const updateImages = async () => {
  try {
    await connectDB();

    for (const [slug, imageUrl] of Object.entries(sportImages)) {
      const result = await Sport.updateOne(
        { slug: slug },
        { $set: { image: imageUrl } }
      );
      console.log(`✅ ${slug}: ${result.modifiedCount > 0 ? 'updated' : 'not found'}`);
    }

    console.log("🎉 All sport images updated!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

updateImages();