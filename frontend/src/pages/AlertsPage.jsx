import React from 'react';
import {
  ShieldAlert,
  Radio,
  PhoneCall,
  ExternalLink,
  LifeBuoy
} from 'lucide-react';
import AlertFeed from '../features/alerts/AlertFeed';
import StaleBadge from '../components/StaleBadge';

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Safety Alerts & Emergency Operations Center
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              Broadcast Active
            </span>
            <StaleBadge url="/alerts" params={{ sector: 'all', status: 'ACTIVE' }} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Proactive marine emergency alert dissemination in coordination with IMD, INCOIS, and Indian Coast Guard
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Radio className="w-3.5 h-3.5 text-tealAccent-400 animate-pulse" />
          <span>VHF Priority: <strong className="text-white">Channel 16 Active</strong></span>
        </div>
      </div>

      {/* Main Grid: Alert Feed (8 Cols) + Emergency Protocol Guidelines (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Full Feature Alert Feed with Auto-Advance & History */}
        <div className="lg:col-span-8 space-y-4">
          <AlertFeed />
        </div>

        {/* Right 4 Cols: Emergency Protocol Guidelines & Distress Frequencies */}
        <div className="lg:col-span-4 space-y-4">
          {/* Emergency Distress Contacts Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 shadow-xl">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 text-slate-200">
              <PhoneCall className="w-4 h-4 text-tealAccent-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Emergency Distress Frequencies
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">VHF International Marine Distress</span>
                <div className="font-bold font-mono text-white text-sm flex items-center justify-between">
                  <span>Channel 16</span>
                  <span className="text-xs text-tealAccent-400 font-normal">156.800 MHz</span>
                </div>
              </div>

              <a
                href="tel:1554"
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 block space-y-1 transition group"
              >
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300">Indian Coast Guard Toll-Free</span>
                <div className="font-bold font-mono text-rose-400 text-sm flex items-center justify-between">
                  <span>Emergency 1554</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
              </a>

              <a
                href="tel:+912224388065"
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 block space-y-1 transition group"
              >
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300">MRCC Mumbai (Search & Rescue)</span>
                <div className="font-bold font-mono text-slate-200 text-xs flex items-center justify-between">
                  <span>+91-22-24388065</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
              </a>

              <a
                href="tel:+914023895000"
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 block space-y-1 transition group"
              >
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300">INCOIS Ocean Warning Helpline</span>
                <div className="font-bold font-mono text-slate-200 text-xs flex items-center justify-between">
                  <span>+91-40-23895000</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
              </a>
            </div>
          </div>

          {/* Emergency Response Tiers Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 shadow-xl">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 text-slate-200">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Maritime Emergency Response Tiers
              </h3>
            </div>

            <div className="space-y-2.5 text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 space-y-1">
                <div className="font-bold text-red-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span>Tier 1: Red Alert / Emergency</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Total sea venturing ban. All vessels moored. Hoist Warning Signal 4.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Tier 2: Orange Warning</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Squally chop (&gt; 2.5m waves). Small artisanal craft abort departure.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-800/60 space-y-1">
                <div className="font-bold text-yellow-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  <span>Tier 3: Yellow Watch</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Developing thunderstorm cells or tidal surge. Maintain VHF watch.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 space-y-1">
                <div className="font-bold text-sky-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span>Tier 4: Coastal Advisory</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Normal operations with seasonal coastal current cautions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
