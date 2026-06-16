import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import api from "../../services/api";
import toast from "react-hot-toast";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

/* ================= AI SCORE MODAL ================= */

function AIScoreModal({ application, onClose }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const { data } = await api.post("/campaigns/match-score", {
          campaignId: application.campaign?._id || application.campaign,
          influencerId: application.influencer?._id || application.influencer,
        });
        setResult(data);
      } catch (err) {
        setResult({ error: err.response?.data?.message || "Score fetch failed" });
      } finally {
        setLoading(false);
      }
    };
    fetchScore();
  }, [application]);

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#0F1C24] border border-white/10 rounded-2xl p-8 w-full max-w-md relative"
        initial={{ y: 40 }}
        animate={{ y: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          ✕
        </button>

        <h3 className="text-xl font-semibold text-slate-100 mb-2">
          AI Match Score
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          {application.influencer?.name} × {application.campaign?.title}
        </p>

        {loading ? (
          <p className="text-slate-400 text-center py-6">Calculating...</p>
        ) : result?.error ? (
          <p className="text-red-400 text-center">{result.error}</p>
        ) : (
          <div className="space-y-4">
            {/* Score circle */}
            <div className="flex flex-col items-center py-4">
              <div
                className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold
                  ${result.matchScore >= 70 ? "bg-emerald-500/20 text-emerald-400" :
                    result.matchScore >= 40 ? "bg-amber-500/20 text-amber-400" :
                    "bg-red-500/20 text-red-400"}`}
              >
                {result.matchScore ?? 0}
              </div>
              <p className="text-slate-400 text-sm mt-2">Match Score / 100</p>
            </div>

            {/* Fraud indicator */}
            {result.fraudRisk !== undefined && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 font-medium text-sm">
                  Fraud Risk Detected
                </p>
                <p className="text-red-300 text-xs mt-1">{result.reasoning}</p>
                <p className="text-red-300 text-xs">Risk Score: {result.fraudRisk}</p>
              </div>
            )}

            {/* Reasoning */}
            {Array.isArray(result.reasoning) && result.reasoning.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-slate-300 text-sm font-medium mb-2">AI Reasoning</p>
                <ul className="space-y-1.5">
                  {result.reasoning.map((r, i) => (
                    <li key={i} className="text-slate-400 text-xs flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">▸</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sentiment Compatibility */}
            {result.sentiment && (
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-slate-300 text-sm font-medium mb-3">Sentiment Analysis</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Campaign Tone</p>
                    <SentimentPill sentiment={result.sentiment.campaign?.sentiment} label={result.sentiment.campaign?.label} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Influencer Tone</p>
                    <SentimentPill sentiment={result.sentiment.influencer?.sentiment} label={result.sentiment.influencer?.label} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Tone Compatibility</span>
                    <span className={result.sentiment.compatibility >= 70 ? "text-emerald-400" : "text-amber-400"}>
                      {result.sentiment.compatibility}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full">
                    <div
                      className={`h-1.5 rounded-full transition-all ${result.sentiment.compatibility >= 70 ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${result.sentiment.compatibility}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 text-center">
              {result.isAuthentic ? "✓ Verified authentic influencer" : "AI-Weighted scoring"}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const COLORS = ["#22d3ee", "#facc15", "#fb7185"];

/* ================= MAIN ================= */

export default function BrandInfluencers() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [aiTarget, setAiTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [updating, setUpdating] = useState(null);

  // ================= LOAD APPLICATIONS =================
  const fetchApplications = useCallback(async () => {
    try {
      const { data } = await api.get("/campaigns/brand-applications");
      setApplications(data);
    } catch {
      toast.error("Failed to load influencer applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);
  useAutoRefresh(fetchApplications, ["application:new", "application:updated"]);

  // ================= ACCEPT / REJECT =================
  const updateStatus = async (applicationId, status) => {
    setUpdating(applicationId);
    try {
      await api.put(`/campaigns/application/${applicationId}/status`, { status });
      toast.success(`Application ${status}`);
      setApplications((prev) =>
        prev.map((a) => (a._id === applicationId ? { ...a, status } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  // ================= REAL-TIME ANALYTICS =================
  const stats = useMemo(() => {
    const total = applications.length;
    const accepted = applications.filter((a) => a.status === "accepted").length;
    const pending = applications.filter((a) => a.status === "pending").length;
    const rejected = applications.filter((a) => a.status === "rejected").length;

    return [
      { label: "Total Applications", value: total },
      { label: "Accepted", value: accepted },
      { label: "Pending", value: pending },
      { label: "Rejected", value: rejected },
    ];
  }, [applications]);

  const chartData = [
    { name: "Accepted", value: applications.filter((a) => a.status === "accepted").length },
    { name: "Pending", value: applications.filter((a) => a.status === "pending").length },
    { name: "Rejected", value: applications.filter((a) => a.status === "rejected").length },
  ];

  // ================= FILTERING =================
  const filtered = applications.filter((a) => {
    const name = a.influencer?.name || "";
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "All" || a.status === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">
          Influencer Management
        </h2>
        <p className="text-slate-400 mt-1">
          Manage, review, and respond to influencer applications
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4 }}
            className="bg-[#0F1C24] border border-white/10 rounded-2xl p-6"
          >
            <p className="text-slate-400 text-sm">{s.label}</p>
            <h3 className="text-3xl font-semibold text-slate-100 mt-2">
              {loading ? "—" : s.value}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* SEARCH / FILTER */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          placeholder="Search influencer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 rounded bg-[#0B141A] border border-white/10 text-slate-100"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-3 rounded bg-[#0B141A] border border-white/10 text-slate-100"
        >
          <option>All</option>
          <option>Accepted</option>
          <option>Pending</option>
          <option>Rejected</option>
        </select>
      </div>

      {/* CHART + TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CHART */}
        <div className="bg-[#0F1C24] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">
            Application Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={90}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLE */}
        <div className="lg:col-span-2 bg-[#0F1C24] border border-white/10 rounded-2xl p-6">
          {loading ? (
            <p className="text-slate-400 text-center py-8">Loading...</p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10">
                  <th className="pb-3">Influencer</th>
                  <th className="pb-3">Campaign</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  filtered.map((app) => (
                    <tr
                      key={app._id}
                      className="hover:bg-white/5 transition text-slate-300"
                    >
                      <td className="py-4 font-medium">
                        {app.influencer?.name || "Unknown"}
                      </td>
                      <td className="py-4 text-slate-400 text-xs">
                        {app.campaign?.title}
                      </td>
                      <td className="py-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-4 text-right space-x-3">
                        <button
                          onClick={() => setSelected(app)}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setAiTarget(app)}
                          className="text-purple-400 hover:text-purple-300 text-xs"
                        >
                          AI Score
                        </button>
                        {app.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(app._id, "accepted")}
                              disabled={updating === app._id}
                              className="text-emerald-400 hover:text-emerald-300 disabled:opacity-60"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => updateStatus(app._id, "rejected")}
                              disabled={updating === app._id}
                              className="text-rose-400 hover:text-rose-300 disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {/* PROFILE MODAL */}
      <AnimatePresence>
        {selected && (
          <InfluencerProfile
            application={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      {/* AI SCORE MODAL */}
      <AnimatePresence>
        {aiTarget && (
          <AIScoreModal
            application={aiTarget}
            onClose={() => setAiTarget(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ================= STATUS BADGE ================= */

function StatusBadge({ status }) {
  const styles = {
    accepted: "bg-emerald-500/20 text-emerald-300",
    pending: "bg-amber-500/20 text-amber-300",
    rejected: "bg-rose-500/20 text-rose-300",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs ${styles[status] || ""}`}>
      {status}
    </span>
  );
}

/* ================= MODAL ================= */

function Modal({ children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#0F1C24] border border-white/10 rounded-2xl p-8 w-full max-w-md relative"
        initial={{ y: 40 }}
        animate={{ y: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          ✕
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function InfluencerProfile({ application, onClose }) {
  const inf = application.influencer || {};
  const campaign = application.campaign || {};

  return (
    <Modal onClose={onClose}>
      <h3 className="text-xl font-semibold text-slate-100 mb-4">
        {inf.name || "Influencer"}
      </h3>
      <p className="text-slate-400 text-sm mb-4">{inf.email}</p>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <Info label="Campaign" value={campaign.title || "—"} />
        <Info label="Budget" value={campaign.budget ? `$${campaign.budget}` : "—"} />
        <Info label="Niche" value={campaign.targetNiche || "—"} />
        <Info label="App Status" value={application.status} />
      </div>
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <p className="text-slate-100 font-medium">{value}</p>
    </div>
  );
}

function SentimentPill({ sentiment, label }) {
  const colors = {
    positive: "bg-emerald-500/20 text-emerald-400",
    negative: "bg-red-500/20 text-red-400",
    neutral: "bg-slate-500/20 text-slate-300",
  };
  const key = sentiment || "neutral";
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[key]}`}>
      {label || key}
    </span>
  );
}
