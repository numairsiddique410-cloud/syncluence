import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  influencer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  matchScore: { type: Number, required: true }, // 0 to 100
  processedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Match", matchSchema);