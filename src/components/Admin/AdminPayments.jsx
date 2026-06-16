import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import api from "../../services/api";
import toast from "react-hot-toast";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function AdminPayments() {
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(null);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [releaseTarget, setReleaseTarget] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [txRes, analyticsRes] = await Promise.all([
        api.get("/payments/all-transactions"),
        api.get("/analytics/admin"),
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

  // ================= RELEASE PAYMENT =================
  const releasePayment = async (txId) => {
    setReleasing(txId);
    setReleaseTarget(null);
    try {
      await api.post("/payments/release", { transactionId: txId });
      toast.success("Payment released to influencer!");
      setTransactions((prev) =>
        prev.map((t) =>
          t._id === txId
            ? { ...t, status: "completed", isReleased: true, platformFee: t.amount * 0.1, influencerAmount: t.amount * 0.9 }
            : t
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Release failed");
    } finally {
      setReleasing(null);
    }
  };

  const filtered = filter === "All"
    ? transactions
    : transactions.filter((t) => t.status === filter);

  const stats = [
    { title: "Total Revenue", value: analytics ? `$${analytics.totalRevenue?.toLocaleString() ?? 0}` : "—", desc: "Platform fees" },
    { title: "Escrowed", value: analytics ? analytics.escrowed ?? 0 : "—", desc: "Pending release" },
    { title: "Completed", value: transactions.filter((t) => t.status === "completed").length, desc: "Successfully paid" },
    { title: "Failed", value: analytics ? analytics.failed ?? 0 : "—", desc: "Failed transactions" },
  ];

  const chartData = analytics?.monthlyStats?.map((m) => ({
    month: m.month,
    revenue: m.revenue ?? 0,
  })) ?? [];

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Payment Management</h2>
        <p className="text-slate-500 mt-1">
          Manage escrow, release payments, and monitor transactions
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-slate-500">{s.title}</p>
            <h3 className="text-3xl font-semibold text-slate-800 mt-2">
              {loading ? "—" : s.value}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Revenue over time */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData.length ? chartData : [{ month: "—", revenue: 0 }]}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction status breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Transaction Status</h3>
          <div className="space-y-4 mt-4">
            {[
              { label: "Completed", color: "bg-emerald-500", count: transactions.filter((t) => t.status === "completed").length },
              { label: "Escrowed", color: "bg-sky-500", count: transactions.filter((t) => t.status === "escrowed").length },
              { label: "Pending", color: "bg-amber-500", count: transactions.filter((t) => t.status === "pending" || t.status === "created").length },
              { label: "Failed", color: "bg-red-500", count: transactions.filter((t) => t.status === "failed").length },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{s.label}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div
                    className={`h-2 rounded-full ${s.color}`}
                    style={{ width: `${transactions.length ? (s.count / transactions.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex gap-2 flex-wrap">
        {["All", "escrowed", "completed", "pending", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize transition
              ${filter === f ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-3 text-left">Brand</th>
              <th className="px-6 py-3 text-left">Influencer</th>
              <th className="px-6 py-3 text-left">Campaign</th>
              <th className="px-6 py-3 text-right">Amount</th>
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
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No transactions</td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{tx.brand?.name || "—"}</td>
                  <td className="px-6 py-4 text-slate-600">{tx.influencer?.name || "—"}</td>
                  <td className="px-6 py-4 text-slate-600">{tx.campaign?.title || "—"}</td>
                  <td className="px-6 py-4 text-right font-semibold">${tx.amount}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => setSelected(tx)}
                      className="text-indigo-600 hover:underline text-xs"
                    >
                      Details
                    </button>
                    {tx.status === "escrowed" && (
                      <button
                        onClick={() => setReleaseTarget(tx)}
                        disabled={releasing === tx._id}
                        className="text-emerald-600 hover:underline text-xs font-semibold disabled:opacity-50"
                      >
                        {releasing === tx._id ? "Releasing..." : "Release"}
                      </button>
                    )}
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
        <TransactionDetailModal tx={selected} onClose={() => setSelected(null)} />
      )}

      {/* RELEASE CONFIRMATION MODAL */}
      {releaseTarget && (
        <ReleaseConfirmModal
          tx={releaseTarget}
          releasing={releasing === releaseTarget._id}
          onConfirm={() => releasePayment(releaseTarget._id)}
          onClose={() => setReleaseTarget(null)}
        />
      )}
    </div>
  );
}

/* ================= TRANSACTION DETAIL MODAL ================= */

function TransactionDetailModal({ tx, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative"
           onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">✕</button>

        <div className="flex items-center gap-3 mb-5">
          <StatusBadge status={tx.status} />
          <h3 className="text-lg font-semibold text-slate-800">Transaction Details</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Metric label="Brand" value={tx.brand?.name || "—"} />
          <Metric label="Influencer" value={tx.influencer?.name || "—"} />
          <Metric label="Campaign" value={tx.campaign?.title || "—"} />
          <Metric label="Amount" value={`$${tx.amount}`} />
          <Metric label="Platform Fee (10%)" value={`$${tx.platformFee ?? 0}`} />
          <Metric label="Influencer Gets" value={`$${tx.influencerAmount ?? (tx.amount * 0.9).toFixed(2)}`} />
          <Metric label="Status" value={tx.status} />
          <Metric label="Released" value={tx.isReleased ? "Yes ✓" : "No"} />
          <Metric label="Currency" value={(tx.currency || "usd").toUpperCase()} />
          <Metric label="Date" value={new Date(tx.createdAt).toLocaleDateString()} />
        </div>

        {tx.stripePaymentIntentId && (
          <div className="bg-slate-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-400 mb-1">Stripe Payment Intent ID</p>
            <p className="text-xs font-mono text-slate-600 break-all">{tx.stripePaymentIntentId}</p>
          </div>
        )}

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
    completed: "bg-emerald-50 text-emerald-600",
    escrowed: "bg-sky-50 text-sky-600",
    created: "bg-amber-50 text-amber-600",
    pending: "bg-amber-50 text-amber-600",
    failed: "bg-red-50 text-red-600",
    refunded: "bg-rose-50 text-rose-600",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-slate-50 text-slate-500"}`}>
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

/* ================= RELEASE CONFIRMATION MODAL ================= */

function ReleaseConfirmModal({ tx, releasing, onConfirm, onClose }) {
  const platformFee = (tx.amount * 0.1).toFixed(2);
  const influencerGets = (tx.amount * 0.9).toFixed(2);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-600 font-bold text-lg">$</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Release Escrow Payment</h3>
            <p className="text-sm text-slate-500">This action cannot be undone</p>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-5">
          <Row label="Brand" value={tx.brand?.name || "—"} />
          <Row label="Influencer" value={tx.influencer?.name || "—"} />
          <Row label="Campaign" value={tx.campaign?.title || "—"} />
          <div className="border-t border-slate-200 pt-3 mt-1" />
          <Row label="Total Amount" value={`$${tx.amount}`} bold />
          <Row label="Platform Fee (10%)" value={`$${platformFee}`} muted />
          <Row label="Influencer Receives" value={`$${influencerGets}`} green />
        </div>

        <p className="text-xs text-slate-400 text-center mb-5">
          Funds will be marked as released. Confirm only after campaign is completed.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={releasing}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600
                       hover:bg-slate-50 transition font-medium text-sm disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={releasing}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm
                       hover:bg-emerald-500 disabled:opacity-50 transition"
          >
            {releasing ? "Releasing..." : "Confirm Release"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted, green }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${bold ? "text-slate-800 font-semibold" : muted ? "text-slate-400" : green ? "text-emerald-600 font-semibold" : "text-slate-700"}`}>
        {value}
      </span>
    </div>
  );
}
