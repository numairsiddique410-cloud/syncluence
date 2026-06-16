import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

import api from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

const fmtMonth = (raw) => {
  const [y, m] = raw.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", {
    month: "short", year: "2-digit",
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0b1221] border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-cyan-400 font-bold text-base">${payload[0].value?.toLocaleString()}</p>
    </div>
  );
};

export default function InfluencerEarnings() {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, txRes] = await Promise.all([
        api.get("/analytics/influencer"),
        api.get("/payments/my-transactions"),
      ]);
      setAnalytics(analyticsRes.data);
      setTransactions(txRes.data);
    } catch {
      // silently fall through
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData, ["payment:new", "payment:released"]);

  const chartData = (analytics?.monthlyStats ?? []).map((m) => ({
    month: fmtMonth(m.month),
    earnings: m.revenue ?? 0,
  }));

  const totalEarnings   = analytics?.totalEarnings ?? 0;
  const completedCount  = analytics?.completedCampaigns ?? 0;
  const pendingCount    = analytics?.pendingPayments ?? 0;
  const avgEarning      = completedCount > 0 ? Math.round(totalEarnings / completedCount) : 0;

  const kpis = [
    { title: "Total Earnings",    value: loading ? "—" : `$${totalEarnings.toLocaleString()}`,  color: "text-cyan-400",    sub: "From released payments" },
    { title: "Avg per Campaign",  value: loading ? "—" : `$${avgEarning.toLocaleString()}`,     color: "text-indigo-400",  sub: "Per completed deal" },
    { title: "Pending Payments",  value: loading ? "—" : pendingCount,                          color: "text-amber-400",   sub: "Awaiting release" },
    { title: "All Transactions",  value: loading ? "—" : transactions.length,                   color: "text-slate-300",   sub: "Total transactions" },
  ];

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">Earnings</h2>
        <p className="text-slate-400 mt-1">Track your payouts and earning history</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.title}
            className="bg-slate-900/70 backdrop-blur border border-slate-700/60 rounded-2xl p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3 }}
          >
            <p className="text-slate-400 text-xs mb-2">{k.title}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-slate-600 text-xs mt-1">{k.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* EARNINGS CHART */}
      <motion.div
        className="bg-slate-900/70 backdrop-blur border border-slate-700/60 rounded-2xl p-6"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Monthly Earnings</h3>
            <p className="text-slate-500 text-xs mt-0.5">Your take-home per month after platform fee</p>
          </div>
          {chartData.length > 0 && (
            <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              {chartData.length} month{chartData.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">No earnings yet</p>
            <p className="text-slate-600 text-xs text-center max-w-xs">
              Apply to campaigns and complete deals to start earning. Released payments appear here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#475569"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#475569"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#334155", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fill="url(#earningsGrad)"
                dot={{ fill: "#06b6d4", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: "#06b6d4", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* TRANSACTION HISTORY */}
      <motion.div
        className="bg-slate-900/70 backdrop-blur border border-slate-700/60 rounded-2xl p-6"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h3 className="text-base font-semibold text-slate-100 mb-5">Transaction History</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="pb-3 font-medium">Brand</th>
                <th className="pb-3 font-medium">Campaign</th>
                <th className="pb-3 font-medium">Your Earnings</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-500">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-500">No transactions yet</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="text-slate-300 hover:bg-white/3 transition">
                    <td className="py-4 font-medium text-slate-100">{tx.brand?.name || "—"}</td>
                    <td className="py-4 text-slate-400 text-xs">{tx.campaign?.title || "—"}</td>
                    <td className="py-4 font-semibold text-cyan-400">
                      ${(tx.influencerAmount ?? tx.amount * 0.9).toLocaleString()}
                    </td>
                    <td className="py-4"><StatusPill status={tx.status} /></td>
                    <td className="py-4 text-xs text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatusPill({ status }) {
  const map = {
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    escrowed:  "bg-sky-500/15 text-sky-400 border-sky-500/30",
    pending:   "bg-amber-500/15 text-amber-400 border-amber-500/30",
    created:   "bg-amber-500/15 text-amber-400 border-amber-500/30",
    failed:    "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${map[status] || "bg-slate-500/15 text-slate-400 border-slate-500/30"}`}>
      {status}
    </span>
  );
}
