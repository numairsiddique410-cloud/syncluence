import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // Make sure: npm install bcryptjs

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["brand", "influencer", "admin"],
      required: true,
    },
    
    brandDetails: {
      companyName: { type: String },
      industry: { type: String },
      website: { type: String },
    },

    influencerDetails: {
      niche: { type: String },
      followerCount: { type: Number, default: 0 },
      socialLinks: {
        instagram: { type: String },
        youtube: { type: String },
        tiktok: { type: String },
      },
      // Zaroori stats AI matching ke liye
      stats: {
        avgLikes: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 },
      }
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },

    preferences: {
      paymentNotify:  { type: Boolean, default: true },
      campaignNotify: { type: Boolean, default: true },
      messageNotify:  { type: Boolean, default: true },
      updatesNotify:  { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// 1. Password hash karne ka middleware (Save hone se pehle)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next(); // Return zaroori hai yahan
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
// 2. [ZAROORI] Login ke waqt password match karne ka method wapis add karein
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;