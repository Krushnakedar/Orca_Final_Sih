import React, { useState, useEffect, useRef } from 'react';
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
  AlertOctagon,
  Anchor,
  Target,
  ChevronDown,
  ChevronUp
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDirectives, setShowDirectives] = useState(false);

  // Live GPS Location State
  const [isUsingLiveLocation, setIsUsingLiveLocation] = useState(false);
  const [liveLocation, setLiveLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState(null);

  // Debounce timer ref to avoid hammering the API on every slider move
  const debounceRef = useRef(null);

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
      setGpsMessage({ type: 'warning', text: 'Geolocation not supported. Using demo coastal fix (Mumbai offshore).' });
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
        setGpsMessage({
          type: 'success',
          text: `GPS Fix: ${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E (±${coords.accuracy}m)`
        });
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsMessage({
            type: 'error',
            text: 'Location permission denied. Enable it in browser settings, or use demo fix below.'
          });
        } else {
          // On timeout/unavailable, fall back to demo
          setGpsMessage({
            type: 'warning',
            text: 'Could not get live GPS. Using demo coastal fix (Mumbai offshore).'
          });
          activateSimulatedGPS();
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
    );
  };

  const activateSimulatedGPS = () => {
    const demoFix = { lat: 18.9220, lon: 72.8347, accuracy: 12, isSimulated: true };
    setLiveLocation(demoFix);
    setIsUsingLiveLocation(true);
    setGpsLoading(false);
    setGpsMessage({ type: 'info', text: 'Demo Fix: 18.9220°N, 72.8347°E (Mumbai Offshore — simulated)' });
  };

  const handleClearLiveLocation = () => {
    setIsUsingLiveLocation(false);
    setLiveLocation(null);
    setGpsMessage(null);
  };

  // 3. Plan Route Function
  const handlePlanRoute = async () => {
    if (isUsingLiveLocation && !liveLocation) {
      return; // Wait for GPS fix to arrive
    }
    setLoading(true);
    setError(null);
    try {
      // Determine origin: live location takes priority, then custom map pin, then selected harbor
      let originParam;
      let liveLocationParam = null;

      if (isUsingLiveLocation && liveLocation) {
        // Pass liveLocation in the dedicated field AND set origin to null so backend uses it
        liveLocationParam = liveLocation;
        originParam = null;
      } else if (customOrigin) {
        originParam = { lat: customOrigin.lat, lon: customOrigin.lon, isCustom: true };
      } else {
        originParam = selectedOrigin;
      }

      // Determine destination: custom map pin takes priority, then selected destination
      const destinationParam = customDestination
        ? { lat: customDestination.lat, lon: customDestination.lon }
        : selectedDestination;

      const vesselProfile = {
        typeKey: vesselType,
        name: vesselType === 'small_motorized'
          ? 'Small Motorized Craft (12m)'
          : vesselType === 'traditional_craft'
          ? 'Traditional Craft (<10m)'
          : 'Mechanized Trawler (24m)',
        draftMeters: vesselType === 'traditional_craft' ? 1.2 : vesselType === 'trawler' ? 2.8 : 2.0
      };

      const res = await routeService.planRoute(
        originParam,
        destinationParam,
        vesselProfile,
        cruisingSpeed,
        liveLocationParam
      );

      const planData = res?.data?.data || res?.data;
      if (planData && onRouteGenerated) {
        onRouteGenerated(planData);
      }
    } catch (err) {
      console.error('Error planning dynamic route:', err);
      setError(err);
      if (err?.offline) remember('Plan route');
    } finally {
      setLoading(false);
    }
  };

  // Debounced auto-recalculate when key inputs change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handlePlanRoute();
    }, 600);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrigin, selectedDestination, customOrigin, customDestination, isUsingLiveLocation, liveLocation, vesselType, cruisingSpeed]);

  // Quick Apply Pre-determined Corridor Template
  const handleApplyTemplate = (tpl) => {
    setIsUsingLiveLocation(false);
    setLiveLocation(null);
    setSelectedOrigin(tpl.origin);
    setSelectedDestination(tpl.destination);
    if (tpl.recommendedSpeedKnots) setCruisingSpeed(tpl.recommendedSpeedKnots);
    setShowTemplates(false);
  };

  const plan = currentPlan;
  const proposed = plan?.lowerRiskProposedRoute;
  const direct = plan?.directBaselineRoute;
  const safetyComp = proposed?.safetyComparison;

  // Fuel estimate per vessel type (L/NM)
  const fuelRateByType = { small_motorized: 2.4, traditional_craft: 1.4, trawler: 5.6 };
  const fuelRate = fuelRateByType[vesselType] || 2.4;
  const estimatedFuel = proposed?.estimatedFuelLiters ?? (proposed?.totalDistanceNm
    ? Math.round(proposed.totalDistanceNm * fuelRate)
    : 0);

  const gpsMessageColors = {
    success: 'text-emerald-300 bg-emerald-950/40 border-emerald-800/60',
    info: 'text-cyan-300 bg-cyan-950/40 border-cyan-800/60',
    warning: 'text-amber-300 bg-amber-950/40 border-amber-800/60',
    error: 'text-rose-300 bg-rose-950/40 border-rose-800/60'
  };

  return (
    <div className="space-y-4 text-xs">

      {/* ── Configuration Card ── */}
      <div className="rounded-2xl bg-slate-900/95 border border-slate-800 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-slate-100 text-sm">Route Planner</h2>
          </div>
          <div className="flex items-center gap-2">
            {loading && <LoadingSpinner size="sm" />}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Auto
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">

          {/* ── Live GPS Bar ── */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px]">
                <Radio className={`w-3.5 h-3.5 ${isUsingLiveLocation ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                Live GPS Origin
              </span>
              {isUsingLiveLocation ? (
                <button
                  onClick={handleClearLiveLocation}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              ) : (
                <button
                  onClick={handleGetLiveLocation}
                  disabled={gpsLoading}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-semibold text-[11px] flex items-center gap-1.5 transition shadow-sm disabled:opacity-60"
                >
                  {gpsLoading ? <LoadingSpinner size="sm" /> : <MapPin className="w-3 h-3 text-cyan-400" />}
                  Use My GPS
                </button>
              )}
            </div>

            {isUsingLiveLocation && liveLocation && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px]">
                <span className="flex items-center gap-1.5 font-mono font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {liveLocation.lat.toFixed(4)}°N, {liveLocation.lon.toFixed(4)}°E
                  {liveLocation.isSimulated && <span className="text-amber-400 ml-1">(demo)</span>}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-900/60 px-1.5 py-0.5 rounded">±{liveLocation.accuracy}m</span>
              </div>
            )}

            {gpsMessage && (
              <div className={`text-[10px] px-2 py-1.5 rounded-lg border font-medium ${gpsMessageColors[gpsMessage.type] || 'text-slate-400'}`}>
                {gpsMessage.text}
              </div>
            )}
          </div>

          {/* ── Departure & Destination ── */}
          <div className="grid grid-cols-1 gap-3">
            {/* Departure */}
            {!isUsingLiveLocation ? (
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-emerald-400" />
                  Departure Port
                </label>
                <select
                  disabled={Boolean(customOrigin)}
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium focus:outline-none focus:border-cyan-500 transition disabled:opacity-60"
                >
                  {harbors.map((h) => (
                    <option key={h.id} value={h.id} className="bg-slate-900 text-slate-100">
                      {h.name} ({h.state})
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500">Or pick on map ↓</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectionModeChange?.('origin')}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-semibold transition ${
                        selectionMode === 'origin'
                          ? 'border-emerald-400 bg-emerald-950 text-emerald-200'
                          : 'border-slate-700 bg-slate-950 text-emerald-300 hover:border-emerald-500'
                      }`}
                    >
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {selectionMode === 'origin' ? 'Click map…' : customOrigin ? 'Change start' : 'Pick start'}
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
                  <div className="text-[10px] text-emerald-300 font-mono bg-emerald-950/30 border border-emerald-900 rounded px-2 py-1">
                    📍 Custom: {customOrigin.lat.toFixed(4)}°N, {customOrigin.lon.toFixed(4)}°E
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-800/60 flex items-center gap-2 text-slate-300">
                <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                <div>
                  <span className="text-slate-500 text-[10px] block">Departure Origin:</span>
                  <span className="font-semibold text-emerald-300 text-[11px]">Live GPS Coordinates</span>
                </div>
              </div>
            )}

            {/* Destination */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                Destination / PFZ
              </label>
              <select
                disabled={Boolean(customDestination)}
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium focus:outline-none focus:border-cyan-500 transition disabled:opacity-60"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-slate-100">
                    {d.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">Or pick on map ↓</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectionModeChange?.('destination')}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-semibold transition ${
                      selectionMode === 'destination'
                        ? 'border-cyan-400 bg-cyan-950 text-cyan-200'
                        : 'border-slate-700 bg-slate-950 text-cyan-300 hover:border-cyan-500'
                    }`}
                  >
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {selectionMode === 'destination' ? 'Click map…' : customDestination ? 'Change end' : 'Pick end'}
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
                <div className="text-[10px] text-cyan-300 font-mono bg-cyan-950/30 border border-cyan-900 rounded px-2 py-1">
                  🎯 Custom: {customDestination.lat.toFixed(4)}°N, {customDestination.lon.toFixed(4)}°E
                </div>
              )}
            </div>
          </div>

          {/* ── Vessel & Speed ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] block font-semibold">Vessel Type</label>
              <select
                value={vesselType}
                onChange={(e) => setVesselType(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-medium focus:outline-none focus:border-cyan-500 text-[11px]"
              >
                <option value="small_motorized">Small Motorized (12m)</option>
                <option value="traditional_craft">Traditional (&lt;10m)</option>
                <option value="trawler">Trawler (24m)</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold">Speed</span>
                <span className="font-mono font-bold text-cyan-400">{cruisingSpeed} kn</span>
              </div>
              <input
                type="range"
                min="4"
                max="18"
                step="0.5"
                value={cruisingSpeed}
                onChange={(e) => setCruisingSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 mt-2"
              />
              <div className="flex justify-between text-[9px] text-slate-600">
                <span>4 kn</span><span>18 kn</span>
              </div>
            </div>
          </div>

          {/* ── Quick Templates ── */}
          {templates.length > 0 && (
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-950 hover:bg-slate-900 text-[11px] font-semibold text-slate-300 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Corridor Templates ({templates.length})
                </span>
                {showTemplates ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              {showTemplates && (
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950/50 border-t border-slate-800 max-h-32 overflow-y-auto">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700 text-slate-300 hover:text-cyan-300 text-[10px] transition text-left"
                      title={tpl.description}
                    >
                      ⚡ {tpl.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {error && <ApiError error={error} onRetry={handlePlanRoute} />}
        </div>
      </div>

      {/* ── Route Results ── */}
      {plan && (
        <div className="space-y-3">

          {/* Safety verdict banner */}
          {safetyComp?.explanation && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-200">Safety Verdict: </strong>
                {safetyComp.explanation}
              </div>
            </div>
          )}

          {/* ── Recommended Route Card ── */}
          <div className="rounded-xl bg-slate-900 border border-cyan-700/60 shadow-lg overflow-hidden">
            <div className="px-4 py-3 bg-cyan-950/30 border-b border-cyan-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold text-cyan-300 text-xs">Recommended Route</span>
                <span className="text-[10px] text-slate-400">(100% Sea Lane)</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                proposed?.riskLevel === 'LOW'
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                  : proposed?.riskLevel === 'MODERATE'
                  ? 'bg-amber-950 border-amber-700 text-amber-300'
                  : 'bg-rose-950 border-rose-700 text-rose-300'
              }`}>
                {proposed?.riskLevel || '—'} Risk · {proposed?.riskScore}/100
              </span>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 rounded-lg p-2.5 text-center">
                  <span className="text-slate-500 text-[10px] block mb-0.5">Distance</span>
                  <strong className="text-slate-100 text-sm">{proposed?.totalDistanceNm}</strong>
                  <span className="text-slate-500 text-[10px] ml-1">NM</span>
                </div>
                <div className="bg-slate-950/60 rounded-lg p-2.5 text-center">
                  <span className="text-slate-500 text-[10px] block mb-0.5">Est. Time</span>
                  <strong className="text-slate-100 text-sm">{proposed?.estimatedDurationHours}</strong>
                  <span className="text-slate-500 text-[10px] ml-1">hrs</span>
                </div>
                <div className="bg-slate-950/60 rounded-lg p-2.5 text-center">
                  <span className="text-emerald-500 text-[10px] block mb-0.5 flex items-center justify-center gap-0.5">
                    <Waves className="w-3 h-3" /> Max Swell
                  </span>
                  <strong className="text-emerald-400 text-sm">{proposed?.maxWaveExposureM}</strong>
                  <span className="text-slate-500 text-[10px] ml-1">m</span>
                </div>
                <div className="bg-slate-950/60 rounded-lg p-2.5 text-center">
                  <span className="text-amber-500 text-[10px] block mb-0.5 flex items-center justify-center gap-0.5">
                    <Fuel className="w-3 h-3" /> Est. Fuel
                  </span>
                  <strong className="text-slate-100 text-sm">{estimatedFuel}</strong>
                  <span className="text-slate-500 text-[10px] ml-1">L</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Clear of all restricted naval zones &amp; marine protected areas
              </div>
            </div>
          </div>

          {/* ── Direct Baseline Reference ── */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Direct Baseline (Unoptimized)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Score: {direct?.riskScore}/100
              </span>
            </div>
            <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
              <span>Straight-line: <strong className="text-slate-400">{direct?.totalDistanceNm} NM</strong></span>
              <span>·</span>
              <span>Max Swell: <strong className="text-slate-400">{direct?.maxWaveExposureM}m</strong></span>
              {direct?.hazardBreaches > 0 && (
                <>
                  <span>·</span>
                  <span className="text-rose-400 font-semibold">⚠ {direct.hazardBreaches} Restriction{direct.hazardBreaches > 1 ? 's' : ''} Breached</span>
                </>
              )}
            </div>
            {onToggleDirectBaseline && (
              <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Show on map for comparison:</span>
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showDirectBaseline}
                    onChange={(e) => onToggleDirectBaseline(e.target.checked)}
                    className="rounded accent-rose-500 bg-slate-950 border-slate-700"
                  />
                  <span className="text-[10px] text-slate-400">{showDirectBaseline ? <><Eye className="w-3 h-3 inline text-rose-400" /> Hide</> : <><EyeOff className="w-3 h-3 inline" /> Show</>}</span>
                </label>
              </div>
            )}
          </div>

          {/* ── Turn-by-Turn Directives (collapsible) ── */}
          {proposed?.turnByTurnDirectives?.length > 0 && (
            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDirectives(!showDirectives)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition"
              >
                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  Turn-by-Turn Directives
                  <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 rounded px-1.5 py-0.5 font-mono">
                    {proposed.turnByTurnDirectives.length} legs
                  </span>
                </span>
                {showDirectives
                  ? <ChevronUp className="w-4 h-4 text-slate-500" />
                  : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {showDirectives && (
                <div className="border-t border-slate-800 max-h-64 overflow-y-auto">
                  {proposed.turnByTurnDirectives.map((leg) => (
                    <div
                      key={leg.legIndex}
                      className="flex items-start justify-between px-4 py-3 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition text-[11px]"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="font-semibold text-slate-200 truncate">{leg.instruction}</div>
                        <div className="text-slate-500 flex flex-wrap gap-x-2">
                          <span>{leg.distanceNm} NM</span>
                          <span>·</span>
                          <span>{leg.estimatedMinutes} min</span>
                          <span>·</span>
                          <span className="text-emerald-400">Swell {leg.waveHeightM}m</span>
                        </div>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <div className="font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded text-[11px]">
                          {leg.bearingDegrees}°
                        </div>
                        <span className="text-[9px] text-emerald-400 font-mono">
                          {leg.geofenceClear ? 'CLEAR' : '⚠ CHECK'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-400">Navigational Advisory: </span>
            Route recommendations are decision-support only. The Vessel Master retains full legal and operational command.
          </div>
        </div>
      )}
    </div>
  );
}
