import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";

/* ── shared helpers ──────────────────────────────────────── */
function formatNum(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const RISK_CFG = {
  high:   { label: "High Risk",  bar: "bg-red-500",    badge: "bg-red-100 text-red-700",     text: "text-red-600"    },
  medium: { label: "Suspicious", bar: "bg-amber-400",  badge: "bg-amber-100 text-amber-700", text: "text-amber-600"  },
  low:    { label: "Authentic",  bar: "bg-emerald-500",badge: "bg-emerald-100 text-emerald-700", text: "text-emerald-600" },
};

const TIER_CFG = {
  Nano:  "bg-sky-100 text-sky-700",
  Micro: "bg-violet-100 text-violet-700",
  Macro: "bg-indigo-100 text-indigo-700",
  Mega:  "bg-pink-100 text-pink-700",
};

/* ═══════════════════════════════════════════════════════════
   TAB 1 — AI Fraud Scan (unchanged logic)
════════════════════════════════════════════════════════════ */
const AI_RISK_LEVELS = [
  { label: "All", min: 0 },
  { label: "High Risk (≥70)", min: 70 },
  { label: "Medium (40-69)", min: 40, max: 69 },
  { label: "Low (<40)", min: 0, max: 39 },
];

function AIFraudTab() {
  const [influencers, setInfluencers] = useState([]);
  const [scores, setScores]           = useState({});
  const [scanning, setScanning]       = useState({});
  const [loading, setLoading]         = useState(true);
  const [riskFilter, setRiskFilter]   = useState("All");
  const [scanningAll, setScanningAll] = useState(false);
  const [campaigns, setCampaigns]     = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");

  useEffect(() => {
    Promise.all([api.get("/users/all"), api.get("/campaigns")])
      .then(([usersRes, campRes]) => {
        setInfluencers(usersRes.data.filter((u) => u.role === "influencer"));
        const camps = campRes.data.campaigns || [];
        setCampaigns(camps);
        if (camps.length > 0) setSelectedCampaign(camps[0]._id);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const scanInfluencer = async (influencerId) => {
    if (!selectedCampaign) { toast.error("Select a campaign to scan against"); return; }
    setScanning((p) => ({ ...p, [influencerId]: true }));
    try {
      const { data } = await api.post("/campaigns/match-score", { campaignId: selectedCampaign, influencerId });
      setScores((p) => ({ ...p, [influencerId]: data }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Scan failed");
    } finally {
      setScanning((p) => ({ ...p, [influencerId]: false }));
    }
  };

  const scanAll = async () => {
    if (!selectedCampaign) { toast.error("Select a campaign first"); return; }
    setScanningAll(true);
    await Promise.all(influencers.slice(0, 20).map((inf) => scanInfluencer(inf._id)));
    setScanningAll(false);
    toast.success("Scan complete");
  };

  const fraudCount   = Object.values(scores).filter((s) => s.matchScore === 0 && s.fraudRisk).length;
  const scannedCount = Object.keys(scores).length;

  const filtered = influencers.filter((inf) => {
    const sc = scores[inf._id];
    if (riskFilter === "All") return true;
    if (!sc) return false;
    const level = AI_RISK_LEVELS.find((r) => r.label === riskFilter);
    if (!level) return true;
    if (sc.matchScore === 0 && sc.fraudRisk) {
      return sc.fraudRisk >= (level.min ?? 0) && sc.fraudRisk <= (level.max ?? 100);
    }
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-end">
        <button
          onClick={scanAll}
          disabled={scanningAll || !selectedCampaign}
          className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm
                     hover:bg-red-500 disabled:opacity-40 transition"
        >
          {scanningAll ? "Scanning..." : "Scan All (Top 20)"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Campaign Context</label>
          <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 text-sm">
            <option value="">— Choose a campaign —</option>
            {campaigns.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Filter by Risk Level</label>
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 text-sm">
            {AI_RISK_LEVELS.map((r) => <option key={r.label}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Influencers", value: influencers.length, color: "bg-blue-50 text-blue-700" },
          { label: "Scanned",           value: scannedCount,        color: "bg-indigo-50 text-indigo-700" },
          { label: "Fraud Flagged",     value: fraudCount,          color: "bg-red-50 text-red-700" },
          { label: "Clean",             value: scannedCount - fraudCount, color: "bg-emerald-50 text-emerald-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-xs opacity-70">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-slate-500 py-10">Loading influencers...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-500">
                <th className="px-6 py-4">Influencer</th>
                <th className="px-6 py-4">Niche</th>
                <th className="px-6 py-4">Followers</th>
                <th className="px-6 py-4">Fraud Status</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inf) => {
                const sc = scores[inf._id];
                const isScanning = scanning[inf._id];
                const isFraud = sc?.matchScore === 0 && sc?.fraudRisk;
                return (
                  <motion.tr key={inf._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center
                                        justify-center font-bold text-xs flex-shrink-0">
                          {inf.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{inf.name}</p>
                          <p className="text-xs text-slate-400">{inf.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{inf.influencerDetails?.niche || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{formatNum(inf.influencerDetails?.followerCount)}</td>
                    <td className="px-6 py-4">
                      {!sc ? (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs">Not scanned</span>
                      ) : isFraud ? (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold">Fraud Detected</span>
                      ) : (
                        <div className="space-y-1">
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold block w-fit">Authentic</span>
                          {sc.sentiment?.influencer && (
                            <span className={`px-2 py-0.5 rounded text-xs block w-fit
                              ${sc.sentiment.influencer.sentiment === "positive" ? "bg-emerald-50 text-emerald-600"
                              : sc.sentiment.influencer.sentiment === "negative" ? "bg-red-50 text-red-600"
                              : "bg-slate-100 text-slate-500"}`}>
                              {sc.sentiment.influencer.label}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sc ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[80px]">
                            <div className={`h-2 rounded-full ${isFraud ? "bg-red-500" : "bg-emerald-500"}`}
                              style={{ width: `${isFraud ? sc.fraudRisk || 80 : sc.matchScore}%` }} />
                          </div>
                          <span className={`text-xs font-medium ${isFraud ? "text-red-600" : "text-emerald-600"}`}>
                            {isFraud ? `${sc.fraudRisk}% risk` : `${sc.matchScore} score`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => scanInfluencer(inf._id)} disabled={isScanning || !selectedCampaign}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium
                                   hover:bg-indigo-500 disabled:opacity-40 transition">
                        {isScanning ? "Scanning..." : sc ? "Re-scan" : "Scan"}
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  {riskFilter !== "All" ? "No influencers match this risk filter" : "No influencers found"}
                </td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {fraudCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="text-red-700 font-semibold mb-3">Fraud Report Summary</h3>
          <div className="space-y-3">
            {influencers
              .filter((inf) => scores[inf._id]?.matchScore === 0 && scores[inf._id]?.fraudRisk)
              .map((inf) => {
                const sc = scores[inf._id];
                return (
                  <div key={inf._id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-red-100">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {inf.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{inf.name}</p>
                      <p className="text-xs text-red-600 mt-0.5">Risk: {sc.fraudRisk}% — {sc.reasoning}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — Fake Follower Analysis
════════════════════════════════════════════════════════════ */
function FakeFollowerTab() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [riskFilter, setRisk]   = useState("all");
  const [expanded, setExpanded] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: res } = await api.get("/users/fake-follower-analysis");
      setData(res);
    } catch {
      toast.error("Failed to load follower analysis");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const results = data?.results ?? [];
  const summary = data?.summary ?? {};

  const filtered = riskFilter === "all" ? results : results.filter(r => r.riskLevel === riskFilter);

  return (
    <div className="space-y-6">

      {/* How it works banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4 text-sm text-indigo-700 flex items-start gap-3">
        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <span className="font-semibold">How detection works: </span>
          Each follower tier (Nano/Micro/Macro/Mega) has an expected minimum engagement rate.
          If actual engagement is far below that benchmark, the gap estimates what % of followers are fake.
          Engagement Rate = (Avg Likes + Avg Comments) ÷ Followers × 100.
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Analysed", value: loading ? "—" : summary.total ?? 0,      color: "bg-slate-50 text-slate-700"      },
          { label: "High Risk",      value: loading ? "—" : summary.highRisk ?? 0,   color: "bg-red-50 text-red-700"          },
          { label: "Suspicious",     value: loading ? "—" : summary.mediumRisk ?? 0, color: "bg-amber-50 text-amber-700"      },
          { label: "Avg Fake %",     value: loading ? "—" : `${summary.avgFakePct ?? 0}%`, color: "bg-violet-50 text-violet-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-xs opacity-70">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter + refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {["all", "high", "medium", "low"].map((f) => (
            <button key={f} onClick={() => setRisk(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize border transition
                ${riskFilter === f
                  ? f === "high"   ? "bg-red-600 text-white border-red-600"
                  : f === "medium" ? "bg-amber-500 text-white border-amber-500"
                  : f === "low"    ? "bg-emerald-600 text-white border-emerald-600"
                  :                  "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}>
              {f === "all" ? "All" : RISK_CFG[f]?.label}
            </button>
          ))}
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-500 text-xs hover:bg-slate-50 transition">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400">
          Analysing followers...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400">
          No influencers found for this filter
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-slate-500 text-xs">
                <th className="px-6 py-3.5">Influencer</th>
                <th className="px-6 py-3.5">Tier</th>
                <th className="px-6 py-3.5">Followers</th>
                <th className="px-6 py-3.5">Engagement</th>
                <th className="px-6 py-3.5">Expected</th>
                <th className="px-6 py-3.5 min-w-[180px]">Fake Followers</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inf) => {
                const cfg  = RISK_CFG[inf.riskLevel];
                const isEx = expanded === inf._id;
                return (
                  <>
                    <tr key={inf._id}
                      className={`hover:bg-slate-50 transition cursor-pointer ${isEx ? "bg-slate-50" : ""}`}
                      onClick={() => setExpanded(isEx ? null : inf._id)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700
                                          flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {inf.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{inf.name}</p>
                            <p className="text-xs text-slate-400">{inf.niche || inf.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TIER_CFG[inf.tier]}`}>
                          {inf.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{formatNum(inf.followers)}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${inf.engagementRate >= inf.expectedEngagement ? "text-emerald-600" : "text-red-500"}`}>
                          {inf.engagementRate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">&ge;{inf.expectedEngagement}%</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 rounded-full h-2.5 max-w-[100px]">
                            <motion.div
                              className={`h-2.5 rounded-full ${cfg.bar}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${inf.fakeFollowerPct}%` }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${cfg.text}`}>{inf.fakeFollowerPct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        <svg className={`w-4 h-4 transition-transform ${isEx ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>

                    {/* Expanded breakdown row */}
                    <AnimatePresence>
                      {isEx && (
                        <motion.tr key={`${inf._id}-exp`}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td colSpan={8} className="px-8 pb-5 pt-2 bg-slate-50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <Detail label="Avg Likes"         value={formatNum(inf.avgLikes)}                  color="text-indigo-600" />
                              <Detail label="Avg Comments"      value={formatNum(inf.avgComments)}               color="text-violet-600" />
                              <Detail label="Est. Real Followers" value={formatNum(inf.estimatedRealCount)}      color="text-emerald-600" />
                              <Detail label="Est. Fake Followers"  value={formatNum(inf.estimatedFakeCount)}     color="text-red-500" />
                            </div>
                            <p className="text-xs text-slate-500 mt-3">
                              <span className="font-semibold">Why: </span>
                              {inf.engagementRate === 0 && inf.followers > 1000
                                ? "No engagement data on record — accounts with zero likes/comments on a large following are typically bot-inflated."
                                : inf.fakeFollowerPct >= 40
                                ? `Engagement rate (${inf.engagementRate}%) is significantly below the ${inf.tier} account benchmark of ≥${inf.expectedEngagement}%. The gap suggests a large proportion of followers are inactive or purchased.`
                                : inf.fakeFollowerPct >= 20
                                ? `Engagement rate (${inf.engagementRate}%) is below the ${inf.tier} benchmark of ≥${inf.expectedEngagement}%. Some follower inflation is likely but the account may still be authentic.`
                                : `Engagement rate (${inf.engagementRate}%) meets or exceeds the ${inf.tier} benchmark of ≥${inf.expectedEngagement}%. Follower base appears genuine.`
                              }
                            </p>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Tier legend */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Tier Benchmarks</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { tier: "Nano",  range: "< 10K",    expected: "≥ 5%"   },
            { tier: "Micro", range: "10K–100K", expected: "≥ 2.5%" },
            { tier: "Macro", range: "100K–1M",  expected: "≥ 1.5%" },
            { tier: "Mega",  range: "1M+",      expected: "≥ 0.8%" },
          ].map((t) => (
            <div key={t.tier} className="bg-slate-50 rounded-lg p-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TIER_CFG[t.tier]}`}>{t.tier}</span>
              <p className="text-slate-500 mt-1.5">{t.range}</p>
              <p className="font-semibold text-slate-700">Expected: <span className="text-indigo-600">{t.expected}</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, color }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-slate-200">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT — Tab shell
════════════════════════════════════════════════════════════ */
const TABS = [
  { id: "ai",     label: "AI Fraud Scan"         },
  { id: "fake",   label: "Fake Follower Analysis" },
];

export default function AdminFraud() {
  const [tab, setTab] = useState("ai");

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Fraud Detection</h2>
        <p className="text-slate-500 mt-1">
          AI-powered influencer fraud scanning and fake follower analysis
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition
              ${tab === t.id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {tab === "ai"   && <AIFraudTab />}
          {tab === "fake" && <FakeFollowerTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
