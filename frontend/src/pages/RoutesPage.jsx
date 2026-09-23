import React, { useState, useEffect } from 'react';
import {
  Navigation,
  MapPin,
  RefreshCw,
  Compass,
  Map as MapIcon,
  Sliders,
  ShieldCheck,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import MarineMap from '../features/map/MarineMap';
import RoutePlanner from '../features/routes/RoutePlanner';
import { mapService } from '../services/mapService';
import StaleBadge from '../components/StaleBadge';
import ApiError from '../components/ApiError';

export default function RoutesPage() {
  const [selectedSector, setSelectedSector] = useState('Mumbai Coast');
  const [layersData, setLayersData] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Requirement 1: Direct baseline off by default
  const [showDirectBaseline, setShowDirectBaseline] = useState(false);

  // Requirement 2: Mobile friendly tab switcher
  const [mobileTab, setMobileTab] = useState('map'); // 'map' | 'planner'
  const [selectionMode, setSelectionMode] = useState(null);
  const [customOrigin, setCustomOrigin] = useState(null);
  const [customDestination, setCustomDestination] = useState(null);

  const handleMapPick = ({ lat, lon, mode }) => {
    const point = { lat, lon };
    if (mode === 'origin') setCustomOrigin(point);
    if (mode === 'destination') setCustomDestination(point);
    setSelectionMode(null); // Clear selection mode after point is picked
    setMobileTab('planner'); // Switch to planner tab to show the picked point
  };

  const handleRouteGenerated = (plan) => {
    setCurrentPlan(plan);
  };

  const fetchLayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mapService.getLayers(selectedSector);
      if (res?.data) {
        setLayersData(res.data);
      }
    } catch (err) {
      console.error('Error fetching map layers for route planner:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSector]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Route Planner
            </h1>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-medium">
              100% Waterway Routing
            </span>
            <StaleBadge
              url={`/map/layers?sector=${encodeURIComponent(selectedSector)}`}
            />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Intelligent maritime route planning — avoiding naval exercise zones, hazardous shoals, and MPAs
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sector Selector */}
          <div className="flex-1 sm:flex-initial flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400 hidden sm:inline">Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent font-semibold text-slate-100 focus:outline-none cursor-pointer text-xs w-full"
            >
              <option value="Mumbai Coast" className="bg-slate-900 text-slate-100">Arabian Sea / Mumbai</option>
              <option value="Kochi Harbor" className="bg-slate-900 text-slate-100">Arabian Sea / Kochi</option>
              <option value="Chennai Offshore" className="bg-slate-900 text-slate-100">Bay of Bengal / Chennai</option>
              <option value="Visakhapatnam" className="bg-slate-900 text-slate-100">Bay of Bengal / Vizag</option>
              <option value="Porbandar" className="bg-slate-900 text-slate-100">Gujarat / Porbandar</option>
            </select>
          </div>

          <button
            onClick={fetchLayers}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 transition shrink-0"
            title="Reload Map Layers"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'map'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Interactive Map</span>
        </button>
        <button
          onClick={() => setMobileTab('planner')}
          className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'planner'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Route Controls</span>
          {currentPlan && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          )}
        </button>
      </div>

      {/* Route Summary Bar (when route is computed) */}
      {currentPlan && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-cyan-800/50 bg-cyan-950/20 p-3 sm:p-4">
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase tracking-wide text-cyan-400 block">Route Ready</span>
            <p className="text-xs font-semibold text-white truncate" title={currentPlan.origin?.name}>{currentPlan.origin?.name}</p>
            <p className="text-[10px] text-slate-400 truncate" title={currentPlan.destination?.name}>→ {currentPlan.destination?.name}</p>
          </div>
          <div className="bg-slate-950/40 rounded-xl px-3 py-2">
            <span className="text-[10px] text-slate-500 block">Distance</span>
            <strong className="text-base text-white">{currentPlan.lowerRiskProposedRoute?.totalDistanceNm} <span className="text-xs font-normal text-slate-400">NM</span></strong>
          </div>
          <div className="bg-slate-950/40 rounded-xl px-3 py-2">
            <span className="text-[10px] text-slate-500 block">Est. Time</span>
            <strong className="text-base text-white">{currentPlan.lowerRiskProposedRoute?.estimatedDurationHours} <span className="text-xs font-normal text-slate-400">hrs</span></strong>
          </div>
          <div className="bg-slate-950/40 rounded-xl px-3 py-2">
            <span className="text-[10px] text-slate-500 block">Risk Level</span>
            <strong className={`text-base ${
              currentPlan.lowerRiskProposedRoute?.riskLevel === 'LOW' ? 'text-emerald-400' :
              currentPlan.lowerRiskProposedRoute?.riskLevel === 'MODERATE' ? 'text-amber-400' : 'text-rose-400'
            }`}>{currentPlan.lowerRiskProposedRoute?.riskLevel || '—'}</strong>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:items-start">

        {/* Map Column — 7 cols, sticky */}
        <div className={`space-y-3 lg:col-span-7 ${mobileTab === 'map' ? 'block' : 'hidden lg:block'}`}>
          {/* Selection mode hint banner */}
          {selectionMode && (
            <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs ${
              selectionMode === 'origin'
                ? 'border-emerald-700 bg-emerald-950/50 text-emerald-200'
                : 'border-cyan-700 bg-cyan-950/50 text-cyan-200'
            }`}>
              <span>
                <strong>{selectionMode === 'origin' ? '📍 Picking start point' : '🎯 Picking end point'}</strong>
                {' '}— click anywhere on the water to set this location.
              </span>
              <button
                type="button"
                onClick={() => setSelectionMode(null)}
                className="shrink-0 text-[10px] font-semibold text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-700"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950">
            <MarineMap
              layersData={layersData}
              selectedSector={selectedSector}
              onSelectSector={setSelectedSector}
              heightClassName="h-[340px] sm:h-[420px] md:h-[500px] lg:h-[580px] xl:h-[650px]"
              compact={false}
              routePlan={currentPlan}
              selectionMode={selectionMode}
              onMapPick={handleMapPick}
              showDirectBaseline={showDirectBaseline}
              onToggleDirectBaseline={setShowDirectBaseline}
            />
          </div>

          {/* Map legend bar */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-4 h-1 bg-cyan-400 inline-block rounded-full shadow-sm shadow-cyan-400" />
                <span className="text-cyan-200">Safe Sea Route</span>
              </span>
              {showDirectBaseline && (
                <span className="flex items-center gap-1.5 font-medium text-rose-300">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
                  <span>Direct Baseline</span>
                </span>
              )}
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400 hover:text-slate-200 select-none">
              <input
                type="checkbox"
                checked={showDirectBaseline}
                onChange={(e) => setShowDirectBaseline(e.target.checked)}
                className="rounded accent-rose-500 bg-slate-950 border-slate-700"
              />
              <span>Compare Direct Baseline</span>
            </label>
          </div>

          {/* Mobile: switch to planner */}
          <div className="block lg:hidden">
            <button
              onClick={() => setMobileTab('planner')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Open Route Controls & Directives</span>
              <Navigation className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Planner Column — 5 cols, sticky */}
        <div className={`lg:col-span-5 lg:sticky lg:top-4 ${mobileTab === 'planner' ? 'block' : 'hidden lg:block'}`}>
          {/* Mobile: back to map */}
          <div className="block lg:hidden mb-3">
            <button
              onClick={() => setMobileTab('map')}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>← Back to Map</span>
            </button>
          </div>

          <RoutePlanner
            onRouteGenerated={handleRouteGenerated}
            currentPlan={currentPlan}
            customOrigin={customOrigin}
            customDestination={customDestination}
            selectionMode={selectionMode}
            onSelectionModeChange={setSelectionMode}
            onClearCustomPoint={(type) => type === 'origin' ? setCustomOrigin(null) : setCustomDestination(null)}
            showDirectBaseline={showDirectBaseline}
            onToggleDirectBaseline={setShowDirectBaseline}
          />
        </div>
      </div>
    </div>
  );
}