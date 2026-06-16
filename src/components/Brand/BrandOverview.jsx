import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function BrandOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [pendingApps, setPendingApps] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [updatingApp, setUpdatingApp] = useState(null);

  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, campaignsRes, appsRes] = await Promise.all([
        api.get("/analytics/brand"),
        api.get("/campaigns"),
        api.get("/campaigns/brand-applications"),
      ]);
      setStats(analyticsRes.data);

      const mine = (campaignsRes.data.campaigns || [])
        .filter((c) => c.brand?._id === user._id || c.brand === user._id)
        .slice(0, 5);
      setCampaigns(mine);

      setPendingApps((appsRes.data || []).filter((a) => a.status === "pending").slice(0, 5));
    } catch {
      // Keep defaults
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData, ["campaign:new", "application:new", "application:updated", "payment:new", "payment:released"]);

  const handleAppAction = async (applicationId, status) => {
    setUpdatingApp(applicationId);
    try {
      await api.put(`/campaigns/application/${applicationId}/status`, { status });
      setPendingApps((prev) => prev.filter((a) => a._id !== applicationId));
      toast.success(`Application ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setUpdatingApp(null);
    }
  };

  const kpis = [
    {
      label: "Total Spend",
      value: stats ? `$${(stats.totalSpent || 0).toLocaleString()}` : "—",
      sub: "All time",
      color: "text-cyan-400",
    },
    {
      label: "Active Campaigns",
      value: stats ? String(stats.activeCampaigns ?? 0) : "—",
      sub: "Running now",
      color: "text-emerald-400",
    },
    {
      label: "Success Rate",
      value: stats ? `${stats.successRate ?? 0}%` : "—",
      sub: "Completed payments",
      color: "text-purple-400",
    },
    {
      label: "Pending Reviews",
      value: pendingApps.length > 0 ? String(pendingApps.length) : "0",
      sub: "Awaiting action",
      color: pendingApps.length > 0 ? "text-amber-400" : "text-slate-400",
    },
  ];

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Brand Overview</h2>
          <p className="text-slate-400 mt-1">Monitor performance and manage campaigns</p>
        </div>
        <button
          onClick={() => navigate("/brand/dashboard/campaigns")}
          className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400 transition"
        >
          + New Campaign
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className="bg-[#0F1C24] border border-white/10 rounded-2xl p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }}
          >
            <p className="text-slate-400 text-xs mb-2">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-slate-500 text-xs mt-1">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* RECENT CAMPAIGNS (3 cols) */}
        <div className="lg:col-span-3 bg-[#0F1C24] border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-slate-100">Recent Campaigns</h3>
            <button
              onClick={() => navigate("/brand/dashboard/campaigns")}
              className="text-xs text-indigo-400 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">No campaigns yet</p>
                <button
                  onClick={() => navigate("/brand/dashboard/campaigns")}
                  className="mt-3 text-xs text-indigo-400 hover:underline"
                >
                  Create your first campaign →
                </button>
              </div>
            ) : (
              campaigns.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
                  onClick={() => setSelectedCampaign(c)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{c.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.targetNiche} · ${c.budget}</p>
                  </div>
                  <StatusPill status={c.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* PENDING APPLICATIONS (2 cols) */}
        <div className="lg:col-span-2 bg-[#0F1C24] border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-slate-100">Pending Applicants</h3>
            <button
              onClick={() => navigate("/brand/dashboard/influencers")}
              className="text-xs text-indigo-400 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {pendingApps.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">
                No pending applications
              </p>
            ) : (
              pendingApps.map((app) => (
                <div key={app._id} className="p-3 rounded-xl bg-white/5 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{app.influencer?.name}</p>
                    <p className="text-xs text-slate-400">{app.campaign?.title}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAppAction(app._id, "accepted")}
                      disabled={updatingApp === app._id}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs
                                 font-medium hover:bg-emerald-500/30 transition disabled:opacity-40"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAppAction(app._id, "rejected")}
                      disabled={updatingApp === app._id}
                      className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs
                                 font-medium hover:bg-red-500/30 transition disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Create Campaign", to: "/brand/dashboard/campaigns", desc: "Launch a new collaboration" },
          { label: "Browse Influencers", to: "/brand/dashboard/influencers", desc: "Review applicants" },
          { label: "AI Matchmaking", to: "/brand/dashboard/ai-match", desc: "Find best-fit creators" },
          { label: "Payments", to: "/brand/dashboard/payments", desc: "Manage escrow & payouts" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.to)}
            className="text-left p-4 rounded-xl bg-[#0F1C24] border border-white/10
                       hover:border-indigo-500/50 hover:bg-indigo-500/5 transition group"
          >
            <p className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition">{action.label}</p>
            <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* CAMPAIGN DETAIL MODAL */}
      <AnimatePresence>
        {selectedCampaign && (
          <CampaignDetails campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatusPill({ status }) {
  const styles = {
    active: "bg-emerald-500/20 text-emerald-400",
    draft: "bg-slate-500/20 text-slate-400",
    completed: "bg-blue-500/20 text-blue-400",
    paused: "bg-amber-500/20 text-amber-400",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${styles[status] || "bg-slate-500/20 text-slate-400"}`}>
      {status || "active"}
    </span>
  );
}

function CampaignDetails({ campaign, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#0F1C24] border border-white/10 rounded-2xl w-full max-w-md p-6"
        initial={{ y: 30 }} animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-slate-100">{campaign.title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <p className="text-slate-400 text-sm mb-5">{campaign.description || "No description"}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { l: "Status", v: campaign.status || "active" },
            { l: "Budget", v: `$${campaign.budget}` },
            { l: "Niche", v: campaign.targetNiche },
            { l: "Created", v: new Date(campaign.createdAt).toLocaleDateString() },
          ].map(({ l, v }) => (
            <div key={l} className="bg-white/5 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{l}</p>
              <p className="text-slate-100 font-medium mt-1">{v}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-lg bg-indigo-500/20 text-indigo-300
                     hover:bg-indigo-500/30 transition text-sm"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}
