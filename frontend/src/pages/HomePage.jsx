import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Waves, ShieldAlert, Cpu, Activity, CheckCircle2 } from 'lucide-react';

export default function HomePage({ apiStatus }) {
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-navy-900 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ocean-950/80 border border-ocean-800 text-ocean-300 text-xs font-semibold">
            <Waves className="w-3.5 h-3.5" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            ORCA <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean-400 to-tealAccent-400">Marine Intelligence</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Autonomous multi-agent marine intelligence platform correlating satellite earth observation, oceanographic models, meteorological forecasts, and GIS boundaries into deterministic risk assessments.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-ocean-600 to-ocean-500 hover:from-ocean-500 hover:to-ocean-400 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-ocean-950/50"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="p-2.5 w-fit rounded-lg bg-ocean-950 border border-ocean-800 text-ocean-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Agentic Orchestration</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Multi-agent pipeline executing specialized tasks across weather, ocean, and advisory domains.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="p-2.5 w-fit rounded-lg bg-teal-950 border border-teal-800 text-teal-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Deterministic Risk Engine</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Physical marine rules calculate risk scores (0 to 100); LLMs explain the reasoning with cited data sources.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="p-2.5 w-fit rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Evidence & Explainability</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Full auditability with traceable sensor datasets, timestamps, and confidence metrics.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-200">Phase 1 Foundation Status</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">GET /api/health</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-xs text-slate-500 font-medium">Backend Health</span>
            <p className="text-sm font-semibold text-slate-200 mt-1">
              {apiStatus.connected ? 'Operational (200 OK)' : apiStatus.loading ? 'Checking...' : 'Disconnected'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-xs text-slate-500 font-medium">API Response</span>
            <p className="text-sm font-mono text-ocean-400 mt-1 truncate">
              {apiStatus.data?.message || (apiStatus.connected ? 'ORCA API is running' : 'Waiting...')}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-xs text-slate-500 font-medium">Active Phase</span>
            <p className="text-sm font-semibold text-slate-200 mt-1">Phase 1 (Setup)</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-xs text-slate-500 font-medium">Next Milestone</span>
            <p className="text-sm font-semibold text-slate-200 mt-1">Phase 2 (Auth + Dashboard)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
