import mongoose from "mongoose";
import fs from "fs";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const influencers = JSON.parse(
      fs.readFileSync("./data/influencers.json", "utf-8")
    );

    let updated = 0;
    let notFound = 0;

    for (const inf of influencers) {
      const followers = inf.influencerDetails?.followers ?? 0;
      const engagementRate = inf.influencerDetails?.engagement_rate ?? 0;
      const avgLikes = Math.round(followers * (engagementRate / 100));
      const avgComments = Math.round(avgLikes * 0.15);

      const result = await User.updateOne(
        { email: inf.email },
        {
          $set: {
            "influencerDetails.followerCount": followers,
            "influencerDetails.stats.avgLikes": avgLikes,
            "influencerDetails.stats.avgComments": avgComments,
          },
        }
      );

      if (result.matchedCount > 0) {
        updated++;
      } else {
        notFound++;
      }
    }

    console.log(`Done. Updated: ${updated}, Not found: ${notFound}`);
    process.exit();
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
};

migrate();
