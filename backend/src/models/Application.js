import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  influencer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" }
}, { timestamps: true });

export default mongoose.model("Application", applicationSchema);