import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import Transaction from "../models/Transaction.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

// ==========================================
// 1. REGISTER USER (Brand or Influencer)
// ==========================================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, brandDetails, influencerDetails } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (!role || !["brand", "influencer"].includes(role)) {
      return res.status(400).json({ message: "Please specify a valid role (brand or influencer)" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      brandDetails: role === "brand" ? brandDetails : undefined,
      influencerDetails: role === "influencer" ? influencerDetails : undefined,
    });

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully! 🎉`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 2. LOGIN USER
// ==========================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        message: "Login successful!",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 3. GET USER PROFILE (Protected)
// ==========================================
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        brandDetails: user.role === "brand" ? user.brandDetails : undefined,
        influencerDetails: user.role === "influencer" ? user.influencerDetails : undefined,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 4. UPDATE PROFILE (Protected)
// ==========================================
export const updateProfile = async (req, res) => {
  try {
    const { name, brandDetails, influencerDetails, preferences } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (brandDetails) user.brandDetails = { ...user.brandDetails?.toObject?.(), ...brandDetails };
    if (influencerDetails) user.influencerDetails = { ...user.influencerDetails?.toObject?.(), ...influencerDetails };
    if (preferences) user.preferences = { ...user.preferences?.toObject?.(), ...preferences };

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      brandDetails: user.brandDetails,
      influencerDetails: user.influencerDetails,
      preferences: user.preferences,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 5. UPDATE PASSWORD (Protected)
// ==========================================
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 6. GET ALL USERS (Admin)
// ==========================================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ==========================================
// 7. GET BRAND TRUST PROFILE (Influencer use)
// ==========================================
export const getBrandProfile = async (req, res) => {
  try {
    const brand = await User.findById(req.params.brandId).select("-password");
    if (!brand || brand.role !== "brand") {
      return res.status(404).json({ message: "Brand not found" });
    }

    const [campaigns, transactions] = await Promise.all([
      Campaign.find({ brand: brand._id }),
      Transaction.find({ brand: brand._id }),
    ]);

    const completed = transactions.filter((t) => t.status === "completed");
    const totalPaidOut = completed.reduce((sum, t) => sum + (t.influencerAmount || t.amount * 0.9), 0);
    const paymentSuccessRate = transactions.length > 0
      ? Math.round((completed.length / transactions.length) * 100)
      : 0;
    const uniqueInfluencers = new Set(completed.map((t) => t.influencer?.toString())).size;

    // ── Trust Score ──────────────────────────────────────────────
    let trustScore = 0;
    const breakdown = [];

    // 1. Profile completeness (25 pts)
    const profileFields = [brand.brandDetails?.companyName, brand.brandDetails?.industry, brand.brandDetails?.website];
    const profilePts = profileFields.filter(Boolean).length * 8; // 0/8/16/24 → cap at 25
    const profileScore = Math.min(profilePts + (profileFields.every(Boolean) ? 1 : 0), 25);
    trustScore += profileScore;
    breakdown.push({ label: "Profile Completeness", score: profileScore, max: 25, detail: `${profileFields.filter(Boolean).length}/3 fields filled` });

    // 2. Payment track record (40 pts)
    let paymentPts = 0;
    if (completed.length > 0) paymentPts += 20;
    if (paymentSuccessRate >= 80) paymentPts += 20;
    else if (paymentSuccessRate >= 50) paymentPts += 10;
    trustScore += paymentPts;
    breakdown.push({ label: "Payment Track Record", score: paymentPts, max: 40, detail: `${completed.length} completed · ${paymentSuccessRate}% success rate` });

    // 3. Campaign activity (25 pts)
    let campaignPts = 0;
    if (campaigns.length >= 1) campaignPts += 10;
    if (campaigns.length >= 3) campaignPts += 5;
    if (completed.length >= 1) campaignPts += 10;
    trustScore += campaignPts;
    breakdown.push({ label: "Campaign Activity", score: campaignPts, max: 25, detail: `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} created` });

    // 4. Account standing (10 pts)
    const ageMonths = Math.floor((Date.now() - new Date(brand.createdAt)) / (1000 * 60 * 60 * 24 * 30));
    let standingPts = brand.isSuspended ? 0 : 5;
    if (!brand.isSuspended && ageMonths >= 1) standingPts += 3;
    if (!brand.isSuspended && ageMonths >= 3) standingPts += 2;
    trustScore += standingPts;
    breakdown.push({ label: "Account Standing", score: standingPts, max: 10, detail: brand.isSuspended ? "Account suspended" : `Active · ${ageMonths}mo old` });

    const isVerified = trustScore >= 60 && !brand.isSuspended;

    res.json({
      brand: {
        _id: brand._id,
        name: brand.name,
        companyName: brand.brandDetails?.companyName || brand.name,
        industry: brand.brandDetails?.industry || null,
        website: brand.brandDetails?.website || null,
        createdAt: brand.createdAt,
        isSuspended: brand.isSuspended,
      },
      trustScore,
      isVerified,
      breakdown,
      stats: {
        totalCampaigns: campaigns.length,
        completedPayments: completed.length,
        totalPaidOut: Math.round(totalPaidOut),
        paymentSuccessRate,
        influencersWorkedWith: uniqueInfluencers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 8. FAKE FOLLOWER ANALYSIS (Admin)
// ==========================================
export const getFakeFollowerAnalysis = async (req, res) => {
  try {
    const influencers = await User.find({ role: "influencer" }).select("-password");

    // Expected minimum engagement rate per follower tier
    const expectedEngagement = (followers) => {
      if (followers < 10_000)  return 5;    // Nano
      if (followers < 100_000) return 2.5;  // Micro
      if (followers < 1_000_000) return 1.5; // Macro
      return 0.8;                            // Mega
    };

    const getTier = (followers) => {
      if (followers < 10_000)  return "Nano";
      if (followers < 100_000) return "Micro";
      if (followers < 1_000_000) return "Macro";
      return "Mega";
    };

    const results = influencers.map((inf) => {
      const followers   = inf.influencerDetails?.followerCount || 0;
      const avgLikes    = inf.influencerDetails?.stats?.avgLikes    || 0;
      const avgComments = inf.influencerDetails?.stats?.avgComments || 0;

      const actualEngagement = followers > 0
        ? ((avgLikes + avgComments) / followers) * 100
        : 0;

      const expected = expectedEngagement(followers);

      let fakeFollowerPct = 0;
      if (followers === 0) {
        fakeFollowerPct = 0;
      } else if (avgLikes === 0 && avgComments === 0 && followers > 1000) {
        fakeFollowerPct = 60; // no engagement data at all = suspicious
      } else {
        fakeFollowerPct = Math.max(0, Math.min(100,
          Math.round((1 - actualEngagement / expected) * 100)
        ));
      }

      const riskLevel = fakeFollowerPct >= 40 ? "high"
        : fakeFollowerPct >= 20 ? "medium"
        : "low";

      return {
        _id: inf._id,
        name: inf.name,
        email: inf.email,
        niche: inf.influencerDetails?.niche || null,
        followers,
        avgLikes,
        avgComments,
        engagementRate: parseFloat(actualEngagement.toFixed(2)),
        expectedEngagement: expected,
        fakeFollowerPct,
        estimatedFakeCount: Math.round(followers * fakeFollowerPct / 100),
        estimatedRealCount: Math.round(followers * (1 - fakeFollowerPct / 100)),
        tier: getTier(followers),
        riskLevel,
        isSuspended: inf.isSuspended,
      };
    });

    results.sort((a, b) => b.fakeFollowerPct - a.fakeFollowerPct);

    const summary = {
      total:      results.length,
      highRisk:   results.filter(r => r.riskLevel === "high").length,
      mediumRisk: results.filter(r => r.riskLevel === "medium").length,
      lowRisk:    results.filter(r => r.riskLevel === "low").length,
      avgFakePct: results.length
        ? Math.round(results.reduce((s, r) => s + r.fakeFollowerPct, 0) / results.length)
        : 0,
    };

    res.json({ results, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 9. TOGGLE SUSPEND USER (Admin)
// ==========================================
export const toggleSuspend = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.json({
      message: user.isSuspended ? "User suspended" : "User activated",
      isSuspended: user.isSuspended,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};