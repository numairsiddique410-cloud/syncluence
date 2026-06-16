import Campaign from "../models/Campaign.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import MatchLog from "../models/MatchLog.js";
import { MatchFactory } from "../services/MatchFactory.js";
import { checkInfluencerAuthenticity } from "../services/fraudDetection.js";
import { analyzeSentiment, analyzeCompatibility } from "../services/sentimentAnalysis.js";

// 1. Create New Campaign
export const createCampaign = async (req, res) => {
  try {
    const { title, description, budget, targetNiche } = req.body;
    const campaign = await Campaign.create({
      brand: req.user._id,
      title,
      description,
      budget,
      targetNiche,
    });
    req.app.get("io")
      .to("role:influencer")
      .to("role:admin")
      .emit("data:update", { type: "campaign:new", payload: { campaignId: campaign._id } });
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 2. Get All Campaigns (With Niche Filtering & Pagination)
export const getCampaigns = async (req, res) => {
  try {
    const { niche, page = 1, limit = 10 } = req.query;
    const query = niche ? { targetNiche: niche } : {};

    const campaigns = await Campaign.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("brand", "name brandDetails")
      .sort({ createdAt: -1 });

    const count = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 3. Apply to Campaign
export const applyToCampaign = async (req, res) => {
  try {
    const { campaignId } = req.body;
    
    const campaignExists = await Campaign.findById(campaignId);
    if (!campaignExists) return res.status(404).json({ message: "Campaign not found" });

    const alreadyApplied = await Application.findOne({ 
      campaign: campaignId, 
      influencer: req.user._id 
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied to this campaign" });
    }

    const application = await Application.create({
      campaign: campaignId,
      influencer: req.user._id,
      status: "pending"
    });

    req.app.get("io")
      .to(`user:${campaignExists.brand}`)
      .to("role:admin")
      .emit("data:update", { type: "application:new", payload: { campaignId, influencerId: req.user._id } });

    res.status(201).json({ message: "Application submitted successfully!", application });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 4. AI-Powered Match Scoring & Fraud Detection
export const getMatchScore = async (req, res) => {
  try {
    const { campaignId, influencerId } = req.body;

    const [campaign, influencer, allInfluencers] = await Promise.all([
      Campaign.findById(campaignId),
      User.findById(influencerId),
      User.find({ role: 'influencer', 'influencerDetails.followerCount': { $gt: 0 } })
    ]);

    if (!campaign || !influencer) {
      return res.status(404).json({ message: "Campaign or Influencer not found" });
    }

    // Dataset preparation for Fraud Detection
    const dataset = allInfluencers.map(inf => ({
      engagementRate: (((inf.influencerDetails.stats?.avgLikes || 0) + 
                       ((inf.influencerDetails.stats?.avgComments || 0) * 2)) / 
                       inf.influencerDetails.followerCount) * 100
    }));

    const fraudReport = checkInfluencerAuthenticity(influencer, dataset);
    
    if (fraudReport.isFraud) {
      return res.status(200).json({ 
        matchScore: 0, 
        message: "Fraud Warning: Suspicious engagement patterns detected.",
        fraudRisk: fraudReport.fraudScore,
        reasoning: fraudReport.reason
      });
    }

    const scorer = MatchFactory.createScorer('AI-Weighted');
    const result = scorer(campaign, influencer);

    const sentiment = analyzeCompatibility(campaign, influencer);

    await MatchLog.create({
      campaign: campaignId,
      influencer: influencerId,
      matchScore: result.matchScore,
      reasoning: result.reasoning,
    });

    res.json({
      campaignId,
      influencerId,
      matchScore: result.matchScore,
      reasoning: result.reasoning,
      isAuthentic: true,
      sentiment,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 5a. Standalone Sentiment Analysis
export const getSentimentAnalysis = async (req, res) => {
  try {
    const { text, campaignId, influencerId } = req.body;

    if (campaignId && influencerId) {
      const [campaign, influencer] = await Promise.all([
        Campaign.findById(campaignId),
        User.findById(influencerId),
      ]);
      if (!campaign || !influencer) {
        return res.status(404).json({ message: "Campaign or Influencer not found" });
      }
      return res.json(analyzeCompatibility(campaign, influencer));
    }

    if (text) {
      return res.json(analyzeSentiment(text));
    }

    return res.status(400).json({ message: "Provide text or campaignId + influencerId" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 5. Get Applications for Brand's Campaigns
export const getBrandApplications = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ brand: req.user._id });
    const campaignIds = campaigns.map((c) => c._id);

    const applications = await Application.find({
      campaign: { $in: campaignIds },
    })
      .populate("influencer", "name email influencerDetails")
      .populate("campaign", "title budget targetNiche");

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 6. Get Applications for Logged-in Influencer
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      influencer: req.user._id,
    }).populate({
      path: "campaign",
      populate: { path: "brand", select: "name brandDetails" },
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// 7. Update Application Status (With Ownership & Logic Check)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body; 

    // Find application and populate campaign to check owner
    const application = await Application.findById(applicationId).populate('campaign');
    
    if (!application) return res.status(404).json({ message: "Application not found" });

    // Authorization: Check if the logged-in user is the owner of the campaign
    if (application.campaign.brand.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Status Validation
    const validStatuses = ["pending", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    application.status = status;
    await application.save();

    req.app.get("io")
      .to(`user:${application.influencer}`)
      .to("role:admin")
      .emit("data:update", { type: "application:updated", payload: { applicationId, status } });

    res.json({ message: `Application marked as ${status}`, application });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};