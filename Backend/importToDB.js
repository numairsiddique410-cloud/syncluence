import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import User from './src/models/User.js'; // Ensure your path is correct
import Campaign from './src/models/Campaign.js';

dotenv.config();

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully!");

    // Data Load Karein
    const influencers = JSON.parse(fs.readFileSync('./data/influencers.json', 'utf-8'));
    const brands = JSON.parse(fs.readFileSync('./data/brands.json', 'utf-8'));
    const campaigns = JSON.parse(fs.readFileSync('./data/campaigns.json', 'utf-8'));

    // Purana Data Saaf Karein
    await User.deleteMany({});
    await Campaign.deleteMany({});
    console.log("Old data cleared.");

    // Map influencer JSON fields → User model schema fields
    const mappedInfluencers = influencers.map((inf) => {
      const followers = inf.influencerDetails?.followers ?? 0;
      const engagementRate = inf.influencerDetails?.engagement_rate ?? 0;
      const avgLikes = Math.round(followers * (engagementRate / 100));
      return {
        ...inf,
        influencerDetails: {
          niche: inf.influencerDetails?.niche || "",
          followerCount: followers,
          stats: {
            avgLikes,
            avgComments: Math.round(avgLikes * 0.15),
          },
        },
      };
    });

    await User.insertMany([...mappedInfluencers, ...brands]);
    await Campaign.insertMany(campaigns);

    console.log("Data Import Successful: 500 Influencers, 500 Brands, 300 Campaigns! 🚀");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();