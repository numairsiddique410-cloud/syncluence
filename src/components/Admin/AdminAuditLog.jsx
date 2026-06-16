import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";

import api from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

/* ── type config ─────────────────────────────────────────── */
const TYPE_CFG = {
  payment:     { label: "Payment",     color: "#6366f1", dot: "bg-indigo-500"  },
  campaign:    { label: "Campaign",    color: "#8b5cf6", dot: "bg-violet-500"  },
  user:        { label: "User",        color: "#06b6d4", dot: "bg-cyan-500"    },
  application: { label: "Application", color: "#10b981", dot: "bg-emerald-500" },
};

const ACTION_COLORS = {
  "Payment Released":  "text-emerald-600 bg-emerald-50 border-emerald-200",
  "Payment Escrowed":  "text-sky-600 bg-sky-50 border-sky-200",
  "Payment Created":   "text-amber-600 bg-amber-50 border-amber-200",
  "Payment Failed":    "text-red-600 bg-red-50 border-red-200",
  "Payment Pending":   "text-amber-600 bg-amber-50 border-amber-200",
  "Campaign Created":  "text-violet-600 bg-violet-50 border-violet-200",
  "User Registered":   "text-cyan-600 bg-cyan-50 border-cyan-200",
  "Account Suspended": "text-red-600 bg-red-50 border-red-200",
};

function actionStyle(action) {
  return ACTION_COLORS[action] || "text-slate-600 bg-slate-50 border-slate-200";
}

const relTime = (iso) => {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

/* ── custom tooltip ──────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-slate-500">{TYPE_CFG[p.dataKey]?.label ?? p.dataKey}:</span>
          <span className="font-semibold text-slate-700">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── main component ─────────────────────────────────────── */
export default function AdminAuditLog() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      const { data: res } = await api.get("/analytics/activity-log");
      setData(res);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData, ["campaign:new", "application:new", "application:updated", "payment:new", "payment:released"]);

  const activities = data?.activities ?? [];
  const dailyStats = data?.dailyStats  ?? [];
  const totals     = data?.typeTotals  ?? {};
  const todayCount = data?.todayCount  ?? 0;

  const pieData = Object.entries(TYPE_CFG).map(([key, cfg]) => ({
    name: cfg.label,
    value: totals[`${key}s`] || totals[key] || 0,
    color: cfg.color,
  })).filter(d => d.value > 0);

  const filtered = typeFilter === "all"
    ? activities
    : activities.filter(a => a.type === typeFilter);

  const kpis = [
    { label: "Today's Events",  value: loading ? "—" : todayCount,                           sub: "Since midnight",          color: "text-indigo-600" },
    { label: "Payments Logged", value: loading ? "—" : totals.payments ?? 0,                  sub: "Transactions recorded",   color: "text-sky-600"    },
    { label: "Campaigns",       value: loading ? "—" : totals.campaigns ?? 0,                 sub: "Campaigns created",       color: "text-violet-600" },
    { label: "Total Events",    value: loading ? "—" : activities.length,                     sub: "All recorded events",     color: "text-emerald-600"},
  ];

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Audit Log</h2>
          <p className="text-slate-500 mt-1">Real-time platform activity across all modules</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200
                     text-slate-600 text-sm hover:bg-slate-50 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
            <p className="text-xs text-slate-500 mb-2">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* 7-day stacked bar */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">7-Day Activity</h3>
          <p className="text-slate-400 text-xs mb-5">Events by type per day</p>
          {loading ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={dailyStats} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Legend
                  formatter={(v) => <span className="text-xs text-slate-500">{TYPE_CFG[v]?.label ?? v}</span>}
                  iconType="circle" iconSize={8}
                />
                {Object.entries(TYPE_CFG).map(([key, cfg]) => (
                  <Bar key={key} dataKey={key + "s"} stackId="a" fill={cfg.color} radius={key === "application" ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie: event type split */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-1">Event Types</h3>
          <p className="text-slate-400 text-xs mb-4">Distribution across all events</p>
          {loading ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
          ) : pieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={44} outerRadius={72} paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-slate-500">{d.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ACTIVITY FEED */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

        {/* Feed header + filter */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Activity Feed</h3>
          <div className="flex items-center gap-2">
            {["all", "payment", "campaign", "user", "application"].map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition border
                  ${typeFilter === f
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
              >
                {f === "all" ? "All" : TYPE_CFG[f]?.label ?? f}
              </button>
            ))}
          </div>
        </div>

        {/* Feed list */}
        <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading activity...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-400 text-sm font-medium">No events recorded yet</p>
              <p className="text-slate-300 text-xs mt-1">Activity appears here in real time as actions happen</p>
            </div>
          ) : (
            filtered.map((event, i) => {
              const tc = TYPE_CFG[event.type] || TYPE_CFG.payment;
              return (
                <div key={i} className="flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50/70 transition">

                  {/* Type dot */}
                  <div className="mt-0.5 flex-shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full block ${tc.dot}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${actionStyle(event.action)}`}>
                        {event.action}
                      </span>
                      <span className="text-slate-500 text-xs truncate">{event.detail}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                    {relTime(event.time)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 text-right">
            Showing {filtered.length} events — updates in real time
          </div>
        )}
      </div>

    </div>
  );
}
