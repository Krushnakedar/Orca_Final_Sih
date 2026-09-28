// Shared constants + pure helpers for MarineMap.jsx.
// Kept separate from the component so the ORCA-specific GIS layer catalogue,
// WMS endpoints and styling stay in one auditable place — none of this
// changed during the MapGlot migration, only how it gets rendered.

// [key, display name, line/marker color, fill color] — unchanged from the
// pre-migration Leaflet implementation.
export const GIS_LAYERS = [
  ["pfz", "PFZ Pelagic Zones", "#34d399", "#10b981"],
  ["protected", "Marine Protected Areas (MPAs)", "#10b981", "#065f46"],
  ["restricted", "Naval Restricted Zones", "#f43f5e", "#881337"],
  ["hazards", "Submerged Hazards", "#f59e0b", "#f59e0b"],
  ["imbl", "IMBL Border", "#ef4444", "#ef4444"],
];

const INCOIS_WMS = "https://www.incois.gov.in/geoserver";
export const OFFICIAL_LAYERS = [
  { key: "eez", name: "INCOIS EEZ", url: `${INCOIS_WMS}/PFZ_EEZ/wms`, layers: "PFZ_EEZ:indiaeez" },
  { key: "sectors", name: "INCOIS Sectors", url: `${INCOIS_WMS}/PFZ_Sectors/wms`, layers: "PFZ_Sectors:sector_new" },
  { key: "landingCentres", name: "INCOIS Landing Centres", url: `${INCOIS_WMS}/PFZ_LandingCentres/wms`, layers: "PFZ_LandingCentres:LandingCenters_29Apr2024" },
  { key: "bathymetry", name: "INCOIS Bathymetry", url: `${INCOIS_WMS}/PFZ_Bathymetry/wms`, layers: "PFZ_Bathymetry:bathymetry" },
];

// SECTOR_CENTERS below is [lat, lon] (matching how the rest of the app already
// stores sector coordinates, e.g. DashboardPage's SECTOR_METADATA). MapLibre
// wants [lng, lat] everywhere, so callers must use toLngLat() when handing a
// center to the map — never swap the source of truth's order.
export const SECTOR_CENTERS = {
  "Mumbai Coast": [18.922, 72.8347],
  "Kochi Harbor": [9.9312, 76.2673],
  "Chennai Offshore": [13.0827, 80.2707],
  Visakhapatnam: [17.6868, 83.2185],
  Porbandar: [21.6417, 69.6293],
};

/** [lat, lon] -> [lng, lat] (MapLibre/GeoJSON order). */
export const toLngLat = ([lat, lon]) => [lon, lat];

/**
 * Builds a WMS 1.1.1 GetMap tile URL template MapLibre's raster source can
 * page through using its {bbox-epsg-3857} placeholder. This is the standard,
 * documented way to consume a WMS layer from MapLibre GL JS (MapGlot's own
 * SDK has no dedicated WMS helper — see migration report).
 */
export function wmsTileUrlTemplate({ url, layers }) {
  const params = new URLSearchParams({
    service: "WMS",
    version: "1.1.1",
    request: "GetMap",
    layers,
    styles: "",
    format: "image/png",
    transparent: "true",
    width: "256",
    height: "256",
    srs: "EPSG:3857",
  });
  return `${url}?${params.toString()}&bbox={bbox-epsg-3857}`;
}

/** Fill/line paint per ORCA layerType — same colors as the pre-migration styles. */
export function paintForLayerType(layerType) {
  switch (layerType) {
    case "MPA":
      return { line: "#10b981", fill: "#059669", fillOpacity: 0.25 };
    case "RESTRICTED":
      return { line: "#f43f5e", fill: "#e11d48", fillOpacity: 0.3, dash: [4, 4] };
    case "HAZARD":
      return { line: "#f59e0b", fill: "#d97706", fillOpacity: 0.35 };
    case "PFZ":
      return { line: "#06b6d4", fill: "#0891b2", fillOpacity: 0.3 };
    default:
      return { line: "#38bdf8", fill: "#38bdf8", fillOpacity: 0.2 };
  }
}

/** Popup HTML for a generic ORCA GeoJSON feature (dynamic layersData.features). */
export function popupHtmlForFeature(properties = {}) {
  const p = properties || {};
  return `
    <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 160px;">
      <strong style="font-size: 13px; color: #0369a1;">${p.name || "Marine Zone"}</strong><br/>
      <span style="color: #64748b; font-size: 11px;">Type: ${p.layerType || "Feature"}</span><br/>
      <div style="margin-top: 4px; font-size: 11px;">${p.advisory || p.description || ""}</div>
    </div>
  `;
}

/** Popup HTML for a GIS_LAYERS overlay feature (mirrors the old bindMetadata()). */
export function popupHtmlForMetadata(properties = {}) {
  const rows = Object.entries(properties || {}).map(([key, value]) => {
    const label = key.replace(/([A-Z])/g, " $1");
    const val = Array.isArray(value) ? value.join(", ") : value;
    return key === "name"
      ? `<strong>${val}</strong>`
      : `<div>${label}: ${val}</div>`;
  });
  return `<div style="font-family: sans-serif; font-size: 12px; color:#0f172a;">${rows.join("")}</div>`;
}

/**
 * Generates an approximate circle polygon (GeoJSON) for a given radius in
 * meters. MapLibre has no native "circle in meters" primitive (unlike
 * Leaflet's L.Circle), so this replaces it for the accuracy-ring use case.
 * No turf dependency added — this is a small, self-contained haversine calc.
 */
export function circlePolygon([lat, lon], radiusMeters, steps = 64) {
  const coords = [];
  const earthRadius = 6371000;
  const latRad = (lat * Math.PI) / 180;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = (radiusMeters * Math.cos(angle)) / (earthRadius * Math.cos(latRad));
    const dy = (radiusMeters * Math.sin(angle)) / earthRadius;
    const pointLon = lon + (dx * 180) / Math.PI;
    const pointLat = lat + (dy * 180) / Math.PI;
    coords.push([pointLon, pointLat]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

export const emptyFC = { type: "FeatureCollection", features: [] };
