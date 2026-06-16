import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import api from "../../services/api";
import toast from "react-hot-toast";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

/* ================= MAIN ================= */

export default function BrandPayments() {
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [txRes, analyticsRes] = await Promise.all([
        api.get("/payments/my-transactions"),
        api.get("/analytics/brand"),
      ]);
      setTransactions(txRes.data);
      setAnalytics(analyticsRes.data);
    } catch {
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData, ["payment:new", "payment:released"]);

  const stats = [
    {
      label: "Total Spent",
      value: analytics ? `$${analytics.totalSpent?.toLocaleString() ?? 0}` : "—",
    },
    {
      label: "Escrowed",
      value: transactions.filter((t) => t.status === "escrowed").length,
    },
    {
      label: "Completed",
      value: transactions.filter((t) => t.status === "completed").length,
    },
    {
      label: "Success Rate",
      value: analytics ? `${analytics.successRate ?? 0}%` : "—",
    },
  ];

  const chartData = analytics?.monthlyStats?.map((m) => ({
    month: m.month,
    value: m.revenue ?? m.count ?? 0,
  })) ?? [];

  return (
    <motion.div
      className="space-y-12"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-semibold text-slate-100">
          Payments & Billing
        </h2>
        <p className="text-slate-400 mt-2">
          Manage campaign payments and track spending
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -6 }}
            className="bg-gradient-to-br from-[#0F1C24] to-[#0B141A]
                       border border-white/10 rounded-2xl p-6"
          >
            <p className="text-slate-400 text-sm">{s.label}</p>
            <h3 className="text-2xl font-semibold text-slate-100 mt-3">
              {loading ? "—" : s.value}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* REVENUE CHART */}
      <div className="bg-[#0F1C24] border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          Spending Analytics
        </h3>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.length ? chartData : [{ month: "—", value: 0 }]}>
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TRANSACTION TABLE */}
      <div className="bg-[#0F1C24] border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-100">
            Transaction History
          </h3>
          <button
            onClick={() => setShowPayModal(true)}
            className="px-4 py-2 rounded bg-cyan-500 text-black font-semibold text-sm"
          >
            + Initiate Payment
          </button>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <th className="pb-4 text-left">Campaign</th>
              <th className="pb-4 text-left">Influencer</th>
              <th className="pb-4">Amount</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Date</th>
              <th className="pb-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No transactions yet
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-white/5 transition">
                  <td className="py-5 font-medium text-slate-100">
                    {tx.campaign?.title || "—"}
                  </td>
                  <td className="py-5 text-slate-300">
                    {tx.influencer?.name || "—"}
                  </td>
                  <td className="py-5 text-center text-slate-300">
                    ${tx.amount}
                  </td>
                  <td className="py-5 text-center">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-5 text-center text-slate-400 text-xs">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-5 text-right">
                    <button
                      onClick={() => setSelected(tx)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {selected && (
          <TransactionModal
            tx={selected}
            onClose={() => setSelected(null)}
          />
        )}
        {showPayModal && (
          <InitiatePaymentModal
            onClose={() => setShowPayModal(false)}
            onCreated={(tx) => {
              setTransactions((prev) => [tx, ...prev]);
              setShowPayModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ================= STATUS BADGE ================= */

function StatusBadge({ status }) {
  const map = {
    completed: "bg-emerald-500/20 text-emerald-300",
    escrowed: "bg-sky-500/20 text-sky-300",
    created: "bg-amber-500/20 text-amber-300",
    pending: "bg-amber-500/20 text-amber-300",
    failed: "bg-red-500/20 text-red-300",
    refunded: "bg-rose-500/20 text-rose-300",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map[status] || "bg-slate-500/20 text-slate-300"}`}>
      {status}
    </span>
  );
}

/* ================= MODALS ================= */

function ModalWrapper({ children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
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

function TransactionModal({ tx, onClose }) {
  return (
    <ModalWrapper onClose={onClose}>
      <h3 className="text-xl font-semibold text-slate-100 mb-5">
        Transaction Details
      </h3>
      <div className="space-y-3 text-sm">
        <Row label="Campaign" value={tx.campaign?.title || "—"} />
        <Row label="Influencer" value={tx.influencer?.name || "—"} />
        <Row label="Amount" value={`$${tx.amount}`} />
        <Row label="Platform Fee (10%)" value={`$${tx.platformFee ?? 0}`} />
        <Row label="Influencer Gets" value={`$${tx.influencerAmount ?? tx.amount * 0.9}`} />
        <Row label="Status" value={tx.status} />
        <Row label="Stripe ID" value={tx.stripePaymentIntentId?.slice(0, 20) + "..."} />
        <Row label="Date" value={new Date(tx.createdAt).toLocaleString()} />
      </div>
    </ModalWrapper>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-100 font-medium">{value}</span>
    </div>
  );
}

function InitiatePaymentModal({ onClose, onCreated }) {
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({ campaignId: "", influencerId: "", amount: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignsRes, appsRes] = await Promise.all([
          api.get("/campaigns"),
          api.get("/campaigns/brand-applications"),
        ]);
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const mine = (campaignsRes.data.campaigns || []).filter(
          (c) => c.brand?._id === user._id || c.brand === user._id
        );
        setCampaigns(mine);
        setApplications(appsRes.data.filter((a) => a.status === "accepted"));
      } catch {
        toast.error("Failed to load data");
      }
    };
    fetchData();
  }, []);

  const filteredApps = form.campaignId
    ? applications.filter((a) => (a.campaign?._id || a.campaign) === form.campaignId)
    : [];

  const submit = async () => {
    if (!form.campaignId || !form.influencerId || !form.amount) {
      toast.error("Fill all fields");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/payments/create-intent", {
        amount: Number(form.amount),
        campaignId: form.campaignId,
        influencerId: form.influencerId,
      });
      toast.success("Payment initiated. Funds are now held in escrow.");
      onCreated(data.transaction);
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <h3 className="text-xl font-semibold text-slate-100 mb-5">
        Initiate Payment
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-slate-400 text-sm block mb-1">Campaign</label>
          <select
            value={form.campaignId}
            onChange={(e) => setForm({ ...form, campaignId: e.target.value, influencerId: "" })}
            className="w-full bg-[#0B141A] border border-white/10 rounded-lg px-4 py-3 text-slate-100"
          >
            <option value="">Select campaign</option>
            {campaigns.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-400 text-sm block mb-1">Accepted Influencer</label>
          <select
            value={form.influencerId}
            onChange={(e) => setForm({ ...form, influencerId: e.target.value })}
            className="w-full bg-[#0B141A] border border-white/10 rounded-lg px-4 py-3 text-slate-100"
            disabled={!form.campaignId}
          >
            <option value="">Select influencer</option>
            {filteredApps.map((a) => (
              <option key={a._id} value={a.influencer?._id || a.influencer}>
                {a.influencer?.name || "Influencer"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-400 text-sm block mb-1">Amount (USD)</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="e.g. 500"
            className="w-full bg-[#0B141A] border border-white/10 rounded-lg px-4 py-3 text-slate-100"
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-cyan-500 text-black font-semibold
                     disabled:opacity-60 mt-2"
        >
          {loading ? "Processing..." : "Create Payment Intent"}
        </button>

        <p className="text-xs text-slate-500 text-center">
          Payment goes into escrow. Release after campaign completion.
        </p>
      </div>
    </ModalWrapper>
  );
}
