import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

import api from "../../services/api";
import toast from "react-hot-toast";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const { data } = await api.get("/campaigns?limit=100");
      setCampaigns(data.campaigns || []);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);
  useAutoRefresh(fetchCampaigns, ["campaign:new", "application:new", "application:updated"]);

  const filtered = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.brand?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Chart data — budget per campaign (top 6)
  const chartData = campaigns
    .slice(0, 6)
    .map((c) => ({ name: c.title.slice(0, 15), budget: c.budget }));

  // Stats
  const stats = [
    { title: "Total Campaigns", value: campaigns.length },
    { title: "Active", value: campaigns.filter((c) => c.status === "active").length },
    { title: "Completed", value: campaigns.filter((c) => c.status === "completed").length },
    { title: "Expired", value: campaigns.filter((c) => c.status === "expired").length },
  ];

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Campaign Management</h2>
        <p className="text-slate-500 mt-1">All platform campaigns with performance data</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-slate-500">{s.title}</p>
            <h3 className="text-3xl font-semibold text-slate-800 mt-2">
              {loading ? "—" : s.value}
            </h3>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Budget per Campaign */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Budget per Campaign</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="budget" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Status Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Status Breakdown</h3>
          <div className="space-y-4 mt-6">
            {[
              { label: "Active", count: campaigns.filter((c) => c.status === "active").length, color: "bg-emerald-500" },
              { label: "Completed", count: campaigns.filter((c) => c.status === "completed").length, color: "bg-indigo-500" },
              { label: "Expired", count: campaigns.filter((c) => c.status === "expired").length, color: "bg-slate-400" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{s.label}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div
                    className={`h-2 rounded-full ${s.color}`}
                    style={{ width: `${campaigns.length ? (s.count / campaigns.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          placeholder="Search by campaign or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none"
        >
          <option>All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* CAMPAIGNS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-3 text-left">Campaign</th>
              <th className="px-6 py-3 text-left">Brand</th>
              <th className="px-6 py-3 text-left">Niche</th>
              <th className="px-6 py-3 text-right">Budget</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No campaigns found</td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{c.title}</td>
                  <td className="px-6 py-4 text-slate-600">{c.brand?.name || "—"}</td>
                  <td className="px-6 py-4 text-slate-600">{c.targetNiche}</td>
                  <td className="px-6 py-4 text-right font-medium">${c.budget.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelected(c)}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <CampaignModal campaign={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ================= CAMPAIGN MODAL ================= */

function CampaignModal({ campaign, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative"
           onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">✕</button>

        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={campaign.status} />
            <span className="text-xs text-slate-400">{campaign.targetNiche}</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-800">{campaign.title}</h3>
          <p className="text-sm text-slate-500 mt-2">{campaign.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Metric label="Budget" value={`$${campaign.budget?.toLocaleString()}`} />
          <Metric label="Status" value={campaign.status} />
          <Metric label="Brand" value={campaign.brand?.name || "—"} />
          <Metric label="Created" value={new Date(campaign.createdAt).toLocaleDateString()} />
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-600",
    completed: "bg-indigo-50 text-indigo-600",
    expired: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || ""}`}>
      {status}
    </span>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800 mt-1">{value}</p>
    </div>
  );
}
