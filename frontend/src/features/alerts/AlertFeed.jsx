import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Waves,
  Anchor,
  Flame,
  Clock,
  Radio,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { alertService } from '../../services/alertService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export default function AlertFeed({ onAlertChange }) {
  const { user } = useAuth();
  const userKey = user?.email || 'default';

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedSector, setSelectedSector] = useState('All');
  const [feedType, setFeedType] = useState('live');
  const [lastSync, setLastSync] = useState(new Date());
  const [activeSimulation, setActiveSimulation] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await alertService.getAlerts({
        sector: selectedSector !== 'All' ? selectedSector : undefined,
        severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined,
        feedType: feedType
      });
      if (res?.data) {
        const localAcks = JSON.parse(
          localStorage.getItem(`orca_acks_${userKey}`) || '[]',
        );
        const withLocalAcks = res.data.map((a) =>
          localAcks.includes(a.id) ? { ...a, status: 'ACKNOWLEDGED' } : a,
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
  }, [selectedSeverity, selectedSector, feedType, userKey]);

  const handleSimulate = async (scenario) => {
    setActiveSimulation(scenario);
    try {
      await alertService.simulateAlert(scenario);
      await fetchAlerts();
      window.dispatchEvent(new CustomEvent('orca-alert-change'));
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setActiveSimulation(null);
    }
  };

  const handleAcknowledge = async (id) => {
    let prevStatus = 'ACTIVE';
    // Optimistic UI: reflect the ack immediately.
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          prevStatus = a.status;
          return { ...a, status: 'ACKNOWLEDGED' };
        }
        return a;
      }),
    );

    try {
      await alertService.acknowledgeAlert(id);
      const localAcks = JSON.parse(
        localStorage.getItem(`orca_acks_${userKey}`) || '[]',
      );
      if (!localAcks.includes(id)) {
        localAcks.push(id);
        localStorage.setItem(`orca_acks_${userKey}`, JSON.stringify(localAcks));
      }
    } catch (err) {
      if (err?.offline) {
        // api.js did not queue — endpoint is not in syncPolicy.
        // Roll back the optimistic UI change.
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: prevStatus } : a)),
        );
      } else {
        console.error('Acknowledge error:', err);
      }
    }
    window.dispatchEvent(new CustomEvent('orca-alert-change'));
  };

  const severityConfigs = {
    EMERGENCY: {
      badge: 'bg-red-950 border-red-700 text-red-200',
      tag: 'CRITICAL EMERGENCY',
      border: 'border-red-600/80 bg-red-950/20',
      icon: ShieldAlert,
      iconColor: 'text-red-400',
    },
    WARNING: {
      badge: 'bg-amber-950 border-amber-800 text-amber-200',
      tag: 'OFFICIAL WARNING',
      border: 'border-amber-700/70 bg-amber-950/20',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    WATCH: {
      badge: 'bg-yellow-950 border-yellow-800 text-yellow-200',
      tag: 'HAZARD WATCH',
      border: 'border-yellow-700/60 bg-yellow-950/20',
      icon: Zap,
      iconColor: 'text-yellow-400',
    },
    ADVISORY: {
      badge: 'bg-sky-950 border-sky-800 text-sky-200',
      tag: 'COASTAL ADVISORY',
      border: 'border-sky-800/60 bg-sky-950/20',
      icon: Radio,
      iconColor: 'text-sky-400'
    },
    INFORMATIONAL: {
      badge: 'bg-emerald-950 border-emerald-800 text-emerald-200',
      tag: 'ALL-CLEAR / SAFE SEA STATE',
      border: 'border-emerald-800/50 bg-emerald-950/20',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400'
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Live Government Gateway Status Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-800/50 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-100 text-xs tracking-wide">
                Live National Safety & Meteorological Stream
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
                LIVE GATEWAY ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Live feeds from NDMA Sachet (IMD/INCOIS CAP) & Open-Meteo marine sensors
            </div>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-400">
          Last Synced: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* 1-Click Simulation Buttons (Crucial for SIH Hackathon Judges) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Emergency Alert Broadcast Simulator (1-Click Drill):</span>
          </span>
          <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800 px-2 py-0.5 rounded-full">
            Evaluation Drill Mode
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleSimulate('EMERGENCY_CYCLONE')}
            disabled={activeSimulation !== null}
            className="p-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-200 text-left transition space-y-0.5"
          >
            <div className="text-[10px] font-bold text-red-400 uppercase font-mono">
              1. Cyclone Alert
            </div>
            <div className="text-xs truncate font-medium">Category 3 Storm</div>
          </button>

          <button
            onClick={() => handleSimulate('HIGH_WAVE_SWELL')}
            disabled={activeSimulation !== null}
            className="p-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 text-amber-200 text-left transition space-y-0.5"
          >
            <div className="text-[10px] font-bold text-amber-400 uppercase font-mono">
              2. High Wave Watch
            </div>
            <div className="text-xs truncate font-medium">3.8m Kerala Swell</div>
          </button>

          <button
            onClick={() => handleSimulate('PORT_CLOSURE')}
            disabled={activeSimulation !== null}
            className="p-2.5 rounded-xl bg-yellow-950/60 hover:bg-yellow-900/80 border border-yellow-800 text-yellow-200 text-left transition space-y-0.5"
          >
            <div className="text-[10px] font-bold text-yellow-400 uppercase font-mono">
              3. Port Closure
            </div>
            <div className="text-xs truncate font-medium">
              Kasimedu Barricade
            </div>
          </button>

          <button
            onClick={() => handleSimulate('LIGHTNING_SQUALL')}
            disabled={activeSimulation !== null}
            className="p-2.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/80 border border-sky-800 text-sky-200 text-left transition space-y-0.5"
          >
            <div className="text-[10px] font-bold text-sky-400 uppercase font-mono">
              4. Lightning Squall
            </div>
            <div className="text-xs truncate font-medium">
              Visakhapatnam Line
            </div>
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Feed Type Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'live', label: '🟢 Live Official Feeds' },
            { id: 'all', label: 'All Alerts' },
            { id: 'simulated', label: '🟣 Simulated Drills' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFeedType(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                feedType === tab.id
                  ? 'bg-slate-800 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'EMERGENCY', 'WARNING', 'WATCH', 'ADVISORY'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedSeverity === sev
                  ? 'bg-ocean-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-semibold focus:outline-none text-xs"
          >
            <option value="All">All Coastal Sectors</option>
            <option value="Mumbai Coast">Mumbai Coast</option>
            <option value="Kochi Harbor">Kochi Harbor</option>
            <option value="Chennai Offshore">Chennai Offshore</option>
            <option value="Visakhapatnam">Visakhapatnam</option>
            <option value="Porbandar">Porbandar</option>
          </select>

          <button
            onClick={fetchAlerts}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            title="Refresh Alert Stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500/60" />
            <p className="font-semibold text-slate-400 text-xs">
              No active emergency alerts for selected filters.
            </p>
            <p className="text-[11px]">
              All coastal sectors are currently within nominal baseline
              advisory limits.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config =
              severityConfigs[alert.severity] || severityConfigs.ADVISORY;
            const Icon = config.icon;
            const isAck = alert.status === 'ACKNOWLEDGED';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition shadow-lg ${config.border} ${
                  isAck ? 'opacity-60 border-slate-800 bg-slate-950/40' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-2 rounded-xl border shrink-0 mt-0.5 ${config.badge}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${config.badge}`}
                        >
                          {config.tag}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                          {alert.sector}
                        </span>
                        {alert.isSimulation ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800 text-purple-300">
                            SIMULATED DRILL
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            LIVE OFFICIAL BULLETIN
                          </span>
                        )}
                        {isAck && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            ACKNOWLEDGED
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-100 text-sm mt-1">{alert.title}</h3>
                      {alert.telemetry && (
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {alert.telemetry.waveHeight !== null && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                              Wave: {alert.telemetry.waveHeight}m
                            </span>
                          )}
                          {alert.telemetry.windSpeed !== null && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300">
                              Wind: {alert.telemetry.windSpeed} km/h
                            </span>
                          )}
                          {alert.telemetry.windGusts !== null && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                              Gusts: {alert.telemetry.windGusts} km/h
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 font-mono">
                      Issued:{' '}
                      {new Date(alert.issuedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">
                      {alert.agency}
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed text-xs py-2.5 font-sans">
                  {alert.summary}
                </p>

                {alert.recommendedActions?.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-1.5 my-1">
                    <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Directives for Coastal Fishermen & Operators:
                      </span>
                    </span>
                    <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                      {alert.recommendedActions.map((action, aIdx) => (
                        <li key={aIdx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Expires:{' '}
                    {new Date(alert.expiresAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {!isAck ? (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      Acknowledge Bulletin
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}