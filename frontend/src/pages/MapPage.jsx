import React, { useEffect, useMemo, useState } from 'react';
import { Anchor, ExternalLink, MapPin, Waves, Wind, Thermometer } from 'lucide-react';
import { CircleMarker, GeoJSON, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import WeatherSafety from '../features/map/WeatherSafety';
import MarineMap from '../features/map/MarineMap';
import { providerService } from '../services/providerService';
import { mapService } from '../services/mapService';

const formatAdvisoryDate = value => {
  const match = /^(\d{4})-(\d{3})$/.exec(value || '');
  if (!match) return value || 'current';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(match[1]), 0, Number(match[2]))));
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
  const [activeOverlay, setActiveOverlay] = useState('none');
  const [svasDay, setSvasDay] = useState(1);
  const [boatLengthM, setBoatLengthM] = useState(6);
  const [oceanField, setOceanField] = useState(null);
  const [svasData, setSvasData] = useState(null);
  const [oceanLoading, setOceanLoading] = useState(true);
  const [svasLoading, setSvasLoading] = useState(true);
  const [oceanError, setOceanError] = useState('');
  const [svasError, setSvasError] = useState('');
  const mapLayers = useMemo(() => {
    if (pfz?.data?.geojson) return { pfz: pfz.data.geojson };
    if (pfz?.data?.zones?.length) {
      return { pfz: {
        type: 'FeatureCollection',
        features: pfz.data.zones.filter(z => z.geometry).map(z => ({
          type: 'Feature', id: z.id,
          properties: { name: z.name, confidence: z.confidenceRatingPct, recommendation: z.recommendationLabel },
          geometry: z.geometry
        }))
      }};
    }
    return null;
  }, [pfz]);

  useEffect(() => {
    let cancelled = false;
    setPfzLoading(true);
    setPfzError('');
    providerService.getPFZs(undefined, undefined, selectedSector)
      .then(result => { if (!cancelled) setPfz(result); })
      .catch(error => { if (!cancelled) { setPfz(null); setPfzError(error.message || 'Official INCOIS PFZ data unavailable.'); } })
      .finally(() => { if (!cancelled) setPfzLoading(false); });
    return () => { cancelled = true; };
  }, [selectedSector]);

  useEffect(() => {
    let cancelled = false;
    const coords = SECTOR_COORDS[selectedSector] || SECTOR_COORDS['Mumbai Coast'];
    setOceanLoading(true);
    setOceanError('');
    setOceanField(null);
    mapService.getOceanField({ lat: coords.lat, lon: coords.lon, span: 5 })
      .then(result => { if (!cancelled) setOceanField(result?.data || null); })
      .catch(() => { if (!cancelled) setOceanError('Currents, swell, and MHW data unavailable.'); })
      .finally(() => { if (!cancelled) setOceanLoading(false); });
    return () => { cancelled = true; };
  }, [selectedSector]);

  useEffect(() => {
    let cancelled = false;
    const coords = SECTOR_COORDS[selectedSector] || SECTOR_COORDS['Mumbai Coast'];
    setSvasLoading(true);
    setSvasError('');
    setSvasData(null);
    mapService.getSvasLayer({ day: svasDay, boatLengthM, lat: coords.lat, lon: coords.lon })
      .then(result => { if (!cancelled) setSvasData(result?.data || null); })
      .catch(() => { if (!cancelled) setSvasError('Vessel advisory data unavailable.'); })
      .finally(() => { if (!cancelled) setSvasLoading(false); });
    return () => { cancelled = true; };
  }, [selectedSector, svasDay, boatLengthM]);

  const changeSector = sector => {
    setSelectedSector(sector);
    setPoint(null);
    setReading(null);
  };

  return (
    <div className="marine-map-page space-y-6">
      <div className="marine-map-header flex flex-col justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Marine GIS &amp; Geofencing Command Center</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-success-surface border border-success/30 text-success font-medium">Live weather &amp; ocean safety</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Live weather and ocean conditions for the point you select on the map</p>
        </div>

        <div className="marine-map-controls flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-xl text-xs text-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Sector:</span>
            <select value={selectedSector} onChange={e => changeSector(e.target.value)} className="min-w-0 bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer">
              <option value="Mumbai Coast" className="bg-surface text-foreground">Arabian Sea / Mumbai Coast</option>
              <option value="Kochi Harbor" className="bg-surface text-foreground">Arabian Sea / Kochi Harbor</option>
              <option value="Chennai Offshore" className="bg-surface text-foreground">Bay of Bengal / Chennai Coast</option>
              <option value="Visakhapatnam" className="bg-surface text-foreground">Bay of Bengal / Visakhapatnam</option>
              <option value="Porbandar" className="bg-surface text-foreground">Gujarat / Porbandar &amp; Kutch</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-surface p-1" role="group" aria-label="Map overlay">
          {[
            ['none', 'None'],
            ['wind', 'Wind'],
            ['currents', 'Currents'],
            ['swell', 'Swell'],
            ['mhw', 'Marine heat wave'],
            ['svas', 'Vessel advisory'],
            ['pfz', 'PFZ'],
          ].map(([value, label]) => <button key={value} type="button" aria-pressed={activeOverlay === value}
            onClick={() => setActiveOverlay(value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeOverlay === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface-secondary hover:text-foreground'}`}>
            {label}
          </button>)}
        </div>
        {activeOverlay === 'svas' && <>
          <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground" aria-label="SVAS forecast day">
            <span className="mr-1">Day</span>
            {[1, 2, 3].map(day => <button key={day} type="button" onClick={() => setSvasDay(day)} aria-pressed={svasDay === day}
              className={`rounded border px-2 py-1 ${svasDay === day ? 'border-info bg-info-surface text-info' : 'border-border hover:border-muted-foreground'}`}>{day}</button>)}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Boat length
            <select value={boatLengthM} onChange={event => setBoatLengthM(Number(event.target.value))} className="rounded border border-border bg-surface px-2 py-1 text-foreground">
              <option value={3.5}>&lt; 4 m</option>
              <option value={5}>&lt; 6 m</option>
              <option value={6.5}>&lt; 7 m</option>
              <option value={9}>&lt; 10 m</option>
              <option value={12}>10 m+</option>
            </select>
          </label>
        </>}
        {activeOverlay !== 'none' && <span className="text-xs text-muted" role="status">
          {['wind', 'currents', 'swell', 'mhw'].includes(activeOverlay)
            ? oceanLoading ? 'Loading ocean data…' : oceanError || `${oceanField?.features?.length || 0} ocean samples`
            : svasLoading ? 'Loading advisory…' : svasError || 'Advisory zones loaded'}
        </span>}
      </div>
      {activeOverlay === 'mhw' && <p className="text-xs text-warning">{`MHW is an SST-anomaly estimate against a simplified 28\u00b0C baseline.`}</p>}
      {activeOverlay === 'svas' && <p className="text-xs text-warning">SVAS zones are prototype guidance, not official navigational advice.</p>}

      <div className="rounded-xl border border-info/30 bg-info-surface px-4 py-3 text-xs text-info">
        <span className="font-semibold">Live data mode.</span> Official INCOIS overlays are available from the public WebGIS.{' '}
        <a className="inline-flex items-center gap-1 underline text-info" href="https://incois.gov.in/geoportal/MFASPFZ/index.html" target="_blank" rel="noreferrer">INCOIS PFZ WebGIS <ExternalLink className="h-3 w-3" /></a>.
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full border px-2 py-1 ${pfzLoading ? 'border-border text-muted-foreground' : pfzError ? 'border-warning/30 bg-warning-surface text-warning' : pfz?.source?.isFallback ? 'border-warning/30 bg-warning-surface text-warning' : 'border-success/30 bg-success-surface text-success'}`}>
          {pfzLoading ? 'Loading INCOIS PFZ…' : pfzError ? 'Official INCOIS PFZ unavailable' : pfz?.source?.isFallback ? 'INCOIS PFZ fallback (demo zones)' : `INCOIS PFZ live · ${pfz?.data?.zoneCount || 0} lines · advisory ${formatAdvisoryDate(pfz?.source?.advisoryDate)}`}
        </span>
        {pfzError && <span className="text-muted-foreground">No PFZ geometry is shown until a current official response is available. ({pfzError})</span>}
        {pfz?.source?.isFallback && <span className="text-warning/70">{pfz.source.notice}</span>}
      </div>

      <div className="marine-map-grid grid gap-6">
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-border overflow-hidden shadow-2xl bg-background">
            <MarineMap layersData={mapLayers} onPointSelect={setPoint} safety={reading} selectedSector={selectedSector} showDemoLayers={false} visibleLayers={activeOverlay === 'pfz' ? ['pfz'] : []} height="clamp(420px, 68vh, 680px)"
              extraOverlays={<OceanOverlays oceanField={oceanField} svasLayers={svasData?.layers} activeOverlay={activeOverlay} />}
              baseTiles={<TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />}
            />
          </div>
          <p className="rounded-xl border border-border bg-surface/60 p-3.5 text-xs text-muted-foreground">Click the map to request live weather and ocean conditions. The dotted circle is a weather-risk reading, not a navigational boundary.</p>
        </div>
        <div className="min-w-0 space-y-4">
          <WeatherSafety point={point} sector={selectedSector} reading={reading} onReading={setReading} />
          {activeOverlay === 'svas' && svasData?.advice && <section className="rounded-xl border border-border bg-surface/70 p-4 text-sm text-foreground">
            <h2 className="mb-2 flex items-center gap-2 font-medium text-foreground"><Anchor size={15} className="text-info" />Vessel advisory · Day {svasData.advice.day}</h2>
            <p>{svasData.advice.adviceText}</p>
            <p className="mt-2 text-xs text-muted-foreground">{svasData.advice.zoneName} · selected boat {boatLengthM} m · {svasData.advice.status}</p>
          </section>}
        </div>
      </div>
    </div>
  );
}

function AnimatedFlowLayer({ features, speedKey, directionKey, color, speedDivisor }) {
  const map = useMap();

  useEffect(() => {
    const pane = map.getPane('animated-flow-pane') || map.createPane('animated-flow-pane');
    pane.style.zIndex = '399';
    pane.style.pointerEvents = 'none';
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    pane.appendChild(canvas);
    const context = canvas.getContext('2d');
    if (!context) {
      canvas.remove();
      return undefined;
    }

    let animationFrame = 0;
    let particles = [];
    let size = map.getSize();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const reset = () => {
      size = map.getSize();
      canvas.width = Math.round(size.x * pixelRatio);
      canvas.height = Math.round(size.y * pixelRatio);
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      particles = Array.from({ length: 240 }, () => ({ x: Math.random() * size.x, y: Math.random() * size.y }));
    };

    const animate = () => {
      const vectors = features.flatMap(feature => {
        const [lon, lat] = feature.geometry?.coordinates || [];
        const speed = Number(feature.properties?.[speedKey]);
        const direction = Number(feature.properties?.[directionKey]);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(speed) || speed <= 0 || !Number.isFinite(direction)) return [];
        const point = map.latLngToContainerPoint([lat, lon]);
        const radians = direction * Math.PI / 180;
        const magnitude = 0.7 + Math.min(speed / speedDivisor, 1) * 1.7;
        return [{ x: point.x, y: point.y, vx: Math.sin(radians) * magnitude, vy: -Math.cos(radians) * magnitude }];
      });

      context.globalCompositeOperation = 'destination-in';
      context.fillStyle = 'rgba(0, 0, 0, 0.91)';
      context.fillRect(0, 0, size.x, size.y);
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = color;
      context.lineWidth = 1.5;
      context.lineCap = 'round';
      context.globalAlpha = 0.82;

      for (const particle of particles) {
        let nearest = null;
        let nearestDistance = Infinity;
        for (const vector of vectors) {
          const distance = (vector.x - particle.x) ** 2 + (vector.y - particle.y) ** 2;
          if (distance < nearestDistance) {
            nearest = vector;
            nearestDistance = distance;
          }
        }
        if (!nearest || nearestDistance > 360 ** 2) {
          particle.x = Math.random() * size.x;
          particle.y = Math.random() * size.y;
          continue;
        }
        const previousX = particle.x;
        const previousY = particle.y;
        particle.x += nearest.vx;
        particle.y += nearest.vy;
        if (particle.x < 0 || particle.x > size.x || particle.y < 0 || particle.y > size.y) {
          particle.x = Math.random() * size.x;
          particle.y = Math.random() * size.y;
          continue;
        }
        context.beginPath();
        context.moveTo(previousX, previousY);
        context.lineTo(particle.x, particle.y);
        context.stroke();
      }
      context.globalAlpha = 1;
      animationFrame = window.requestAnimationFrame(animate);
    };

    reset();
    map.on('moveend zoomend resize', reset);
    animationFrame = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      map.off('moveend zoomend resize', reset);
      canvas.remove();
    };
  }, [map, features, speedKey, directionKey, color, speedDivisor]);

  return null;
}

function OceanOverlays({ oceanField, svasLayers, activeOverlay }) {
  const features = oceanField?.features || [];
  const halfCell = (oceanField?.metadata?.span || 5) / 4;
  const mhwFeatures = activeOverlay === 'mhw' ? features.flatMap((feature, index) => {
    const [lon, lat] = feature.geometry?.coordinates || [];
    const sst = Number(feature.properties?.seaSurfaceTemperatureC);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(sst)) return [];
    const anomaly = sst - 28;
    const category = anomaly >= 4 ? 'Extreme' : anomaly >= 3 ? 'Severe' : anomaly >= 2 ? 'Strong' : anomaly >= 1 ? 'Moderate' : 'None';
    const color = category === 'Extreme' ? '#dc2626' : category === 'Severe' ? '#f97316' : category === 'Strong' ? '#f59e0b' : category === 'Moderate' ? '#fde047' : '#94a3b8';
    return [{
      type: 'Feature',
      id: `mhw-${index}`,
      properties: { category, color, sst, anomaly },
      geometry: { type: 'Polygon', coordinates: [[[lon - halfCell, lat - halfCell], [lon + halfCell, lat - halfCell], [lon + halfCell, lat + halfCell], [lon - halfCell, lat + halfCell], [lon - halfCell, lat - halfCell]]] },
    }];
  }) : [];

  return <>
    {activeOverlay === 'wind' && <AnimatedFlowLayer features={features} speedKey="windSpeedKmh" directionKey="windFlowDirectionDegrees" color="#eab308" speedDivisor={30} />}
    {activeOverlay === 'currents' && <AnimatedFlowLayer features={features} speedKey="currentSpeedMps" directionKey="currentDirectionDegrees" color="#0284c7" speedDivisor={2} />}
    {mhwFeatures.length > 0 && <GeoJSON data={{ type: 'FeatureCollection', features: mhwFeatures }}
      style={feature => ({ color: feature.properties.color, fillColor: feature.properties.color, weight: 1, fillOpacity: feature.properties.category === 'None' ? 0.04 : 0.36 })}
      onEachFeature={(feature, layer) => layer.bindTooltip(`Estimated MHW: ${feature.properties.category}<br/>SST ${feature.properties.sst.toFixed(1)}°C · anomaly ${feature.properties.anomaly.toFixed(1)}°C`)} />}
    {activeOverlay === 'svas' && svasLayers?.features?.length > 0 && <GeoJSON data={svasLayers}
      style={feature => ({ color: feature.properties.color, fillColor: feature.properties.color, weight: 1.5, fillOpacity: feature.properties.isRestricted ? 0.42 : 0.24 })}
      onEachFeature={(feature, layer) => layer.bindTooltip(`${feature.properties.name}<br/>Day ${feature.properties.day}: ${feature.properties.status}${feature.properties.isRestricted ? ' · selected boat restricted' : ''}`)} />}
    {features.map((feature, index) => {
      const [lon, lat] = feature.geometry?.coordinates || [];
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const properties = feature.properties || {};
      const swell = Number(properties.swellHeightM);
      return <React.Fragment key={`ocean-${index}`}>
        {activeOverlay === 'swell' && Number.isFinite(swell) && <CircleMarker center={[lat, lon]} radius={Math.max(4, Math.min(12, 4 + swell * 3))}
          pathOptions={{ color: '#7c3aed', fillColor: '#a78bfa', fillOpacity: 0.48, weight: 1 }}>
          <Tooltip>Swell {swell.toFixed(1)} m{Number.isFinite(Number(properties.swellPeriodSec)) ? ` · ${Number(properties.swellPeriodSec).toFixed(1)} s` : ''}</Tooltip>
        </CircleMarker>}
      </React.Fragment>;
    })}
  </>;
}
