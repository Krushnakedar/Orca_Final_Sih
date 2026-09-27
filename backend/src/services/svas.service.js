const ZONES = [
  {
    id: "gujarat_saurashtra",
    name: "Gujarat - Saurashtra",
    coordinates: [[68.8, 22.8], [70.5, 22.5], [72.0, 21.5], [72.2, 20.5], [71.5, 20.0], [69.5, 20.8], [68.5, 21.8], [68.8, 22.8]],
    center: [70.4, 21.4],
    status: ["CAUTION", "CAUTION", "CLEAR"],
    restrictedLength: [6, 4, 0],
  },
  {
    id: "maharashtra_konkan",
    name: "Maharashtra - Konkan",
    coordinates: [[72.2, 20.5], [73.0, 19.5], [73.2, 18.0], [73.0, 16.5], [72.4, 16.2], [72.0, 17.5], [71.8, 19.0], [72.2, 20.5]],
    center: [72.5, 18.4],
    status: ["CLEAR", "CLEAR", "CLEAR"],
    restrictedLength: [0, 0, 0],
  },
  {
    id: "goa_karnataka",
    name: "Goa - Karnataka",
    coordinates: [[73.0, 16.5], [74.2, 15.0], [74.5, 13.5], [74.3, 12.5], [73.6, 12.8], [73.2, 14.5], [72.8, 15.8], [73.0, 16.5]],
    center: [73.7, 14.4],
    status: ["CLEAR", "CAUTION", "CAUTION"],
    restrictedLength: [0, 4, 6],
  },
  {
    id: "kerala",
    name: "Kerala",
    coordinates: [[74.3, 12.5], [75.5, 11.0], [76.5, 9.5], [77.2, 8.2], [76.6, 8.0], [75.2, 9.8], [74.5, 11.5], [74.3, 12.5]],
    center: [76.0, 10.1],
    status: ["CAUTION", "NOT_ADVISED", "NOT_ADVISED"],
    restrictedLength: [4, 10, 10],
  },
  {
    id: "tamil_nadu",
    name: "Tamil Nadu - East",
    coordinates: [[77.5, 8.2], [78.5, 9.5], [80.0, 11.0], [80.3, 13.0], [79.8, 13.2], [79.2, 11.0], [78.0, 9.0], [77.5, 8.2]],
    center: [79.0, 10.6],
    status: ["CLEAR", "CLEAR", "CAUTION"],
    restrictedLength: [0, 0, 4],
  },
  {
    id: "andhra_odisha",
    name: "Andhra - Odisha",
    coordinates: [[80.3, 13.2], [82.0, 15.0], [84.5, 17.5], [86.5, 19.5], [87.5, 21.0], [86.8, 21.2], [84.0, 18.5], [81.5, 15.5], [80.3, 13.2]],
    center: [84.0, 17.2],
    status: ["CLEAR", "CLEAR", "CLEAR"],
    restrictedLength: [0, 0, 0],
  },
];

function pointInPolygon(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function getZone(lat, lon) {
  return ZONES.find(zone => pointInPolygon(lon, lat, zone.coordinates)) ||
    ZONES.reduce((nearest, zone) => {
      const distance = (zone.center[0] - lon) ** 2 + (zone.center[1] - lat) ** 2;
      return distance < nearest.distance ? { zone, distance } : nearest;
    }, { zone: ZONES[0], distance: Infinity }).zone;
}

function getStatus(zone, day, boatLengthM) {
  const status = zone.status[day - 1];
  const isRestricted = boatLengthM < zone.restrictedLength[day - 1];
  return { status: isRestricted && status === "CLEAR" ? "CAUTION" : status, isRestricted };
}

function getMapLayers({ day = 1, boatLengthM = 6 } = {}) {
  const features = ZONES.map(zone => {
    const result = getStatus(zone, day, boatLengthM);
    const color = result.status === "NOT_ADVISED" ? "#ef4444" : result.status === "CAUTION" ? "#f59e0b" : "#22c55e";
    return {
      type: "Feature",
      properties: { id: zone.id, name: zone.name, day, status: result.status, isRestricted: result.isRestricted, color, boatLengthM },
      geometry: { type: "Polygon", coordinates: [zone.coordinates] },
    };
  });
  return { type: "FeatureCollection", features, metadata: { day, boatLengthM, source: "prototype-zone-advisory" } };
}

function getAdvice({ lat, lon, day = 1, boatLengthM = 6 } = {}) {
  const zone = getZone(lat, lon);
  const result = getStatus(zone, day, boatLengthM);
  return {
    zoneName: zone.name,
    day,
    boatLengthM,
    status: result.status,
    isRestricted: result.isRestricted,
    adviceText: result.status === "NOT_ADVISED"
      ? `Day ${day}: Sailing is not advised for the selected vessel in ${zone.name}.`
      : result.status === "CAUTION"
        ? `Day ${day}: Caution advised in ${zone.name}. Review current official forecasts before departure.`
        : `Day ${day}: No prototype restriction is indicated for this vessel in ${zone.name}.`,
  };
}

module.exports = { getMapLayers, getAdvice };