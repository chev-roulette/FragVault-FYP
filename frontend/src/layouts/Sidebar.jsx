import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Binary,
  Shield,
  BarChart3,
  KeyRound,
} from "lucide-react";

function Sidebar() {
  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard size={24} />,
    },
    {
      name: "XOR Segmentation",
      path: "/segmentation",
      icon: <Binary size={24} />,
    },
    {
      name: "Attack Simulation",
      path: "/attack-simulation",
      icon: <Shield size={24} />,
    },
    {
      name: "Statistics",
      path: "/statistics",
      icon: <BarChart3 size={24} />,
    },
    {
      name: "Reconstruction",
      path: "/reconstruction",
      icon: <KeyRound size={24} />,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 border-r border-cyan-500/40 bg-slate-950 px-8 py-10 text-white">
      <div className="flex h-full flex-col justify-between">
        <div>
          {/* Logo Area */}
          <div className="mb-16 space-y-3">
            <h1 className="text-5xl font-bold tracking-tight text-cyan-400">
              FragVault
            </h1>

            <p className="text-base leading-relaxed text-slate-400">
              API Fragment Vault Platform
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-5">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-5 rounded-2xl px-6 py-5 text-lg font-semibold transition-all duration-200",
                    isActive
                      ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
                      : "text-slate-300 hover:bg-slate-900 hover:text-cyan-300",
                  ].join(" ")
                }
              >
                <span className="flex items-center justify-center">
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;