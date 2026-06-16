import Transaction from "../models/Transaction.js";
import Campaign from "../models/Campaign.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import { getMonthlyData, calculateSuccessRate } from "../utils/analyticsHelper.js";

/**
 * =========================
 * ADVANCED BRAND ANALYTICS
 * =========================
 */
export const getBrandAnalytics = async (req, res) => {
  try {
    const brandId = req.user._id;

    const transactions = await Transaction.find({ brand: brandId });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalProfit = transactions.reduce((sum, t) => sum + (t.platformFee || 0), 0);

    const failed = transactions.filter(t => t.status === "failed").length;

    const monthlyStats = getMonthlyData(transactions);

    const activeCampaigns = await Campaign.countDocuments({
      brand: brandId,
      status: "active",
    });

    const successRate = calculateSuccessRate(transactions.length, failed);

    res.json({
      totalSpent,
      totalProfit,
      successRate,
      activeCampaigns,
      monthlyStats,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getInfluencerAnalytics = async (req, res) => {
  try {
    const influencerId = req.user._id;

    const transactions = await Transaction.find({
      influencer: influencerId,
    });

    const completed = transactions.filter(t => t.status === "completed");
    const pending = transactions.filter(t => t.status !== "completed");

    const totalEarnings = completed.reduce(
      (sum, t) => sum + (t.influencerAmount || 0),
      0
    );

    // Use influencerAmount so chart reflects what influencer actually earns
    const monthlyStats = getMonthlyData(completed, "influencerAmount");

    res.json({
      totalEarnings,
      completedCampaigns: completed.length,
      pendingPayments: pending.length,
      monthlyStats,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * =========================
 * ADMIN ACTIVITY LOG
 * =========================
 */
export const getActivityLog = async (req, res) => {
  try {
    const [transactions, campaigns, users, applications] = await Promise.all([
      Transaction.find({}).sort({ createdAt: -1 }).limit(40)
        .populate("brand", "name").populate("influencer", "name").populate("campaign", "title"),
      Campaign.find({}).sort({ createdAt: -1 }).limit(30)
        .populate("brand", "name"),
      User.find({}).sort({ createdAt: -1 }).limit(30).select("-password"),
      Application.find({}).sort({ createdAt: -1 }).limit(30)
        .populate("influencer", "name").populate("campaign", "title"),
    ]);

    const txColorMap = { completed: "emerald", escrowed: "sky", created: "amber", failed: "red", pending: "amber" };
    const txActionMap = { completed: "Payment Released", escrowed: "Payment Escrowed", created: "Payment Created", failed: "Payment Failed", pending: "Payment Pending" };
    const appColorMap  = { accepted: "emerald", rejected: "red", pending: "amber" };

    const activities = [
      ...transactions.map(t => ({
        type: "payment",
        action: txActionMap[t.status] || "Payment Event",
        detail: `${t.brand?.name || "Brand"} → ${t.influencer?.name || "Influencer"} · $${t.amount}`,
        time: t.createdAt,
        color: txColorMap[t.status] || "slate",
      })),
      ...campaigns.map(c => ({
        type: "campaign",
        action: "Campaign Created",
        detail: `"${c.title}" by ${c.brand?.name || "Brand"} · $${c.budget}`,
        time: c.createdAt,
        color: "indigo",
      })),
      ...users.map(u => ({
        type: "user",
        action: u.isSuspended ? "Account Suspended" : "User Registered",
        detail: `${u.name} (${u.role})`,
        time: u.createdAt,
        color: u.isSuspended ? "red" : "violet",
      })),
      ...applications.map(a => ({
        type: "application",
        action: `Application ${a.status.charAt(0).toUpperCase() + a.status.slice(1)}`,
        detail: `${a.influencer?.name || "Influencer"} → ${a.campaign?.title || "Campaign"}`,
        time: a.createdAt,
        color: appColorMap[a.status] || "slate",
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 60);

    // 7-day daily breakdown
    const dailyStats = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      dailyStats[key] = { date: key, label, payments: 0, campaigns: 0, users: 0, applications: 0 };
    }
    activities.forEach(a => {
      const key = new Date(a.time).toISOString().slice(0, 10);
      if (dailyStats[key]) {
        if (a.type === "payment") dailyStats[key].payments++;
        else if (a.type === "campaign") dailyStats[key].campaigns++;
        else if (a.type === "user") dailyStats[key].users++;
        else if (a.type === "application") dailyStats[key].applications++;
      }
    });

    const typeTotals = {
      payments:     activities.filter(a => a.type === "payment").length,
      campaigns:    activities.filter(a => a.type === "campaign").length,
      users:        activities.filter(a => a.type === "user").length,
      applications: activities.filter(a => a.type === "application").length,
    };

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayCount = Object.values(dailyStats[todayKey] || {})
      .filter(v => typeof v === "number")
      .reduce((s, v) => s + v, 0);

    res.json({
      activities,
      dailyStats: Object.values(dailyStats),
      typeTotals,
      todayCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const transactions = await Transaction.find({});

    const totalRevenue = transactions.reduce(
      (sum, t) => sum + (t.platformFee || 0),
      0
    );

    const escrowed = transactions.filter(t => t.status === "escrowed").length;
    const failed = transactions.filter(t => t.status === "failed").length;
    const refunded = transactions.filter(t => t.status === "refunded").length;

    const monthlyStats = getMonthlyData(transactions);

    const successRate = calculateSuccessRate(transactions.length, failed);

    res.json({
      totalRevenue,
      escrowed,
      failed,
      refunded,
      successRate,
      monthlyStats,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};