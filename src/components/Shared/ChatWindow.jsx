import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/useChat";
import toast from "react-hot-toast";

/* ════════════════════════════════════════
   CHAT WINDOW — used by both portals
════════════════════════════════════════ */
export default function ChatWindow({ theme = "dark" }) {
  const { user } = useAuth();
  const chat = useChat();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const inputRef = useRef(null);

  const isDark = theme === "dark";

  /* ── Load conversations ── */
  useEffect(() => {
    api.get("/chat/conversations")
      .then(({ data }) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  /* ── Socket: incoming messages ── */
  useEffect(() => {
    if (!chat) return;
    const unsub = chat.onMessage("chat-window", (msg) => {
      if (msg.conversation === activeConv?._id) {
        setMessages((prev) => [...prev, msg]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversation
            ? { ...c, lastMessage: msg.content, lastMessageAt: new Date() }
            : c
        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    });
    return unsub;
  }, [chat, activeConv]);

  /* ── Socket: typing ── */
  useEffect(() => {
    if (!chat) return;
    const unsub = chat.onTyping("chat-window", ({ userId, name, isTyping }) => {
      if (userId !== user?._id) {
        setTypingUser(isTyping ? name : null);
      }
    });
    return unsub;
  }, [chat, user]);

  /* ── Open conversation ── */
  const openConversation = useCallback(async (conv) => {
    if (activeConv?._id === conv._id) return;
    if (activeConv && chat) chat.leaveConversation(activeConv._id);
    setActiveConv(conv);
    setMessages([]);
    setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/chat/${conv._id}/messages`);
      setMessages(data);
      if (chat) chat.joinConversation(conv._id);
      setConversations((prev) =>
        prev.map((c) => c._id === conv._id ? { ...c, unread: 0 } : c)
      );
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoadingMsgs(false);
    }
  }, [activeConv, chat]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  /* ── Send message ── */
  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    if (chat) chat.emitStopTyping(activeConv._id);

    const optimistic = {
      _id: `opt-${Date.now()}`,
      sender: { _id: user._id, name: user.name },
      content,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const { data } = await api.post(`/chat/${activeConv._id}/messages`, { content });
      setMessages((prev) => prev.map((m) => m._id === optimistic._id ? data : m));
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConv._id ? { ...c, lastMessage: content, lastMessageAt: new Date() } : c
        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      toast.error("Failed to send message");
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  /* ── Typing indicator ── */
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!activeConv || !chat) return;
    chat.emitTyping(activeConv._id);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => chat.emitStopTyping(activeConv._id), 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ── Other participant ── */
  const getOther = (conv) => conv.participants?.find((p) => p._id !== user?._id);

  const filteredConvs = conversations.filter((c) => {
    const other = getOther(c);
    return !search || other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  /* ── Styles ── */
  const bg = isDark ? "bg-[#0B141A]" : "bg-slate-50";
  const sidebar = isDark ? "bg-[#0F1C24] border-white/10" : "bg-white border-slate-200";
  const msgBg = isDark ? "bg-[#0F1C24]" : "bg-white";
  const textPrimary = isDark ? "text-slate-100" : "text-slate-800";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const inputBg = isDark ? "bg-[#1a2a34] border-white/10 text-slate-100 placeholder-slate-500" : "bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-slate-50";
  const activeBg = isDark ? "bg-white/10" : "bg-blue-50";
  const accent = isDark ? "bg-indigo-600" : "bg-blue-600";

  return (
    <div className={`flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden border ${isDark ? "border-white/10" : "border-slate-200"} ${bg}`}>

      {/* ── SIDEBAR ── */}
      <div className={`w-80 flex-shrink-0 flex flex-col border-r ${sidebar}`}>
        {/* Header */}
        <div className="p-4 border-b border-inherit">
          <div className="flex justify-between items-center mb-3">
            <h2 className={`font-semibold text-base ${textPrimary}`}>Messages</h2>
            <button
              onClick={() => setShowNewChat(true)}
              className={`w-8 h-8 rounded-full ${accent} text-white flex items-center justify-center text-lg hover:opacity-90 transition`}
            >
              +
            </button>
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${inputBg}`}
          />
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className={`text-center py-12 px-4 ${textSecondary}`}>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1 opacity-70">Start a new conversation using +</p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const other = getOther(conv);
              const isActive = activeConv?._id === conv._id;
              const unread = conv.unreadCounts?.[user?._id] || 0;
              return (
                <button
                  key={conv._id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left p-4 transition flex items-center gap-3 border-b border-white/5
                    ${isActive ? activeBg : hoverBg}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                                  flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {other?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className={`font-medium text-sm truncate ${textPrimary}`}>{other?.name || "Unknown"}</p>
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${unread > 0 ? (isDark ? "text-slate-200" : "text-slate-700") + " font-medium" : textSecondary}`}>
                      {conv.lastMessage || "No messages yet"}
                    </p>
                    <p className={`text-xs mt-0.5 opacity-50 ${textSecondary}`}>
                      {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ""}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── MESSAGE AREA ── */}
      <div className={`flex-1 flex flex-col ${msgBg}`}>
        {!activeConv ? (
          <div className={`flex-1 flex flex-col items-center justify-center ${textSecondary}`}>
            <p className={`text-lg font-semibold ${textPrimary}`}>Select a conversation</p>
            <p className="text-sm mt-1">Choose from the list or start a new one</p>
          </div>
        ) : (
          <>
            {/* Topbar */}
            <div className={`px-5 py-3 border-b ${isDark ? "border-white/10" : "border-slate-200"} flex items-center gap-3`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                              flex items-center justify-center text-white font-semibold text-sm">
                {getOther(activeConv)?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className={`font-semibold text-sm ${textPrimary}`}>{getOther(activeConv)?.name}</p>
                <p className={`text-xs ${textSecondary} capitalize`}>{getOther(activeConv)?.role}</p>
              </div>
              {chat?.connected && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className={`text-center py-8 text-sm ${textSecondary}`}>
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500
                                        flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                          {msg.sender?.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className={`max-w-[70%] space-y-0.5`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                          ${isMine
                            ? `${accent} text-white rounded-br-sm ${msg.optimistic ? "opacity-70" : ""}`
                            : isDark ? "bg-white/10 text-slate-100 rounded-bl-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"
                          }`}>
                          {msg.content}
                        </div>
                        <p className={`text-xs px-1 ${textSecondary}`}>
                          {formatTime(msg.createdAt)}
                          {isMine && msg.read && !msg.optimistic && " · Read"}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* Typing indicator */}
              <AnimatePresence>
                {typingUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {typingUser?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl rounded-bl-sm flex gap-1 items-center ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={`px-4 py-3 border-t ${isDark ? "border-white/10" : "border-slate-200"} flex items-end gap-3`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                className={`flex-1 px-4 py-2.5 rounded-xl resize-none text-sm border outline-none
                             focus:ring-2 focus:ring-indigo-500/50 transition max-h-32 ${inputBg}`}
                style={{ lineHeight: "1.5" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className={`w-10 h-10 rounded-xl ${accent} text-white flex items-center justify-center
                             hover:opacity-90 disabled:opacity-40 transition flex-shrink-0`}
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* NEW CHAT MODAL */}
      <AnimatePresence>
        {showNewChat && (
          <NewChatModal
            currentUser={user}
            isDark={isDark}
            onStart={(conv) => {
              setConversations((prev) => {
                const exists = prev.find((c) => c._id === conv._id);
                return exists ? prev : [conv, ...prev];
              });
              setShowNewChat(false);
              openConversation(conv);
            }}
            onClose={() => setShowNewChat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── NEW CHAT MODAL ── */
function NewChatModal({ currentUser, isDark, onStart, onClose }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    api.get("/users/all").then(({ data }) => {
      setUsers(data.filter((u) => {
        if (u._id === currentUser?._id) return false;
        if (u.role === "admin") return false;
        if (currentUser?.role === "brand") return u.role === "influencer";
        if (currentUser?.role === "influencer") return u.role === "brand";
        return true;
      }));
    }).catch(() => {});
  }, []);

  const startChat = async (userId) => {
    setStarting(userId);
    try {
      const { data } = await api.post("/chat/conversation", { recipientId: userId });
      onStart(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not start conversation");
    } finally {
      setStarting(null);
    }
  };

  const filtered = users.filter((u) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const bg = isDark ? "bg-[#0F1C24] border-white/10" : "bg-white border-slate-200";
  const textPrimary = isDark ? "text-slate-100" : "text-slate-800";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const inputBg = isDark ? "bg-[#1a2a34] border-white/10 text-slate-100 placeholder-slate-500" : "bg-slate-100 border-transparent text-slate-800";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-slate-50";

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${bg}`}
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-inherit">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-semibold text-base ${textPrimary}`}>New Conversation</h3>
            <button onClick={onClose} className={`${textSecondary} hover:text-slate-100`}>✕</button>
          </div>
          <input
            autoFocus
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg text-sm border outline-none ${inputBg}`}
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className={`text-center py-8 text-sm ${textSecondary}`}>No users found</p>
          ) : (
            filtered.map((u) => (
              <button
                key={u._id}
                onClick={() => startChat(u._id)}
                disabled={starting === u._id}
                className={`w-full flex items-center gap-3 px-5 py-3.5 transition ${hoverBg}`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                                flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {u.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`font-medium text-sm ${textPrimary} truncate`}>{u.name}</p>
                  <p className={`text-xs ${textSecondary} truncate capitalize`}>{u.role} · {u.email}</p>
                </div>
                {starting === u._id ? (
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-indigo-400 text-xs">Start →</span>
                )}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── HELPERS ── */
function timeAgo(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function formatTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
