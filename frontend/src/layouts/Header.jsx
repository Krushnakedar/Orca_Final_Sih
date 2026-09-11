import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Waves, User, LogOut, LogIn, Bell } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { alertService } from "../services/alertService";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Header({ apiStatus }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(3);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await alertService.getAlerts({ status: "ACTIVE" });
        if (res?.data) {
          setUnreadCount(res.data.length);
        }
      } catch (err) {
        // silent fallback
      }
    };
    fetchUnread();
  }, []);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-ocean-600 via-ocean-500 to-tealAccent-500 flex items-center justify-center text-slate-950 shadow-lg shadow-ocean-950/60 group-hover:scale-105 transition">
            <Waves className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">
                ORCA
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ocean-950 border border-ocean-800 text-tealAccent-400 font-bold">
                SIH 2026
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none">
              Agentic Marine Intelligence Platform
            </p>
          </div>
        </Link>
      </div>

      {/* Right Controls: Language Switcher, Alerts Bell, Backend State & Operator Auth */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <LanguageSwitcher />

        {/* Active Emergency Alerts Bell Link */}
        <Link
          to="/alerts"
          className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
          title="View Safety Alerts"
          aria-label={`View safety alerts${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse shadow-md">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Backend API Heartbeat Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              apiStatus?.connected
                ? "bg-tealAccent-400 animate-pulse"
                : "bg-rose-500"
            }`}
          />
          <span className="text-slate-400 text-[11px] font-mono">
            {apiStatus?.connected ? "Live Multi-Agent Grid" : "Connecting..."}
          </span>
        </div>

        {/* Auth / Profile Area */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition"
            >
              <User className="w-3.5 h-3.5 text-ocean-400" />
              <span className="font-semibold">
                {user?.name?.split(" ")[0] || "Operator"}
              </span>
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-semibold transition shadow-md shadow-ocean-950/50"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
