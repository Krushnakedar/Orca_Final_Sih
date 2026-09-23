import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Map,
  Compass,
  BellRing,
  Navigation,
  History,
  User,
  Radio,
  X
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../hooks/useAuth';
import SidebarStatusDot from '../components/SidebarStatusDot';
import { ROUTE_AVAILABILITY } from '../utils/routeAvailability';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, ready: true },
  { name: 'AI Marine Assistant', path: '/chat', icon: Bot, ready: true },
  { name: 'Marine Map', path: '/map', icon: Map, ready: true },
  { name: 'Route Planner', path: '/routes', icon: Navigation, ready: true },
  { name: 'Safety & Alerts', path: '/alerts', icon: BellRing, ready: true },
  { name: 'PFZ Intelligence', path: '/pfz', icon: Compass, ready: true },
  { name: 'History & Logs', path: '/history', icon: History, ready: true },
  { name: 'Operator Profile', path: '/profile', icon: User, ready: true },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          // Mobile: full-screen overlay that slides in/out
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-slate-800/80 bg-slate-950 flex flex-col p-4 transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: sticky in the layout column, full available height
          'md:static md:translate-x-0 md:w-64 md:max-w-none md:h-full md:shrink-0 md:flex md:flex-col'
        )}
      >
        {/* Scrollable nav section */}
        <div className="flex-1 flex flex-col overflow-y-auto min-h-0 gap-6">
          {/* Mobile close button row */}
          <div className="flex items-center justify-between px-3 md:hidden pt-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Navigation
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 px-3 hidden md:block">
              Marine Operations
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.ready ? item.path : '#'}
                  onClick={(e) => {
                    if (!item.ready) { e.preventDefault(); return; }
                    onClose();
                  }}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive && item.ready
                        ? 'bg-ocean-950/80 text-ocean-300 border border-ocean-800/60'
                        : item.ready
                        ? 'text-slate-300 hover:bg-slate-900 hover:text-white'
                        : 'text-slate-500 cursor-not-allowed opacity-75'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SidebarStatusDot
                      availability={ROUTE_AVAILABILITY[item.path] || 'online'}
                    />
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Pinned footer — always visible at bottom of sidebar */}
        <div className="flex-shrink-0 pt-4">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300">System Monitoring</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isAuthenticated ? `Operator: ${user?.name || 'Authorized'}` : 'Audit logging active.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
