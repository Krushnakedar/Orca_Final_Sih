import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Waves,
  User,
  LogOut,
  LogIn,
  Bell,
  Activity,
  Menu,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { alertService } from '../services/alertService';

export default function Header({ apiStatus, onMenuClick }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await alertService.getAlerts({ status: 'ACTIVE' });
        if (res?.data) {
          const userKey = user?.email || 'default';
          const localAcks = JSON.parse(localStorage.getItem(`orca_acks_${userKey}`) || '[]');
          const activeUnread = res.data.filter(a => a.status === 'ACTIVE' && !localAcks.includes(a.id));
          setUnreadCount(activeUnread.length);
        }
      } catch (err) {
        // silent fallback
      }
    };

    fetchUnread();

    const handleAlertChange = () => {
      fetchUnread();
    };

    window.addEventListener('orca-alert-change', handleAlertChange);
    return () => window.removeEventListener('orca-alert-change', handleAlertChange);
  }, [user]);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2.5 group min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-ocean-600 via-ocean-500 to-tealAccent-500 flex items-center justify-center text-slate-950 shadow-lg shadow-ocean-950/60 group-hover:scale-105 transition">
            <Waves className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">ORCA</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none hidden sm:block">Agentic Marine Intelligence Platform</p>
          </div>
        </Link>
      </div>

      {/* Right Controls: Alerts Bell, Backend State & Operator Auth */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Active Emergency Alerts Bell Link */}
        <Link
          to="/alerts"
          className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
          title="View Safety Alerts"
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
              apiStatus?.connected ? 'bg-tealAccent-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-400 text-[11px] font-mono">
            {apiStatus?.connected ? 'Live Multi-Agent Grid' : 'Connecting...'}
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
              <span className="font-semibold hidden xs:inline">{user?.name?.split(' ')[0] || 'Operator'}</span>
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
              title="Sign Out"
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
