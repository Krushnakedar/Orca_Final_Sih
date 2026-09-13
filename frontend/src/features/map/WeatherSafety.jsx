import React, { useEffect, useState } from 'react';
import { providerService } from '../../services/providerService';
import { riskService } from '../../services/riskService';

const COLORS = { LOW: '#0ea5e9', MODERATE: '#6366f1', HIGH: '#a855f7', CRITICAL: '#d946ef' };
const VESSEL = { typeKey: 'small_motorized', name: 'Small motorized craft' };
const isMock = response => Boolean(response?.isFallback || response?.source?.isFallback || response?.source?.isDemoData || response?.provider?.isMock || response?.data?.isFallback);
const safetyBand = level => level === 'LOW' ? 'LOW' : level === 'MODERATE' ? 'MODERATE' : 'CRITICAL';
const plainRecommendation = level => level === 'LOW'
  ? 'Conditions look usable for this vessel. Check the latest notice before leaving.'
  : level === 'MODERATE'
    ? 'Be careful. Consider waiting for calmer water and keep checking the weather.'
    : 'Do not leave in these conditions. Wait for safer weather or use an approved alternative plan.';

export default function WeatherSafety({ point, sector, reading, onReading }) {
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let cancelled = false;
    onReading(point ? { point } : null);
    if (!point) return () => { cancelled = true; };
    (async () => {
      try {
        const context = await providerService.getMarineContext(point.lat, point.lon, sector);
        if (context?.location?.isLand) throw new Error('This point is on land. Select a point over the sea.');
        const [weather, ocean] = await Promise.all([
          providerService.getWeather(point.lat, point.lon, sector),
          providerService.getOceanConditions(point.lat, point.lon)
        ]);
        if (!Number.isFinite(weather?.data?.windSpeedKmh) || !Number.isFinite(ocean?.data?.significantWaveHeightM)) throw new Error('Weather or wave measurements are unavailable.');
        if (cancelled) return;
        const result = await riskService.evaluateRisk({ weather: weather.data, ocean: ocean.data, vesselProfile: VESSEL });
        if (!COLORS[result?.data?.riskLevel]) throw new Error('Risk evaluation is unavailable.');
        if (!cancelled) onReading({ point, weather, ocean, context, risk: result.data, isFallback: isMock(weather) || isMock(ocean) || isMock(result), color: COLORS[result.data.riskLevel] });
      } catch (error) {
        if (!cancelled) onReading({ point, error: error.message || 'Could not check weather safety. Try again.' });
      }
    })();
    return () => { cancelled = true; };
  }, [point, sector, refresh, onReading]);

  return <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-3 text-sm" aria-label="Weather safety" aria-live="polite">
    <h2 className="font-semibold text-white">Selected area summary</h2>
    <p className="text-xs text-slate-400">Click anywhere on the map. We check the latest wind, waves and weather for that point.</p>
    {!point && <p className="text-slate-300">Select a point on the map to begin.</p>}
    {point && <p className="text-xs text-slate-400">Selected: {point.lat.toFixed(4)}, {point.lon.toFixed(4)}</p>}
    {point && !reading?.risk && !reading?.error && <p>Checking weather and ocean conditions…</p>}
    {reading?.error && <p role="alert" className="text-rose-300">{reading.error}</p>}
    {reading?.risk && <>
      <div className="rounded-lg border-2 p-3" style={{ borderColor: reading.color }}>
        <strong style={{ color: reading.color }}>Recommendation: {safetyBand(reading.risk.riskLevel)}</strong>
        <p className="mt-1 text-slate-100">{plainRecommendation(safetyBand(reading.risk.riskLevel))}</p>
        <p className="mt-2 text-slate-100">Air temperature: {reading.weather.data.temperatureC == null ? 'Unavailable' : `${reading.weather.data.temperatureC}°C`}<br />Wind: {reading.weather.data.windSpeedKmh} km/h<br />Waves: {reading.ocean.data.significantWaveHeightM} m</p>
        <p className={`mt-2 rounded px-2 py-1 text-xs ${reading.isFallback ? 'bg-amber-950 text-amber-200' : 'bg-sky-950 text-sky-200'}`}>{reading.isFallback ? 'Some readings are backup estimates — check again before leaving.' : 'Live readings from the weather and ocean services.'}</p>
      </div>
      <details className="rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
        <summary className="cursor-pointer font-medium text-slate-100">Technical details</summary>
        <p className="mt-2">Weather: {isMock(reading.weather) ? 'Backup estimate' : 'Live model'} · Ocean: {isMock(reading.ocean) ? 'Backup estimate' : 'Live model'}</p>
        <p>EEZ features: {reading.context?.data?.eez?.features?.length || 0} · Sector features: {reading.context?.data?.sectors?.features?.length || 0}</p>
        <p>Landing centres nearby: {reading.context?.data?.landingCentres?.features?.length || 0} · Bathymetry features: {reading.context?.data?.bathymetry?.features?.length || 0}</p>
        <p>Checked {new Date(reading.risk.evaluatedAt).toLocaleString()} · {reading.risk.vesselProfile.type}</p>
        <p>{reading.risk.primaryFactors.join('. ')}</p>
      </details>
    </>}
    {point && <button className="rounded border border-slate-600 px-3 py-1 text-slate-200" onClick={() => setRefresh(n => n + 1)}>Refresh weather</button>}
  </section>;
}
