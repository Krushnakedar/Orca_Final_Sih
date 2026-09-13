import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { TileLayer } from 'react-leaflet';
import WeatherSafety from '../features/map/WeatherSafety';
import MarineMap from '../features/map/MarineMap';
import { providerService } from '../services/providerService';

const formatAdvisoryDate = value => {
  const match = /^(\d{4})-(\d{3})$/.exec(value || '');
  if (!match) return value || 'current';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(match[1]), 0, Number(match[2]))));
};

export default function MapPage() {
  const [selectedSector, setSelectedSector] = useState('Mumbai Coast');
  const [point, setPoint] = useState(null);
  const [reading, setReading] = useState(null);
  const [pfz, setPfz] = useState(null);
  const [pfzError, setPfzError] = useState('');
  const [pfzLoading, setPfzLoading] = useState(true);
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

  const changeSector = sector => {
    setSelectedSector(sector);
    setPoint(null);
    setReading(null);
  };

  return (
    <div className="marine-map-page space-y-6">
      <style>{`.marine-map-page .map-tiles-charcoal { filter: brightness(0.58) contrast(1.12) saturate(0.3); }`}</style>
      <div className="marine-map-header flex flex-col justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Marine GIS & Geofencing Command Center</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">Live weather & ocean safety</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Live weather and ocean conditions for the point you select on the map</p>
        </div>

        <div className="marine-map-controls flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-ocean-400 shrink-0" />
            <span className="text-slate-400">Sector:</span>
            <select value={selectedSector} onChange={e => changeSector(e.target.value)} className="min-w-0 bg-transparent font-semibold text-slate-100 focus:outline-none cursor-pointer">
              <option value="Mumbai Coast" className="bg-slate-900 text-slate-100">Arabian Sea / Mumbai Coast</option>
              <option value="Kochi Harbor" className="bg-slate-900 text-slate-100">Arabian Sea / Kochi Harbor</option>
              <option value="Chennai Offshore" className="bg-slate-900 text-slate-100">Bay of Bengal / Chennai Coast</option>
              <option value="Visakhapatnam" className="bg-slate-900 text-slate-100">Bay of Bengal / Visakhapatnam</option>
              <option value="Porbandar" className="bg-slate-900 text-slate-100">Gujarat / Porbandar & Kutch</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-sky-900/80 bg-sky-950/30 px-4 py-3 text-xs text-sky-100">
        <span className="font-semibold">Live data mode.</span> Official INCOIS overlays are available from the public WebGIS.{' '}
        <a className="inline-flex items-center gap-1 underline text-sky-300" href="https://incois.gov.in/geoportal/MFASPFZ/index.html" target="_blank" rel="noreferrer">INCOIS PFZ WebGIS <ExternalLink className="h-3 w-3" /></a>.
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full border px-2 py-1 ${pfzLoading ? 'border-slate-700 text-slate-400' : pfzError ? 'border-amber-800 bg-amber-950 text-amber-200' : pfz?.source?.isFallback ? 'border-yellow-800 bg-yellow-950 text-yellow-200' : 'border-emerald-800 bg-emerald-950 text-emerald-200'}`}>
          {pfzLoading ? 'Loading INCOIS PFZ…' : pfzError ? 'Official INCOIS PFZ unavailable' : pfz?.source?.isFallback ? 'INCOIS PFZ fallback (demo zones)' : `INCOIS PFZ live · ${pfz?.data?.zoneCount || 0} lines · advisory ${formatAdvisoryDate(pfz?.source?.advisoryDate)}`}
        </span>
        {pfzError && <span className="text-slate-400">No PFZ geometry is shown until a current official response is available. ({pfzError})</span>}
        {pfz?.source?.isFallback && <span className="text-yellow-400/70">{pfz.source.notice}</span>}
      </div>

      <div className="marine-map-grid grid gap-6">
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950">
            <MarineMap layersData={mapLayers} onPointSelect={setPoint} safety={reading} selectedSector={selectedSector} showDemoLayers={false} visibleLayers={['pfz']} showOfficialLayers height="clamp(420px, 68vh, 680px)"
              baseTiles={<>
                <TileLayer
                  url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  className="map-tiles-charcoal"
                  maxNativeZoom={16} maxZoom={19}
                  attribution='Tiles &copy; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <TileLayer
                  url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                  maxNativeZoom={16} maxZoom={19}
                />
              </>}
            />
          </div>
          <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-400">Click the map to request live weather and ocean conditions. The dotted circle is a weather-risk reading, not a navigational boundary.</p>
        </div>
        <div className="min-w-0 space-y-4">
          <WeatherSafety point={point} sector={selectedSector} reading={reading} onReading={setReading} />
        </div>
      </div>
    </div>
  );
}
