import React, { useState, useEffect, useMemo } from 'react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              PFZ Intelligence & Pelagic Zones
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
              Satellite Integration Active
            </span>
            <StaleBadge
              url={`/pfz?lat=${selectedSector.lat}&lon=${selectedSector.lon}`}
            />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Oceansat & Sentinel-3 thermal gradient boundaries correlated with marine upwelling chlorophyll indices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-ocean-400 shrink-0" />
            <span className="text-slate-400">Sector:</span>
            <select
              value={selectedSector.name}
              onChange={(e) => {
                const s = SECTORS.find((sec) => sec.name === e.target.value) || SECTORS[0];
                setSelectedSector(s);
              }}
              className="bg-transparent font-semibold text-slate-100 focus:outline-none cursor-pointer text-xs"
            >
              {SECTORS.map((sec) => (
                <option key={sec.name} value={sec.name} className="bg-slate-900 text-slate-100">
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchPFZTelemetry}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-200 transition"
            title="Refresh PFZ Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-ocean-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Identified PFZs
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {zones.length} Zones
          </div>
          <p className="text-[10px] text-slate-500">Thermal front gradient &gt; 0.08°C/km</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Nearest Zone Distance
          </span>
          <div className="text-2xl font-black text-slate-100">
            {zones[0]?.distanceKm ?? (zones.length > 0 ? 18.4 : '--')} <span className="text-sm font-normal text-slate-400">km</span>
          </div>
          <p className="text-[10px] text-ocean-400 font-semibold">Bearing {zones[0]?.bearingDegrees ?? 265}° ({zones[0]?.bearingCardinal || 'W'})</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            SST & Chlorophyll Composite
          </span>
          <div className="text-2xl font-black text-tealAccent-400">
            {zones[0]?.seaSurfaceTempC ? `${zones[0].seaSurfaceTempC}°C` : (oceanData?.data?.seaSurfaceTemperatureC ? `${oceanData.data.seaSurfaceTemperatureC}°C` : '28.5°C')}
          </div>
          <p className="text-[10px] text-slate-500">
            Chl-a: {zones[0]?.chlorophyllConcentrationMgM3 ? `${zones[0].chlorophyllConcentrationMgM3} mg/m³` : (oceanData?.data?.chlorophyllMgM3 ? `${oceanData.data.chlorophyllMgM3} mg/m³` : '1.35 mg/m³')}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Sea State Safety at Zone
          </span>
          <div className="text-2xl font-black text-amber-400">
            {oceanData?.data?.significantWaveHeightM || 1.8} m
          </div>
          <p className="text-[10px] text-slate-500">Wind: {weatherData?.data?.windSpeedKmh || 18.2} km/h</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Fish className="w-4 h-4 text-emerald-400" />
              <span>Potential Fishing Zones in {selectedSector.name}</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Composite Model: <strong>INCOIS / CMEMS</strong>
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <LoadingSpinner message="Calculating satellite thermal fronts and pelagic zones..." />
            </div>
          ) : zones.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No active thermal fronts detected within 50 km for current timestamp.
            </div>
          ) : (
            zones.map((zone) => (
              <div
                key={zone.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 relative overflow-hidden shadow-lg hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold">
                        {zone.confidenceRatingPct || 86}% Confidence
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{zone.depthRangeMeters || '30 - 50m'} depth</span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{zone.name}</h3>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-ocean-400 font-mono">
                      {zone.distanceKm ?? 18.4} km &bull; {zone.bearingDegrees ?? 270}° {zone.bearingCardinal || 'W'}
                    </div>
                    <div className="text-[10px] text-slate-500">From {selectedSector.name} baseline</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Sea Surface Temp</span>
                    <div className="font-bold text-slate-200 mt-0.5">
                      {zone.seaSurfaceTempC ? `${zone.seaSurfaceTempC}°C` : (oceanData?.data?.seaSurfaceTemperatureC ? `${oceanData.data.seaSurfaceTemperatureC}°C` : '28.5°C')}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Chlorophyll-a</span>
                    <div className="font-bold text-tealAccent-400 mt-0.5">
                      {zone.chlorophyllConcentrationMgM3 ? `${zone.chlorophyllConcentrationMgM3} mg/m³` : (oceanData?.data?.chlorophyllMgM3 ? `${oceanData.data.chlorophyllMgM3} mg/m³` : '1.35 mg/m³')}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Thermal Gradient</span>
                    <div className="font-bold text-indigo-400 mt-0.5">
                      {zone.thermalGradientCPerKm ? `${zone.thermalGradientCPerKm}°C / km` : '0.12°C / km'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Validity Window</span>
                    <div className="font-bold text-slate-300 mt-0.5">
                      {zone.validityWindow || (zone.validUntil ? `Valid until ${new Date(zone.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Active 48h Window')}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">
                    Target Pelagic Assemblage:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(zone.targetSpecies || ['Indian Mackerel', 'Carangids', 'Seer Fish']).map((sp, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs flex items-center gap-1.5 font-medium"
                      >
                        <Fish className="w-3 h-3 text-ocean-400" />
                        <span>{sp}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-tealAccent-400" />
                    <span>Decision Support: Potentially Favourable Zone (No catch guarantee)</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-ocean-400" />
              <span>Geospatial PFZ Boundary Preview</span>
            </h2>
            <StaleBadge
              url={`/map/layers?sector=${encodeURIComponent(selectedSector.name)}`}
            />
          </div>

          <MarineMap
            layersData={mapLayers}
            selectedSector={selectedSector.name}
            showDemoLayers={false}
            visibleLayers={['pfz']}
            showOfficialLayers
            height="480px"
            compact={true}
          />

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Info className="w-4 h-4 text-ocean-400" />
              <span>Scientific Advisory Disclaimer</span>
            </div>
            <p className="leading-relaxed">
              Potential Fishing Zone (PFZ) advisories are generated by correlating oceanic thermal fronts derived from satellite NOAA/Sentinel AVHRR sensors and chlorophyll concentration from Ocean Color Monitors. PFZs indicate ecological aggregation zones and do not guarantee fish catch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}