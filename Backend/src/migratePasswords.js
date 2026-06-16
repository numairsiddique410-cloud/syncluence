import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js"; // Sahi path dein
import dotenv from "dotenv";

dotenv.config();

const migratePasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected...");

    const users = await User.find({});
    
    for (const user of users) {
      // Check karein ke kahin pehle se hash toh nahi hai
      // Agar password $2a$ ya $2b$ se shuru nahi ho raha, toh hash karein
      if (!user.password.startsWith("$2a$") && !user.password.startsWith("$2b$")) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();
        console.log(`Updated user: ${user.email}`);
      }
    }

    console.log("All passwords migrated successfully!");
    process.exit();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migratePasswords();