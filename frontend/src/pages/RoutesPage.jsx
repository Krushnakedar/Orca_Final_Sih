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
import { providerService } from '../services/providerService';
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
      const [mapResponse, pfzResponse] = await Promise.all([
        mapService.getLayers(selectedSector),
        providerService.getPFZs(undefined, undefined, selectedSector).catch((pfzError) => {
          console.warn('Official PFZ geometry unavailable for route planner:', pfzError);
          return null;
        })
      ]);

      const baseLayers = mapResponse?.data || mapResponse;
      const pfzPayload = pfzResponse?.data;
      const officialPfz = pfzPayload?.geojson || (Array.isArray(pfzPayload?.zones)
        ? {
            type: 'FeatureCollection',
            features: pfzPayload.zones.filter(zone => zone.geometry).map(zone => ({
              type: 'Feature',
              id: zone.id,
              properties: {
                name: zone.name,
                confidence: zone.confidenceRatingPct,
                recommendation: zone.recommendationLabel
              },
              geometry: zone.geometry
            }))
          }
        : null);
      const chlorophyll = {
        type: 'FeatureCollection',
        features: (pfzPayload?.zones || [])
          .filter(zone => Number.isFinite(zone.centerLat) && Number.isFinite(zone.centerLon))
          .map(zone => ({
            type: 'Feature',
            id: `chlorophyll_${zone.id}`,
            properties: {
              name: `${zone.name || 'PFZ'} chlorophyll intensity`,
              chlorophyllMgM3: zone.chlorophyllConcentrationMgM3,
              layerType: 'CHLOROPHYLL'
            },
            geometry: {
              type: 'Point',
              coordinates: [zone.centerLon, zone.centerLat]
            }
          }))
      };

      if (baseLayers) {
        setLayersData({
          ...baseLayers,
          pfz: officialPfz || { type: 'FeatureCollection', features: [] },
          chlorophyll
        });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Route Planner
            </h1>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
              100% Waterway Routing
            </span>
            <StaleBadge
              url={`/map/layers?sector=${encodeURIComponent(selectedSector)}`}
            />
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Intelligent maritime route planning — avoiding naval exercise zones, hazardous shoals, and MPAs
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sector Selector */}
          <div className="flex-1 sm:flex-initial flex items-center gap-2 bg-surface-secondary border border-border px-2.5 sm:px-3 py-1.5 rounded-xl text-xs text-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground hidden sm:inline">Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer text-xs w-full"
            >
              <option value="Mumbai Coast" className="bg-surface text-foreground">Arabian Sea / Mumbai</option>
              <option value="Kochi Harbor" className="bg-surface text-foreground">Arabian Sea / Kochi</option>
              <option value="Chennai Offshore" className="bg-surface text-foreground">Bay of Bengal / Chennai</option>
              <option value="Visakhapatnam" className="bg-surface text-foreground">Bay of Bengal / Vizag</option>
              <option value="Porbandar" className="bg-surface text-foreground">Gujarat / Porbandar</option>
            </select>
          </div>

          <button
            onClick={fetchLayers}
            className="p-2 bg-surface-secondary hover:bg-surface-tertiary border border-border rounded-xl text-foreground transition shrink-0"
            title="Reload Map Layers"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-surface-secondary p-1 rounded-xl border border-border text-xs">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'map'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Interactive Map</span>
        </button>
        <button
          onClick={() => setMobileTab('planner')}
          className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'planner'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Route Controls</span>
          {currentPlan && (
            <span className="w-2 h-2 rounded-full bg-success animate-pulse ml-1" />
          )}
        </button>
      </div>

      {/* Route Summary Bar (when route is computed) */}
      {currentPlan && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-4 shadow-sm">
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase tracking-wide text-primary font-bold block">Route Ready</span>
            <p className="text-xs font-semibold text-foreground truncate" title={currentPlan.origin?.name}>{currentPlan.origin?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate" title={currentPlan.destination?.name}>→ {currentPlan.destination?.name}</p>
          </div>
          <div className="bg-surface rounded-xl px-3 py-2 border border-border">
            <span className="text-[10px] text-muted-foreground block">Distance</span>
            <strong className="text-base text-foreground">{currentPlan.lowerRiskProposedRoute?.totalDistanceNm} <span className="text-xs font-normal text-muted-foreground">NM</span></strong>
          </div>
          <div className="bg-surface rounded-xl px-3 py-2 border border-border">
            <span className="text-[10px] text-muted-foreground block">Est. Time</span>
            <strong className="text-base text-foreground">{currentPlan.lowerRiskProposedRoute?.estimatedDurationHours} <span className="text-xs font-normal text-muted-foreground">hrs</span></strong>
          </div>
          <div className="bg-surface rounded-xl px-3 py-2 border border-border">
            <span className="text-[10px] text-muted-foreground block">Risk Level</span>
            <strong className={`text-base ${
              currentPlan.lowerRiskProposedRoute?.riskLevel === 'LOW' ? 'text-success' :
              currentPlan.lowerRiskProposedRoute?.riskLevel === 'MODERATE' ? 'text-warning' : 'text-danger'
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
                ? 'border-success/40 bg-success-surface text-success'
                : 'border-primary/40 bg-primary/10 text-primary'
            }`}>
              <span>
                <strong>{selectionMode === 'origin' ? '📍 Picking start point' : '🎯 Picking end point'}</strong>
                {' '}— click anywhere on the water to set this location.
              </span>
              <button
                type="button"
                onClick={() => setSelectionMode(null)}
                className="shrink-0 text-[10px] font-semibold text-foreground px-2 py-1 rounded bg-surface border border-border hover:bg-surface-secondary"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-border overflow-hidden shadow-sm bg-surface">
            <MarineMap
              layersData={layersData}
              selectedSector={selectedSector}
              onSelectSector={setSelectedSector}
              heightClassName="h-[340px] sm:h-[420px] md:h-[500px] lg:h-[580px] xl:h-[650px]"
              compact={false}
              routePlan={currentPlan}
              showOfficialLayers
              selectionMode={selectionMode}
              onMapPick={handleMapPick}
              showDirectBaseline={showDirectBaseline}
              onToggleDirectBaseline={setShowDirectBaseline}
            />
          </div>

          {/* Map legend bar */}
          <div className="p-3 rounded-xl bg-surface border border-border flex flex-wrap items-center justify-between gap-3 text-xs text-foreground shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-4 h-1 bg-cyan-400 inline-block rounded-full shadow-sm shadow-cyan-400" />
                <span className="text-primary font-semibold">Safe Sea Route</span>
              </span>
              {showDirectBaseline && (
                <span className="flex items-center gap-1.5 font-medium text-danger">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-danger inline-block" />
                  <span>Direct Baseline</span>
                </span>
              )}
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground select-none">
              <input
                type="checkbox"
                checked={showDirectBaseline}
                onChange={(e) => setShowDirectBaseline(e.target.checked)}
                className="rounded accent-primary bg-surface border-border"
              />
              <span>Compare Direct Baseline</span>
            </label>
          </div>

          {/* Mobile: switch to planner */}
          <div className="block lg:hidden">
            <button
              onClick={() => setMobileTab('planner')}
              className="w-full py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-tertiary border border-border text-primary font-semibold text-xs flex items-center justify-center gap-2 transition"
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
              className="w-full py-2 rounded-xl bg-surface-secondary hover:bg-surface-tertiary border border-border text-foreground font-semibold text-xs flex items-center justify-center gap-2 transition"
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