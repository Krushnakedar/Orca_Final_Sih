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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Safety Alerts & Emergency Operations Center
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-danger-surface border border-danger/30 text-danger font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-danger animate-ping"></span>
              Broadcast Active
            </span>
            <StaleBadge url="/alerts" params={{ sector: 'all', status: 'ACTIVE' }} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Proactive marine emergency alert dissemination in coordination with IMD, INCOIS, and Indian Coast Guard
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-foreground bg-surface-secondary border border-border px-3 py-1.5 rounded-xl">
          <Radio className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span>VHF Priority: <strong className="text-foreground">Channel 16 Active</strong></span>
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
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border text-foreground">
              <PhoneCall className="w-4 h-4 text-accent" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Emergency Distress Frequencies
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-surface-secondary border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground">VHF International Marine Distress</span>
                <div className="font-bold font-mono text-foreground text-sm flex items-center justify-between">
                  <span>Channel 16</span>
                  <span className="text-xs text-accent font-normal">156.800 MHz</span>
                </div>
              </div>

              <a
                href="tel:1554"
                className="p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary border border-border text-foreground block space-y-1 transition group"
              >
                <span className="text-[11px] text-muted-foreground">Indian Coast Guard Toll-Free</span>
                <div className="font-bold font-mono text-danger text-sm flex items-center justify-between">
                  <span>Emergency 1554</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
              </a>

              <a
                href="tel:+912224388065"
                className="p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary border border-border text-foreground block space-y-1 transition group"
              >
                <span className="text-[11px] text-muted-foreground">MRCC Mumbai (Search & Rescue)</span>
                <div className="font-bold font-mono text-foreground text-xs flex items-center justify-between">
                  <span>+91-22-24388065</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
              </a>

              <a
                href="tel:+914023895000"
                className="p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary border border-border text-foreground block space-y-1 transition group"
              >
                <span className="text-[11px] text-muted-foreground">INCOIS Ocean Warning Helpline</span>
                <div className="font-bold font-mono text-foreground text-xs flex items-center justify-between">
                  <span>+91-40-23895000</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </div>
              </a>
            </div>
          </div>

          {/* Emergency Response Tiers Card */}
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border text-foreground">
              <ShieldAlert className="w-4 h-4 text-danger" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Maritime Emergency Response Tiers
              </h3>
            </div>

            <div className="space-y-2.5 text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-danger-surface border border-danger/40 space-y-1">
                <div className="font-bold text-danger flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
                  <span>Tier 1: Red Alert / Emergency</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Total sea venturing ban. All vessels moored. Hoist Warning Signal 4.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-warning-surface border border-warning/40 space-y-1">
                <div className="font-bold text-warning flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-warning"></span>
                  <span>Tier 2: Orange Warning</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Squally chop (&gt; 2.5m waves). Small artisanal craft abort departure.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-warning-surface/60 border border-warning/30 space-y-1">
                <div className="font-bold text-warning flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-warning"></span>
                  <span>Tier 3: Yellow Watch</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Developing thunderstorm cells or tidal surge. Maintain VHF watch.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-info-surface border border-info/40 space-y-1">
                <div className="font-bold text-info flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-info"></span>
                  <span>Tier 4: Coastal Advisory</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
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
