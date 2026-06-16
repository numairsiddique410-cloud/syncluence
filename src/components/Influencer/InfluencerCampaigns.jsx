import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import api from "../../services/api";
import toast from "react-hot-toast";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

/* ================= BRAND VERIFY MODAL ================= */

const RADIUS = 52;
const CIRC   = 2 * Math.PI * RADIUS;

function scoreCfg(score) {
  if (score >= 75) return { hex: "#10b981", ring: "from-emerald-500 to-cyan-500",    text: "text-emerald-400", badge: "bg-emerald-500/15 border-emerald-500/30", bar: "bg-emerald-500" };
  if (score >= 50) return { hex: "#f59e0b", ring: "from-amber-500 to-yellow-400",   text: "text-amber-400",   badge: "bg-amber-500/15 border-amber-500/30",   bar: "bg-amber-500"  };
  return            { hex: "#ef4444", ring: "from-red-500 to-rose-500",              text: "text-red-400",     badge: "bg-red-500/15 border-red-500/30",       bar: "bg-red-500"    };
}

function BrandVerifyModal({ brandId, brandName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/brand-profile/${brandId}`)
      .then(({ data: res }) => setData(res))
      .catch(() => setData({ error: true }))
      .finally(() => setLoading(false));
  }, [brandId]);

  const cfg = data && !data.error ? scoreCfg(data.trustScore) : null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-md"
        initial={{ scale: 0.88, y: 32, opacity: 0 }}
        animate={{ scale: 1,    y: 0,  opacity: 1 }}
        exit={{    scale: 0.88, y: 16, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card */}
        <div className="bg-[#080f1c] border border-white/8 rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto">

          {/* Top accent bar */}
          <div className={`h-0.5 w-full bg-gradient-to-r ${cfg ? cfg.ring : "from-slate-600 to-slate-700"}`} />

          <div className="p-6">
            {/* Header row */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Brand Verification</p>
                <h3 className="text-xl font-bold text-white leading-tight">{brandName}</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500
                           hover:text-white hover:bg-white/8 transition flex-shrink-0 mt-0.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* LOADING */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-cyan-500 animate-spin" />
                </div>
                <p className="text-slate-500 text-sm">Analyzing brand profile...</p>
              </div>
            )}

            {/* ERROR */}
            {!loading && data?.error && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-slate-300 font-medium">Failed to load brand profile</p>
                <p className="text-slate-500 text-sm mt-1">Try again later</p>
              </div>
            )}

            {/* DATA */}
            {!loading && !data?.error && data && (
              <div className="space-y-5">

                {/* Suspended banner */}
                {data.brand.isSuspended && (
                  <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/25 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-400 text-sm font-medium">Account suspended by platform admins</p>
                  </div>
                )}

                {/* Score ring + badge + quick stats */}
                <div className="flex items-center gap-5">

                  {/* Ring */}
                  <div className="relative flex-shrink-0 w-28 h-28">
                    <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
                      <circle cx="56" cy="56" r={RADIUS} fill="none" stroke="#1e293b" strokeWidth="7" />
                      <motion.circle
                        cx="56" cy="56" r={RADIUS} fill="none"
                        stroke={cfg.hex}
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={CIRC}
                        initial={{ strokeDashoffset: CIRC }}
                        animate={{ strokeDashoffset: CIRC * (1 - data.trustScore / 100) }}
                        transition={{ duration: 1.3, ease: "easeOut", delay: 0.15 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        className={`text-3xl font-black ${cfg.text}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {data.trustScore}
                      </motion.span>
                      <span className="text-slate-600 text-xs">/100</span>
                    </div>
                  </div>

                  {/* Right panel */}
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Badge */}
                    {data.isVerified ? (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${cfg.badge}`}>
                        <svg className={`w-3.5 h-3.5 ${cfg.text}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className={`${cfg.text} text-xs font-bold`}>Verified Brand</span>
                      </div>
                    ) : (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${cfg.badge}`}>
                        <svg className={`w-3.5 h-3.5 ${cfg.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className={`${cfg.text} text-xs font-bold`}>Not Verified</span>
                      </div>
                    )}

                    {/* Mini stats 2×2 */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Campaigns",   value: data.stats.totalCampaigns },
                        { label: "Paid Out",    value: `$${data.stats.totalPaidOut.toLocaleString()}` },
                        { label: "Influencers", value: data.stats.influencersWorkedWith },
                        { label: "Success",     value: `${data.stats.paymentSuccessRate}%` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white/4 border border-white/6 rounded-lg px-2.5 py-2">
                          <p className="text-slate-500 text-xs leading-none mb-1">{label}</p>
                          <p className="text-white text-sm font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Brand meta chips */}
                <div className="flex flex-wrap gap-2">
                  {data.brand.industry && (
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-slate-400 text-xs">
                      {data.brand.industry}
                    </span>
                  )}
                  {data.brand.website && (
                    <a
                      href={data.brand.website.startsWith("http") ? data.brand.website : `https://${data.brand.website}`}
                      target="_blank" rel="noreferrer"
                      className="px-3 py-1 rounded-full bg-cyan-500/8 border border-cyan-500/20 text-cyan-400 text-xs hover:bg-cyan-500/15 transition"
                    >
                      {data.brand.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  )}
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-slate-400 text-xs">
                    Since {new Date(data.brand.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>

                {/* Score breakdown */}
                <div className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-4">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Score Breakdown</p>
                  {data.breakdown.map((item, i) => {
                    const pct = (item.score / item.max) * 100;
                    const barColor = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500/60";
                    const numColor = pct >= 70 ? "text-emerald-400" : pct >= 40 ? "text-amber-400" : "text-red-400";
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-slate-300 text-xs font-medium">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs hidden sm:block">{item.detail}</span>
                            <span className={`text-xs font-bold tabular-nums ${numColor}`}>{item.score}/{item.max}</span>
                          </div>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${barColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.9, delay: i * 0.12 + 0.3, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendation pill */}
                <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${cfg.badge}`}>
                  <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.text}`} fill="currentColor" viewBox="0 0 20 20">
                    {data.trustScore >= 60
                      ? <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      : <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    }
                  </svg>
                  <p className={`${cfg.text} text-sm leading-relaxed`}>
                    {data.trustScore >= 75
                      ? "Strong trust score with verified payment history. Safe to apply and collaborate."
                      : data.trustScore >= 50
                      ? "Moderate trust score. Review their campaign details carefully before applying."
                      : "Low trust score. Do additional research before committing to this campaign."}
                  </p>
                </div>

              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const TABS = ["Active", "Pending", "Rejected"];

// Map application status → tab
const STATUS_MAP = {
  accepted: "Active",
  pending: "Pending",
  rejected: "Rejected",
};

export default function InfluencerCampaigns() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Active");
  const [selectedApp, setSelectedApp] = useState(null);
  const [showBrowse, setShowBrowse] = useState(false);
  const [verifyBrand, setVerifyBrand] = useState(null);

  // ================= LOAD MY APPLICATIONS =================
  const fetchApplications = useCallback(async () => {
    try {
      const { data } = await api.get("/campaigns/my-applications");
      setApplications(data);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);
  useAutoRefresh(fetchApplications, ["campaign:new", "application:new", "application:updated"]);

  const filtered = applications.filter(
    (a) => STATUS_MAP[a.status] === activeTab
  );

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Campaigns</h2>
          <p className="text-slate-400 mt-1">
            Manage and track your brand collaborations
          </p>
        </div>

        <button
          onClick={() => setShowBrowse(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Find Campaigns
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === activeTab
                ? "bg-cyan-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[580px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="px-6 py-4 text-left">Brand</th>
              <th className="px-6 py-4 text-left">Campaign</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Budget</th>
              <th className="px-6 py-4 text-left">Niche</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No {activeTab.toLowerCase()} applications yet.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app._id} className="hover:bg-slate-750">
                  <td className="px-6 py-4 text-slate-100 font-medium">
                    {app.campaign?.brand?.name || "Brand"}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {app.campaign?.title}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    ${app.campaign?.budget}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {app.campaign?.targetNiche}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setVerifyBrand({ id: app.campaign?.brand?._id || app.campaign?.brand, name: app.campaign?.brand?.name || "Brand" })}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                    >
                      Verify Brand
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* DETAILS MODAL */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <div className="flex justify-between mb-4">
                <h3 className="text-xl text-slate-100 font-semibold">
                  {selectedApp.campaign?.title}
                </h3>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-slate-400"
                >
                  ✕
                </button>
              </div>

              <p className="text-slate-400 mb-4">
                {selectedApp.campaign?.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <Info label="Brand" value={selectedApp.campaign?.brand?.name || "—"} />
                <Info label="Budget" value={`$${selectedApp.campaign?.budget}`} />
                <Info label="Niche" value={selectedApp.campaign?.targetNiche} />
                <Info label="Application Status" value={selectedApp.status} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BROWSE & APPLY MODAL */}
      <AnimatePresence>
        {showBrowse && (
          <BrowseCampaignsModal
            onClose={() => setShowBrowse(false)}
            onApplied={fetchApplications}
            myApplications={applications}
            onVerifyBrand={(id, name) => setVerifyBrand({ id, name })}
          />
        )}
      </AnimatePresence>

      {/* BRAND VERIFY MODAL */}
      <AnimatePresence>
        {verifyBrand && (
          <BrandVerifyModal
            brandId={verifyBrand.id}
            brandName={verifyBrand.name}
            onClose={() => setVerifyBrand(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ================= BROWSE CAMPAIGNS MODAL ================= */

function BrowseCampaignsModal({ onClose, onApplied, myApplications, onVerifyBrand }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/campaigns");
        setCampaigns(data.campaigns || []);
      } catch {
        toast.error("Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const appliedIds = new Set(
    myApplications.map((a) => a.campaign?._id || a.campaign)
  );

  const applyToCampaign = async (campaignId) => {
    setApplying(campaignId);
    try {
      await api.post("/campaigns/apply", { campaignId });
      toast.success("Application submitted!");
      onApplied();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply");
    } finally {
      setApplying(null);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        <div className="flex justify-between mb-6">
          <h3 className="text-xl text-slate-100 font-semibold">
            Browse Campaigns
          </h3>
          <button onClick={onClose} className="text-slate-400">
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400 text-center py-8">Loading...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No campaigns available.</p>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => {
              const alreadyApplied = appliedIds.has(c._id);
              return (
                <div
                  key={c._id}
                  className="bg-slate-700/50 border border-slate-600 rounded-xl p-4
                             flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-100 font-medium">{c.title}</p>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                      {c.description}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                      <span>Budget: ${c.budget}</span>
                      <span>Niche: {c.targetNiche}</span>
                      <span>Brand: {c.brand?.name}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => !alreadyApplied && applyToCampaign(c._id)}
                      disabled={alreadyApplied || applying === c._id}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition
                        ${alreadyApplied
                          ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                          : "bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-60"
                        }`}
                    >
                      {alreadyApplied
                        ? "Applied"
                        : applying === c._id
                        ? "Applying..."
                        : "Apply"}
                    </button>
                    <button
                      onClick={() => onVerifyBrand(c.brand?._id || c.brand, c.brand?.name || "Brand")}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/40
                                 text-indigo-400 hover:bg-indigo-500/10 transition whitespace-nowrap"
                    >
                      Verify Brand
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ================= HELPERS ================= */

function StatusPill({ status }) {
  const map = {
    accepted: "bg-emerald-500/20 text-emerald-400",
    pending: "bg-amber-500/20 text-amber-400",
    rejected: "bg-slate-500/30 text-slate-300",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] || ""}`}>
      {status}
    </span>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-slate-100 font-medium mt-1">{value}</p>
    </div>
  );
}
