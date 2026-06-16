import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    targetNiche: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Yahan maine 'CampaignSchema' ko 'campaignSchema' (small c) kar diya hai
const Campaign = mongoose.model("Campaign", campaignSchema);

export default Campaign;