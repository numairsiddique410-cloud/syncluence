import { useEffect } from "react";
import ChatWindow from "../Shared/ChatWindow";
import { useChat } from "../../context/useChat";

export default function BrandChat() {
  const { clearUnread } = useChat();

  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-slate-400 text-sm mt-1">Chat with influencers about campaigns</p>
      </div>
      <ChatWindow theme="dark" />
    </div>
  );
}
