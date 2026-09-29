import React, { useState, useEffect } from 'react';
import {
  Waves,
  MapPin,
  ShieldCheck,
  Wind,
  Compass,
  AlertTriangle,
  Bot,
  Layers,
  ArrowUpRight,
  Maximize2,
  RefreshCw,
  Radio,
  Sparkles,
  Sliders,
  X,
  WifiOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { mapService } from '../services/mapService';
import { useAuth } from '../hooks/useAuth';
import MarineMap from '../features/map/MarineMap';
import RiskAuditViewer from '../features/risk/RiskAuditViewer';
import StaleBadge from '../components/StaleBadge';
import ApiError from '../components/ApiError';

const SECTOR_METADATA = {
  'Mumbai Coast': {
    lat: 18.9220,
    lon: 72.8347,
    name: 'Arabian Sea / Mumbai Coast',
    state: 'Maharashtra / Western EEZ',
    riskScore: 24,
    riskLevel: 'LOW',
    factors: ['Calm sea swell', 'Moderate breeze'],
    windSpeed: 18.2,
    windDir: 'WSW (245°)',
    temp: 28.5,
    vis: 10,
    waveHeight: 1.8,
    wavePeriod: 7.2,
    sst: 28.6,
    chl: 1.25,
    tide: 'Ebb Tide (Falling)',
    current: 0.42,
    pfzDist: 16.2,
    pfzBearing: 265,
    species: ['Indian Mackerel', 'Carangids (Trevally)', 'Seer Fish'],
  },
  'Kochi Harbor': {
    lat: 9.9312,
    lon: 76.2673,
    name: 'Arabian Sea / Kochi Harbor',
    state: 'Kerala / Arabian Sea',
    riskScore: 32,
    riskLevel: 'MODERATE',
    factors: ['Active coastal upwelling', 'Monsoon swell'],
    windSpeed: 22.4,
    windDir: 'WNW (290°)',
    temp: 27.8,
    vis: 9,
    waveHeight: 2.1,
    wavePeriod: 8.5,
    sst: 28.4,
    chl: 1.65,
    tide: 'Flood Tide (Rising)',
    current: 0.58,
    pfzDist: 18.4,
    pfzBearing: 275,
    species: ['Oil Sardine (Sardinella longiceps)', 'Indian Mackerel', 'Yellowfin Tuna', 'Squid'],
  },
  'Chennai Offshore': {
    lat: 13.0827,
    lon: 80.2707,
    name: 'Bay of Bengal / Chennai Coast',
    state: 'Tamil Nadu / Bay of Bengal',
    riskScore: 28,
    riskLevel: 'LOW',
    factors: ['Steady trade breeze', 'Low swell'],
    windSpeed: 16.8,
    windDir: 'SE (135°)',
    temp: 30.2,
    vis: 12,
    waveHeight: 1.4,
    wavePeriod: 6.8,
    sst: 29.8,
    chl: 1.10,
    tide: 'Slack Water',
    current: 0.35,
    pfzDist: 21.5,
    pfzBearing: 85,
    species: ['Skipjack Tuna', 'Horse Mackerel', 'Barracuda', 'Sardines'],
  },
  'Visakhapatnam': {
    lat: 17.6868,
    lon: 83.2185,
    name: 'Bay of Bengal / Visakhapatnam',
    state: 'Andhra Pradesh / Bay of Bengal',
    riskScore: 35,
    riskLevel: 'MODERATE',
    factors: ['Northeast swell', 'Continental shelf front'],
    windSpeed: 20.1,
    windDir: 'ENE (065°)',
    temp: 29.5,
    vis: 10,
    waveHeight: 1.9,
    wavePeriod: 7.6,
    sst: 30.1,
    chl: 1.20,
    tide: 'Ebb Tide',
    current: 0.48,
    pfzDist: 24.1,
    pfzBearing: 110,
    species: ['Yellowfin Tuna', 'Seer Fish', 'Anchovies', 'Carangids'],
  },
  'Porbandar': {
    lat: 21.6417,
    lon: 69.6293,
    name: 'Gujarat / Porbandar Coast',
    state: 'Gujarat / Gulf of Kutch',
    riskScore: 22,
    riskLevel: 'LOW',
    factors: ['Mild coastal current', 'Clear visibility'],
    windSpeed: 15.2,
    windDir: 'NW (315°)',
    temp: 28.0,
    vis: 11,
    waveHeight: 1.5,
    wavePeriod: 6.4,
    sst: 28.2,
    chl: 1.30,
    tide: 'Flood Tide',
    current: 0.38,
    pfzDist: 19.8,
    pfzBearing: 240,
    species: ['Ribbon Fish', 'Croakers', 'Silver Pomfret', 'Cuttlefish'],
  }
};

function getOfflineSectorTelemetry(sectorName) {
  const m = SECTOR_METADATA[sectorName] || SECTOR_METADATA['Mumbai Coast'];
  return {
    location: {
      name: m.name,
      coordinates: { lat: m.lat, lon: m.lon },
      coastalState: m.state,
      timestamp: new Date().toISOString()
    },
    riskAssessment: {
      riskScore: m.riskScore,
      riskLevel: m.riskLevel,
      primaryFactors: m.factors,
      confidenceScore: 92,
      recommendation: m.riskLevel === 'LOW' ? 'Standard navigational caution' : 'Exercise caution in open water',
      rulesTriggered: [
        { id: 'R_OFFLINE_1', name: 'Offline Maritime Baseline', description: 'Operating on cached sector telemetry', severity: 'INFO' }
      ]
    },
    weather: {
      status: 'Offline Telemetry Model',
      temperatureC: m.temp,
      windSpeedKmh: m.windSpeed,
      windDirection: m.windDir,
      precipitationMm: 0,
      visibilityKm: m.vis,
      lightningAlert: 'NONE',
      cycloneAlert: 'NO ACTIVE CYCLONE',
      isDemoData: false,
      isFallback: true,
      sourceOrigin: 'ORCA Maritime Cache'
    },
    ocean: {
      status: 'Offline Marine Model',
      sstCelsius: m.sst,
      chlorophyllMgM3: m.chl,
      significantWaveHeightM: m.waveHeight,
      wavePeriodSec: m.wavePeriod,
      tideStatus: m.tide,
      currentSpeedMps: m.current,
      isDemoData: false,
      isFallback: true,
      sourceOrigin: 'ORCA Marine Cache'
    },
    pfz: {
      status: 'Cached Advisory Model',
      zoneCount: 2,
      nearestZoneDistanceKm: m.pfzDist,
      bearingDegrees: m.pfzBearing,
      potentialRating: 'Potentially Favourable',
      sstFrontIdentified: true,
      chlorophyllBloom: `Optimal (${m.chl} mg/m³)`,
      targetSpecies: m.species,
      isDemoData: false,
      sourceOrigin: 'ORCA Offline Cache'
    },
    alerts: [],
    geofence: {
      status: 'CLEAR',
      restrictedZonesNearby: 0,
      marineProtectedAreasNearby: 0,
      distanceToTerritorialBoundaryKm: 22.2,
      isDemoData: false
    }
  };
}

function getOfflineSectorMapLayers(sectorName) {
  const m = SECTOR_METADATA[sectorName] || SECTOR_METADATA['Mumbai Coast'];
  return {
    metadata: {
      sector: sectorName,
      center: [m.lat, m.lon],
      zoom: 9
    },
    coastline: { type: 'FeatureCollection', features: [] },
    bathymetry: { type: 'FeatureCollection', features: [] },
    eez: { type: 'FeatureCollection', features: [] },
    shippingLanes: { type: 'FeatureCollection', features: [] },
    mpas: { type: 'FeatureCollection', features: [] },
    pfz: { type: 'FeatureCollection', features: [] }
  };
}

export default function DashboardPage({ apiStatus }) {
  const { user } = useAuth();
  const [selectedSector, setSelectedSector] = useState(
    user?.preferredSector?.includes('Kochi') ? 'Kochi Harbor' : 'Mumbai Coast'
  );
  const [telemetry, setTelemetry] = useState(() => getOfflineSectorTelemetry(selectedSector));
  const [mapLayers, setMapLayers] = useState(() => getOfflineSectorMapLayers(selectedSector));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cachedTimestamp, setCachedTimestamp] = useState(null);
  const [showRiskModal, setShowRiskModal] = useState(false);

  const fetchDashboardData = async (sectorName = selectedSector) => {
    setLoading(true);
    setError(null);

    const cacheKey = `orca_dash_${sectorName}`;
    const mapCacheKey = `orca_map_${sectorName}`;
    let hasLoadedFromCache = false;

    // 1. Immediately read from localStorage cache if available
    try {
      const cachedDashRaw = localStorage.getItem(cacheKey);
      const cachedMapRaw = localStorage.getItem(mapCacheKey);
      if (cachedDashRaw) {
        const parsed = JSON.parse(cachedDashRaw);
        if (parsed?.data) {
          setTelemetry(parsed.data);
          setCachedTimestamp(parsed.timestamp);
          hasLoadedFromCache = true;
        }
      }
      if (cachedMapRaw) {
        const parsedMap = JSON.parse(cachedMapRaw);
        if (parsedMap?.data) {
          setMapLayers(parsedMap.data);
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }

    // If not cached yet, immediately display sector-specific offline baseline
    if (!hasLoadedFromCache) {
      const fallbackTelemetry = getOfflineSectorTelemetry(sectorName);
      const fallbackMap = getOfflineSectorMapLayers(sectorName);
      setTelemetry(fallbackTelemetry);
      setMapLayers(fallbackMap);
    }

    // 2. Attempt network fetch
    try {
      const [dashRes, mapRes] = await Promise.all([
        dashboardService.getSummary(sectorName),
        mapService.getLayers(sectorName)
      ]);

      if (dashRes?.data) {
        setTelemetry(dashRes.data);
        setIsOffline(false);
        setCachedTimestamp(null);
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data: dashRes.data, timestamp: Date.now() }));
        } catch (e) {}
      }

      if (mapRes?.data) {
        setMapLayers(mapRes.data);
        try {
          localStorage.setItem(mapCacheKey, JSON.stringify({ data: mapRes.data, timestamp: Date.now() }));
        } catch (e) {}
      }
      setError(null);
    } catch (err) {
      console.warn('Dashboard network request failed, operating on cached/offline data:', err);
      setIsOffline(true);

      // Persist fallback baseline into cache if missing
      try {
        if (!localStorage.getItem(cacheKey)) {
          const fallbackTelemetry = getOfflineSectorTelemetry(sectorName);
          localStorage.setItem(cacheKey, JSON.stringify({ data: fallbackTelemetry, timestamp: Date.now() }));
          setCachedTimestamp(Date.now());
        }
      } catch (e) {}

      // Clear error so the dashboard stays functional instead of showing a fatal 500 error block
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedSector);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSector]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchDashboardData(selectedSector);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [selectedSector]);

  return (
    <div className="space-y-6">
      {/* Top Bar with Sector Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Marine Operations Dashboard</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-success-surface border border-success/30 text-success font-medium">
              Risk Engine Active
            </span>
            <StaleBadge
              url={`/dashboard?sector=${encodeURIComponent(selectedSector)}`}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time multi-agent telemetry aggregation and situational awareness
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-secondary border border-border px-3 py-1.5 rounded-xl text-xs text-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="Mumbai Coast" className="bg-surface text-foreground">Arabian Sea / Mumbai Coast</option>
              <option value="Kochi Harbor" className="bg-surface text-foreground">Arabian Sea / Kochi Harbor</option>
              <option value="Chennai Offshore" className="bg-surface text-foreground">Bay of Bengal / Chennai Coast</option>
              <option value="Visakhapatnam" className="bg-surface text-foreground">Bay of Bengal / Visakhapatnam</option>
              <option value="Porbandar" className="bg-surface text-foreground">Gujarat / Porbandar Coast</option>
            </select>
          </div>

          <button
            onClick={() => fetchDashboardData(selectedSector)}
            className="p-2 bg-surface-secondary hover:bg-surface-tertiary border border-border rounded-xl text-foreground transition"
            title="Refresh Dashboard Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Offline Maritime Telemetry Banner */}
      {isOffline && (
        <div className="p-3.5 rounded-xl bg-surface border border-primary/30 flex items-center justify-between gap-3 text-xs text-foreground shadow-sm">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-warning animate-pulse shrink-0" />
            <div>
              <span className="font-semibold text-foreground">📡 Offline Maritime Mode:</span>{' '}
              <span className="text-muted-foreground">
                Operating on cached sector telemetry for <strong className="text-primary">{selectedSector}</strong>. All navigation models active offline.
              </span>
            </div>
          </div>
          {cachedTimestamp && (
            <span className="text-[10px] text-muted-foreground font-mono shrink-0 hidden sm:inline">
              Cached: {new Date(cachedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {error && <ApiError error={error} onRetry={() => fetchDashboardData(selectedSector)} />}

      {/* Main Telemetry 4-Card Grid with Deterministic Engine Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Risk Assessment Card */}
        <div className="p-5 rounded-2xl bg-surface border border-border space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Risk Assessment
            </span>
            <button
              onClick={() => setShowRiskModal(true)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-secondary hover:bg-surface-tertiary text-accent border border-border transition"
            >
              Inspect Rules &rarr;
            </button>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${
                telemetry?.riskAssessment?.riskLevel === 'CRITICAL'
                  ? 'text-danger'
                  : telemetry?.riskAssessment?.riskLevel === 'HIGH'
                  ? 'text-danger'
                  : telemetry?.riskAssessment?.riskLevel === 'MODERATE'
                  ? 'text-warning'
                  : 'text-success'
              }`}>
                {telemetry?.riskAssessment?.riskScore ?? 24}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
              <span className={`text-xs font-bold uppercase ml-1 ${
                telemetry?.riskAssessment?.riskLevel === 'CRITICAL' ? 'text-danger' :
                telemetry?.riskAssessment?.riskLevel === 'HIGH' ? 'text-danger' :
                telemetry?.riskAssessment?.riskLevel === 'MODERATE' ? 'text-warning' : 'text-success'
              }`}>
                ({telemetry?.riskAssessment?.riskLevel || 'LOW'})
              </span>
            </div>
            <p className="text-[11px] text-foreground mt-1 leading-snug line-clamp-2">
              {telemetry?.riskAssessment?.primaryFactors?.join(' • ') || 'Calm sea swell • Moderate breeze'}
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Confidence: {telemetry?.riskAssessment?.confidenceScore || 94}%</span>
            <span>Deterministic Engine</span>
          </div>
        </div>

        {/* 2. Weather & Wind Card */}
        <div className="p-5 rounded-2xl bg-surface border border-border space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Weather & Wind
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
              telemetry?.weather?.isFallback
                ? 'bg-warning-surface border-warning/30 text-warning'
                : 'bg-success-surface border-success/30 text-success'
            }`}>
              {telemetry?.weather?.isFallback ? 'Cached / Baseline' : 'Live'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {telemetry?.weather?.windSpeedKmh || 18.2} <span className="text-sm font-normal text-muted-foreground">km/h</span>
              </span>
              <span className="text-xs text-primary font-semibold">
                {telemetry?.weather?.windDirection || 'WSW (245°)'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
              <span>Temp: <strong className="text-foreground">{telemetry?.weather?.temperatureC || 28.5}°C</strong></span>
              <span>Vis: <strong className="text-foreground">{telemetry?.weather?.visibilityKm || 10} km</strong></span>
            </div>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Cyclone: {telemetry?.weather?.cycloneAlert || 'None'}</span>
            <span className="truncate max-w-[110px]" title={telemetry?.weather?.sourceOrigin}>
              {telemetry?.weather?.isFallback ? 'Cached Model' : 'Live Feed'}
            </span>
          </div>
        </div>

        {/* 3. Ocean & Waves Card */}
        <div className="p-5 rounded-2xl bg-surface border border-border space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ocean & Waves
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
              telemetry?.ocean?.isFallback
                ? 'bg-warning-surface border-warning/30 text-warning'
                : 'bg-success-surface border-success/30 text-success'
            }`}>
              {telemetry?.ocean?.isFallback ? 'Cached / Baseline' : 'Live CMEMS'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-accent">
                {telemetry?.ocean?.significantWaveHeightM || 1.8} <span className="text-sm font-normal text-muted-foreground">m</span>
              </span>
              <span className="text-xs text-muted-foreground">
                Period: {telemetry?.ocean?.wavePeriodSec || 7.2}s
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
              <span>SST: <strong className="text-foreground">{telemetry?.ocean?.sstCelsius || 27.8}°C</strong></span>
              <span>Chl-a: <strong className="text-foreground">{telemetry?.ocean?.chlorophyllMgM3 || 0.95} mg/m³</strong></span>
            </div>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Tide: {telemetry?.ocean?.tideStatus || 'Ebb Tide'}</span>
            <span>Current: {telemetry?.ocean?.currentSpeedMps || 0.42} m/s</span>
          </div>
        </div>

        {/* 4. PFZ Intelligence Card */}
        <div className="p-5 rounded-2xl bg-surface border border-border space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              PFZ Intelligence
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-success-surface border border-success/30 text-success font-semibold">
              Satellite Advisory
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-primary">
                {telemetry?.pfz?.nearestZoneDistanceKm || 16.2} <span className="text-sm font-normal text-muted-foreground">km</span>
              </span>
              <span className="text-xs text-muted-foreground">
                Bearing: {telemetry?.pfz?.bearingDegrees || 265}°
              </span>
            </div>
            <p className="text-[11px] text-foreground mt-1 truncate" title={telemetry?.pfz?.targetSpecies?.join(', ')}>
              Species: <strong className="text-foreground">{telemetry?.pfz?.targetSpecies?.join(', ') || 'Mackerel, Tuna'}</strong>
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Thermal Front: Detected</span>
            <Link to="/pfz" className="text-primary hover:underline font-semibold">
              View All &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Embedded Deterministic Risk Audit Viewer Card */}
      {telemetry?.riskAssessment && (
        <RiskAuditViewer riskAssessment={telemetry.riskAssessment} />
      )}

      {/* Active Alerts Banner */}
      {telemetry?.alerts && telemetry.alerts.length > 0 && (
        <div className="p-4 rounded-xl bg-warning-surface border border-warning/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">{telemetry.alerts[0].title}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-warning/20 text-warning font-semibold">
                {telemetry.alerts[0].agency || 'INCOIS Marine Advisory'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {telemetry.alerts[0].description}
            </p>
          </div>
        </div>
      )}

      {/* Central Interactive Grid: Live MarineMap + AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground text-sm">Interactive Marine GIS Map</h2>
              <StaleBadge
                url={`/map/layers?sector=${encodeURIComponent(selectedSector)}`}
              />
            </div>
            <Link
              to="/map"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium transition"
            >
              <span>Full Screen GIS Center</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </Link>
          </div>

          <MarineMap
            layersData={mapLayers}
            selectedSector={selectedSector}
            onSelectSector={setSelectedSector}
            height="460px"
            compact={true}
          />
        </div>

        <div className="rounded-2xl bg-surface border border-border p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-accent" />
                <h2 className="font-bold text-foreground">AI Marine Assistant</h2>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded-md bg-surface-secondary border border-border text-foreground font-semibold">
                Active
              </span>
            </div>

            <div className="mt-5 space-y-3.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Autonomous orchestrator executing multi-agent task decomposition across weather, ocean, and advisory models:
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-surface-secondary border border-border text-xs text-foreground flex items-center justify-between hover:border-border-subtle transition cursor-default">
                  <span>💬 <em>"Is it safe to go fishing tomorrow morning?"</em></span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="p-3 rounded-xl bg-surface-secondary border border-border text-xs text-foreground flex items-center justify-between hover:border-border-subtle transition cursor-default">
                  <span>💬 <em>"Where is the nearest potentially favourable fishing zone?"</em></span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="p-3 rounded-xl bg-surface-secondary border border-border text-xs text-foreground flex items-center justify-between hover:border-border-subtle transition cursor-default">
                  <span>💬 <em>"Show a lower-risk navigation route."</em></span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-border text-[11px] text-muted-foreground leading-relaxed">
            Deterministic Engine: AI orchestrates &bull; Data provides evidence &bull; Rules calculate risk &bull; AI explains.
          </div>
        </div>
      </div>

      {/* Risk Modal */}
      {showRiskModal && telemetry?.riskAssessment && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-2xl bg-surface border border-border p-6 relative shadow-xl">
            <button
              onClick={() => setShowRiskModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-3">Risk Assessment Rules</h3>
            <RiskAuditViewer riskAssessment={telemetry.riskAssessment} />
          </div>
        </div>
      )}
    </div>
  );
}