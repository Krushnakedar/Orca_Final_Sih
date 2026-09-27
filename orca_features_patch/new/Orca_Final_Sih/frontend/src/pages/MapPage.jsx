import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, MapPin, Waves, Wind, Thermometer, Ship } from 'lucide-react';
import { TileLayer, GeoJSON, CircleMarker, Tooltip } from 'react-leaflet';
import WeatherSafety from '../features/map/WeatherSafety';
import MarineMap from '../features/map/MarineMap';
import { providerService } from '../services/providerService';
import {
  fetchOceanField,
  fetchMhwLayer,
  fetchSvasLayer,
} from '../services/mapService';

const formatAdvisoryDate = value => {
  const match = /^(\d{4})-(\d{3})$/.exec(value || '');
  if (!match) return value || 'current';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(match[1]), 0, Number(match[2]))));
};

const SECTOR_COORDS = {
  'Mumbai Coast': { lat: 18.922, lon: 72.8347 },
  'Kochi Harbor': { lat: 9.9312, lon: 76.2673 },
  'Chennai Offshore': { lat: 13.0827, lon: 80.2707 },
  Visakhapatnam: { lat: 17.6868, lon: 83.2185 },
  Porbandar: { lat: 21.6417, lon: 69.6293 },
};

export default function MapPage() {
  const [selectedSector, setSelectedSector] = useState('Mumbai Coast');
  const [point, setPoint] = useState(null);
  const [reading, setReading] = useState(null);
  const [pfz, setPfz] = useState(null);
  const [pfzError, setPfzError] = useState('');
  const [pfzLoading, setPfzLoading] = useState(true);

  // New feature layers
  const [showCurrents, setShowCurrents] = useState(true);
  const [showSwell, setShowSwell] = useState(true);
  const [showMhw, setShowMhw] = useState(true);
  const [showSvas, setShowSvas] = useState(true);
  const [svasDay, setSvasDay] = useState(1);
  const [boatLengthM, setBoatLengthM] = useState(6);

  const [oceanField, setOceanField] = useState(null);
  const [mhwData, setMhwData] = useState(null);
  const [svasData, setSvasData] = useState(null);
  const [layerError, setLayerError] = useState('');

  const mapLayers = useMemo(() => {
    const base = {};
    if (pfz?.data?.geojson) base.pfz = pfz.data.geojson;
    else if (pfz?.data?.zones?.length) {
      base.pfz = {
        type: 'FeatureCollection',
        features: pfz.data.zones
          .filter(z => z.geometry)
          .map(z => ({
            type: 'Feature',
            id: z.id,
            properties: {
              name: z.name,
              confidence: z.confidenceRatingPct,
              recommendation: z.recommendationLabel,
            },
            geometry: z.geometry,
          })),
      };
    }
    if (showMhw && mhwData?.grid) base.mhw = mhwData.grid;
    if (showSvas && svasData?.layers) base.svas = svasData.layers;
    if ((showCurrents || showSwell) && oceanField) base.oceanField = oceanField;
    return Object.keys(base).length ? base : null;
  }, [pfz, mhwData, svasData, oceanField, showMhw, showSvas, showCurrents, showSwell]);

  useEffect(() => {
    let cancelled = false;
    setPfzLoading(true);
    setPfzError('');
    providerService
      .getPFZs(undefined, undefined, selectedSector)
      .then(result => {
        if (!cancelled) setPfz(result);
      })
      .catch(error => {
        if (!cancelled) {
          setPfz(null);
          setPfzError(error.message || 'Official INCOIS PFZ data unavailable.');
        }
      })
      .finally(() => {
        if (!cancelled) setPfzLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSector]);

  // Load currents/swell field, MHW, SVAS for sector
  useEffect(() => {
    let cancelled = false;
    const coords = SECTOR_COORDS[selectedSector] || SECTOR_COORDS['Mumbai Coast'];
    setLayerError('');

    Promise.allSettled([
      fetchOceanField({ lat: coords.lat, lon: coords.lon, span: 5 }),
      fetchMhwLayer({ lat: coords.lat, lon: coords.lon }),
      fetchSvasLayer({
        day: svasDay,
        boatLengthM,
        lat: coords.lat,
        lon: coords.lon,
      }),
    ]).then(([oceanRes, mhwRes, svasRes]) => {
      if (cancelled) return;
      if (oceanRes.status === 'fulfilled') {
        setOceanField(oceanRes.value?.data || oceanRes.value);
      } else {
        setOceanField(null);
      }
      if (mhwRes.status === 'fulfilled') {
        setMhwData(mhwRes.value?.data || mhwRes.value);
      } else {
        setMhwData(null);
      }
      if (svasRes.status === 'fulfilled') {
        setSvasData(svasRes.value?.data || svasRes.value);
      } else {
        setSvasData(null);
      }
      const failed = [oceanRes, mhwRes, svasRes].filter(r => r.status === 'rejected');
      if (failed.length === 3) {
        setLayerError('Ocean field / MHW / SVAS layers unavailable (backend offline?).');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedSector, svasDay, boatLengthM]);

  const changeSector = sector => {
    setSelectedSector(sector);
    setPoint(null);
    setReading(null);
  };

  const visibleLayerKeys = useMemo(() => {
    const keys = ['pfz'];
    if (showMhw) keys.push('mhw');
    if (showSvas) keys.push('svas');
    return keys;
  }, [showMhw, showSvas]);

  return (
    <div className="marine-map-page space-y-6">
      <style>{`.marine-map-page .map-tiles-charcoal { filter: brightness(0.58) contrast(1.12) saturate(0.3); }`}</style>
      <div className="marine-map-header flex flex-col justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-100">Marine Map</h1>
            <span className="rounded-full border border-cyan-800 bg-cyan-950/60 px-2 py-0.5 text-xs text-cyan-200">
              Currents · Swell · MHW · SVAS
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            INCOIS-aligned PFZ plus live ocean currents, swell, marine heat wave, and small vessel advisory overlays.
          </p>
        </div>
      </div>

      {/* Layer toggles */}
      <div className="flex flex-wrap gap-2 items-center">
        <ToggleChip
          active={showCurrents}
          onClick={() => setShowCurrents(v => !v)}
          icon={<Wind size={14} />}
          label="Currents"
        />
        <ToggleChip
          active={showSwell}
          onClick={() => setShowSwell(v => !v)}
          icon={<Waves size={14} />}
          label="Swell"
        />
        <ToggleChip
          active={showMhw}
          onClick={() => setShowMhw(v => !v)}
          icon={<Thermometer size={14} />}
          label="Marine Heat Wave"
        />
        <ToggleChip
          active={showSvas}
          onClick={() => setShowSvas(v => !v)}
          icon={<Ship size={14} />}
          label="Vessel Advisory (SVAS)"
        />

        {showSvas && (
          <div className="flex items-center gap-2 ml-2 text-xs text-slate-300">
            <span>Day</span>
            {[1, 2, 3].map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setSvasDay(d)}
                className={`rounded-md px-2 py-1 border ${
                  svasDay === d
                    ? 'border-cyan-500 bg-cyan-950 text-cyan-100'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                {d}
              </button>
            ))}
            <span className="ml-2">Boat LOA</span>
            <select
              value={boatLengthM}
              onChange={e => setBoatLengthM(Number(e.target.value))}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
            >
              <option value={3.5}>&lt; 4 m</option>
              <option value={5}>&lt; 6 m</option>
              <option value={6.5}>&lt; 7 m</option>
              <option value={9}>&lt; 10 m</option>
              <option value={14}>≥ 10 m</option>
            </select>
          </div>
        )}
      </div>

      {/* Status strip */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span
          className={`rounded-full border px-2 py-1 ${
            pfzLoading
              ? 'border-slate-700 text-slate-400'
              : pfzError
                ? 'border-amber-800 bg-amber-950 text-amber-200'
                : pfz?.source?.isFallback
                  ? 'border-yellow-800 bg-yellow-950 text-yellow-200'
                  : 'border-emerald-800 bg-emerald-950 text-emerald-200'
          }`}
        >
          {pfzLoading
            ? 'Loading INCOIS PFZ…'
            : pfzError
              ? 'Official INCOIS PFZ unavailable'
              : pfz?.source?.isFallback
                ? 'INCOIS PFZ fallback (demo zones)'
                : `INCOIS PFZ live · ${pfz?.data?.zoneCount || 0} lines · advisory ${formatAdvisoryDate(pfz?.source?.advisoryDate)}`}
        </span>
        {mhwData?.point && (
          <span className="rounded-full border border-amber-800 bg-amber-950/50 px-2 py-1 text-amber-100">
            MHW {mhwData.point.category} · ΔSST {mhwData.point.sstAnomalyC}°C · area{' '}
            {mhwData.point.areaSpreadingPercent}%
          </span>
        )}
        {svasData?.advice && (
          <span
            className={`rounded-full border px-2 py-1 ${
              svasData.advice.isRestricted
                ? 'border-rose-800 bg-rose-950 text-rose-100'
                : 'border-emerald-800 bg-emerald-950 text-emerald-100'
            }`}
          >
            SVAS Day {svasData.advice.day}: {svasData.advice.status} — {svasData.advice.zoneName}
          </span>
        )}
        {layerError && (
          <span className="rounded-full border border-slate-700 px-2 py-1 text-slate-400">{layerError}</span>
        )}
      </div>

      <div className="marine-map-grid grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950 relative">
            <MarineMap
              layersData={mapLayers}
              onPointSelect={setPoint}
              safety={reading}
              selectedSector={selectedSector}
              showDemoLayers={false}
              visibleLayers={visibleLayerKeys}
              showOfficialLayers
              height="clamp(420px, 68vh, 680px)"
              baseTiles={
                <>
                  <TileLayer
                    url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    className="map-tiles-charcoal"
                    maxNativeZoom={16}
                    maxZoom={19}
                    attribution='Tiles &copy; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <TileLayer
                    url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                    maxNativeZoom={16}
                    maxZoom={19}
                  />
                </>
              }
              extraOverlays={
                <OceanOverlays
                  oceanField={oceanField}
                  showCurrents={showCurrents}
                  showSwell={showSwell}
                  mhwGrid={showMhw ? mhwData?.grid : null}
                  svasLayers={showSvas ? svasData?.layers : null}
                />
              }
            />
          </div>
          <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-400">
            Click the map to request live weather and ocean conditions. Currents (arrows via tooltips),
            swell height, marine heat wave polygons, and SVAS coastal advisory bands can be toggled above.
          </p>
        </div>
        <div className="min-w-0 space-y-4">
          <WeatherSafety point={point} sector={selectedSector} reading={reading} onReading={setReading} />
          {svasData?.advice && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200 space-y-2">
              <div className="font-medium text-slate-100 flex items-center gap-2">
                <Ship size={16} className="text-cyan-400" /> Small Vessel Advisory
              </div>
              <p className="text-slate-300">{svasData.advice.adviceText}</p>
              <p className="text-xs text-slate-500">
                LOA class: {svasData.advice.boatSizeClass} · Restricted classes:{' '}
                {(svasData.advice.restrictedBoatClasses || []).join(', ') || 'none'}
              </p>
            </div>
          )}
          {mhwData?.point && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200 space-y-2">
              <div className="font-medium text-slate-100 flex items-center gap-2">
                <Thermometer size={16} className="text-amber-400" /> Marine Heat Wave
              </div>
              <p>
                Category <strong>{mhwData.point.category}</strong> · SST{' '}
                {mhwData.point.seaSurfaceTemperatureC}°C (anomaly {mhwData.point.sstAnomalyC}°C)
              </p>
              <p className="text-xs text-slate-500">{mhwData.point.disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleChip({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-cyan-600 bg-cyan-950 text-cyan-100'
          : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Renders currents/swell sample points and MHW/SVAS polygons inside the map.
 * Passed as extraOverlays into MarineMap if supported; otherwise MapPage can nest.
 */
function OceanOverlays({ oceanField, showCurrents, showSwell, mhwGrid, svasLayers }) {
  // MarineMap may not forward extraOverlays — we also patch MarineMap below.
  // This component is designed to be rendered as a child of MapContainer.
  return (
    <>
      {mhwGrid?.features?.length > 0 && (
        <GeoJSON
          key={`mhw-${mhwGrid.features.length}`}
          data={mhwGrid}
          style={f => ({
            color: f.properties?.color || '#fde047',
            weight: 1,
            fillColor: f.properties?.color || '#fde047',
            fillOpacity: 0.35,
          })}
          onEachFeature={(feature, layer) => {
            const p = feature.properties || {};
            layer.bindPopup(
              `<strong>${p.name || 'MHW cell'}</strong><br/>Category: ${p.category}<br/>ΔSST: ${p.sstAnomalyC}°C<br/>Area: ${p.areaSpreadingPercent}%`,
            );
          }}
        />
      )}
      {svasLayers?.features?.length > 0 && (
        <GeoJSON
          key={`svas-${svasLayers.features.length}-${svasLayers.metadata?.day}`}
          data={svasLayers}
          style={f => ({
            color: f.properties?.color || '#22c55e',
            weight: 2,
            fillColor: f.properties?.color || '#22c55e',
            fillOpacity: 0.25,
          })}
          onEachFeature={(feature, layer) => {
            const p = feature.properties || {};
            layer.bindPopup(
              `<strong>${p.name}</strong><br/>Status: ${p.status}<br/>Day ${p.day}<br/>Restricted: ${(p.restrictedBoatClasses || []).join(', ') || 'none'}`,
            );
          }}
        />
      )}
      {oceanField?.features?.map((f, i) => {
        const [lon, lat] = f.geometry?.coordinates || [];
        if (lon == null || lat == null) return null;
        const p = f.properties || {};
        const speed = p.currentSpeedMps;
        const swell = p.swellHeightM;
        if (showCurrents && Number.isFinite(speed)) {
          const radius = Math.max(4, Math.min(14, speed * 12));
          return (
            <CircleMarker
              key={`cur-${i}`}
              center={[lat, lon]}
              radius={radius}
              pathOptions={{
                color: '#38bdf8',
                fillColor: '#0ea5e9',
                fillOpacity: 0.55,
                weight: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]}>
                <span>
                  Current {speed?.toFixed(2)} m/s @ {p.currentDirectionDegrees}°
                  {showSwell && Number.isFinite(swell)
                    ? ` · Swell ${swell.toFixed(1)} m`
                    : ''}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        }
        if (showSwell && Number.isFinite(swell) && !showCurrents) {
          return (
            <CircleMarker
              key={`sw-${i}`}
              center={[lat, lon]}
              radius={Math.max(4, Math.min(12, swell * 5))}
              pathOptions={{
                color: '#a78bfa',
                fillColor: '#8b5cf6',
                fillOpacity: 0.5,
                weight: 1,
              }}
            >
              <Tooltip>
                Swell {swell.toFixed(1)} m @ {p.swellDirectionDegrees}° / {p.swellPeriodSec}s
              </Tooltip>
            </CircleMarker>
          );
        }
        return null;
      })}
    </>
  );
}
