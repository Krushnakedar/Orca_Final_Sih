/**
 * Marine Heat Wave service — INCOIS-style categories.
 * Uses live SST from Open-Meteo when available and compares to a simple
 * tropical climatology baseline for Indian EEZ (approx 28°C).
 */

const CLIMATOLOGY_SST_C = 28.0;

function classifyAnomaly(anomalyC) {
  if (anomalyC >= 4.0) return { category: 'Extreme', severityScore: 1.0 };
  if (anomalyC >= 3.0) return { category: 'Severe', severityScore: 0.8 };
  if (anomalyC >= 2.0) return { category: 'Strong', severityScore: 0.6 };
  if (anomalyC >= 1.0) return { category: 'Moderate', severityScore: 0.35 };
  return { category: 'None', severityScore: 0 };
}

function categoryColor(category) {
  switch ((category || '').toLowerCase()) {
    case 'extreme': return '#b91c1c';
    case 'severe': return '#ea580c';
    case 'strong': return '#f59e0b';
    case 'moderate': return '#fde047';
    default: return '#94a3b8';
  }
}

/**
 * Point MHW assessment from ocean payload or explicit SST.
 */
async function getPointAssessment(location = {}, oceanPayload = null) {
  const lat = parseFloat(location.lat ?? 18.92);
  const lon = parseFloat(location.lon ?? 72.83);

  let sst = oceanPayload?.seaSurfaceTemperatureC;
  let source = 'provided-ocean-payload';

  if (!Number.isFinite(sst)) {
    try {
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=sea_surface_temperature`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const json = await res.json();
        sst = json?.current?.sea_surface_temperature;
        source = 'Open-Meteo Marine SST';
      }
    } catch (_) {
      /* fall through to synthetic */
    }
  }

  if (!Number.isFinite(sst)) {
    // Synthetic seasonal-ish value for demo resilience
    sst = 28.5 + (Math.sin((Date.now() / 8.64e7) % 365) * 0.8);
    source = 'synthetic-climatology-fallback';
  }

  const anomalyC = parseFloat((sst - CLIMATOLOGY_SST_C).toFixed(2));
  const { category, severityScore } = classifyAnomaly(anomalyC);
  // Synthetic "area spreading" for map legend continuity with SAMUDRA
  const areaSpreadingPercent =
    category === 'None'
      ? 0
      : parseFloat((25 + severityScore * 55 + (Math.abs(lat) % 7)).toFixed(1));

  return {
    location: { lat, lon },
    observedOn: new Date().toISOString().slice(0, 10),
    seaSurfaceTemperatureC: parseFloat(Number(sst).toFixed(2)),
    climatologySstC: CLIMATOLOGY_SST_C,
    sstAnomalyC: anomalyC,
    category,
    severityScore,
    areaSpreadingPercent,
    color: categoryColor(category),
    region: lat > 15 ? 'North Arabian Sea / Gujarat–Maharashtra sector' : 'Central–South west coast sector',
    source,
    disclaimer:
      'Prototype MHW classifier using SST anomaly vs tropical EEZ baseline. Operational use should prefer official INCOIS Marine Heat Wave advisories.',
  };
}

/**
 * GeoJSON-ish grid of MHW categories for map overlay (coarse EEZ samples).
 */
async function getMapGrid() {
  const samples = [
    { lat: 21.5, lon: 69.0, name: 'Gujarat offshore' },
    { lat: 19.0, lon: 71.5, name: 'Mumbai offshore' },
    { lat: 15.5, lon: 72.5, name: 'Goa offshore' },
    { lat: 12.0, lon: 74.5, name: 'Karnataka offshore' },
    { lat: 9.5, lon: 75.8, name: 'Kerala offshore' },
    { lat: 13.0, lon: 80.5, name: 'Chennai offshore' },
    { lat: 16.5, lon: 82.5, name: 'Andhra offshore' },
    { lat: 20.0, lon: 87.0, name: 'Odisha offshore' },
    { lat: 11.5, lon: 92.5, name: 'Andaman Sea' },
  ];

  const features = [];
  for (const s of samples) {
    const point = await getPointAssessment(s);
    // Small square polygon around sample (~0.8°)
    const d = 0.4;
    features.push({
      type: 'Feature',
      properties: {
        name: s.name,
        category: point.category,
        sstAnomalyC: point.sstAnomalyC,
        areaSpreadingPercent: point.areaSpreadingPercent,
        seaSurfaceTemperatureC: point.seaSurfaceTemperatureC,
        color: point.color,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [s.lon - d, s.lat - d],
          [s.lon + d, s.lat - d],
          [s.lon + d, s.lat + d],
          [s.lon - d, s.lat + d],
          [s.lon - d, s.lat - d],
        ]],
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      generatedAt: new Date().toISOString(),
      scheme: 'SST anomaly vs 28°C tropical baseline',
    },
  };
}

module.exports = {
  getPointAssessment,
  getMapGrid,
  classifyAnomaly,
};
