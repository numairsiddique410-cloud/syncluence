import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully! ✅");
  } catch (error) {
    console.error(`Database Connection Error: ${error.message} ❌`);
    process.exit(1); // Server ko stop karne ke liye agar connection fail ho
  }
};

export default connectDB;