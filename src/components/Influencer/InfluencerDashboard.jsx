import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/useChat";

export default function InfluencerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalUnread } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const close = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-[#0B141A] text-white">

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
          bg-[#0F1C24] border-r border-white/10 p-6
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:z-auto md:flex
        `}
      >
        {/* Close btn (mobile only) */}
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
        <div className="text-2xl font-bold mb-10 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Syncluence
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          <NavItem to="/influencer/dashboard" onClick={close}>Overview</NavItem>
          <NavItem to="/influencer/dashboard/campaigns" onClick={close}>Campaigns</NavItem>
          <NavItem to="/influencer/dashboard/earnings" onClick={close}>Earnings</NavItem>
          <NavItem to="/influencer/dashboard/chat" onClick={close}>
            <span className="flex items-center justify-between w-full">
              Messages
              {totalUnread > 0 && (
                <span className="ml-2 bg-cyan-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </span>
          </NavItem>
          <NavItem to="/influencer/dashboard/settings" onClick={close}>Settings</NavItem>
        </nav>

        {/* User + Logout */}
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name || "Creator"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-red-400 hover:text-red-300 px-1 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 border-b border-white/10 flex items-center px-4 sm:px-6 bg-[#0B141A] gap-3">
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

          <h1 className="text-base sm:text-lg font-semibold flex-1 truncate">Creator Dashboard</h1>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm text-slate-400 hidden lg:block truncate max-w-[120px]">{user?.name}</span>
            <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "C"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#0B141A] overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, children, onClick }) {
  const isIndex = to === "/influencer/dashboard";
  return (
    <NavLink
      to={to}
      end={isIndex}
      onClick={onClick}
      className={({ isActive }) =>
        `px-4 py-2.5 rounded-md text-sm transition ${
          isActive
            ? "bg-cyan-500/20 text-cyan-300"
            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
