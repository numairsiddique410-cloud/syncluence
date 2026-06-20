// Backend/tests/test-ai.js
// ESM format use kar rahe hain
import { MatchFactory } from "../src/services/MatchFactory.js";

const testMatchmaking = () => {
  console.log("--- Starting AI Matchmaking Test ---");
  
  // 1. TF-IDF Strategy test
  const strategy = MatchFactory.createScorer('TF-IDF');
  
  // Mock Data
  const brandData = { targetNiche: 'Tech' };
  const influencerData = { niche: 'Tech' };
  
  const score = strategy(brandData, influencerData);
  
  console.log("Input: Brand(Tech), Influencer(Tech)");
  console.log("Calculated Match Score:", score);
  
  if(score === 90) {
    console.log("SUCCESS: TF-IDF Logic is working!");
  } else {
    console.log("FAILED: Check logic again.");
  }
};

testMatchmaking();