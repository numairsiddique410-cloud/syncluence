import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/useChat";

export default function BrandDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalUnread } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const close = () => setSidebarOpen(false);

  const navItem =
    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition text-sm";
  const activeNav = "bg-indigo-500/15 text-indigo-400 font-medium";

  const links = [
    { to: "/brand/dashboard",             label: "Overview",       end: true  },
    { to: "/brand/dashboard/campaigns",   label: "Campaigns"                  },
    { to: "/brand/dashboard/influencers", label: "Influencers"                },
    { to: "/brand/dashboard/ai-match",    label: "AI Matchmaking"             },
    { to: "/brand/dashboard/chat",        label: "Messages",  badge: totalUnread },
    { to: "/brand/dashboard/payments",    label: "Payments"                   },
    { to: "/brand/dashboard/settings",    label: "Settings"                   },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-200">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={close}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-slate-900 border-r border-slate-800 px-4 py-6
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:z-auto
        `}
      >
        {/* Close btn (mobile) */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-slate-400 hover:text-white md:hidden"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="mb-10 px-2">
          <h2 className="text-lg font-semibold text-white">
            <span className="text-indigo-400">Syncluence</span>{" "}
            <span className="text-slate-400 font-normal">for Brands</span>
          </h2>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          {links.map(({ to, label, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={close}
              className={({ isActive }) => `${navItem} ${isActive ? activeNav : ""}`}
            >
              <span className="flex items-center justify-between w-full">
                {label}
                {badge > 0 && (
                  <span className="ml-2 bg-indigo-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "B"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name || "Brand"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center px-4 sm:px-6 gap-3">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white md:hidden flex-shrink-0"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-base sm:text-lg font-semibold text-slate-200 flex-1 truncate">Brand Dashboard</h1>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm text-slate-400 hidden lg:block truncate max-w-[120px]">{user?.name}</span>
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "B"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-950 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
