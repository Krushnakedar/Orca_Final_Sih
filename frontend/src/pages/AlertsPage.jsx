import React from "react";
import { ShieldAlert, Radio } from "lucide-react";
import AlertFeed from "../features/alerts/AlertFeed";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Safety Alerts & Emergency Operations Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Proactive marine emergency alert dissemination in coordination with
            IMD, INCOIS, and Indian Coast Guard
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>
            VHF Priority: <strong>Channel 16 Active</strong>
          </span>
        </div>
      </div>

      {/* Main Grid: Alert Feed (8 Cols) + Emergency Protocol Guidelines (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <AlertFeed />
        </div>

        <div className="lg:col-span-4 space-y-4">
          {/* Emergency Protocols Card */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Maritime Emergency Response Tiers
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 space-y-1">
                <div className="font-bold text-red-300">
                  Tier 1: Red Alert / Emergency
                </div>
                <p className="text-[11px] text-slate-400">
                  Total sea venturing ban. All vessels moored. Hoist Warning
                  Signal 4.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-1">
                <div className="font-bold text-amber-300">
                  Tier 2: Orange Warning
                </div>
                <p className="text-[11px] text-slate-400">
                  Squally sea chop (&gt; 2.5m waves). Small artisanal craft
                  abort departure.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-yellow-950/40 border border-yellow-800/60 space-y-1">
                <div className="font-bold text-yellow-300">
                  Tier 3: Yellow Watch
                </div>
                <p className="text-[11px] text-slate-400">
                  Developing thunderstorm cells or high tidal surge. Maintain
                  VHF watch.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/60 space-y-1">
                <div className="font-bold text-sky-300">
                  Tier 4: Coastal Advisory
                </div>
                <p className="text-[11px] text-slate-400">
                  Normal operations with seasonal current cautions.
                </p>
              </div>
            </div>
          </div>

          {/* Search & Rescue Coordinates */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-slate-200">
              <Radio className="w-4 h-4 text-tealAccent-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Emergency Distress Frequencies
              </h3>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">
                  VHF International Distress:
                </span>
                <span className="font-bold font-mono text-slate-200">
                  Channel 16 (156.8 MHz)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Coast Guard MRCC Mumbai:</span>
                <span className="font-bold font-mono text-slate-200">
                  1554 / +91-22-24388065
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">INCOIS Coastal Helpline:</span>
                <span className="font-bold font-mono text-slate-200">
                  +91-40-23895000
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
