import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/auth");
  };

  const close = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-slate-100">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-gradient-to-b from-blue-700 via-blue-800 to-indigo-900
          text-blue-100 px-6 py-6
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:z-auto
        `}
      >
        {/* Close btn (mobile) */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-blue-200 hover:text-white md:hidden"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <h2 className="text-2xl font-semibold text-white mb-10">Syncluence</h2>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          <NavItem to="" onClick={close}>Overview</NavItem>
          <NavItem to="users" onClick={close}>Users</NavItem>
          <NavItem to="campaigns" onClick={close}>Campaigns</NavItem>
          <NavItem to="payments" onClick={close}>Payments</NavItem>
          <NavItem to="fraud" onClick={close}>Fraud Detection</NavItem>
          <NavItem to="audit-log" onClick={close}>Audit Log</NavItem>
          <NavItem to="chat" onClick={close}>Chat Monitor</NavItem>
          <NavItem to="settings" onClick={close}>Settings</NavItem>
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-8 text-left px-4 py-3 rounded-lg text-red-300 hover:bg-white/10 transition text-sm"
        >
          Logout
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <div className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-8">
          {/* Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-500 hover:text-slate-700 md:hidden"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-slate-800">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">{user?.name || "Admin"}</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-semibold shadow">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === ""}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-4 py-3 rounded-lg text-sm font-medium transition
         ${isActive
           ? "bg-white text-blue-800 shadow-sm"
           : "text-blue-100 hover:bg-white/10"
         }`
      }
    >
      {children}
    </NavLink>
  );
}
