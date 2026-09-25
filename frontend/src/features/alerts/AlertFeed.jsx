import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Waves,
  Anchor,
  Clock,
  Radio,
  CheckCircle2,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  History,
  RotateCcw,
  Check,
  Search,
  Trash2,
  X,
  Info,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { alertService } from '../../services/alertService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export default function AlertFeed({ onAlertChange }) {
  const { user } = useAuth();
  const userKey = user?.email || 'default';

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedSector, setSelectedSector] = useState('All');
  const [feedType, setFeedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState(new Date());
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [showDrillPanel, setShowDrillPanel] = useState(true);

  // Undo Toast State
  const [undoToast, setUndoToast] = useState(null); // { id, title, timerId }
  const toastTimeoutRef = useRef(null);

  // Acknowledgement metadata (stores timestamps for history view)
  const [ackMetadata, setAckMetadata] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`orca_ack_meta_${userKey}`) || '{}');
    } catch {
      return {};
    }
  });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await alertService.getAlerts({
        sector: selectedSector !== 'All' ? selectedSector : undefined,
        severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined,
        feedType: feedType !== 'all' ? feedType : undefined,
      });

      if (res?.data) {
        const localAcks = JSON.parse(
          localStorage.getItem(`orca_acks_${userKey}`) || '[]'
        );
        const withLocalAcks = res.data.map((a) =>
          localAcks.includes(a.id) ? { ...a, status: 'ACKNOWLEDGED' } : a
        );
        setAlerts(withLocalAcks);
        setLastSync(new Date());
        if (onAlertChange) onAlertChange(withLocalAcks);
      }
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeverity, selectedSector, feedType, userKey]);

  // Clean up undo timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleSimulate = async (scenario) => {
    setActiveSimulation(scenario);
    try {
      await alertService.simulateAlert(scenario);
      await fetchAlerts();
      window.dispatchEvent(new CustomEvent('orca-alert-change'));
      // Auto-switch to active tab so user sees the newly simulated drill
      setActiveTab('active');
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setActiveSimulation(null);
    }
  };

  /**
   * ACKNOWLEDGE ACTION:
   * Immediately removes the alert from the Active view so the NEXT alert
   * appears in its place. Stores metadata and provides an Undo option.
   */
  const handleAcknowledge = async (alertItem) => {
    const id = alertItem.id;
    const nowIso = new Date().toISOString();

    // 1. Optimistically mark as ACKNOWLEDGED in state
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED', acknowledgedAt: nowIso } : a))
    );

    // 2. Persist ID in local storage for Header & sync
    try {
      const localAcks = JSON.parse(
        localStorage.getItem(`orca_acks_${userKey}`) || '[]'
      );
      if (!localAcks.includes(id)) {
        localAcks.push(id);
        localStorage.setItem(`orca_acks_${userKey}`, JSON.stringify(localAcks));
      }

      // 3. Persist timestamp in local metadata map for History
      const meta = {
        ...ackMetadata,
        [id]: {
          acknowledgedAt: nowIso,
          title: alertItem.title,
          severity: alertItem.severity,
          sector: alertItem.sector,
        }
      };
      setAckMetadata(meta);
      localStorage.setItem(`orca_ack_meta_${userKey}`, JSON.stringify(meta));

      // 4. Set Undo Toast (disappears after 6s)
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setUndoToast({ id, title: alertItem.title });
      toastTimeoutRef.current = setTimeout(() => {
        setUndoToast(null);
      }, 6000);

      // 5. Notify backend API
      await alertService.acknowledgeAlert(id);
    } catch (err) {
      console.warn('Notice while updating acknowledgment:', err);
    }

    window.dispatchEvent(new CustomEvent('orca-alert-change'));
  };

  /**
   * UNDO / RESTORE ACTION:
   * Returns an acknowledged bulletin back to the active queue.
   */
  const handleRestore = async (id) => {
    // 1. Optimistically mark as ACTIVE in state
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ACTIVE', acknowledgedAt: null } : a))
    );

    // 2. Remove ID from localStorage
    try {
      const localAcks = JSON.parse(
        localStorage.getItem(`orca_acks_${userKey}`) || '[]'
      );
      const filtered = localAcks.filter((ackId) => ackId !== id);
      localStorage.setItem(`orca_acks_${userKey}`, JSON.stringify(filtered));

      // 3. Remove from ackMetadata
      const meta = { ...ackMetadata };
      delete meta[id];
      setAckMetadata(meta);
      localStorage.setItem(`orca_ack_meta_${userKey}`, JSON.stringify(meta));

      // 4. Notify backend API
      await alertService.unacknowledgeAlert(id).catch(() => {});
    } catch (err) {
      console.warn('Notice while restoring alert:', err);
    }

    if (undoToast?.id === id) {
      setUndoToast(null);
    }

    window.dispatchEvent(new CustomEvent('orca-alert-change'));
  };

  /**
   * Clear all locally acknowledged history records
   */
  const handleClearHistory = () => {
    if (!window.confirm('Are you sure you want to clear your local acknowledged bulletins history? This will re-enable all active bulletins.')) {
      return;
    }
    localStorage.removeItem(`orca_acks_${userKey}`);
    localStorage.removeItem(`orca_ack_meta_${userKey}`);
    setAckMetadata({});
    setAlerts((prev) => prev.map((a) => ({ ...a, status: 'ACTIVE' })));
    window.dispatchEvent(new CustomEvent('orca-alert-change'));
  };

  // Severity UI Styling Configuration
  const severityConfigs = {
    EMERGENCY: {
      badge: 'bg-red-950/90 border-red-700 text-red-200',
      tag: 'CRITICAL EMERGENCY',
      border: 'border-red-600/90 bg-gradient-to-br from-red-950/40 to-slate-950',
      accent: 'border-l-4 border-l-red-500',
      icon: ShieldAlert,
      iconColor: 'text-red-400',
      glow: 'shadow-red-950/40 shadow-lg'
    },
    WARNING: {
      badge: 'bg-amber-950/90 border-amber-700 text-amber-200',
      tag: 'OFFICIAL WARNING',
      border: 'border-amber-600/80 bg-gradient-to-br from-amber-950/30 to-slate-950',
      accent: 'border-l-4 border-l-amber-500',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      glow: 'shadow-amber-950/30 shadow-md'
    },
    WATCH: {
      badge: 'bg-yellow-950/80 border-yellow-700 text-yellow-200',
      tag: 'HAZARD WATCH',
      border: 'border-yellow-700/60 bg-gradient-to-br from-yellow-950/20 to-slate-950',
      accent: 'border-l-4 border-l-yellow-500',
      icon: Zap,
      iconColor: 'text-yellow-400',
      glow: ''
    },
    ADVISORY: {
      badge: 'bg-sky-950/80 border-sky-700 text-sky-200',
      tag: 'COASTAL ADVISORY',
      border: 'border-sky-800/60 bg-gradient-to-br from-sky-950/20 to-slate-950',
      accent: 'border-l-4 border-l-sky-500',
      icon: Radio,
      iconColor: 'text-sky-400',
      glow: ''
    },
    INFORMATIONAL: {
      badge: 'bg-emerald-950/80 border-emerald-700 text-emerald-200',
      tag: 'SAFE SEA STATE',
      border: 'border-emerald-800/50 bg-gradient-to-br from-emerald-950/20 to-slate-950',
      accent: 'border-l-4 border-l-emerald-500',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      glow: ''
    }
  };

  // Filter alerts by active vs acknowledged and search query
  const { activeAlerts, acknowledgedAlerts } = useMemo(() => {
    let list = alerts;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.summary?.toLowerCase().includes(q) ||
          a.sector?.toLowerCase().includes(q) ||
          a.agency?.toLowerCase().includes(q)
      );
    }

    const active = list.filter((a) => a.status !== 'ACKNOWLEDGED');
    const acknowledged = list.filter((a) => a.status === 'ACKNOWLEDGED');

    return { activeAlerts: active, acknowledgedAlerts: acknowledged };
  }, [alerts, searchQuery]);

  // Overall metric counts for tactical header chips
  const emergencyCount = alerts.filter((a) => a.status !== 'ACKNOWLEDGED' && a.severity === 'EMERGENCY').length;
  const warningCount = alerts.filter((a) => a.status !== 'ACKNOWLEDGED' && a.severity === 'WARNING').length;
  const watchCount = alerts.filter((a) => a.status !== 'ACKNOWLEDGED' && (a.severity === 'WATCH' || a.severity === 'ADVISORY')).length;

  return (
    <div className="space-y-4 text-xs">
      {/* Undo Toast Notification Bar */}
      {undoToast && (
        <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/80 shadow-2xl flex items-center justify-between gap-3 text-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs truncate">
              Bulletin acknowledged: <strong className="text-white">{undoToast.title}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRestore(undoToast.id)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1 shadow-sm"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
            <button
              onClick={() => setUndoToast(null)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tactical Status & Emergency Metric Summary Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-100 text-sm tracking-wide">
                  Marine Safety Broadcast Operations
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                  LIVE GRID
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                INCOIS WebGIS &bull; NDMA Sachet CAP Alerts &bull; Open-Meteo High Sea Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 self-end sm:self-auto">
            <span>Synced: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <button
              onClick={fetchAlerts}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              title="Refresh Stream"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-ocean-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tactical Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Critical Emergencies</span>
            <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-xs ${
              emergencyCount > 0 ? 'bg-red-950 border border-red-700 text-red-300 animate-pulse' : 'bg-slate-900 text-slate-500'
            }`}>
              {emergencyCount}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Warnings</span>
            <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-xs ${
              warningCount > 0 ? 'bg-amber-950 border border-amber-700 text-amber-300' : 'bg-slate-900 text-slate-500'
            }`}>
              {warningCount}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Watches / Advisories</span>
            <span className="px-2 py-0.5 rounded-full font-mono font-bold text-xs bg-slate-900 text-sky-400 border border-slate-800">
              {watchCount}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Acknowledged</span>
            <span className="px-2 py-0.5 rounded-full font-mono font-bold text-xs bg-slate-900 text-emerald-400 border border-slate-800">
              {acknowledgedAlerts.length}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Drill Simulator (Clean for real operations, 1-click ready for testing) */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-lg">
        <button
          onClick={() => setShowDrillPanel(!showDrillPanel)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="font-bold text-slate-200 text-xs tracking-wide">
              Emergency Broadcast Drill Simulator (1-Click Evaluation Scenarios)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-purple-300 bg-purple-950/80 border border-purple-800 hidden sm:inline">
              Drill Mode
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <span>{showDrillPanel ? 'Hide Controls' : 'Show Drills'}</span>
            {showDrillPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showDrillPanel && (
          <div className="p-3.5 pt-0 border-t border-slate-800/60 bg-slate-950/40 space-y-2.5">
            <p className="text-[11px] text-slate-400">
              Trigger high-priority maritime emergency broadcasts to verify the immediate advance, acknowledgment queue, and audio-visual alarms:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleSimulate('EMERGENCY_CYCLONE')}
                disabled={activeSimulation !== null}
                className="p-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/80 text-red-200 text-left transition space-y-0.5 group"
              >
                <div className="text-[10px] font-bold text-red-400 uppercase font-mono group-hover:underline">
                  1. Cyclone Red Alert
                </div>
                <div className="text-xs truncate font-medium">Category 3 Storm</div>
              </button>

              <button
                onClick={() => handleSimulate('HIGH_WAVE_SWELL')}
                disabled={activeSimulation !== null}
                className="p-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/80 text-amber-200 text-left transition space-y-0.5 group"
              >
                <div className="text-[10px] font-bold text-amber-400 uppercase font-mono group-hover:underline">
                  2. High Swell Waves
                </div>
                <div className="text-xs truncate font-medium">3.8m Kerala Swell</div>
              </button>

              <button
                onClick={() => handleSimulate('PORT_CLOSURE')}
                disabled={activeSimulation !== null}
                className="p-2.5 rounded-xl bg-yellow-950/60 hover:bg-yellow-900/80 border border-yellow-800/80 text-yellow-200 text-left transition space-y-0.5 group"
              >
                <div className="text-[10px] font-bold text-yellow-400 uppercase font-mono group-hover:underline">
                  3. Port Closure
                </div>
                <div className="text-xs truncate font-medium">Harbor Barricade</div>
              </button>

              <button
                onClick={() => handleSimulate('LIGHTNING_SQUALL')}
                disabled={activeSimulation !== null}
                className="p-2.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/80 border border-sky-800/80 text-sky-200 text-left transition space-y-0.5 group"
              >
                <div className="text-[10px] font-bold text-sky-400 uppercase font-mono group-hover:underline">
                  4. Lightning Squall
                </div>
                <div className="text-xs truncate font-medium">Visakhapatnam Line</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Controls: Active vs Acknowledged History */}
      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-ocean-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Active Bulletins</span>
            <span className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] ${
              activeTab === 'active'
                ? 'bg-white/20 text-white'
                : emergencyCount > 0
                ? 'bg-red-950 text-red-300 border border-red-700 font-bold'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {activeAlerts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-slate-800 text-slate-100 shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acknowledged History</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-900 text-emerald-400 font-mono text-[10px] border border-slate-800">
              {acknowledgedAlerts.length}
            </span>
          </button>
        </div>

        {/* Right: Search & Sector Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:w-48 min-w-[140px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts..."
              className="w-full pl-8 pr-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-ocean-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-semibold focus:outline-none text-xs"
          >
            <option value="All">All Sectors</option>
            <option value="Mumbai Coast">Mumbai Coast</option>
            <option value="Kochi Harbor">Kochi Harbor</option>
            <option value="Chennai Offshore">Chennai Offshore</option>
            <option value="Visakhapatnam">Visakhapatnam</option>
            <option value="Porbandar">Porbandar</option>
          </select>

          {activeTab === 'history' && acknowledgedAlerts.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-semibold flex items-center gap-1 transition"
              title="Clear acknowledged records"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Filter: Severity Pills (Active Tab Only) */}
      {activeTab === 'active' && (
        <div className="flex items-center justify-between gap-2 flex-wrap px-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Severity:</span>
            {['ALL', 'EMERGENCY', 'WARNING', 'WATCH', 'ADVISORY'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                  selectedSeverity === sev
                    ? 'bg-ocean-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Source:</span>
            <button
              onClick={() => setFeedType(feedType === 'live' ? 'all' : 'live')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                feedType === 'live'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Official Live Only
            </button>
          </div>
        </div>
      )}

      {/* Content Stream */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 flex justify-center">
          <LoadingSpinner message="Correlating national maritime safety alerts..." />
        </div>
      ) : activeTab === 'active' ? (
        /* ================= ACTIVE BULLETINS VIEW ================= */
        activeAlerts.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-700 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-base">
                All Clear — Zero Active Emergency Bulletins
              </h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                All maritime weather warnings and hazardous notices have been acknowledged or no severe alerts are active for the selected sector.
              </p>
            </div>
            {acknowledgedAlerts.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('history')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700 shadow"
                >
                  <History className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Acknowledged History ({acknowledgedAlerts.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {activeAlerts.map((alert, idx) => {
              const config = severityConfigs[alert.severity] || severityConfigs.ADVISORY;
              const Icon = config.icon;
              const isFirst = idx === 0;

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 shadow-xl ${config.border} ${config.accent} ${config.glow} ${
                    isFirst ? 'ring-1 ring-white/10' : ''
                  }`}
                >
                  {/* Alert Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${config.badge}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
                            {config.tag}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
                            {alert.sector}
                          </span>
                          {alert.isSimulation ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800 text-purple-300">
                              SIMULATED DRILL
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              OFFICIAL BULLETIN
                            </span>
                          )}
                          {isFirst && activeAlerts.length > 1 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ocean-950 border border-ocean-800 text-ocean-300">
                              Next in Queue &bull; 1 of {activeAlerts.length}
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-white text-sm sm:text-base mt-1.5 tracking-tight">
                          {alert.title}
                        </h3>

                        {alert.telemetry && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {alert.telemetry.waveHeight !== null && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300">
                                Wave: <strong>{alert.telemetry.waveHeight}m</strong>
                              </span>
                            )}
                            {alert.telemetry.windSpeed !== null && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-300">
                                Wind: <strong>{alert.telemetry.windSpeed} km/h</strong>
                              </span>
                            )}
                            {alert.telemetry.windGusts !== null && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-300">
                                Gusts: <strong>{alert.telemetry.windGusts} km/h</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-[10px] text-slate-400 font-mono">
                        Issued: {new Date(alert.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px] mt-0.5">
                        {alert.agency}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-slate-200 leading-relaxed text-xs py-3 font-sans">
                    {alert.summary}
                  </p>

                  {/* Recommended Directives */}
                  {alert.recommendedActions?.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5 my-1">
                      <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Directives for Coastal Fishermen & Operators:</span>
                      </span>
                      <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                        {alert.recommendedActions.map((action, aIdx) => (
                          <li key={aIdx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Row */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>
                        Expires: {new Date(alert.expiresAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>

                    {/* Acknowledge Button that triggers immediate dismiss & advance */}
                    <button
                      onClick={() => handleAcknowledge(alert)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Acknowledge Bulletin</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-80" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ================= ACKNOWLEDGED HISTORY VIEW ================= */
        acknowledgedAlerts.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
            <History className="w-8 h-8 mx-auto text-slate-600" />
            <div className="space-y-1">
              <h3 className="font-bold text-slate-200 text-sm">
                No Acknowledged Bulletins Yet
              </h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                When you acknowledge bulletins in the Active tab, they will be archived here with full timestamps and directives.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('active')}
              className="mt-2 px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white font-semibold text-xs transition"
            >
              Go to Active Bulletins
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-slate-400 text-xs">
              <span>Showing {acknowledgedAlerts.length} past acknowledged bulletins</span>
              <span className="text-[11px] font-mono">Retained in local vessel log</span>
            </div>

            {acknowledgedAlerts.map((alert) => {
              const meta = ackMetadata[alert.id];
              const ackTimeStr = meta?.acknowledgedAt
                ? new Date(meta.acknowledgedAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Earlier today';

              return (
                <div
                  key={alert.id}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/70 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Acknowledged: {ackTimeStr}</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                          {alert.sector}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                          {alert.severity}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-200 text-sm mt-1">{alert.title}</h3>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <button
                        onClick={() => handleRestore(alert.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-ocean-300 hover:text-white font-semibold text-xs transition flex items-center gap-1.5"
                        title="Move back to active view"
                      >
                        <RotateCcw className="w-3 h-3 text-ocean-400" />
                        <span>Restore to Active</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    {alert.summary}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>Agency: {alert.agency}</span>
                    <span>Status: Acknowledged by Operator</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}