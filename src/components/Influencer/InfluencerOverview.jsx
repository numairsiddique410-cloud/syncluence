import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function InfluencerOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, appsRes, campRes] = await Promise.all([
        api.get("/analytics/influencer"),
        api.get("/campaigns/my-applications"),
        api.get("/campaigns"),
      ]);
      setStats(analyticsRes.data);
      setApplications(appsRes.data || []);
      const allCamps = campRes.data.campaigns || [];
      const myNiche = user?.influencerDetails?.niche?.toLowerCase() || "";
      const recommended = allCamps
        .filter((c) => myNiche && c.targetNiche?.toLowerCase().includes(myNiche))
        .slice(0, 3);
      setCampaigns(recommended.length > 0 ? recommended : allCamps.slice(0, 3));
    } catch {
      // keep defaults
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData, ["campaign:new", "application:updated", "payment:released"]);

  const profileFields = [
    { label: "Niche", filled: !!user?.influencerDetails?.niche },
    { label: "Follower Count", filled: !!user?.influencerDetails?.followerCount },
    { label: "Avg Likes", filled: !!user?.influencerDetails?.stats?.avgLikes },
    { label: "Instagram", filled: !!user?.influencerDetails?.socialLinks?.instagram },
  ];
  const profileScore = Math.round((profileFields.filter((f) => f.filled).length / profileFields.length) * 100);

  const kpis = [
    { label: "Total Earned", value: stats ? `$${(stats.totalEarnings || 0).toLocaleString()}` : "—", color: "text-cyan-400" },
    { label: "Campaigns", value: stats ? String(stats.completedCampaigns ?? 0) : "—", color: "text-emerald-400" },
    { label: "Pending Pay", value: stats ? String(stats.pendingPayments ?? 0) : "—", color: "text-amber-400" },
    { label: "Applied", value: applications.length ? String(applications.length) : "0", color: "text-purple-400" },
  ];

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">
            Welcome back, {user?.name?.split(" ")[0] || "Creator"}
          </h2>
          <p className="text-slate-400 mt-1">Track your campaigns and earnings</p>
        </div>
        <button
          onClick={() => navigate("/influencer/dashboard/campaigns")}
          className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500 transition"
        >
          Find Campaigns
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className="bg-slate-800/70 border border-white/10 rounded-2xl p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }}
          >
            <p className="text-slate-400 text-xs mb-2">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* RECENT APPLICATIONS */}
        <div className="lg:col-span-3 bg-slate-800/70 border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-slate-100">My Applications</h3>
            <button
              onClick={() => navigate("/influencer/dashboard/campaigns")}
              className="text-xs text-cyan-400 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">No applications yet</p>
                <button
                  onClick={() => navigate("/influencer/dashboard/campaigns")}
                  className="mt-2 text-xs text-cyan-400 hover:underline"
                >
                  Browse campaigns →
                </button>
              </div>
            ) : (
              applications.slice(0, 4).map((app) => (
                <div key={app._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{app.campaign?.title}</p>
                    <p className="text-xs text-slate-400">{app.campaign?.brand?.name} · ${app.campaign?.budget}</p>
                  </div>
                  <AppStatus status={app.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* PROFILE + STRENGTH */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile card */}
          <div className="bg-slate-800/70 border border-white/10 rounded-2xl p-5 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-cyan-600 flex items-center justify-center text-xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <p className="font-semibold text-slate-100">{user?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            {user?.influencerDetails?.niche && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                {user.influencerDetails.niche}
              </span>
            )}
          </div>

          {/* Profile strength */}
          <div className="bg-slate-800/70 border border-white/10 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-slate-100">Profile Strength</p>
              <span className={`text-sm font-bold ${profileScore === 100 ? "text-emerald-400" : profileScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                {profileScore}%
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
              <motion.div
                className={`h-full rounded-full ${profileScore === 100 ? "bg-emerald-500" : profileScore >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${profileScore}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <div className="space-y-1">
              {profileFields.map((f) => (
                <div key={f.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{f.label}</span>
                  <span className={f.filled ? "text-emerald-400" : "text-slate-500"}>
                    {f.filled ? "✓" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
            {profileScore < 100 && (
              <button
                onClick={() => navigate("/influencer/dashboard/settings")}
                className="mt-3 w-full py-1.5 rounded-lg text-xs bg-cyan-500/10 text-cyan-400
                           hover:bg-cyan-500/20 transition"
              >
                Complete Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RECOMMENDED CAMPAIGNS */}
      {campaigns.length > 0 && (
        <div className="bg-slate-800/70 border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-slate-100">
              {user?.influencerDetails?.niche ? `Campaigns in ${user.influencerDetails.niche}` : "Open Campaigns"}
            </h3>
            <button
              onClick={() => navigate("/influencer/dashboard/campaigns")}
              className="text-xs text-cyan-400 hover:underline"
            >
              Browse & Apply
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <div key={c._id} className="bg-white/5 rounded-xl p-4">
                <p className="font-medium text-slate-100 text-sm truncate">{c.title}</p>
                <p className="text-xs text-slate-400 mt-1">{c.brand?.name} · {c.targetNiche}</p>
                <p className="text-cyan-400 font-semibold text-sm mt-2">${c.budget}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Browse Campaigns", to: "/influencer/dashboard/campaigns", desc: "Apply to new campaigns" },
          { label: "View Earnings", to: "/influencer/dashboard/earnings", desc: "Track your payouts" },
          { label: "Update Profile", to: "/influencer/dashboard/settings", desc: "Improve AI match score" },
          { label: "Check Stats", to: "/influencer/dashboard/earnings", desc: "Monthly earnings chart" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.to)}
            className="text-left p-4 rounded-xl bg-slate-800/70 border border-white/10
                       hover:border-cyan-500/50 hover:bg-cyan-500/5 transition group"
          >
            <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition">{action.label}</p>
            <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function AppStatus({ status }) {
  const map = {
    accepted: "bg-emerald-500/20 text-emerald-400",
    pending: "bg-amber-500/20 text-amber-400",
    rejected: "bg-slate-500/20 text-slate-400",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${map[status] || ""}`}>
      {status}
    </span>
  );
}
