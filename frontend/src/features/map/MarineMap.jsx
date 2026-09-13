import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Polyline,
  Circle,
  LayersControl,
  useMap,
  useMapEvents,
  CircleMarker,
  WMSTileLayer,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Compass,
  Anchor,
  AlertTriangle,
  ShieldCheck,
  Fish,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  Radio,
  Eye,
  EyeOff
} from "lucide-react";

const GIS_LAYERS = [
  ["pfz", "PFZ Pelagic Zones", "#34d399", "#10b981"],
  ["protected", "Marine Protected Areas (MPAs)", "#10b981", "#065f46"],
  ["restricted", "Naval Restricted Zones", "#f43f5e", "#881337"],
  ["hazards", "Submerged Hazards", "#f59e0b", "#f59e0b"],
  ["imbl", "IMBL Border", "#ef4444", "#ef4444"],
];

const INCOIS_WMS = "https://www.incois.gov.in/geoserver";
const OFFICIAL_LAYERS = [
  { key: "eez", name: "INCOIS EEZ", url: `${INCOIS_WMS}/PFZ_EEZ/wms`, layers: "PFZ_EEZ:indiaeez" },
  { key: "sectors", name: "INCOIS Sectors", url: `${INCOIS_WMS}/PFZ_Sectors/wms`, layers: "PFZ_Sectors:sector_new" },
  { key: "landingCentres", name: "INCOIS Landing Centres", url: `${INCOIS_WMS}/PFZ_LandingCentres/wms`, layers: "PFZ_LandingCentres:LandingCenters_29Apr2024" },
  { key: "bathymetry", name: "INCOIS Bathymetry", url: `${INCOIS_WMS}/PFZ_Bathymetry/wms`, layers: "PFZ_Bathymetry:bathymetry" },
];

const SECTOR_CENTERS = {
  "Mumbai Coast": [18.922, 72.8347],
  "Kochi Harbor": [9.9312, 76.2673],
  "Chennai Offshore": [13.0827, 80.2707],
  Visakhapatnam: [17.6868, 83.2185],
  Porbandar: [21.6417, 69.6293],
};

const createCustomIcon = (colorBg, symbol) =>
  L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div style="background-color:${colorBg};width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.5);font-size:11px;font-weight:bold;color:white;">${symbol}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const createLiveGpsIcon = () =>
  L.divIcon({
    className: "live-gps-icon",
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #06b6d4; opacity: 0.5; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; background: #0891b2; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #06b6d4; display: flex; align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: bold;">📍</div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function MapView({
  center,
  simulation,
  layersData,
  onPointSelect,
  onMapPick,
  selectionMode,
  userLocation,
  followUser,
  origin,
  destination,
  routeGeometry,
}) {
  const map = useMap();
  const flewToUserRef = useRef(false);

  useMapEvents({
    click: (event) => {
      const point = event.latlng.wrap();

      // Selection mode: assign origin or destination instead of a weather point.
      if (selectionMode && onMapPick) {
        onMapPick({ lat: point.lat, lon: point.lng, mode: selectionMode });
        return;
      }

      map.flyTo(point, Math.max(map.getZoom(), 11), { duration: 0.45 });
      onPointSelect?.({ lat: point.lat, lon: point.lng });
    },
  });

  // Default sector view (skipped when a stronger signal exists).
  useEffect(() => {
    if (simulation) return;
    if (followUser && userLocation) return;
    map.setView(center, 8);
  }, [map, center, simulation, followUser, userLocation]);

  // Follow user (fires once per watch-start / follow toggle).
  useEffect(() => {
    if (!followUser || !userLocation) {
      flewToUserRef.current = false;
      return;
    }
    if (flewToUserRef.current) return;
    flewToUserRef.current = true;
    map.flyTo(
      [userLocation.lat, userLocation.lon],
      Math.max(map.getZoom(), 12),
      { duration: 0.6 },
    );
  }, [map, followUser, userLocation?.lat, userLocation?.lon]);

  // Simulation focus (existing behaviour, preserved).
  useEffect(() => {
    map.closePopup();
    if (!simulation) return;
    const position = simulation.vesselPosition;
    const zones = [...simulation.breachedZones, ...simulation.warningZones, ...simulation.boundaryWarnings];
    const points = [[position.lat, position.lon], ...zones.flatMap(zone => zone.coordinates || zone.lineCoordinates || [])];
    map.fitBounds(points, { padding: [45, 45], maxZoom: zones.length ? 10 : 8 });
  }, [map, simulation]);

  // Fit to origin + destination + route when present.
  useEffect(() => {
    const points = [];
    if (origin) points.push([origin.lat, origin.lon]);
    if (destination) points.push([destination.lat, destination.lon]);
    if (Array.isArray(routeGeometry) && routeGeometry.length)
      points.push(...routeGeometry);
    if (points.length < 2) return;
    map.fitBounds(points, { padding: [50, 50], maxZoom: 11 });
  }, [map, origin?.lat, origin?.lon, destination?.lat, destination?.lon, routeGeometry]);

  // Fit to GIS layer collection when there is nothing else to focus on.
  // Guarded against oversized/placeholder geometry: if the collection's bounds
  // span an unreasonably large area for a single operational sector (e.g. bad
  // or malformed feature coordinates), keep the sector-centered default view
  // instead of zooming out to a whole-region/continent extent.
  useEffect(() => {
    const collection = layersData?.features ? layersData : layersData?.pfz;
    if (simulation || origin || destination || !collection?.features?.length) return;
    const bounds = L.geoJSON(collection).getBounds();
    if (!bounds.isValid()) return;
    const MAX_SECTOR_SPAN_DEGREES = 6;
    const spansTooWide =
      bounds.getNorth() - bounds.getSouth() > MAX_SECTOR_SPAN_DEGREES ||
      bounds.getEast() - bounds.getWest() > MAX_SECTOR_SPAN_DEGREES;
    if (spansTooWide) return;
    map.fitBounds(bounds.pad(0.2), { maxZoom: 8 });
  }, [map, layersData, simulation, origin, destination]);

  return null;
}

function BaseTiles() {
  // Plain OpenStreetMap tiles — no API key, no CORS/referrer restrictions,
  // guaranteed to load. A gentle tint keeps it in the app's dark theme
  // without the old grayscale+invert combo that made water look black.
  return <TileLayer
    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    maxZoom={19}
    className="map-tiles-dark"
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  />;
}

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function bindMetadata(feature, layer) {
  const content = document.createElement("div");
  for (const [key, value] of Object.entries(feature.properties || {})) {
    const row = document.createElement(key === "name" ? "strong" : "div");
    row.textContent = `${key.replace(/([A-Z])/g, " $1")}: ${Array.isArray(value) ? value.join(", ") : value}`;
    content.appendChild(row);
  }
  layer.bindPopup(content, { maxHeight: 240 });
}

export default function MarineMap({
  baseTiles,
  layersData,
  selectedSector = "Mumbai Coast",
  onSelectSector,
  height = "500px",
  heightClassName = "",
  compact = false,
  routePlan = null,
  showDirectBaseline = false,
  onToggleDirectBaseline,
  simulation = null,
  onPointSelect,
  safety = null,
  showDemoLayers = true,
  visibleLayers = GIS_LAYERS.map(([key]) => key),
  showOfficialLayers = false,
  onMapPick,
  selectionMode = null,
  userLocation = null,
  followUser = false,
  origin = null,
  destination = null,
  routeGeometry = null,
  routeError = null,
}) {
  const [legendOpen, setLegendOpen] = useState(false);

  const center =
    SECTOR_CENTERS[selectedSector] || SECTOR_CENTERS["Mumbai Coast"];

  const getStyleForLayer = (feature) => {
    const layerType = feature.properties?.layerType;
    if (layerType === "MPA") {
      return {
        color: "#10b981",
        weight: 2,
        fillOpacity: 0.25,
        fillColor: "#059669",
      };
    }
    if (layerType === "RESTRICTED") {
      return {
        color: "#f43f5e",
        weight: 2,
        fillOpacity: 0.3,
        fillColor: "#e11d48",
        dashArray: "4, 4",
      };
    }
    if (layerType === "HAZARD") {
      return {
        color: "#f59e0b",
        weight: 2,
        fillOpacity: 0.35,
        fillColor: "#d97706",
      };
    }
    if (layerType === "PFZ") {
      return {
        color: "#06b6d4",
        weight: 2,
        fillOpacity: 0.3,
        fillColor: "#0891b2",
      };
    }
    return { color: "#38bdf8", weight: 2, fillOpacity: 0.2 };
  };

  const onEachFeature = (feature, layer) => {
    const p = feature.properties || {};
    layer.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 160px;">
        <strong style="font-size: 13px; color: #0369a1;">${p.name || "Marine Zone"}</strong><br/>
        <span style="color: #64748b; font-size: 11px;">Type: ${p.layerType || "Feature"}</span><br/>
        <div style="margin-top: 4px; font-size: 11px;">${p.advisory || p.description || ""}</div>
      </div>
    `);
  };

  return (
    <div
      className={`relative isolate min-w-0 w-full rounded-2xl overflow-hidden border border-slate-800 ${heightClassName}`}
      style={heightClassName ? undefined : { height }}
    >
      <MapContainer
        center={center}
        zoom={compact ? 9 : 8}
        style={{ height: "100%", width: "100%", background: "#020617" }}
        zoomControl={!compact}
      >
        <MapView
          center={center}
          simulation={simulation}
          layersData={layersData}
          onPointSelect={onPointSelect}
          onMapPick={onMapPick}
          selectionMode={selectionMode}
          userLocation={userLocation}
          followUser={followUser}
          origin={origin}
          destination={destination}
          routeGeometry={routeGeometry}
        />
        <ResizeMap />
        {baseTiles || <BaseTiles />}
        {visibleLayers.length > 0 && <LayersControl position="topright">
          {GIS_LAYERS.filter(([key]) => visibleLayers.includes(key)).map(([key, name, color, fillColor]) => (
            <LayersControl.Overlay checked name={name} key={key}>
              <GeoJSON
                key={JSON.stringify(layersData?.[key] || null)}
                data={layersData?.[key] || { type: "FeatureCollection", features: [] }}
                style={feature => ({ color, fillColor, fillOpacity: ["protected", "restricted"].includes(key) ? 0.8 : 1,
                  weight: simulation && [...simulation.breachedZones, ...simulation.warningZones, ...simulation.boundaryWarnings].some(zone => zone.id === feature.id) ? 6 : 2,
                  dashArray: key === "imbl" ? "8 6" : undefined })}
                pointToLayer={(feature, latlng) => L.circleMarker(latlng, { color, fillColor, fillOpacity: 0.8, radius: 7 })}
                onEachFeature={bindMetadata}
              />
            </LayersControl.Overlay>
          ))}
          {showOfficialLayers && OFFICIAL_LAYERS.map(layer => (
            <LayersControl.Overlay checked={false} name={layer.name} key={layer.key}>
              <WMSTileLayer url={layer.url} layers={layer.layers} format="image/png" transparent version="1.1.1" opacity={0.8} attribution="INCOIS" />
            </LayersControl.Overlay>
          ))}
        </LayersControl>}

        {/* Dynamic GeoJSON Layers */}
        {layersData?.features && (
          <GeoJSON
            key={`${selectedSector}_${layersData.features.length}`}
            data={layersData}
            style={getStyleForLayer}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Simulation vessel (existing, only when showDemoLayers) */}
        {showDemoLayers && simulation?.vesselPosition && (
          <Marker
            position={[
              simulation.vesselPosition.lat,
              simulation.vesselPosition.lon,
            ]}
            icon={createCustomIcon("#0f172a", "S")}
          >
            <Popup>
              Simulated vessel: {simulation.status.replaceAll("_", " ")}
              <br />
              {simulation.vesselPosition.lat}, {simulation.vesselPosition.lon}
            </Popup>
          </Marker>
        )}

        {/* Weather safety circle (existing) */}
        {safety?.point && (
          <CircleMarker
            center={[safety.point.lat, safety.point.lon]}
            radius={18}
            pathOptions={{
              color: safety.color || "#64748b",
              fillColor: safety.color || "#64748b",
              fillOpacity: 0.45,
              weight: 4,
              dashArray: "3 4",
            }}
          >
            <Popup>
              Weather safety:{" "}
              {safety.risk
                ? safety.risk.riskLevel === "LOW"
                  ? "LOW"
                  : safety.risk.riskLevel === "MODERATE"
                    ? "MODERATE"
                    : "CRITICAL"
                : safety.error
                  ? "Unavailable"
                  : "Loading"}
              <br />
              {safety.risk && (
                <>
                  Air temperature:{" "}
                  {safety.weather.data.temperatureC == null
                    ? "Unavailable"
                    : `${safety.weather.data.temperatureC}°C`}
                  <br />
                  Wind: {safety.weather.data.windSpeedKmh} km/h · Waves:{" "}
                  {safety.ocean.data.significantWaveHeightM} m
                </>
              )}
            </Popup>
          </CircleMarker>
        )}

        {/* -------------------- Phase 1 additions -------------------- */}

        {/* User's live location: accuracy ring + dot */}
        {userLocation && (
          <>
            {Number.isFinite(userLocation.accuracy) &&
              userLocation.accuracy > 0 && (
                <Circle
                  center={[userLocation.lat, userLocation.lon]}
                  radius={userLocation.accuracy}
                  pathOptions={{
                    color: "#38bdf8",
                    weight: 1,
                    fillColor: "#38bdf8",
                    fillOpacity: 0.12,
                  }}
                />
              )}
            <CircleMarker
              center={[userLocation.lat, userLocation.lon]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: "#0ea5e9",
                fillOpacity: 1,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "sans-serif", fontSize: 12 }}>
                  <strong>Your current location</strong>
                  <br />
                  {userLocation.lat.toFixed(5)}, {userLocation.lon.toFixed(5)}
                  {Number.isFinite(userLocation.accuracy) && (
                    <>
                      <br />
                      <span style={{ color: "#64748b", fontSize: 11 }}>
                        ±{Math.round(userLocation.accuracy)} m
                      </span>
                    </>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* Origin marker (Phase 1 generic picker — separate from routePlan.origin below) */}
        {origin && (
          <Marker
            position={[origin.lat, origin.lon]}
            icon={createCustomIcon("#10b981", "A")}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", fontSize: 12 }}>
                <strong>Origin</strong>
                <br />
                {origin.name ||
                  `${origin.lat.toFixed(4)}, ${origin.lon.toFixed(4)}`}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination marker (Phase 1 generic picker) */}
        {destination && (
          <Marker
            position={[destination.lat, destination.lon]}
            icon={createCustomIcon("#ef4444", "B")}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", fontSize: 12 }}>
                <strong>Destination</strong>
                <br />
                {destination.name ||
                  `${destination.lat.toFixed(4)}, ${destination.lon.toFixed(4)}`}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Real maritime route (Phase 1 generic route geometry) */}
        {Array.isArray(routeGeometry) && routeGeometry.length > 1 && (
          <Polyline
            positions={routeGeometry}
            pathOptions={{ color: "#06b6d4", weight: 4, opacity: 0.95 }}
          >
            <Popup>
              <div style={{ fontFamily: "sans-serif", fontSize: 12 }}>
                <strong style={{ color: "#0891b2" }}>Maritime route</strong>
              </div>
            </Popup>
          </Polyline>
        )}

        {routeError && (
          <CircleMarker
            center={destination ? [destination.lat, destination.lon] : center}
            radius={1}
            pathOptions={{ opacity: 0, fillOpacity: 0 }}
          >
            <Popup autoPan={false}>{routeError}</Popup>
          </CircleMarker>
        )}

        {/* -------------------- End Phase 1 -------------------- */}

        {/* Direct Baseline Path (Unoptimized) Overlay — only shown when toggled on,
            since a straight line often cuts across land/hazards and is for comparison only */}
        {showDirectBaseline && routePlan?.directBaselineRoute?.coordinates && (
           <Polyline
            positions={routePlan.directBaselineRoute.coordinates}
            pathOptions={{
              color: "#f43f5e",
              weight: 3,
              dashArray: "6, 8",
              opacity: 0.85,
            }}
          >
            <Popup>
              <div className="text-xs text-slate-900 font-sans">
                <strong style={{ color: "#e11d48" }}>Direct Baseline Path (Unoptimized)</strong>
                <br />
                <span className="text-[10px] text-rose-600 font-semibold">⚠️ Unsafe: Cuts directly across landmass / military hazards</span>
                <br />
                Distance: {routePlan.directBaselineRoute.totalDistanceNm} NM
                <br />
                Risk Score: <strong>{routePlan.directBaselineRoute.riskScore}/100</strong>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Lower-Risk Recommended Route Overlay (100% Waterway Trajectory) */}
        {routePlan?.lowerRiskProposedRoute?.coordinates && (
          <Polyline
            positions={routePlan.lowerRiskProposedRoute.coordinates}
            pathOptions={{
              color: "#06b6d4",
              weight: 4,
              opacity: 0.95,
            }}
          >
            <Popup>
              <div className="text-xs text-slate-900 font-sans">
                <strong style={{ color: "#0891b2" }}>
                  Lower-Risk Route Recommendation (100% Sea Lane)
                 </strong>
                <br />
                Distance: <strong>{routePlan.lowerRiskProposedRoute.totalDistanceNm} NM</strong>
                <br />
                Risk Score: <strong>{routePlan.lowerRiskProposedRoute.riskScore}/100</strong> ({routePlan.lowerRiskProposedRoute.riskLevel})
                <br />
                Max Wave Swell: {routePlan.lowerRiskProposedRoute.maxWaveExposureM} m (Sheltered)
                <br />
                Geofence: <span style={{ color: "#059669", fontWeight: "bold" }}>100% Clear of Restricted Zones</span>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Interactive Waypoint Markers Along Recommended Route */}
        {routePlan?.lowerRiskProposedRoute?.turnByTurnDirectives?.map((leg, idx) => (
          <CircleMarker
            key={`wp_${idx}`}
            center={leg.toCoordinates}
            radius={5}
            pathOptions={{
              color: "#06b6d4",
              fillColor: "#0891b2",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs text-slate-900 font-sans">
                <strong style={{ color: "#0891b2" }}>Waypoint {idx + 1}</strong>
                <br />
                Course: <strong>{leg.bearingDegrees}°</strong> &bull; Leg: <strong>{leg.distanceNm} NM</strong> ({leg.estimatedMinutes} mins)
                <br />
                Local Wave Swell: {leg.waveHeightM} m &bull; Wind: {leg.windSpeedKmh} km/h
                <br />
                Status: <span style={{ color: leg.geofenceClear ? "#059669" : "#dc2626", fontWeight: "bold" }}>
                  {leg.geofenceClear ? "✅ Clear of Hazards" : "⚠️ Proximity Alert"}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Departure Origin Marker (Live GPS Radar vs Harbor Anchor) */}
        {routePlan?.origin?.coordinates && (
          <Marker
            position={routePlan.origin.coordinates}
            icon={routePlan.origin.isLive ? createLiveGpsIcon() : createCustomIcon("#10b981", "⚓")}
          >
            <Popup>
              <div className="text-xs text-slate-900 font-sans">
                <strong style={{ color: routePlan.origin.isLive ? "#0891b2" : "#059669" }}>
                  {routePlan.origin.isLive ? "📍 Live Vessel GPS Position" : "Departure Harbor"}
                </strong>
                <br />
                {routePlan.origin.name}
                <br />
                Coordinates: {routePlan.origin.coordinates[0]?.toFixed(4)}°N, {routePlan.origin.coordinates[1]?.toFixed(4)}°E
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Target Marker */}
        {routePlan?.destination?.coordinates && (
          <Marker
            position={routePlan.destination.coordinates}
            icon={createCustomIcon("#06b6d4", "🎯")}
          >
            <Popup>
              <div className="text-xs text-slate-900 font-sans">
                <strong style={{ color: "#0891b2" }}>Target Destination Ground</strong>
                <br />
                {routePlan.destination.name}
                <br />
                Coordinates: {routePlan.destination.coordinates[0]?.toFixed(4)}°N, {routePlan.destination.coordinates[1]?.toFixed(4)}°E
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Interactive Map Legend & Symbols Box */}
      <div className="absolute bottom-4 left-3 z-[999] pointer-events-auto transition-all max-w-[calc(100vw-24px)] sm:max-w-xs">
        {!legendOpen ? (
          <button
            onClick={() => setLegendOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-2xl hover:bg-slate-900 transition hover:border-cyan-700"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Symbols & Legend</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 font-mono">Guide</span>
          </button>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-lg border border-slate-800 text-slate-200 shadow-2xl space-y-2.5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Maritime Map Symbols Guide</span>
              </span>
              <button
                onClick={() => setLegendOpen(false)}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2">
                <div className="w-4 h-1 bg-cyan-400 mt-1.5 rounded-full shrink-0 shadow-sm shadow-cyan-400" />
                <div>
                  <strong className="text-cyan-300 block">Cyan Solid Line</strong>
                  <span className="text-slate-400 text-[10px]">Recommended safe sea route (100% water, avoiding land & hazards)</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-white mt-1 shrink-0" />
                <div>
                  <strong className="text-slate-200 block">Cyan Waypoint Dots</strong>
                  <span className="text-slate-400 text-[10px]">Navigation turns — click any dot for local waves, wind & course</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-xs shrink-0">📍</span>
                <div>
                  <strong className="text-cyan-300 block">Pulsing Cyan Beacon</strong>
                  <span className="text-slate-400 text-[10px]">Your active vessel live GPS location</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-xs shrink-0">⚓ / 🎯</span>
                <div>
                  <strong className="text-slate-200 block">Anchor & Bullseye</strong>
                  <span className="text-slate-400 text-[10px]">⚓ Departure port &bull; 🎯 Destination fishing ground / PFZ</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-3.5 h-3 rounded bg-emerald-500/40 border border-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-emerald-300 block">Green Shaded (PFZ)</strong>
                  <span className="text-slate-400 text-[10px]">Potential Fishing Zones (high fish biomass & thermal fronts)</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-3.5 h-3 rounded bg-rose-500/30 border border-rose-500 border-dashed mt-0.5 shrink-0" />
                <div>
                  <strong className="text-rose-300 block">Red Dashed Zones</strong>
                  <span className="text-slate-400 text-[10px]">Naval firing perimeters (e.g. INS Trata — strict avoidance)</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-3.5 h-3 rounded bg-amber-500/35 border border-amber-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-amber-300 block">Amber Shaded Zones</strong>
                  <span className="text-slate-400 text-[10px]">Submerged coral reefs, atolls & shoals (e.g. Angria Bank)</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-4 h-0.5 border-t-2 border-red-500 border-dashed mt-1.5 shrink-0" />
                <div>
                  <strong className="text-red-400 block">Red Dashed Line (IMBL)</strong>
                  <span className="text-slate-400 text-[10px]">International Maritime Boundary Line</span>
                </div>
              </div>

              {onToggleDirectBaseline && (
                <div className="pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showDirectBaseline}
                      onChange={(e) => onToggleDirectBaseline(e.target.checked)}
                      className="rounded accent-rose-500 bg-slate-900 border-slate-700"
                    />
                    <span className="text-[10px] text-slate-300 flex items-center gap-1">
                      {showDirectBaseline ? <Eye className="w-3 h-3 text-rose-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                      <span>Show Straight-Line Baseline (Compare Land Cut)</span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
