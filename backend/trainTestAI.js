import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js'; // Sahi path ensure karein

dotenv.config();

const runAITest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Database se sirf Influencers nikalna
    // trainTestAI.js mein yeh update karein
    const influencers = await User.find({ role: "influencer" }); // 'type' ki jagah 'role' try karein
    
    if (influencers.length === 0) {
      console.log("Error: No influencers found in database!");
      return;
    }

    console.log(`Total Influencers found: ${influencers.length}`);

    // Data Split (80% Train, 20% Test)
    const splitIndex = Math.floor(influencers.length * 0.8);
    const testSet = influencers.slice(splitIndex);

    console.log(`--- AI Model Testing on ${testSet.length} samples ---`);

    // Testing logic
    testSet.forEach(inf => {
      // Fraud Prediction Logic (Model)
      const isPredictedFraud = inf.engagement_rate < 1.5;
      
      if (isPredictedFraud !== inf.is_fraud) {
        console.log(`Mismatch found for: ${inf.name} (Predicted: ${isPredictedFraud}, Actual: ${inf.is_fraud})`);
      }
    });

    console.log("Testing process completed.");
    process.exit();
  } catch (error) {
    console.error("Test Error:", error);
  }
};

runAITest();