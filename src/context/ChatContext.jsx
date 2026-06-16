import { createContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "../services/api";

export const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const messageHandlers = useRef(new Map());
  const typingHandlers = useRef(new Map());
  const dataHandlers = useRef(new Map());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!user || !token) return;

    const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setConnected(true);
      // fetch initial unread count
      api.get("/chat/conversations")
        .then(({ data }) => {
          const count = data.reduce((sum, conv) => {
            const mine = conv.unreadCounts?.[user._id] ?? 0;
            return sum + mine;
          }, 0);
          setTotalUnread(count);
        })
        .catch(() => {});
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("receive_message", (message) => {
      messageHandlers.current.forEach((handler) => handler(message));
      // only count as unread if no handler is registered for this conversation
      // (i.e. user is not currently viewing that chat)
      if (!messageHandlers.current.has(message.conversation)) {
        setTotalUnread((prev) => prev + 1);
      }
    });

    socket.on("data:update", ({ type, payload }) => {
      const handlers = dataHandlers.current.get(type);
      if (handlers) handlers.forEach((h) => h(payload));
    });

    socket.on("user_typing", (data) => {
      typingHandlers.current.forEach((handler) => handler({ ...data, isTyping: true }));
    });

    socket.on("user_stop_typing", (data) => {
      typingHandlers.current.forEach((handler) => handler({ ...data, isTyping: false }));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  const joinConversation = useCallback((conversationId) => {
    socketRef.current?.emit("join_conversation", conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    socketRef.current?.emit("leave_conversation", conversationId);
  }, []);

  const emitTyping = useCallback((conversationId) => {
    socketRef.current?.emit("typing", { conversationId });
  }, []);

  const emitStopTyping = useCallback((conversationId) => {
    socketRef.current?.emit("stop_typing", { conversationId });
  }, []);

  const onMessage = useCallback((key, handler) => {
    messageHandlers.current.set(key, handler);
    return () => messageHandlers.current.delete(key);
  }, []);

  const onTyping = useCallback((key, handler) => {
    typingHandlers.current.set(key, handler);
    return () => typingHandlers.current.delete(key);
  }, []);

  const clearUnread = useCallback(() => setTotalUnread(0), []);

  const onDataEvent = useCallback((type, handler) => {
    if (!dataHandlers.current.has(type)) {
      dataHandlers.current.set(type, new Set());
    }
    dataHandlers.current.get(type).add(handler);
    return () => dataHandlers.current.get(type)?.delete(handler);
  }, []);

  return (
    <ChatContext.Provider value={{
      connected,
      totalUnread,
      clearUnread,
      joinConversation,
      leaveConversation,
      emitTyping,
      emitStopTyping,
      onMessage,
      onTyping,
      onDataEvent,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

