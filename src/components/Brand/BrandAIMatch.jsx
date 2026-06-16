import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const NICHE_OPTIONS = [
  "All", "Fashion", "Tech", "Beauty", "Fitness", "Food",
  "Travel", "Gaming", "Music", "Lifestyle", "Education",
];

export default function BrandAIMatch() {
  const [campaigns, setCampaigns] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [scores, setScores] = useState({});
  const [scoring, setScoring] = useState({});
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [campaignSentiment, setCampaignSentiment] = useState(null);
  const [nicheFilter, setNicheFilter] = useState("All");
  const [minScore, setMinScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailTarget, setDetailTarget] = useState(null);
  const [scoringAll, setScoringAll] = useState(false);
  const [sortBy, setSortBy] = useState("score");

  const { user } = useAuth();

  useEffect(() => {
    Promise.all([api.get("/campaigns"), api.get("/users/all")])
      .then(([campRes, usersRes]) => {
        const mine = (campRes.data.campaigns || []).filter(
          (c) => c.brand?._id === user._id || c.brand === user._id
        );
        setCampaigns(mine);
        setInfluencers(usersRes.data.filter((u) => u.role === "influencer"));
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  // Analyze campaign sentiment when selection changes
  useEffect(() => {
    if (!selectedCampaign) { setCampaignSentiment(null); return; }
    const camp = campaigns.find((c) => c._id === selectedCampaign);
    if (!camp) return;
    api.post("/campaigns/sentiment", {
      text: `${camp.title} ${camp.description || ""} ${camp.targetNiche}`,
    })
      .then(({ data }) => setCampaignSentiment(data))
      .catch(() => {});
  }, [selectedCampaign, campaigns]);

  const getScore = async (influencerId) => {
    if (!selectedCampaign) { toast.error("Select a campaign first"); return; }
    setScoring((p) => ({ ...p, [influencerId]: true }));
    try {
      const { data } = await api.post("/campaigns/match-score", {
        campaignId: selectedCampaign,
        influencerId,
      });
      setScores((p) => ({ ...p, [influencerId]: data }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Scoring failed");
    } finally {
      setScoring((p) => ({ ...p, [influencerId]: false }));
    }
  };

  const scoreAll = async () => {
    if (!selectedCampaign) { toast.error("Select a campaign first"); return; }
    setScoringAll(true);
    await Promise.all(filteredInfluencers.slice(0, 10).map((inf) => getScore(inf._id)));
    setScoringAll(false);
    toast.success("AI analysis complete for top 10 influencers");
  };

  const filteredInfluencers = influencers
    .filter((inf) => {
      const niche = inf.influencerDetails?.niche || "";
      const matchNiche = nicheFilter === "All" || niche.toLowerCase().includes(nicheFilter.toLowerCase());
      const sc = scores[inf._id]?.matchScore ?? -1;
      const matchScore = minScore === 0 || sc === -1 || sc >= minScore;
      return matchNiche && matchScore;
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        return (scores[b._id]?.matchScore ?? -1) - (scores[a._id]?.matchScore ?? -1);
      }
      if (sortBy === "followers") {
        return (b.influencerDetails?.followerCount ?? 0) - (a.influencerDetails?.followerCount ?? 0);
      }
      return 0;
    });

  const scoredCount = Object.keys(scores).length;
  const fraudCount = Object.values(scores).filter((s) => s.matchScore === 0 && s.fraudRisk).length;
  const avgScore = scoredCount > 0
    ? Math.round(Object.values(scores).filter((s) => !s.fraudRisk).reduce((sum, s) => sum + (s.matchScore || 0), 0) / Math.max(scoredCount - fraudCount, 1))
    : 0;

  const selectedCamp = campaigns.find((c) => c._id === selectedCampaign);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>

      {/* HEADER */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">AI Matchmaking</h2>
          <p className="text-slate-400 mt-1 text-sm">
            AI-powered scoring using niche alignment, engagement analysis, reach metrics, and sentiment compatibility
          </p>
        </div>
        <button
          onClick={scoreAll}
          disabled={scoringAll || !selectedCampaign}
          className="px-5 py-2.5 rounded-lg bg-indigo-500 text-white font-semibold text-sm
                     hover:bg-indigo-400 disabled:opacity-40 transition"
        >
          {scoringAll ? "Analyzing..." : "Analyze Top 10"}
        </button>
      </div>

      {/* CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Campaign</label>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full bg-[#0F1C24] border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 text-sm"
          >
            <option value="">— Select a campaign —</option>
            {campaigns.map((c) => (
              <option key={c._id} value={c._id}>{c.title} · ${c.budget}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Niche Filter</label>
          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className="w-full bg-[#0F1C24] border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 text-sm"
          >
            {NICHE_OPTIONS.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-[#0F1C24] border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 text-sm"
          >
            <option value="score">Match Score</option>
            <option value="followers">Followers</option>
          </select>
        </div>
      </div>

      {/* CAMPAIGN SENTIMENT PANEL */}
      <AnimatePresence>
        {selectedCamp && campaignSentiment && (
          <motion.div
            className="bg-[#0F1C24] border border-white/10 rounded-2xl p-5"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Campaign Sentiment Analysis</p>
                <h3 className="text-slate-100 font-semibold">{selectedCamp.title}</h3>
                <p className="text-slate-400 text-sm mt-0.5">{selectedCamp.targetNiche} · ${selectedCamp.budget}</p>
              </div>
              <div className="flex items-center gap-4">
                <SentimentBadge sentiment={campaignSentiment.sentiment} label={campaignSentiment.label} score={campaignSentiment.score} />
                <div className="text-right">
                  <p className="text-xs text-slate-400">Polarity</p>
                  <p className={`font-bold ${campaignSentiment.polarity >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {campaignSentiment.polarity >= 0 ? "+" : ""}{campaignSentiment.polarity}
                  </p>
                </div>
              </div>
            </div>
            {(campaignSentiment.keywords?.positive?.length > 0 || campaignSentiment.keywords?.negative?.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {campaignSentiment.keywords.positive.map((k) => (
                  <span key={k} className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs">{k}</span>
                ))}
                {campaignSentiment.keywords.negative.map((k) => (
                  <span key={k} className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs">{k}</span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Influencers", value: influencers.length },
          { label: "Analyzed", value: scoredCount },
          { label: "Avg Score", value: avgScore || "—" },
          { label: "Fraud Flagged", value: fraudCount, alert: fraudCount > 0 },
        ].map((s) => (
          <div key={s.label} className="bg-[#0F1C24] border border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.alert ? "text-red-400" : "text-slate-100"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* MIN SCORE SLIDER */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-400 whitespace-nowrap">Min Score: {minScore}</span>
        <input
          type="range" min={0} max={90} step={10}
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="flex-1 accent-indigo-500"
        />
        <span className="text-xs text-slate-500">{filteredInfluencers.length} showing</span>
      </div>

      {/* INFLUENCER GRID */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading influencers...</div>
      ) : filteredInfluencers.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No influencers match the current filters</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredInfluencers.map((inf) => {
            const sc = scores[inf._id];
            const isScoring = scoring[inf._id];
            const isFraud = sc?.matchScore === 0 && sc?.fraudRisk;

            return (
              <motion.div
                key={inf._id}
                whileHover={{ y: -3 }}
                className="bg-[#0F1C24] border border-white/10 rounded-2xl p-5 space-y-4"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                                  flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {inf.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100 truncate">{inf.name}</p>
                    <p className="text-xs text-slate-400 truncate">{inf.email}</p>
                  </div>
                  {isFraud && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold flex-shrink-0">
                      Fraud
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <StatBox label="Niche" value={inf.influencerDetails?.niche || "—"} small />
                  <StatBox label="Followers" value={fmt(inf.influencerDetails?.followerCount)} />
                  <StatBox label="Avg Likes" value={fmt(inf.influencerDetails?.stats?.avgLikes)} />
                </div>

                {/* Score + sentiment */}
                {sc ? (
                  <div className={`rounded-xl p-3 space-y-2
                    ${isFraud
                      ? "bg-red-500/10 border border-red-500/25"
                      : sc.matchScore >= 70 ? "bg-emerald-500/10 border border-emerald-500/25"
                      : sc.matchScore >= 40 ? "bg-amber-500/10 border border-amber-500/25"
                      : "bg-slate-500/10 border border-slate-500/25"}`}>
                    {isFraud ? (
                      <div className="text-center">
                        <p className="text-red-400 font-semibold text-sm">Suspicious Activity Detected</p>
                        <p className="text-red-300 text-xs mt-1">Risk: {sc.fraudRisk}%</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-2xl font-bold
                              ${sc.matchScore >= 70 ? "text-emerald-400"
                              : sc.matchScore >= 40 ? "text-amber-400" : "text-slate-400"}`}>
                              {sc.matchScore}
                              <span className="text-xs text-slate-500 font-normal ml-1">/ 100</span>
                            </p>
                            <p className="text-xs text-slate-500">Match Score</p>
                          </div>
                          {sc.sentiment && (
                            <SentimentBadge
                              sentiment={sc.sentiment.influencer?.sentiment}
                              label={sc.sentiment.influencer?.label}
                              score={sc.sentiment.compatibility}
                              compact
                            />
                          )}
                        </div>
                        {sc.sentiment?.compatibility !== undefined && (
                          <div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>Sentiment Compatibility</span>
                              <span>{sc.sentiment.compatibility}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full">
                              <div
                                className={`h-1.5 rounded-full ${
                                  sc.sentiment.compatibility >= 70 ? "bg-emerald-500"
                                  : sc.sentiment.compatibility >= 40 ? "bg-amber-500"
                                  : "bg-red-500"
                                }`}
                                style={{ width: `${sc.sentiment.compatibility}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-3 text-center text-slate-500 text-sm">
                    Not analyzed yet
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => getScore(inf._id)}
                    disabled={isScoring || !selectedCampaign}
                    className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold
                               hover:bg-indigo-500 disabled:opacity-40 transition"
                  >
                    {isScoring ? "Analyzing..." : sc ? "Re-analyze" : "Analyze"}
                  </button>
                  {sc && !isFraud && (
                    <button
                      onClick={() => setDetailTarget({ inf, sc })}
                      className="px-3 py-2 rounded-lg bg-white/10 text-slate-300 text-xs hover:bg-white/15 transition"
                    >
                      Details
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {detailTarget && (
          <MatchDetailModal
            inf={detailTarget.inf}
            sc={detailTarget.sc}
            onClose={() => setDetailTarget(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── DETAIL MODAL ─── */
function MatchDetailModal({ inf, sc, onClose }) {
  const sentiment = sc.sentiment;

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#0F1C24] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ y: 30 }} animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{inf.name}</h3>
            <p className="text-xs text-slate-400">{inf.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Score ring */}
        <div className="flex items-center justify-center gap-8 py-5 bg-white/5 rounded-xl mb-5">
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto
              ${sc.matchScore >= 70 ? "bg-emerald-500/20 text-emerald-400"
              : sc.matchScore >= 40 ? "bg-amber-500/20 text-amber-400"
              : "bg-slate-500/20 text-slate-400"}`}>
              {sc.matchScore}
            </div>
            <p className="text-xs text-slate-400 mt-2">Match Score</p>
          </div>
          {sentiment && (
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto
                ${sentiment.compatibility >= 70 ? "bg-purple-500/20 text-purple-400"
                : sentiment.compatibility >= 40 ? "bg-amber-500/20 text-amber-400"
                : "bg-slate-500/20 text-slate-400"}`}>
                {sentiment.compatibility}
              </div>
              <p className="text-xs text-slate-400 mt-2">Tone Match</p>
            </div>
          )}
          <div className="text-center">
            <span className="text-2xl">✓</span>
            <p className="text-xs text-emerald-400 mt-1">Authentic</p>
          </div>
        </div>

        {/* AI Reasoning */}
        {Array.isArray(sc.reasoning) && sc.reasoning.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-200 mb-2">AI Reasoning</p>
            <div className="space-y-2">
              {sc.reasoning.map((r, i) => (
                <div key={i} className="flex items-start gap-2 bg-white/5 rounded-lg p-2.5">
                  <span className="text-indigo-400 text-xs mt-0.5">▸</span>
                  <span className="text-slate-300 text-xs">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sentiment Analysis */}
        {sentiment && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-200 mb-2">Sentiment Analysis</p>
            <div className="grid grid-cols-2 gap-3">
              <SentimentCard title="Campaign Tone" data={sentiment.campaign} />
              <SentimentCard title="Influencer Tone" data={sentiment.influencer} />
            </div>
            <div className="mt-3 bg-white/5 rounded-xl p-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Tone Compatibility</span>
                <span className={sentiment.compatibility >= 70 ? "text-emerald-400" : "text-amber-400"}>
                  {sentiment.compatibility}%
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full">
                <div
                  className={`h-2 rounded-full ${sentiment.compatibility >= 70 ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${sentiment.compatibility}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition text-sm"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── SENTIMENT CARD ─── */
function SentimentCard({ title, data }) {
  if (!data) return null;
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <p className="text-xs text-slate-400 mb-1">{title}</p>
      <SentimentBadge sentiment={data.sentiment} label={data.label} score={data.score} />
      {data.keywords?.positive?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.keywords.positive.map((k) => (
            <span key={k} className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">{k}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── REUSABLE COMPONENTS ─── */
function SentimentBadge({ sentiment, label, score, compact }) {
  const colors = {
    positive: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    negative: "bg-red-500/20 text-red-400 border-red-500/30",
    neutral: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  const icons = { positive: "↑", negative: "↓", neutral: "→" };
  const key = sentiment || "neutral";

  if (compact) {
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs border ${colors[key]}`}>
        {icons[key]} {score}%
      </span>
    );
  }
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${colors[key]}`}>
      <span className="font-bold">{icons[key]}</span>
      <span className="text-xs font-medium">{label || key}</span>
      <span className="text-xs opacity-70">{score}%</span>
    </div>
  );
}

function StatBox({ label, value, small }) {
  return (
    <div className="bg-white/5 rounded-lg p-2 text-center">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className={`font-semibold text-slate-100 mt-0.5 truncate ${small ? "text-xs" : "text-sm"}`}>{value}</p>
    </div>
  );
}

function fmt(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
