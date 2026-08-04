// scripts/migrateUsers.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const connectDB = require("../src/utils/connectDB");

const migrateUsers = async () => {
  try {
    await connectDB();

    // 1. تحديث role: "user" → "athlete"
    const athleteResult = await User.updateMany(
      { role: "user" },
      { 
        $set: { 
          role: "athlete",
          isActive: true,
          isOnline: false,
          lastSeen: new Date()
        }
      }
    );
    console.log(`✅ Updated ${athleteResult.modifiedCount} users from 'user' to 'athlete'`);

    // 2. تحديث role: "publisher" → "coach" (مع coachStatus: 'pending')
    const coachResult = await User.updateMany(
      { role: "publisher" },
      { 
        $set: { 
          role: "coach",
          coachStatus: "pending",
          isActive: true,
          isOnline: false,
          lastSeen: new Date(),
          workingDays: [],
          certificates: []
        }
      }
    );
    console.log(`✅ Updated ${coachResult.modifiedCount} users from 'publisher' to 'coach (pending)'`);

    // 3. تحديث coaches اللي عندهم isVerified = true → approve تلقائي
    const approveResult = await User.updateMany(
      { role: "coach", isVerified: true, coachStatus: "pending" },
      { $set: { coachStatus: "approved" } }
    );
    console.log(`✅ Auto-approved ${approveResult.modifiedCount} verified coaches`);

    // 4. تحديث admin (يبقى admin)
    const adminResult = await User.updateMany(
      { role: "admin" },
      { 
        $set: { 
          isActive: true,
          isOnline: false,
          lastSeen: new Date()
        }
      }
    );
    console.log(`✅ Updated ${adminResult.modifiedCount} admins`);

    // 5. إضافة coachStatus لكل coach مفقود
    const missingStatusResult = await User.updateMany(
      { role: "coach", coachStatus: { $exists: false } },
      { $set: { coachStatus: "pending" } }
    );
    console.log(`✅ Added coachStatus to ${missingStatusResult.modifiedCount} coaches`);

    // 6. التأكد من وجود Admin واحد على الأقل
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const passwordService = require("../src/utils/passwordService");
      const hashedPassword = await passwordService.hashPassword("Admin123@#");
      await User.create({
        name: "Super Admin",
        email: "admin@sportshub.com",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        isActive: true
      });
      console.log(`✅ Admin user created`);
    } else {
      console.log(`✅ Admin already exists`);
    }

    console.log("🎉 Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
};

migrateUsers();