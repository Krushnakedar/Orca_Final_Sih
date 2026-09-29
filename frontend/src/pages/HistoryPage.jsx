import React, { useState, useEffect } from 'react';
import {
  History,
  Activity,
  Cpu,
  Download,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Sliders
} from 'lucide-react';
import { traceService } from '../services/traceService';
import TraceTimeline from '../features/admin/TraceTimeline';
import LoadingSpinner from '../components/LoadingSpinner';

// Sample/demo trace records are seeded server-side for prototype purposes and
// are identifiable by this traceId prefix. They are not genuine user activity
// and must never be shown in the end-user History & Logs view.
const isSeededDemoTrace = (t) => typeof t?.traceId === 'string' && t.traceId.startsWith('tr_seed_');

export default function HistoryPage() {
  const [traces, setTraces] = useState([]);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const traceRes = await traceService.getTraces({
        sector: selectedSector !== 'All' ? selectedSector : undefined,
        language: selectedLanguage !== 'ALL' ? selectedLanguage : undefined,
        search: searchQuery || undefined
      });
      const realTraces = (traceRes?.data || []).filter((t) => !isSeededDemoTrace(t));
      setTraces(realTraces);
      setSelectedTrace((prev) => {
        if (prev && realTraces.some((t) => t.traceId === prev.traceId)) return prev;
        return realTraces[0] || null;
      });
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedSector, selectedLanguage]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Activity History & Audit Log
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
              Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your marine safety queries and application activity
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 1-Click Export Audit Log JSON */}
          <a
            href={traceService.getExportUrl()}
            download
            className="px-3.5 py-2 rounded-xl bg-surface-secondary hover:bg-surface-tertiary border border-border text-foreground text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export Audit Log (JSON)</span>
          </a>

          <button
            onClick={fetchHistory}
            className="p-2 bg-surface-secondary hover:bg-surface-tertiary border border-border rounded-xl text-foreground transition"
            title="Refresh Trace Stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Trace Log Table (7 Cols) + Selected Activity Detail (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Trace History Log Table */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search & Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-surface border border-border flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-sm">
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search traces by query text or ID..."
                  className="w-full pl-8 pr-3 py-1.5 bg-surface-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-surface-secondary hover:bg-surface-tertiary border border-border text-foreground rounded-lg font-semibold text-xs transition"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-2">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-secondary border border-border text-foreground text-xs focus:outline-none cursor-pointer"
              >
                <option value="All">All Sectors</option>
                <option value="Mumbai Coast">Mumbai Coast</option>
                <option value="Kochi Harbor">Kochi Harbor</option>
                <option value="Chennai Offshore">Chennai Offshore</option>
                <option value="Visakhapatnam">Visakhapatnam</option>
              </select>

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-secondary border border-border text-foreground text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Languages</option>
                <option value="en">English (EN)</option>
                <option value="hi">Hindi (HI)</option>
                <option value="mr">Marathi (MR)</option>
              </select>
            </div>
          </div>

          {/* Trace Records Table */}
          <div className="rounded-2xl border border-border overflow-hidden bg-surface shadow-sm">
            {traces.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-xs space-y-1">
                <p className="font-semibold text-foreground">No activity yet</p>
                <p>Your marine safety queries and application activity will appear here.</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-secondary text-muted-foreground border-b border-border font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">User Query</th>
                    <th className="py-2.5 px-3">Sector</th>
                    <th className="py-2.5 px-3">Lang</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Risk</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-sans text-[11px]">
                  {traces.map((t) => {
                    const isSelected = selectedTrace?.traceId === t.traceId;
                    return (
                      <tr
                        key={t.traceId}
                        onClick={() => setSelectedTrace(t)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-surface-secondary/70'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-foreground font-medium truncate max-w-[170px]">
                          {t.query}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                          {t.sector}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-primary uppercase">
                          {t.language}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-accent font-semibold whitespace-nowrap">
                          {t.overallDurationMs} ms
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                            t.riskCalculated?.level === 'CRITICAL' ? 'bg-danger-surface border-danger/30 text-danger' :
                            t.riskCalculated?.level === 'HIGH' ? 'bg-danger-surface border-danger/30 text-danger' :
                            t.riskCalculated?.level === 'MODERATE' ? 'bg-warning-surface border-warning/30 text-warning' :
                            'bg-success-surface border-success/30 text-success'
                          }`}>
                            {t.riskCalculated?.score}/100
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrace(t);
                            }}
                            className="p-1 rounded-lg bg-surface-secondary hover:bg-surface-tertiary border border-border text-foreground transition"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Selected Trace Timeline Visualizer */}
        <div className="lg:col-span-5 space-y-4">
          <TraceTimeline trace={selectedTrace} />
        </div>
      </div>
    </div>
  );
}
