require("dotenv").config();
const User = require("../src/models/User");
const connectDB = require("../src/utils/connectDB");
const passwordService = require("../src/utils/passwordService");

const createAdminUser = async () => {
  try {
    await connectDB();

    const { SUPERADMIN_EMAIL, SUPERADMIN_PASS, SUPERADMIN_NAME } = process.env;

    if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASS || !SUPERADMIN_NAME) {
      console.error("❌ Missing SUPERADMIN env variables");
      process.exit(1);
    }

    const existedAdmin = await User.findOne({ email: SUPERADMIN_EMAIL });
    if (existedAdmin) {
      console.error("❌ Admin already exists");
      process.exit(1);
    }

    passwordService.validatePasswordStrength(SUPERADMIN_PASS);
    const hashedPassword = await passwordService.hashPassword(SUPERADMIN_PASS);

    await User.create({
      name: SUPERADMIN_NAME,
      email: SUPERADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",        // ✅ lowercase
      phone: "0000000000",
      isVerified: true,     
    });

    console.log("✅ Admin user created successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  }
};

createAdminUser();