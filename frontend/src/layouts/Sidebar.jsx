import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  Map,
  Compass,
  BellRing,
  Navigation,
  Database,
  History,
  User,
  Radio,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, ready: true },
  { name: "AI Marine Assistant", path: "/chat", icon: Bot, ready: true },
  { name: "Marine Map", path: "/map", icon: Map, ready: true },
  { name: "Route Planner", path: "/routes", icon: Navigation, ready: true },
  { name: "Safety & Alerts", path: "/alerts", icon: BellRing, ready: true },
  { name: "PFZ Intelligence", path: "/pfz", icon: Compass, ready: true },
  { name: "Data Sources", path: "/sources", icon: Database, ready: true },
  { name: "History & Logs", path: "/history", icon: History, ready: true },
  { name: "Operator Profile", path: "/profile", icon: User, ready: true },
];

export default function Sidebar() {
  const { isAuthenticated, user } = useAuth();

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950 flex flex-col justify-between p-4 hidden md:flex">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 px-3">
            Marine Operations
          </span>
          <nav className="mt-2 space-y-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.ready ? item.path : "#"}
                onClick={(e) => !item.ready && e.preventDefault()}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive && item.ready
                      ? "bg-ocean-950/80 text-ocean-300 border border-ocean-800/60"
                      : item.ready
                        ? "text-slate-300 hover:bg-slate-900 hover:text-white"
                        : "text-slate-500 cursor-not-allowed opacity-75",
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-2 mb-1.5">
          <Radio
            className="w-3.5 h-3.5 text-indigo-400 animate-pulse"
            aria-hidden="true"
          />
          <span className="text-xs font-semibold text-slate-300">
            Audit Logging Active
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isAuthenticated
            ? `Operator: ${user?.name || "Authorized"}`
            : "Sign in to enable operator trace."}
        </p>
      </div>
    </aside>
  );
}
