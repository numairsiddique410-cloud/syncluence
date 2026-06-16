import { useState } from "react";

export default function ChatWindow({ activeChat }) {
  const [message, setMessage] = useState("");

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        Select a conversation
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950">

      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-800">
        <h3 className="text-white font-medium">{activeChat.name}</h3>
        <p className="text-xs text-slate-400">{activeChat.platform}</p>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="max-w-sm bg-slate-800 text-slate-200 px-4 py-2 rounded-lg">
          Hi! I’m interested in your campaign.
        </div>

        <div className="max-w-sm ml-auto bg-indigo-500 text-white px-4 py-2 rounded-lg">
          Great! Let’s discuss the details.
        </div>
      </div>

      {/* INPUT */}
      <div className="p-4 border-t border-slate-800 flex gap-3">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 rounded-lg">
          Send
        </button>
      </div>

    </div>
  );
}
