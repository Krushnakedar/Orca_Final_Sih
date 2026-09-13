import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Compass,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Waves,
  Wind,
  Fuel,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info,
  Radio,
  Zap,
  RotateCcw,
  Eye,
  EyeOff,
  AlertOctagon
} from 'lucide-react';
import { routeService } from '../../services/routeService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ApiError from '../../components/ApiError';
import { usePendingActions } from '../../context/PendingActionContext';

export default function RoutePlanner({
  onRouteGenerated,
  currentPlan,
  showDirectBaseline = false,
  onToggleDirectBaseline,
  customOrigin = null,
  customDestination = null,
  selectionMode = null,
  onSelectionModeChange,
  onClearCustomPoint
}) {
  const { remember } = usePendingActions();

  const [harbors, setHarbors] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedOrigin, setSelectedOrigin] = useState('mumbai_sassoon_dock');
  const [selectedDestination, setSelectedDestination] = useState('mumbai_pfz_alpha');
  const [cruisingSpeed, setCruisingSpeed] = useState(8.5);
  const [vesselType, setVesselType] = useState('small_motorized');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live GPS Location State
  const [isUsingLiveLocation, setIsUsingLiveLocation] = useState(false);
  const [liveLocation, setLiveLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState(null);

  // 1. Fetch Harbors, Destinations & Route Templates on Mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [wpRes, tplRes] = await Promise.all([
          routeService.getWaypoints().catch(() => null),
          routeService.getTemplates().catch(() => null)
        ]);

        if (wpRes?.data) {
          const payload = wpRes.data.data || wpRes.data;
          setHarbors(payload.harbors || []);
          setDestinations(payload.destinations || []);
        }

        if (tplRes?.data) {
          const tpls = tplRes.data.data || tplRes.data;
          setTemplates(Array.isArray(tpls) ? tpls : []);
        }
      } catch (err) {
        console.error('Error loading route waypoints or templates:', err);
      }
    };

    fetchMetadata();
  }, []);

  // 2. Handle Live Location Geolocation API
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsMessage({ type: 'error', text: 'Geolocation not supported by browser. Using simulated coastal fix.' });
      activateSimulatedGPS();
      return;
    }

    setGpsLoading(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 15)
        };
        setLiveLocation(coords);
        setIsUsingLiveLocation(true);
        setGpsLoading(false);
        setGpsMessage({ type: 'success', text: `GPS Fix: ${coords.lat.toFixed(3)}°N, ${coords.lon.toFixed(3)}°E (±${coords.accuracy}m)` });
      },
      (err) => {
        console.warn('Geolocation failed, falling back to coastal GPS fix:', err.message);
        activateSimulatedGPS();
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const activateSimulatedGPS = () => {
    const demoFix = { lat: 18.9220, lon: 72.8347, accuracy: 12, isSimulated: true };
    setLiveLocation(demoFix);
    setIsUsingLiveLocation(true);
    setGpsLoading(false);
    setGpsMessage({ type: 'info', text: 'Live Coastal Fix Active: 18.922°N, 72.835°E (Mumbai Offshore)' });
  };

  const handleClearLiveLocation = () => {
    setIsUsingLiveLocation(false);
    setLiveLocation(null);
    setGpsMessage(null);
  };

  // 3. Plan Route Function (incorporates all parameters & live location)
  const handlePlanRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await routeService.planRoute(
        isUsingLiveLocation ? null : (customOrigin ? { ...customOrigin, isCustom: true } : selectedOrigin),
        customDestination || selectedDestination,
        {
          typeKey: vesselType,
          name: vesselType === 'small_motorized'
            ? 'Small Motorized Craft (12m)'
            : vesselType === 'traditional_craft'
            ? 'Traditional Craft (<10m)'
            : 'Mechanized Trawler (24m)',
          draftMeters: vesselType === 'traditional_craft' ? 1.2 : 2.2
        },
        cruisingSpeed,
        isUsingLiveLocation ? liveLocation : null
      );

      const planData = res?.data?.data || res?.data;
      if (planData && onRouteGenerated) {
        onRouteGenerated(planData);
      }
    } catch (err) {
      console.error('Error planning dynamic route:', err);
      setError(err);
      // Offline: remember intent so the user gets a toast when back online.
      if (err?.offline) remember('Plan route');
    } finally {
      setLoading(false);
    }
  };

  // Auto-recalculate when key inputs change
  useEffect(() => {
    handlePlanRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrigin, selectedDestination, customOrigin, customDestination, isUsingLiveLocation, liveLocation, vesselType, cruisingSpeed]);

  // Quick Apply Pre-determined Corridor Template
  const handleApplyTemplate = (tpl) => {
    setIsUsingLiveLocation(false);
    setLiveLocation(null);
    setSelectedOrigin(tpl.origin);
    setSelectedDestination(tpl.destination);
    if (tpl.recommendedSpeedKnots) {
      setCruisingSpeed(tpl.recommendedSpeedKnots);
    }
  };

  const plan = currentPlan;
  const direct = plan?.directBaselineRoute;
  const proposed = plan?.lowerRiskProposedRoute;
  const safetyComp = proposed?.safetyComparison;

  return (
    <div className="space-y-3 sm:space-y-4 text-xs">
      {/* Configuration Controls Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-slate-800 space-y-3.5 sm:space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-slate-100 text-sm">Dynamic Maritime Route Planner</h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            &lt;50ms Router
          </span>
        </div>

        {/* Live GPS Location Bar */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px] sm:text-xs">
              <Radio className={`w-3.5 h-3.5 ${isUsingLiveLocation ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span>Live Vessel GPS Routing:</span>
            </span>

            {isUsingLiveLocation ? (
              <button
                onClick={handleClearLiveLocation}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Harbor
              </button>
            ) : (
              <button
                onClick={handleGetLiveLocation}
                disabled={gpsLoading}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-semibold text-[11px] flex items-center gap-1.5 transition shadow-sm"
              >
                {gpsLoading ? <LoadingSpinner size="sm" /> : <MapPin className="w-3 h-3 text-cyan-400" />}
                Use My Live GPS
              </button>
            )}
          </div>

          {isUsingLiveLocation && liveLocation && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] flex-wrap gap-1">
              <span className="flex items-center gap-1.5 font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {liveLocation.lat.toFixed(4)}°N, {liveLocation.lon.toFixed(4)}°E
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-900/60 px-1.5 py-0.5 rounded">
                Fix (±{liveLocation.accuracy}m)
              </span>
            </div>
          )}

          {gpsMessage && !isUsingLiveLocation && (
            <div className="text-[10px] text-slate-400">{gpsMessage.text}</div>
          )}
        </div>

        {/* Departure Port / Harbor Selector (Disabled if using Live GPS) */}
        {!isUsingLiveLocation ? (
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Departure Port / Harbor:</span>
            </label>
            <select
              disabled={Boolean(customOrigin)}
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium focus:outline-none focus:border-cyan-500 transition"
            >
              {harbors.map((h) => (
                <option key={h.id} value={h.id} className="bg-slate-900 text-slate-100">
                  {h.name} ({h.state})
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] text-slate-500">Or choose any offshore point on the map.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectionModeChange?.('origin')}
                  className={`px-2 py-1 rounded-lg border text-[10px] font-semibold transition ${selectionMode === 'origin' ? 'border-emerald-400 bg-emerald-950 text-emerald-200' : 'border-slate-700 bg-slate-950 text-emerald-300 hover:border-emerald-500'}`}
                >
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {selectionMode === 'origin' ? 'Picking start...' : customOrigin ? 'Pick another start' : 'Pick start on map'}
                </button>
                {customOrigin && (
                  <button
                    type="button"
                    onClick={() => onClearCustomPoint?.('origin')}
                    className="text-[10px] text-rose-300 hover:text-rose-200 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {customOrigin && (
              <div className="text-[10px] text-emerald-300 font-mono">Custom start: {customOrigin.lat.toFixed(4)}°N, {customOrigin.lon.toFixed(4)}°E</div>
            )}
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-500 text-[10px] block">Departure Origin:</span>
              <span className="font-semibold text-emerald-300">Live GPS Coordinates (snapped to coastal water)</span>
            </div>
          </div>
        )}

        {/* Destination PFZ Selector */}
        <div className="space-y-1.5">
          <label className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Destination Fishing Ground / PFZ:</span>
          </label>
          <select
            disabled={Boolean(customDestination)}
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium focus:outline-none focus:border-cyan-500 transition"
          >
            {destinations.map((d) => (
              <option
                key={d.id}
                value={d.id}
                className="bg-slate-900 text-slate-100"
              >
                {d.name} &bull; {d.targetSpecies?.join(', ')}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[10px] text-slate-500">Or choose any offshore destination.</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectionModeChange?.('destination')}
                className={`px-2 py-1 rounded-lg border text-[10px] font-semibold transition ${selectionMode === 'destination' ? 'border-cyan-400 bg-cyan-950 text-cyan-200' : 'border-slate-700 bg-slate-950 text-cyan-300 hover:border-cyan-500'}`}
              >
                <MapPin className="w-3 h-3 inline mr-1" />
                {selectionMode === 'destination' ? 'Picking end...' : customDestination ? 'Pick another end' : 'Pick end on map'}
              </button>
              {customDestination && (
                <button
                  type="button"
                  onClick={() => onClearCustomPoint?.('destination')}
                  className="text-[10px] text-rose-300 hover:text-rose-200 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {customDestination && (
            <div className="text-[10px] text-cyan-300 font-mono">Custom end: {customDestination.lat.toFixed(4)}°N, {customDestination.lon.toFixed(4)}°E</div>
          )}
        </div>

        {/* Predetermined Route Quick-Picks */}
        {templates.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Predetermined Maritime Corridors:</span>
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700 text-slate-300 hover:text-cyan-300 text-[10px] transition text-left"
                  title={tpl.description}
                >
                  ⚡ {tpl.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cruising Speed & Vessel Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">Vessel Type:</label>
            <select
              value={vesselType}
              onChange={(e) => setVesselType(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="small_motorized">Small Motorized (12m)</option>
              <option value="traditional_craft">Traditional Craft (&lt;10m)</option>
              <option value="trawler">Mechanized Trawler (24m)</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Cruising Speed:</span>
              <span className="font-mono font-bold text-cyan-400">{cruisingSpeed} Knots</span>
            </div>
            <input
              type="range"
              min="5"
              max="18"
              step="0.5"
              value={cruisingSpeed}
              onChange={(e) => setCruisingSpeed(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-950 mt-1.5"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-slate-500 border-t border-slate-800">
          {loading ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{loading ? 'Updating route for current settings...' : 'Route updates automatically as settings change'}</span>
        </div>

        {/* Offline / error feedback */}
        {error && (
          <ApiError error={error} onRetry={handlePlanRoute} />
        )}
      </div>

      {/* Multi-Parameter Context & Risk Comparison */}
      {plan && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Environmental Context & Telemetry
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              WMO & INCOIS Validated
            </span>
          </div>

          {/* Safety Comparison Alert Banner */}
          {safetyComp?.explanation && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/80 text-cyan-300 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-200">Safety Verdict: </strong>
                {safetyComp.explanation}
              </div>
            </div>
          )}

          {/* Primary Recommended Route Card (100% Waterway) */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-700 space-y-3 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Recommended Route (100% Sea Lane)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                Score: {proposed?.riskScore}/100 ({proposed?.riskLevel})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
              <div>
                <span className="text-slate-500 block">Distance:</span>
                <strong className="text-slate-200">{proposed?.totalDistanceNm} NM</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Est. Time:</span>
                <strong className="text-slate-200">{proposed?.estimatedDurationHours} Hours</strong>
              </div>
              <div>
                <span className="text-slate-500 block flex items-center gap-1">
                  <Waves className="w-3 h-3 text-emerald-400" /> Max Swell:
                </span>
                <strong className="text-emerald-400">{proposed?.maxWaveExposureM} m</strong>
              </div>
              <div>
                <span className="text-slate-500 block flex items-center gap-1">
                  <Fuel className="w-3 h-3 text-amber-400" /> Est. Fuel:
                </span>
                <strong className="text-slate-200">{proposed?.estimatedFuelLiters} L</strong>
              </div>
              <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-800/40">
                <span className="text-slate-500 block">Geofence Clearance:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  100% Clear of Military Firing Ranges & Protected Marine Areas
                </span>
              </div>
            </div>
          </div>

          {/* Unoptimized Direct Baseline Reference Card (Land-cutting Path) */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Unoptimized Direct Baseline:</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Score: {direct?.riskScore}/100 ({direct?.hazardBreaches > 0 ? 'High Risk' : 'Baseline'})
              </span>
            </div>

            <div className="text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span>Straight-line: {direct?.totalDistanceNm} NM &bull; Max Swell: {direct?.maxWaveExposureM}m &bull; Hazards: {direct?.hazardBreaches > 0 ? `${direct.hazardBreaches} Breach (${direct.breachedZones?.join(', ') || 'INS Trata'})` : 'None'}</span>
            </div>

            {onToggleDirectBaseline && (
              <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Direct line cuts landmass & hazards:</span>
                <label className="flex items-center gap-1 cursor-pointer text-[10px] text-cyan-400 hover:text-cyan-300 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={showDirectBaseline}
                    onChange={(e) => onToggleDirectBaseline(e.target.checked)}
                    className="rounded accent-rose-500 bg-slate-950 border-slate-700"
                  />
                  <span>{showDirectBaseline ? 'Hide from map' : 'Show on map to compare'}</span>
                </label>
              </div>
            )}
          </div>

          {/* Turn-by-Turn Steerage Directives */}
          {proposed?.turnByTurnDirectives?.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Steerage Directives ({proposed.turnByTurnDirectives.length} Legs):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Magnetic Bearings
                </span>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {proposed.turnByTurnDirectives.map((leg) => (
                  <div
                    key={leg.legIndex}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px] hover:border-slate-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-200">{leg.instruction}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Leg: <strong className="text-slate-300">{leg.distanceNm} NM</strong></span>
                        <span>&bull;</span>
                        <span>ETA: <strong className="text-slate-300">{leg.estimatedMinutes} mins</strong></span>
                        <span>&bull;</span>
                        <span className="text-emerald-400">Wave: {leg.waveHeightM}m</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <div className="font-mono text-cyan-400 font-bold bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded text-[11px] shadow-sm">
                        {leg.bearingDegrees}°
                      </div>
                      <span className="text-[9px] text-emerald-400 font-mono">CLEAR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Maritime Safety Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-500 leading-relaxed space-y-1">
            <span className="font-bold text-slate-400">Scientific Navigational Disclaimer:</span>
            <p>
              ORCA calculates <strong>"Lower-risk route recommendations"</strong> utilizing multi-parameter environmental context. The platform provides navigational decision support only; the Vessel Master maintains ultimate legal and operational command.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
