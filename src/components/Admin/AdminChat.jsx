import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";

/* ══════════════════════════════════════════════
   ADMIN CHAT MONITOR
   Read-only view of all brand-influencer conversations
══════════════════════════════════════════════ */
export default function AdminChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get("/chat/admin/conversations")
      .then(({ data }) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  const openConversation = async (conv) => {
    if (activeConv?._id === conv._id) return;
    setActiveConv(conv);
    setMessages([]);
    setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/chat/admin/${conv._id}/messages`);
      setMessages(data);
    } catch {
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getParticipantByRole = (conv, role) =>
    conv.participants?.find((p) => p.role === role);

  const filteredConvs = conversations.filter((c) => {
    const names = c.participants?.map((p) => p.name?.toLowerCase()).join(" ") || "";
    const matchSearch = !search || names.includes(search.toLowerCase());
    const brand = getParticipantByRole(c, "brand");
    const influencer = getParticipantByRole(c, "influencer");
    const matchRole =
      roleFilter === "all" ||
      (roleFilter === "brand" && brand) ||
      (roleFilter === "influencer" && influencer);
    return matchSearch && matchRole;
  });

  const stats = [
    { label: "Total Conversations", value: conversations.length },
    {
      label: "Total Messages",
      value: conversations.reduce((s, c) => s + (c.messageCount || 0), 0),
    },
    {
      label: "Active Pairs",
      value: conversations.filter((c) => c.messageCount > 0).length,
    },
    {
      label: "Empty Threads",
      value: conversations.filter((c) => !c.messageCount).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Chat Monitor</h2>
        <p className="text-slate-500 text-sm mt-1">
          Read-only view of all brand–influencer conversations
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-semibold text-slate-800 mt-1">
              {loadingConvs ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex h-[calc(100vh-360px)] min-h-[500px]">

        {/* ── LEFT: Conversation list ── */}
        <div className="w-80 flex-shrink-0 border-r border-slate-200 flex flex-col">
          {/* Search + filter */}
          <div className="p-4 border-b border-slate-200 space-y-2">
            <input
              type="text"
              placeholder="Search participants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200
                         bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <div className="flex gap-2">
              {["all", "brand", "influencer"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition
                    ${roleFilter === r
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {r === "all" ? "All" : r === "brand" ? "Brands" : "Creators"}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center h-24">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-10">No conversations found</p>
            ) : (
              filteredConvs.map((conv) => {
                const brand = getParticipantByRole(conv, "brand");
                const influencer = getParticipantByRole(conv, "influencer");
                const isActive = activeConv?._id === conv._id;
                return (
                  <button
                    key={conv._id}
                    onClick={() => openConversation(conv)}
                    className={`w-full text-left px-4 py-3.5 border-b border-slate-100 transition
                      ${isActive ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  >
                    {/* Participants row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <ParticipantChip name={brand?.name} role="brand" />
                      <span className="text-slate-300 text-xs">↔</span>
                      <ParticipantChip name={influencer?.name} role="influencer" />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-400 truncate max-w-[140px]">
                        {conv.lastMessage || "No messages"}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${conv.messageCount > 0
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-slate-100 text-slate-400"}`}>
                        {conv.messageCount || 0} msgs
                      </span>
                    </div>
                    {conv.lastMessageAt && (
                      <p className="text-xs text-slate-300 mt-0.5">
                        {timeAgo(conv.lastMessageAt)}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT: Message thread ── */}
        <div className="flex-1 flex flex-col">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="font-medium text-slate-600">Select a conversation</p>
              <p className="text-sm mt-1">View messages between brand and influencer</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 flex-wrap">
                  <ConvHeader conv={activeConv} getBy={getParticipantByRole} />
                  <span className="ml-auto text-xs text-slate-400 font-medium">
                    {messages.length} message{messages.length !== 1 ? "s" : ""}
                  </span>
                  <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    Read-only — Admin View
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-slate-50/30">
                {loadingMsgs ? (
                  <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-10">No messages in this conversation</p>
                ) : (
                  <>
                    {messages.map((msg, i) => {
                      const brand = getParticipantByRole(activeConv, "brand");
                      const isBrand = msg.sender?._id === brand?._id;
                      return (
                        <motion.div
                          key={msg._id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.3) }}
                          className={`flex ${isBrand ? "justify-start" : "justify-end"}`}
                        >
                          <div className="max-w-[65%]">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                                ${isBrand
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"}`}>
                                {msg.sender?.name}
                              </span>
                              <span className="text-xs text-slate-400">
                                {isBrand ? "Brand" : "Creator"}
                              </span>
                            </div>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                              ${isBrand
                                ? "bg-blue-600 text-white rounded-tl-sm"
                                : "bg-purple-600 text-white rounded-tr-sm"}`}>
                              {msg.content}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 px-1">
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Read-only notice */}
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-slate-400">
                  Admin monitoring mode — you can read messages but cannot participate
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function ParticipantChip({ name, role }) {
  const colors = role === "brand"
    ? "bg-blue-100 text-blue-700"
    : "bg-purple-100 text-purple-700";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium truncate max-w-[90px] ${colors}`}>
      {name || "—"}
    </span>
  );
}

function ConvHeader({ conv, getBy }) {
  const brand = getBy(conv, "brand");
  const influencer = getBy(conv, "influencer");
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
          {brand?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-none">{brand?.name || "Unknown Brand"}</p>
          <p className="text-xs text-slate-400">Brand</p>
        </div>
      </div>
      <span className="text-slate-300 text-sm font-light mx-1">↔</span>
      <div className="flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {influencer?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-none">{influencer?.name || "Unknown Creator"}</p>
          <p className="text-xs text-slate-400">Creator</p>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(date).toLocaleDateString();
}

function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
