/**
 * Small Vessel Advisory Service (SVAS) — SAMUDRA-aligned coastal zones.
 * Provides day-1/2/3 advice by boat length class for Indian coastal sectors.
 */

const ZONES = [
  {
    id: 'gujarat_saurashtra',
    name: 'Gujarat – Saurashtra',
    colorByDay: { 1: '#f59e0b', 2: '#f59e0b', 3: '#22c55e' },
    statusByDay: { 1: 'CAUTION', 2: 'CAUTION', 3: 'CLEAR' },
    restrictedBoatClassesByDay: {
      1: ['lt4', 'lt6'],
      2: ['lt4'],
      3: [],
    },
    // Simplified coastal band polygon (lon, lat)
    coordinates: [
      [68.8, 22.8], [70.5, 22.5], [72.0, 21.5], [72.2, 20.5],
      [71.5, 20.0], [69.5, 20.8], [68.5, 21.8], [68.8, 22.8],
    ],
  },
  {
    id: 'maharashtra_konkan',
    name: 'Maharashtra – Konkan',
    colorByDay: { 1: '#22c55e', 2: '#22c55e', 3: '#22c55e' },
    statusByDay: { 1: 'CLEAR', 2: 'CLEAR', 3: 'CLEAR' },
    restrictedBoatClassesByDay: { 1: [], 2: [], 3: [] },
    coordinates: [
      [72.2, 20.5], [73.0, 19.5], [73.2, 18.0], [73.0, 16.5],
      [72.4, 16.2], [72.0, 17.5], [71.8, 19.0], [72.2, 20.5],
    ],
  },
  {
    id: 'goa_karnataka',
    name: 'Goa – Karnataka',
    colorByDay: { 1: '#22c55e', 2: '#f59e0b', 3: '#f59e0b' },
    statusByDay: { 1: 'CLEAR', 2: 'CAUTION', 3: 'CAUTION' },
    restrictedBoatClassesByDay: {
      1: [],
      2: ['lt4'],
      3: ['lt4', 'lt6'],
    },
    coordinates: [
      [73.0, 16.5], [74.2, 15.0], [74.5, 13.5], [74.3, 12.5],
      [73.6, 12.8], [73.2, 14.5], [72.8, 15.8], [73.0, 16.5],
    ],
  },
  {
    id: 'kerala',
    name: 'Kerala',
    colorByDay: { 1: '#f59e0b', 2: '#ef4444', 3: '#ef4444' },
    statusByDay: { 1: 'CAUTION', 2: 'NOT_ADVISED', 3: 'NOT_ADVISED' },
    restrictedBoatClassesByDay: {
      1: ['lt4'],
      2: ['lt4', 'lt6', 'lt7'],
      3: ['lt4', 'lt6', 'lt7', 'lt10'],
    },
    coordinates: [
      [74.3, 12.5], [75.5, 11.0], [76.5, 9.5], [77.2, 8.2],
      [76.6, 8.0], [75.2, 9.8], [74.5, 11.5], [74.3, 12.5],
    ],
  },
  {
    id: 'tamil_nadu',
    name: 'Tamil Nadu – East',
    colorByDay: { 1: '#22c55e', 2: '#22c55e', 3: '#f59e0b' },
    statusByDay: { 1: 'CLEAR', 2: 'CLEAR', 3: 'CAUTION' },
    restrictedBoatClassesByDay: { 1: [], 2: [], 3: ['lt4'] },
    coordinates: [
      [77.5, 8.2], [78.5, 9.5], [80.0, 11.0], [80.3, 13.0],
      [79.8, 13.2], [79.2, 11.0], [78.0, 9.0], [77.5, 8.2],
    ],
  },
  {
    id: 'andhra_odisha',
    name: 'Andhra – Odisha',
    colorByDay: { 1: '#22c55e', 2: '#22c55e', 3: '#22c55e' },
    statusByDay: { 1: 'CLEAR', 2: 'CLEAR', 3: 'CLEAR' },
    restrictedBoatClassesByDay: { 1: [], 2: [], 3: [] },
    coordinates: [
      [80.3, 13.2], [82.0, 15.0], [84.5, 17.5], [86.5, 19.5],
      [87.5, 21.0], [86.8, 21.2], [84.0, 18.5], [81.5, 15.5], [80.3, 13.2],
    ],
  },
  {
    id: 'west_bengal',
    name: 'West Bengal – Sundarbans approach',
    colorByDay: { 1: '#f59e0b', 2: '#f59e0b', 3: '#22c55e' },
    statusByDay: { 1: 'CAUTION', 2: 'CAUTION', 3: 'CLEAR' },
    restrictedBoatClassesByDay: {
      1: ['lt4', 'lt6'],
      2: ['lt4'],
      3: [],
    },
    coordinates: [
      [87.5, 21.0], [89.0, 21.5], [89.2, 22.5], [88.5, 22.8],
      [87.2, 22.0], [87.0, 21.2], [87.5, 21.0],
    ],
  },
];

function boatSizeClass(lengthM) {
  const L = parseFloat(lengthM) || 12;
  if (L < 4) return 'lt4';
  if (L < 6) return 'lt6';
  if (L < 7) return 'lt7';
  if (L < 10) return 'lt10';
  return 'large';
}

function pointInPolygon(lon, lat, ring) {
  // Ray casting
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function findZone(lat, lon) {
  for (const z of ZONES) {
    if (pointInPolygon(lon, lat, z.coordinates)) return z;
  }
  // Nearest by centroid distance
  let best = ZONES[0];
  let bestD = Infinity;
  for (const z of ZONES) {
    const cx = z.coordinates.reduce((s, c) => s + c[0], 0) / z.coordinates.length;
    const cy = z.coordinates.reduce((s, c) => s + c[1], 0) / z.coordinates.length;
    const d = (cx - lon) ** 2 + (cy - lat) ** 2;
    if (d < bestD) {
      bestD = d;
      best = z;
    }
  }
  return best;
}

function getAdvice({ lat, lon, boatLengthM = 6, day = 1 } = {}) {
  const d = Math.min(3, Math.max(1, parseInt(day, 10) || 1));
  const zone = findZone(parseFloat(lat) || 18.9, parseFloat(lon) || 72.8);
  const sizeClass = boatSizeClass(boatLengthM);
  const status = zone.statusByDay[d] || 'CLEAR';
  const restricted = zone.restrictedBoatClassesByDay[d] || [];
  const isRestricted =
    status === 'NOT_ADVISED' ||
    status === 'DO_NOT_SAIL' ||
    restricted.includes(sizeClass);

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    day: d,
    boatLengthM: parseFloat(boatLengthM) || 6,
    boatSizeClass: sizeClass,
    status: isRestricted && status === 'CLEAR' ? 'CAUTION' : status,
    restrictedBoatClasses: restricted,
    color: zone.colorByDay[d],
    adviceText:
      status === 'NOT_ADVISED' || status === 'DO_NOT_SAIL'
        ? `Day ${d}: Sailing not advised in ${zone.name} for restricted small craft classes.`
        : status === 'CAUTION'
          ? `Day ${d}: Caution advised in ${zone.name}. Review wind/wave before departure.`
          : `Day ${d}: Conditions favourable for most craft in ${zone.name}.`,
    isRestricted,
  };
}

function getMapLayers({ day = 1, boatLengthM = 6 } = {}) {
  const d = Math.min(3, Math.max(1, parseInt(day, 10) || 1));
  const sizeClass = boatSizeClass(boatLengthM);

  const features = ZONES.map((z) => {
    const status = z.statusByDay[d] || 'CLEAR';
    const restricted = z.restrictedBoatClassesByDay[d] || [];
    const isRestricted =
      status === 'NOT_ADVISED' ||
      status === 'DO_NOT_SAIL' ||
      restricted.includes(sizeClass);
    return {
      type: 'Feature',
      properties: {
        id: z.id,
        name: z.name,
        day: d,
        status,
        color: z.colorByDay[d],
        restrictedBoatClasses: restricted,
        isRestrictedForSelectedBoat: isRestricted,
        boatSizeClass: sizeClass,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [z.coordinates],
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      day: d,
      boatLengthM: parseFloat(boatLengthM) || 6,
      boatSizeClass: sizeClass,
      generatedAt: new Date().toISOString(),
      legend: {
        CLEAR: '#22c55e',
        CAUTION: '#f59e0b',
        NOT_ADVISED: '#ef4444',
      },
    },
  };
}

module.exports = {
  getAdvice,
  getMapLayers,
  boatSizeClass,
  ZONES,
};
