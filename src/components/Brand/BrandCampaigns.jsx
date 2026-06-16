import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
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
import { useAuth } from "../../context/AuthContext";

/* ================= NICHES ================= */
const NICHES = [
  "Fashion", "Beauty", "Tech", "Fitness", "Food",
  "Travel", "Gaming", "Lifestyle", "Sports", "Education",
];

/* ================= MAIN ================= */

export default function BrandCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const { user } = useAuth();

  // ================= LOAD CAMPAIGNS =================
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data } = await api.get("/campaigns");
        const mine = data.campaigns.filter(
          (c) => c.brand?._id === user._id || c.brand === user._id
        );
        setCampaigns(mine);
      } catch {
        toast.error("Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  // ================= ADD CAMPAIGN =================
  const handleAdd = (newCampaign) => {
    setCampaigns((prev) => [newCampaign, ...prev]);
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">
            Campaign Management
          </h2>
          <p className="text-slate-400">
            Analyze performance, influencers & ROI
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2 rounded-lg bg-cyan-500/20
                     text-cyan-300 hover:bg-cyan-500/30 transition"
        >
          + Add Campaign
        </button>
      </header>

      {/* TABLE */}
      <div className="bg-[#0F1C24] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-6 py-4 text-left">Campaign</th>
              <th className="px-6 py-4">Budget</th>
              <th className="px-6 py-4">Niche</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  No campaigns yet. Create your first campaign!
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c._id} className="hover:bg-white/5">
                  <td className="px-6 py-4 text-slate-200 font-medium">
                    {c.title}
                    <span className="ml-2 text-xs text-slate-400">
                      • {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-center">
                    ${c.budget}
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-center">
                    {c.targetNiche}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelected(c)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium"
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

      {/* MODALS */}
      <AnimatePresence>
        {selected && (
          <CampaignModal
            campaign={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <AddCampaignModal
            onClose={() => setShowAdd(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ================= STATUS PILL ================= */

function StatusPill({ status }) {
  const styles =
    status === "active"
      ? "bg-emerald-500/20 text-emerald-400"
      : status === "completed"
      ? "bg-sky-500/20 text-sky-400"
      : "bg-slate-500/20 text-slate-300";

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${styles}`}>
      {status}
    </span>
  );
}

/* ================= ADD CAMPAIGN MODAL ================= */

function AddCampaignModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    targetNiche: NICHES[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.title || !form.description || !form.budget) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/campaigns", {
        title: form.title,
        description: form.description,
        budget: Number(form.budget),
        targetNiche: form.targetNiche,
      });
      toast.success("Campaign created!");
      onAdd(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#0F1C24] border border-white/10 rounded-2xl
                   w-full max-w-md p-8 space-y-4"
        initial={{ y: 30 }}
        animate={{ y: 0 }}
      >
        <h3 className="text-xl font-semibold text-slate-100">
          Add Campaign
        </h3>

        <input
          name="title"
          placeholder="Campaign title"
          value={form.title}
          onChange={handleChange}
          className="w-full bg-[#0B141A] border border-white/10
                     rounded-lg px-4 py-3 text-slate-100"
        />

        <textarea
          name="description"
          placeholder="Campaign description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="w-full bg-[#0B141A] border border-white/10
                     rounded-lg px-4 py-3 text-slate-100 resize-none"
        />

        <input
          name="budget"
          placeholder="Budget (USD)"
          type="number"
          value={form.budget}
          onChange={handleChange}
          className="w-full bg-[#0B141A] border border-white/10
                     rounded-lg px-4 py-3 text-slate-100"
        />

        <select
          name="targetNiche"
          value={form.targetNiche}
          onChange={handleChange}
          className="w-full bg-[#0B141A] border border-white/10
                     rounded-lg px-4 py-3 text-slate-100"
        >
          {NICHES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="text-slate-400">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-cyan-500/20
                       text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ================= CAMPAIGN DETAILS MODAL ================= */

function CampaignModal({ campaign, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#0F1C24] border border-white/10 rounded-2xl
                   w-full max-w-4xl p-8 space-y-6"
        initial={{ y: 30 }}
        animate={{ y: 0 }}
      >
        <div className="flex justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-100">
              {campaign.title}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {campaign.description}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Placeholder chart (no real daily analytics in backend yet) */}
        <div className="h-48 bg-white/5 rounded-xl p-4 flex items-center justify-center">
          <p className="text-slate-500 text-sm">
            Analytics chart available after campaign runs
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <Detail label="Budget" value={`$${campaign.budget}`} />
          <Detail label="Niche" value={campaign.targetNiche} />
          <Detail label="Status" value={campaign.status} />
        </div>

        <div className="flex justify-between border-t border-white/10 pt-6">
          <button
            onClick={() => exportCSV(campaign)}
            className="px-5 py-2 rounded-lg bg-cyan-500/20
                       text-cyan-300 hover:bg-cyan-500/30"
          >
            Export CSV
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-slate-100 font-medium">{value}</p>
    </div>
  );
}

/* ================= EXPORT ================= */

function exportCSV(campaign) {
  const rows = [
    ["Campaign", campaign.title],
    ["Budget", campaign.budget],
    ["Niche", campaign.targetNiche],
    ["Status", campaign.status],
    ["Description", campaign.description],
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${campaign.title}-report.csv`;
  a.click();
}
