import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import api from "../../services/api";
import toast from "react-hot-toast";

const COLORS = ["#6366f1", "#8b5cf6"];

const TYPE_DOT = {
  payment:     "bg-indigo-500",
  campaign:    "bg-violet-500",
  user:        "bg-cyan-500",
  application: "bg-emerald-500",
};

const relTime = (iso) => {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspending, setSuspending] = useState(null);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // ================= FETCH =================
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, activityRes] = await Promise.all([
          api.get("/users/all"),
          api.get("/analytics/activity-log"),
        ]);
        setUsers(usersRes.data);
        setRecentActivity(activityRes.data.activities?.slice(0, 6) ?? []);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
        setActivityLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ================= SUSPEND / ACTIVATE =================
  const toggleSuspend = async (userId, name, isSuspended) => {
    setSuspending(userId);
    try {
      const { data } = await api.put(`/users/${userId}/suspend`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isSuspended: data.isSuspended } : u
        )
      );
      const action = data.isSuspended ? "Suspended" : "Activated";
      toast.success(`${action} ${name}`);
      setSessionLogs((prev) => [
        { action: `${action} user: ${name}`, time: new Date().toISOString(), type: "user" },
        ...prev,
      ]);
    } catch {
      toast.error("Action failed");
    } finally {
      setSuspending(null);
    }
  };

  // ================= EXPORT CSV =================
  const exportCSV = () => {
    const csv =
      "Name,Email,Role,Status\n" +
      users.map((u) => `${u.name},${u.email},${u.role},${u.isSuspended ? "Suspended" : "Active"}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "users.csv";
    a.click();
    setSessionLogs((prev) => [
      { action: "Exported users CSV", time: new Date().toISOString(), type: "user" },
      ...prev,
    ]);
  };

  // ================= FILTER =================
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesTab =
        activeTab === "All" ||
        (activeTab === "Suspended" && u.isSuspended) ||
        u.role === activeTab.toLowerCase();

      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [users, activeTab, search]);

  // ================= STATS =================
  const kpis = [
    { title: "Total Users", value: users.length, change: "" },
    { title: "Brands", value: users.filter((u) => u.role === "brand").length, change: "" },
    { title: "Influencers", value: users.filter((u) => u.role === "influencer").length, change: "" },
    { title: "Suspended", value: users.filter((u) => u.isSuspended).length, change: "" },
  ];

  const userSplit = [
    { name: "Brands", value: users.filter((u) => u.role === "brand").length },
    { name: "Influencers", value: users.filter((u) => u.role === "influencer").length },
  ];

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">User Management</h2>
          <p className="text-slate-500 mt-1">Full platform user control with audit trail</p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
        >
          Export CSV
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-slate-500">{kpi.title}</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-2">
              {loading ? "—" : kpi.value}
            </h3>
          </div>
        ))}
      </div>

      {/* USER DISTRIBUTION CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={userSplit} dataKey="value" nameKey="name" outerRadius={80} label>
                {userSplit.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* AUDIT LOG MINI-FEED */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Audit Log</h3>
            <button
              onClick={() => navigate("../audit-log")}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              View all →
            </button>
          </div>

          {/* session actions (appear instantly when admin acts) */}
          {sessionLogs.length > 0 && (
            <div className="mb-3 space-y-2">
              {sessionLogs.slice(0, 2).map((l, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{l.action}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{relTime(l.time)}</span>
                </div>
              ))}
              <div className="border-t border-dashed border-slate-100 my-2" />
            </div>
          )}

          {/* recent platform activity from API */}
          {activityLoading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-8">
              Loading...
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                       M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-1 flex-1">
              {recentActivity.map((event, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_DOT[event.type] || "bg-slate-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{event.action}</p>
                    <p className="text-xs text-slate-400 truncate">{event.detail}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                    {relTime(event.time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        {["All", "brand", "influencer", "Suspended"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition capitalize
              ${activeTab === tab
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-4 py-2
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* USERS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Joined</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No users found</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge suspended={user.isSuspended} />
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-indigo-600 hover:underline"
                    >
                      View
                    </button>
                    <button
                      onClick={() => toggleSuspend(user._id, user.name, user.isSuspended)}
                      disabled={suspending === user._id}
                      className={`hover:underline disabled:opacity-50 ${
                        user.isSuspended ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {suspending === user._id ? "..." : user.isSuspended ? "Activate" : "Suspend"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}

/* ================= USER MODAL ================= */

function UserModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
           onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">✕</button>

        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white
            ${user.role === "brand" ? "bg-blue-500" : user.role === "admin" ? "bg-indigo-500" : "bg-purple-500"}`}>
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{user.name}</h3>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <InfoRow label="Role" value={<RoleBadge role={user.role} />} />
          <InfoRow label="Status" value={<StatusBadge suspended={user.isSuspended} />} />
          <InfoRow label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
          <InfoRow label="Last Updated" value={new Date(user.updatedAt).toLocaleDateString()} />
          {user.brandDetails?.companyName && (
            <InfoRow label="Company" value={user.brandDetails.companyName} />
          )}
          {user.brandDetails?.industry && (
            <InfoRow label="Industry" value={user.brandDetails.industry} />
          )}
          {user.influencerDetails?.niche && (
            <InfoRow label="Niche" value={user.influencerDetails.niche} />
          )}
          {user.influencerDetails?.followerCount > 0 && (
            <InfoRow label="Followers" value={user.influencerDetails.followerCount.toLocaleString()} />
          )}
          {user.influencerDetails?.socialLinks?.instagram && (
            <InfoRow label="Instagram" value={user.influencerDetails.socialLinks.instagram} />
          )}
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

function InfoRow({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <div className="font-medium text-slate-800">{value}</div>
    </div>
  );
}

/* ================= BADGES ================= */

function RoleBadge({ role }) {
  const styles =
    role === "brand"
      ? "bg-blue-50 text-blue-600"
      : role === "influencer"
      ? "bg-purple-50 text-purple-600"
      : "bg-slate-50 text-slate-600";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${styles}`}>
      {role}
    </span>
  );
}

function StatusBadge({ suspended }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium
      ${suspended ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
      {suspended ? "Suspended" : "Active"}
    </span>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <p className="text-slate-800 font-medium">{value}</p>
    </div>
  );
}
