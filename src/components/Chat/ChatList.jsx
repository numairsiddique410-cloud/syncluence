const creators = [
  { id: 1, name: "Ayesha Khan", platform: "Instagram", unread: 2 },
  { id: 2, name: "Ali Raza", platform: "TikTok", unread: 0 },
  { id: 3, name: "Sara Malik", platform: "YouTube", unread: 1 },
];

export default function ChatList({ onSelect, activeChat }) {
  return (
    <div className="w-72 border-r border-slate-800 bg-slate-900">
      <div className="p-4 font-semibold text-white">Messages</div>

      <div className="space-y-1 px-2">
        {creators.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={`w-full text-left px-3 py-3 rounded-lg transition
              ${
                activeChat?.id === c.id
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-slate-400">{c.platform}</p>
              </div>

              {c.unread > 0 && (
                <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                  {c.unread}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
