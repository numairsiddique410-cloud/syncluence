import Campaign from "../models/Campaign.js";
import User from "../models/User.js";
import Match from "../models/Match.js";

export const runMatchmaking = async () => {
  // 1. Dataset uthao
  const campaigns = await Campaign.find({});
  const influencers = await User.find({ role: "influencer" });

  for (let campaign of campaigns) {
    for (let inf of influencers) {
      // 2. TF-IDF/Logic simulation (Yahan tumhara AI logic aayega)
      const score = calculateScore(campaign.targetNiche, inf.influencerDetails.niche);
      
      // 3. Dataset mein save kardo
      await Match.findOneAndUpdate(
        { campaign: campaign._id, influencer: inf._id },
        { matchScore: score },
        { upsert: true }
      );
    }
  }
  console.log("AI Matchmaking Batch Processed Successfully!");
};

// Simple logic (Ise tum TF-IDF/VADER se replace karoge)
const calculateScore = (campNiche, infNiche) => {
  return campNiche === infNiche ? 95 : 40; 
};