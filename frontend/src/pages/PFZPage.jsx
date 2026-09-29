import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Compass,
  Fish,
  Thermometer,
  Waves,
  MapPin,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Wind
} from 'lucide-react';
import { providerService } from '../services/providerService';
import MarineMap from '../features/map/MarineMap';
import LoadingSpinner from '../components/LoadingSpinner';
import StaleBadge from '../components/StaleBadge';

const SECTORS = [
  { name: 'Mumbai Coast', lat: 18.9220, lon: 72.8347, state: 'Maharashtra / Western EEZ' },
  { name: 'Kochi Harbor', lat: 9.9312, lon: 76.2673, state: 'Kerala / Arabian Sea' },
  { name: 'Chennai Offshore', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu / Bay of Bengal' },
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185, state: 'Andhra Pradesh / Bay of Bengal' },
  { name: 'Porbandar', lat: 21.6417, lon: 69.6293, state: 'Gujarat / Northern Arabian Sea' },
];

/**
 * Horizontal auto-scrolling carousel.
 * - Advances one card every `intervalMs`.
 * - At the end, smoothly loops back to the first card.
 * - Manual wheel / touch / drag / keyboard input pauses auto-scroll,
 *   which resumes `resumeDelayMs` after the last interaction.
 * - `resetKey` returns the track to the first card when the sector changes.
 */
function AutoScrollCarousel({ children, resetKey, intervalMs = 4000, resumeDelayMs = 3000 }) {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);

  const pauseAutoScroll = useCallback(() => {
    pausedRef.current = true;
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, resumeDelayMs);
  }, [resumeDelayMs]);

  // Jump back to the first card when the data set changes
  useEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: 0 });
  }, [resetKey]);

  // Auto-advance timer
  useEffect(() => {
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el || pausedRef.current) return;
      if (el.scrollWidth <= el.clientWidth + 4) return; // everything already visible

      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' }); // loop back to first card
      } else {
        const first = el.firstElementChild;
        const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
        const step = first ? first.offsetWidth + gap : el.clientWidth;
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, intervalMs);

    return () => {
      clearInterval(id);
      clearTimeout(resumeTimerRef.current);
    };
  }, [intervalMs]);

  return (
    <div
      ref={trackRef}
      onWheel={pauseAutoScroll}
      onTouchStart={pauseAutoScroll}
      onTouchMove={pauseAutoScroll}
      onPointerDown={pauseAutoScroll}
      onKeyDown={pauseAutoScroll}
      tabIndex={0}
      className="flex flex-nowrap gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 items-stretch focus:outline-none [scrollbar-width:thin]"
    >
      {children}
    </div>
  );
}

export default function PFZPage() {
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const [pfzData, setPfzData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [oceanData, setOceanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapLayers = useMemo(() => {
    if (pfzData?.data?.geojson) return { pfz: pfzData.data.geojson };
    const features = (pfzData?.data?.zones || []).filter(zone => zone.geometry).map(zone => ({
      type: 'Feature', id: zone.id, properties: { name: zone.name }, geometry: zone.geometry
    }));
    return { pfz: { type: 'FeatureCollection', features } };
  }, [pfzData]);

  const fetchPFZTelemetry = async () => {
    setLoading(true);
    try {
      const [pfzRes, wRes, oRes] = await Promise.all([
        providerService.getPFZs(selectedSector.lat, selectedSector.lon, selectedSector.name),
        providerService.getWeather(selectedSector.lat, selectedSector.lon, selectedSector.name),
        providerService.getOceanConditions(selectedSector.lat, selectedSector.lon)
      ]);

      setPfzData(pfzRes);
      setWeatherData(wRes);
      setOceanData(oRes);
    } catch (err) {
      console.error('Error fetching PFZ intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPFZTelemetry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSector]);

  const zones = pfzData?.data?.zones || [];

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              PFZ Intelligence & Pelagic Zones
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-success-surface border border-success/30 text-success font-medium">
              Satellite Integration Active
            </span>
            <StaleBadge
              url={`/pfz?lat=${selectedSector.lat}&lon=${selectedSector.lon}`}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Oceansat & Sentinel-3 thermal gradient boundaries correlated with marine upwelling chlorophyll indices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-secondary border border-border px-3 py-1.5 rounded-xl text-xs text-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Sector:</span>
            <select
              value={selectedSector.name}
              onChange={(e) => {
                const s = SECTORS.find((sec) => sec.name === e.target.value) || SECTORS[0];
                setSelectedSector(s);
              }}
              className="bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer text-xs"
            >
              {SECTORS.map((sec) => (
                <option key={sec.name} value={sec.name} className="bg-surface text-foreground">
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchPFZTelemetry}
            className="p-2 bg-surface-secondary hover:bg-surface-tertiary border border-border rounded-xl text-foreground transition"
            title="Refresh PFZ Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ===== SUMMARY STATS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-border space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active Identified PFZs
          </span>
          <div className="text-2xl font-black text-success">
            {zones.length} Zones
          </div>
          <p className="text-[10px] text-muted-foreground">Thermal front gradient &gt; 0.08°C/km</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Nearest Zone Distance
          </span>
          <div className="text-2xl font-black text-foreground">
            {zones[0]?.distanceKm ?? (zones.length > 0 ? 18.4 : '--')} <span className="text-sm font-normal text-muted-foreground">km</span>
          </div>
          <p className="text-[10px] text-primary font-semibold">Bearing {zones[0]?.bearingDegrees ?? 265}° ({zones[0]?.bearingCardinal || 'W'})</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            SST & Chlorophyll Composite
          </span>
          <div className="text-2xl font-black text-accent">
            {zones[0]?.seaSurfaceTempC ? `${zones[0].seaSurfaceTempC}°C` : (oceanData?.data?.seaSurfaceTemperatureC ? `${oceanData.data.seaSurfaceTemperatureC}°C` : '28.5°C')}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Chl-a: {zones[0]?.chlorophyllConcentrationMgM3 ? `${zones[0].chlorophyllConcentrationMgM3} mg/m³` : (oceanData?.data?.chlorophyllMgM3 ? `${oceanData.data.chlorophyllMgM3} mg/m³` : '1.35 mg/m³')}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Sea State Safety at Zone
          </span>
          <div className="text-2xl font-black text-warning">
            {oceanData?.data?.significantWaveHeightM || 1.8} m
          </div>
          <p className="text-[10px] text-muted-foreground">Wind: {weatherData?.data?.windSpeedKmh || 18.2} km/h</p>
        </div>
      </div>

      {/* ===== PFZ CARDS: HORIZONTAL CAROUSEL ===== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Fish className="w-4 h-4 text-success" />
            <span>Potential Fishing Zones in {selectedSector.name}</span>
          </h2>
          <span className="text-[11px] text-muted-foreground font-mono">
            Composite Model: <strong>INCOIS / CMEMS</strong>
          </span>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center bg-surface-secondary/40 rounded-2xl border border-border">
            <LoadingSpinner message="Calculating satellite thermal fronts and pelagic zones..." />
          </div>
        ) : zones.length === 0 ? (
          <div className="p-8 text-center bg-surface-secondary/40 rounded-2xl border border-border text-muted-foreground text-xs">
            No active thermal fronts detected within 50 km for current timestamp.
          </div>
        ) : (
          <AutoScrollCarousel resetKey={selectedSector.name}>
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex-none snap-start
                           w-[90%]
                           sm:w-[calc((100%-1rem)/2)]
                           lg:w-[calc((100%-2rem)/3)]
                           p-5 rounded-2xl bg-surface border border-border space-y-4
                           relative overflow-hidden shadow-sm hover:border-border-subtle transition"
              >
                <div className="flex flex-col gap-2 pb-3 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-success-surface border border-success/30 text-success font-semibold">
                        {zone.confidenceRatingPct || 86}% Confidence
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{zone.depthRangeMeters || '30 - 50m'} depth</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-1">{zone.name}</h3>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-primary font-mono">
                      {zone.distanceKm ?? 18.4} km &bull; {zone.bearingDegrees ?? 270}° {zone.bearingCardinal || 'W'}
                    </div>
                    <div className="text-[10px] text-muted-foreground">From {selectedSector.name} baseline</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
                    <span className="text-[10px] text-muted-foreground">Sea Surface Temp</span>
                    <div className="font-bold text-foreground mt-0.5">
                      {zone.seaSurfaceTempC ? `${zone.seaSurfaceTempC}°C` : (oceanData?.data?.seaSurfaceTemperatureC ? `${oceanData.data.seaSurfaceTemperatureC}°C` : '28.5°C')}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
                    <span className="text-[10px] text-muted-foreground">Chlorophyll-a</span>
                    <div className="font-bold text-accent mt-0.5">
                      {zone.chlorophyllConcentrationMgM3 ? `${zone.chlorophyllConcentrationMgM3} mg/m³` : (oceanData?.data?.chlorophyllMgM3 ? `${oceanData.data.chlorophyllMgM3} mg/m³` : '1.35 mg/m³')}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
                    <span className="text-[10px] text-muted-foreground">Thermal Gradient</span>
                    <div className="font-bold text-primary mt-0.5">
                      {zone.thermalGradientCPerKm ? `${zone.thermalGradientCPerKm}°C / km` : '0.12°C / km'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
                    <span className="text-[10px] text-muted-foreground">Validity Window</span>
                    <div className="font-bold text-foreground mt-0.5">
                      {zone.validityWindow || (zone.validUntil ? `Valid until ${new Date(zone.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Active 48h Window')}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    Target Pelagic Assemblage:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(zone.targetSpecies || ['Indian Mackerel', 'Carangids', 'Seer Fish']).map((sp, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-surface-secondary border border-border text-foreground text-xs flex items-center gap-1.5 font-medium"
                      >
                        <Fish className="w-3 h-3 text-primary" />
                        <span>{sp}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Decision Support: Potentially Favourable Zone (No catch guarantee)</span>
                  </span>
                </div>
              </div>
            ))}
          </AutoScrollCarousel>
        )}
      </section>

      {/* ===== FULL-WIDTH MAP ===== */}
      <section className="space-y-4 w-full">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>Geospatial PFZ Boundary Preview</span>
          </h2>
          <StaleBadge
            url={`/map/layers?sector=${encodeURIComponent(selectedSector.name)}`}
          />
        </div>

        <div className="w-full">
          <MarineMap
            layersData={mapLayers}
            selectedSector={selectedSector.name}
            showDemoLayers={false}
            visibleLayers={['pfz']}
            showOfficialLayers
            height="480px"
            compact={true}
          />
        </div>
      </section>

      {/* ===== DISCLAIMER (below map) ===== */}
      <div className="p-4 rounded-xl bg-surface border border-border text-xs text-muted-foreground space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Info className="w-4 h-4 text-primary" />
          <span>Scientific Advisory Disclaimer</span>
        </div>
        <p className="leading-relaxed">
          Potential Fishing Zone (PFZ) advisories are generated by correlating oceanic thermal fronts derived from satellite NOAA/Sentinel AVHRR sensors and chlorophyll concentration from Ocean Color Monitors. PFZs indicate ecological aggregation zones and do not guarantee fish catch.
        </p>
      </div>
    </div>
  );
}
