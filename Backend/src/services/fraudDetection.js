import { AI_CONFIG } from "../config/aiConfig.js";

export const checkInfluencerAuthenticity = (influencer, dataset) => {
  // Safe extraction of data using optional chaining
  const details = influencer.influencerDetails || {};
  const stats = details.stats || {};
  const followerCount = details.followerCount || 1; // Default 1 to avoid division by zero

  const avgLikes = stats.avgLikes || 0;
  const avgComments = stats.avgComments || 0;

  const engagementRate = ((avgLikes + (avgComments * 2)) / followerCount) * 100;

  // Statistical Anomaly Detection (Dataset safe handling)
  const validDataset = dataset.filter(d => d.engagementRate !== undefined);
  const avgEngagement = validDataset.length > 0 
    ? validDataset.reduce((a, b) => a + b.engagementRate, 0) / validDataset.length 
    : 0;

  const stdDev = validDataset.length > 0 
    ? Math.sqrt(validDataset.reduce((a, b) => a + Math.pow(b.engagementRate - avgEngagement, 2), 0) / validDataset.length)
    : 0;
  
  const zScore = (engagementRate - avgEngagement) / (stdDev || 1);
  
  let fraudProbability = 0;
  if (zScore < -2) fraudProbability = 85; 
  else if (zScore < -1) fraudProbability = 45;
  
  return {
    isFraud: fraudProbability > 50, // Threshold as per your config
    fraudScore: fraudProbability,
    reason: fraudProbability > 50 ? "Unnatural engagement pattern" : "Authentic patterns"
  };
};