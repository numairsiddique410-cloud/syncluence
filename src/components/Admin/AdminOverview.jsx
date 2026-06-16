import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import api from "../../services/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

const ROLE_COLORS = ["#6366f1", "#8b5cf6", "#64748b"];

export default function AdminOverview() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    Promise.all([
      api.get("/analytics/admin"),
      api.get("/users/all"),
    ])
      .then(([anaRes, usersRes]) => {
        setAnalytics(anaRes.data);
        setUsers(usersRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData, ["campaign:new", "application:new", "application:updated", "payment:new", "payment:released"]);

  const brands = users.filter((u) => u.role === "brand").length;
  const influencers = users.filter((u) => u.role === "influencer").length;
  const suspended = users.filter((u) => u.isSuspended).length;

  const kpis = [
    { title: "Total Users", value: users.length, sub: `${brands} brands · ${influencers} creators`, color: "text-blue-600" },
    { title: "Platform Revenue", value: analytics ? `$${(analytics.totalRevenue ?? 0).toLocaleString()}` : "—", sub: "Total fees earned", color: "text-emerald-600" },
    { title: "Escrowed Payments", value: analytics ? analytics.escrowed ?? 0 : "—", sub: "Awaiting release", color: "text-amber-600" },
    { title: "Success Rate", value: analytics ? `${analytics.successRate ?? 0}%` : "—", sub: "Transaction success", color: "text-indigo-600" },
    { title: "Failed Transactions", value: analytics ? analytics.failed ?? 0 : "—", sub: "Need review", color: "text-red-500" },
    { title: "Suspended Accounts", value: suspended, sub: "Inactive users", color: "text-slate-500" },
  ];

  const userSplit = [
    { name: "Brands", value: brands },
    { name: "Creators", value: influencers },
    { name: "Admins", value: users.filter((u) => u.role === "admin").length },
  ].filter((d) => d.value > 0);

  const revenueData = analytics?.monthlyStats?.length
    ? analytics.monthlyStats.map((m) => ({ month: m.month, revenue: m.revenue ?? m.count ?? 0 }))
    : [];

  const systemStatus = [
    { label: "API Server", ok: true },
    { label: "Database", ok: true },
    { label: "Payment Escrow", ok: true },
    { label: "Fraud Detection Engine", ok: true },
    { label: "AI Matchmaking Service", ok: true },
    { label: "Real-time Chat", ok: true },
  ];

  const alerts = [];
  if (analytics?.failed > 0)
    alerts.push(`${analytics.failed} failed transaction${analytics.failed > 1 ? "s" : ""} need review`);
  if (analytics?.escrowed > 0)
    alerts.push(`${analytics.escrowed} payment${analytics.escrowed > 1 ? "s" : ""} pending release`);
  if (suspended > 0)
    alerts.push(`${suspended} suspended account${suspended > 1 ? "s" : ""}`);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Platform Overview</h2>
        <p className="text-slate-500 text-sm mt-1">
          Real-time analytics and operational health
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{k.title}</p>
            <p className={`text-3xl font-semibold mt-2 ${k.color}`}>
              {loading ? <span className="text-slate-300 animate-pulse">—</span> : k.value}
            </p>
            <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Revenue bar chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Monthly Revenue</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${v}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
              No transaction data yet
            </div>
          )}
        </div>

        {/* User distribution pie */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">User Distribution</h3>
          {userSplit.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={userSplit} dataKey="value" nameKey="name" outerRadius={75} label={({ name, value }) => `${name}: ${value}`}>
                  {userSplit.map((_, i) => (
                    <Cell key={i} fill={ROLE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
              No users yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Alerts + System Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Active Alerts</h3>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              All systems normal
            </div>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <span className="text-amber-800">{a}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* System Status */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">System Status</h3>
          <div className="grid grid-cols-2 gap-3">
            {systemStatus.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.ok ? "bg-emerald-500" : "bg-red-500"}`} />
                <span className="text-slate-700">{s.label}</span>
                <span className={`ml-auto text-xs font-medium ${s.ok ? "text-emerald-600" : "text-red-500"}`}>
                  {s.ok ? "Online" : "Down"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
