import { NavLink } from "react-router-dom";

export default function SideBar({ links }) {
  return (
    <aside
      className="
        w-64 min-h-screen p-6
        bg-black/40 backdrop-blur-xl
        border-r border-white/10
        text-slate-300
      "
    >

      <h2 className="text-2xl font-bold mb-10 text-white">
        Syncluence
      </h2>

      <nav className="space-y-4">

        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `block p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-purple-600 text-white"
                  : "hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}

      </nav>

    </aside>
  );
}