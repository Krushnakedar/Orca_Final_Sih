import React from 'react';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Compass,
  Fish,
  AlertTriangle,
  HelpCircle,
  FileText
} from 'lucide-react';
import ChatWindow from '../features/chat/ChatWindow';

export default function ChatPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              AI Marine Assistant
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-success-surface border border-success/30 text-success font-medium">
              Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agentic multi-agent natural language intelligence for fishing safety and oceanographic inquiries
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span>Model: <strong className="text-foreground">ORCA Multi-Agent Orchestrator</strong></span>
        </div>
      </div>

      {/* Main Grid: Chat Window + Side Operational Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Full Chat Window Component */}
        <div className="lg:col-span-8">
          <ChatWindow />
        </div>

        {/* Right 4 Cols: System Architecture & Safety Protocols */}
        <div className="lg:col-span-4 space-y-4">
          {/* Architecture Card */}
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-3 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border text-foreground">
              <Cpu className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Agentic Decision Hierarchy
              </h3>
            </div>

            <div className="space-y-2 text-xs text-foreground leading-relaxed">
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border space-y-1">
                <div className="font-bold text-primary">1. AI Orchestrates</div>
                <p className="text-[11px] text-muted-foreground">Decomposes inquiries across weather, ocean, and PFZ specialists.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border space-y-1">
                <div className="font-bold text-accent">2. Data Provides Evidence</div>
                <p className="text-[11px] text-muted-foreground">Fetches verified Open-Meteo and INCOIS satellite telemetry.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border space-y-1">
                <div className="font-bold text-warning">3. Rules Calculate Risk</div>
                <p className="text-[11px] text-muted-foreground">Deterministic thresholds assess safety score (0-100).</p>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border space-y-1">
                <div className="font-bold text-indigo-500 dark:text-indigo-400">4. AI Explains Result</div>
                <p className="text-[11px] text-muted-foreground">Translates complex oceanography into actionable guidance.</p>
              </div>
            </div>
          </div>

          {/* Safety Threshold Reference Card */}
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-3 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border text-foreground">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Operational Safety Thresholds
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-success-surface border border-success/30 text-success">
                <span>Low Risk (&lt; 35):</span>
                <span className="font-semibold font-mono">Wave &lt; 1.5m &bull; Wind &lt; 20 km/h</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-warning-surface border border-warning/30 text-warning">
                <span>Moderate (35-70):</span>
                <span className="font-semibold font-mono">Wave 1.5-2.2m &bull; Wind 20-35 km/h</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-danger-surface border border-danger/30 text-danger">
                <span>High Risk (&gt; 70):</span>
                <span className="font-semibold font-mono">Wave &gt; 2.2m &bull; Wind &gt; 35 km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
