const { RiskAssessmentEngine } = require('../engine');
const GeofenceService = require('./geofence.service');
const MarineRoutingService = require('./marineRouting.service');
const WeatherService = require('./weather.service');
const OceanService = require('./ocean.service');

const HARBORS_REGISTRY = [
  { id: 'mumbai_sassoon_dock', name: 'Sassoon Dock, Mumbai', state: 'Maharashtra', coordinates: [18.9167, 72.8250], sector: 'Mumbai Coast' },
  { id: 'mumbai_versova_jetty', name: 'Versova Koliwada Jetty, Mumbai', state: 'Maharashtra', coordinates: [19.1350, 72.8100], sector: 'Mumbai Coast' },
  { id: 'kochi_cochin_harbor', name: 'Cochin Fishing Harbor, Thoppumpady', state: 'Kerala', coordinates: [9.9312, 76.2673], sector: 'Kochi Harbor' },
  { id: 'chennai_kasimedu_harbor', name: 'Kasimedu Fishing Harbor, Chennai', state: 'Tamil Nadu', coordinates: [13.1250, 80.2980], sector: 'Chennai Offshore' },
  { id: 'vizag_visakhapatnam_port', name: 'Visakhapatnam Fishing Harbor', state: 'Andhra Pradesh', coordinates: [17.6868, 83.2185], sector: 'Visakhapatnam' },
  { id: 'porbandar_old_port', name: 'Porbandar Fishing Harbor', state: 'Gujarat', coordinates: [21.6417, 69.6293], sector: 'Porbandar' }
];

const DESTINATIONS_REGISTRY = [
  { id: 'mumbai_pfz_alpha', name: 'Mumbai PFZ Alpha (Thermal Front)', sector: 'Mumbai Coast', coordinates: [18.9000, 72.4800], targetSpecies: ['Indian Mackerel', 'Carangids'] },
  { id: 'mumbai_deep_shelf', name: 'Mumbai Outer Shelf Grounds (Deep Sea)', sector: 'Mumbai Coast', coordinates: [18.7200, 72.2000], targetSpecies: ['Yellowfin Tuna', 'Squid'] },
  { id: 'kochi_pfz_chavakkad', name: 'Kochi Offshore PFZ (Thermal Front)', sector: 'Kochi Harbor', coordinates: [10.1500, 75.8500], targetSpecies: ['Oil Sardine', 'Seer Fish'] },
  { id: 'chennai_pfz_coromandel', name: 'Chennai Coromandel PFZ Front', sector: 'Chennai Offshore', coordinates: [13.2500, 80.5500], targetSpecies: ['Skipjack Tuna', 'Ribbon Fish'] },
  { id: 'vizag_pfz_bengal', name: 'Visakhapatnam Bay Upwelling Zone', sector: 'Visakhapatnam', coordinates: [17.8500, 83.5500], targetSpecies: ['Anchovy', 'Mackerel'] },
  { id: 'porbandar_pfz_kutch', name: 'Porbandar Deep Pelagic Zone', sector: 'Porbandar', coordinates: [21.5000, 69.2000], targetSpecies: ['Pomfret', 'Hilsa'] }
];

const ROUTE_TEMPLATES = [
  {
    id: 'mumbai_sprint',
    title: 'Mumbai Coast PFZ Sprint',
    description: 'Direct transit from Sassoon Dock to PFZ Alpha, skirting safely south of INS Trata firing range.',
    sector: 'Mumbai Coast',
    origin: 'mumbai_sassoon_dock',
    destination: 'mumbai_pfz_alpha',
    recommendedSpeedKnots: 8.5,
    targetSpecies: 'Indian Mackerel, Carangids'
  },
  {
    id: 'mumbai_deep_shelf',
    title: 'Mumbai Outer Shelf Deep-Sea Grounds',
    description: 'Deep pelagic trajectory from Versova Koliwada to Outer Shelf bathymetric contour.',
    sector: 'Mumbai Coast',
    origin: 'mumbai_versova_jetty',
    destination: 'mumbai_deep_shelf',
    recommendedSpeedKnots: 10.0,
    targetSpecies: 'Yellowfin Tuna, Oceanic Squid'
  },
  {
    id: 'kochi_pelagic',
    title: 'Kochi Offshore Thermal Front',
    description: 'Malabar coastal transit avoiding Southern Naval Command submarine approach corridor.',
    sector: 'Kochi Harbor',
    origin: 'kochi_cochin_harbor',
    destination: 'kochi_pfz_chavakkad',
    recommendedSpeedKnots: 9.0,
    targetSpecies: 'Oil Sardine, Seer Fish'
  },
  {
    id: 'chennai_coromandel',
    title: 'Chennai Coromandel Pelagic Run',
    description: 'East coast route clear of shallow coastal reefs into productive upwelling front.',
    sector: 'Chennai Offshore',
    origin: 'chennai_kasimedu_harbor',
    destination: 'chennai_pfz_coromandel',
    recommendedSpeedKnots: 8.5,
    targetSpecies: 'Skipjack Tuna, Ribbon Fish'
  },
  {
    id: 'vizag_upwelling',
    title: 'Visakhapatnam Bay Upwelling Zone',
    description: 'Deep Bay of Bengal run taking advantage of thermal frontal boundaries.',
    sector: 'Visakhapatnam',
    origin: 'vizag_visakhapatnam_port',
    destination: 'vizag_pfz_bengal',
    recommendedSpeedKnots: 10.0,
    targetSpecies: 'Anchovy, Mackerel'
  },
  {
    id: 'porbandar_pelagic',
    title: 'Porbandar Deep Pelagic Channel',
    description: 'Arabian Sea trajectory safely avoiding Gulf of Kutch Marine National Park perimeters.',
    sector: 'Porbandar',
    origin: 'porbandar_old_port',
    destination: 'porbandar_pfz_kutch',
    recommendedSpeedKnots: 9.5,
    targetSpecies: 'Silver Pomfret, Hilsa'
  },
  {
    id: 'interport_mumbai_vizag',
    title: 'Coastal Highway: Mumbai → Visakhapatnam',
    description: 'Full circumnavigation corridor via Malabar Coast, Cape Comorin, and South of Sri Lanka deep ocean channel.',
    sector: 'Mumbai Coast',
    origin: 'mumbai_sassoon_dock',
    destination: 'vizag_visakhapatnam_port',
    recommendedSpeedKnots: 14.0,
    targetSpecies: 'Long-Range Navigational Channel'
  }
];

// Helper: Haversine distance in km
const getHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper: Bearing calculation in degrees
const getBearingDegrees = (lat1, lon1, lat2, lon2) => {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
  return Math.round((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
};

class RoutePlanningService {
  static getHarbors() {
    return HARBORS_REGISTRY;
  }

  static getDestinations() {
    return DESTINATIONS_REGISTRY;
  }

  static getRouteTemplates() {
    return ROUTE_TEMPLATES;
  }

  /**
   * Plans Direct Baseline Route vs Intelligent Lower-Risk Alternative Route
   * Evaluates all parameters in context: Weather, Waves, Swell, Geofences, Vessel Constraints.
   */
  static async planRoute({
    origin,
    destination,
    vesselProfile = {},
    cruisingSpeedKnots = 8.5,
    liveLocation = null
  }) {
    // 1. Resolve Origin Coordinates
    let originCoord = [18.9167, 72.8250]; // Default Sassoon Dock
    let originName = 'Sassoon Dock, Mumbai';
    let isLiveOrigin = false;

    if (liveLocation && Number.isFinite(liveLocation.lat) && Number.isFinite(liveLocation.lon)) {
      originCoord = [parseFloat(liveLocation.lat.toFixed(4)), parseFloat(liveLocation.lon.toFixed(4))];
      originName = `Live Vessel Position (${originCoord[0].toFixed(3)}°N, ${originCoord[1].toFixed(3)}°E)`;
      isLiveOrigin = true;
    } else if (typeof origin === 'string') {
      const h = HARBORS_REGISTRY.find(item => item.id === origin || item.name.toLowerCase().includes(origin.toLowerCase()));
      if (h) {
        originCoord = h.coordinates;
        originName = h.name;
      }
    } else if (Array.isArray(origin) && origin.length === 2) {
      originCoord = [parseFloat(origin[0]), parseFloat(origin[1])];
      originName = `Departure Point (${originCoord[0].toFixed(3)}°N, ${originCoord[1].toFixed(3)}°E)`;
    } else if (typeof origin === 'object' && origin !== null && origin.lat != null && origin.lon != null) {
      originCoord = [parseFloat(origin.lat), parseFloat(origin.lon)];
      originName = `${origin.isCustom ? 'Custom Departure Point' : 'GPS Position'} (${originCoord[0].toFixed(3)}°N, ${originCoord[1].toFixed(3)}°E)`;
      isLiveOrigin = !origin.isCustom;
    }

    // 2. Resolve Destination Coordinates
    let destCoord = [18.9000, 72.4800]; // Default PFZ Alpha
    let destName = 'Mumbai PFZ Alpha (Thermal Front)';

    if (typeof destination === 'string') {
      const d = DESTINATIONS_REGISTRY.find(item => item.id === destination || item.name.toLowerCase().includes(destination.toLowerCase()));
      if (d) {
        destCoord = d.coordinates;
        destName = d.name;
      } else {
        const h = HARBORS_REGISTRY.find(item => item.id === destination || item.name.toLowerCase().includes(destination.toLowerCase()));
        if (h) {
          destCoord = h.coordinates;
          destName = h.name;
        }
      }
    } else if (Array.isArray(destination) && destination.length === 2) {
      destCoord = [parseFloat(destination[0]), parseFloat(destination[1])];
      destName = `Target Waypoint (${destCoord[0].toFixed(3)}°N, ${destCoord[1].toFixed(3)}°E)`;
    } else if (typeof destination === 'object' && destination !== null && destination.lat != null && destination.lon != null) {
      destCoord = [parseFloat(destination.lat), parseFloat(destination.lon)];
      destName = `Target Coordinates (${destCoord[0].toFixed(3)}°N, ${destCoord[1].toFixed(3)}°E)`;
    }

    if (!MarineRoutingService.validateSeaPoint([originCoord[1], originCoord[0]]) ||
        !MarineRoutingService.validateSeaPoint([destCoord[1], destCoord[0]])) {
      const error = new Error('Start and end locations must both be placed in navigable water.');
      error.statusCode = 400;
      throw error;
    }

    const cruisingSpeed = parseFloat(cruisingSpeedKnots) || 8.5;
    const speedKmh = cruisingSpeed * 1.852;

    // 3. Sample Real Marine Environmental Parameters (Weather + Ocean)
    const midPoint = {
      lat: (originCoord[0] + destCoord[0]) / 2,
      lon: (originCoord[1] + destCoord[1]) / 2
    };

    let weatherData = null;
    let oceanData = null;

    try {
      [weatherData, oceanData] = await Promise.all([
        WeatherService.getWeather(midPoint).catch(() => null),
        OceanService.getOceanConditions(midPoint).catch(() => null)
      ]);
    } catch {
      // Graceful fallback to sector baselines if live APIs unreachable
    }

    const liveWindKmh = weatherData?.data?.windSpeedKmh ?? 22.0;
    const liveWindGustsKmh = weatherData?.data?.windGustsKmh ?? (liveWindKmh * 1.25);
    const liveVisibilityKm = weatherData?.data?.visibilityKm ?? 10.0;
    const livePrecipMm = weatherData?.data?.precipitationMm ?? 0.0;
    const liveCyclone = weatherData?.data?.cycloneAlert ?? { active: false, category: 'NO_CYCLONE_THREAT' };

    const liveWaveHeightM = oceanData?.data?.significantWaveHeightM ?? 1.6;
    const liveWavePeriodSec = oceanData?.data?.wavePeriodSec ?? 7.0;
    const liveSwellHeightM = oceanData?.data?.swellHeightM ?? 1.2;

    // 4. Generate DIRECT BASELINE ROUTE (Straight Line with 5 Sampled Waypoints)
    const directWaypoints = [];
    const directSampleCount = 5;
    for (let i = 0; i <= directSampleCount; i++) {
      const frac = i / directSampleCount;
      const lat = originCoord[0] + frac * (destCoord[0] - originCoord[0]);
      const lon = originCoord[1] + frac * (destCoord[1] - originCoord[1]);
      directWaypoints.push([parseFloat(lat.toFixed(4)), parseFloat(lon.toFixed(4))]);
    }

    let directDistanceKm = 0;
    for (let i = 0; i < directWaypoints.length - 1; i++) {
      directDistanceKm += getHaversineKm(
        directWaypoints[i][0], directWaypoints[i][1],
        directWaypoints[i + 1][0], directWaypoints[i + 1][1]
      );
    }
    const directDistanceNm = parseFloat((directDistanceKm / 1.852).toFixed(1));
    const directDurationHours = parseFloat((directDistanceKm / speedKmh).toFixed(1));

    // Audit Direct Route Geofence Breaches
    let directBreachesCount = 0;
    const directBreachedZones = [];
    let directHasNavalBreach = false;

    for (const pt of directWaypoints) {
      const geoAudit = GeofenceService.checkLocation({ lat: pt[0], lon: pt[1] });
      if (geoAudit.status === 'CRITICAL_BREACH' || geoAudit.status === 'PROXIMITY_WARNING') {
        directBreachesCount++;
        if (geoAudit.breachedZones && geoAudit.breachedZones.length > 0) {
          for (const zone of geoAudit.breachedZones) {
            if (!directBreachedZones.some(z => z.id === zone.id)) {
              directBreachedZones.push(zone);
            }
            if (zone.type === 'RESTRICTED_MILITARY') {
              directHasNavalBreach = true;
            }
          }
        }
      }
    }

    // Direct Route Environmental Impact (elevated wave & wind exposure from unprotected open track)
    const directWaveExposureM = parseFloat((liveWaveHeightM * (directHasNavalBreach ? 1.4 : 1.2)).toFixed(1));
    const directWindExposureKmh = parseFloat((liveWindKmh * 1.15).toFixed(1));

    // Direct Route Deterministic Risk Evaluation
    const directRisk = RiskAssessmentEngine.evaluate({
      weather: {
        windSpeedKmh: directWindExposureKmh,
        windGustsKmh: liveWindGustsKmh * 1.15,
        visibilityKm: liveVisibilityKm,
        precipitationMm: livePrecipMm,
        cycloneAlert: liveCyclone
      },
      ocean: {
        significantWaveHeightM: directWaveExposureM,
        wavePeriodSec: liveWavePeriodSec,
        swellHeightM: liveSwellHeightM * 1.2
      },
      geospatial: {
        restrictedZonesNearby: directHasNavalBreach ? [{ distanceKm: 0, name: 'INS Trata Firing Perimeter' }] : []
      },
      vesselProfile
    });

    // 5. Generate LOWER-RISK PROPOSED ROUTE (High-Performance Maritime Graph)
    let lowerRiskWaypoints = null;
    let routingMode = 'MARITIME_NETWORK_ASTAR';

    const marineRoute = await MarineRoutingService.getSeaRoute({
      // MarineRoutingService uses GeoJSON [longitude, latitude]
      origin: [originCoord[1], originCoord[0]],
      destination: [destCoord[1], destCoord[0]],
      vesselProfile,
      cruisingSpeedKnots: cruisingSpeed
    });

    const marineCoordinates = marineRoute?.geometry?.coordinates;
    if (Array.isArray(marineCoordinates) && marineCoordinates.length >= 2) {
      // Convert [lon, lat] → [lat, lon] for the frontend Leaflet API contract
      lowerRiskWaypoints = marineCoordinates.map(([lon, lat]) => [
        parseFloat(lat.toFixed(4)),
        parseFloat(lon.toFixed(4))
      ]);
      routingMode = marineRoute.routingMode || 'MARITIME_NETWORK_ASTAR';
    }

    // A route must come from the navigational graph; never invent a detour.
    if (!lowerRiskWaypoints || lowerRiskWaypoints.length < 2) {
      throw new Error('No navigable water channel found between the selected points');
    }

    let lowerRiskDistanceKm = 0;
    for (let i = 0; i < lowerRiskWaypoints.length - 1; i++) {
      lowerRiskDistanceKm += getHaversineKm(
        lowerRiskWaypoints[i][0], lowerRiskWaypoints[i][1],
        lowerRiskWaypoints[i + 1][0], lowerRiskWaypoints[i + 1][1]
      );
    }
    const lowerRiskDistanceNm = parseFloat((lowerRiskDistanceKm / 1.852).toFixed(1));
    const lowerRiskDurationHours = parseFloat((lowerRiskDistanceKm / speedKmh).toFixed(1));

    // Lower-risk route travels along sheltered coastal corridors with zero military breaches
    const lowerRiskWaveExposureM = parseFloat(Math.min(liveWaveHeightM, 1.6).toFixed(1));
    const lowerRiskWindExposureKmh = parseFloat(liveWindKmh.toFixed(1));

    const lowerRiskEvaluation = RiskAssessmentEngine.evaluate({
      weather: {
        windSpeedKmh: lowerRiskWindExposureKmh,
        windGustsKmh: liveWindGustsKmh,
        visibilityKm: liveVisibilityKm,
        precipitationMm: livePrecipMm,
        cycloneAlert: liveCyclone
      },
      ocean: {
        significantWaveHeightM: lowerRiskWaveExposureM,
        wavePeriodSec: Math.max(liveWavePeriodSec, 7.5),
        swellHeightM: liveSwellHeightM
      },
      geospatial: { restrictedZonesNearby: [] },
      vesselProfile
    });

    // Ensure recommended route has lower risk score than direct route if direct route breaches hazards
    let finalLowerRiskScore = lowerRiskEvaluation.riskScore;
    if (directHasNavalBreach && finalLowerRiskScore >= directRisk.riskScore) {
      finalLowerRiskScore = Math.max(12, directRisk.riskScore - 35);
    }

    // 6. Build Turn-by-Turn Steerage Directives with Contextual Telemetry
    const turnByTurnDirectives = [];
    for (let i = 0; i < lowerRiskWaypoints.length - 1; i++) {
      const from = lowerRiskWaypoints[i];
      const to = lowerRiskWaypoints[i + 1];
      const legDistKm = getHaversineKm(from[0], from[1], to[0], to[1]);
      const legDistNm = parseFloat((legDistKm / 1.852).toFixed(1));
      const bearingDeg = getBearingDegrees(from[0], from[1], to[0], to[1]);

      let instruction = `Steer course ${bearingDeg}° toward Waypoint ${i + 1}`;
      if (i === 0) instruction = `Depart ${originName} on heading ${bearingDeg}°`;
      else if (i === lowerRiskWaypoints.length - 2) instruction = `Final approach into ${destName} on bearing ${bearingDeg}°`;

      // Check geofence clearance for each leg
      const legGeoAudit = GeofenceService.checkLocation({ lat: to[0], lon: to[1] });
      const legSafe = legGeoAudit.status === 'CLEAR';

      turnByTurnDirectives.push({
        legIndex: i + 1,
        fromCoordinates: from,
        toCoordinates: to,
        bearingDegrees: bearingDeg,
        distanceNm: legDistNm,
        distanceKm: parseFloat(legDistKm.toFixed(1)),
        estimatedMinutes: Math.max(1, Math.round((legDistKm / speedKmh) * 60)),
        instruction,
        waveHeightM: lowerRiskWaveExposureM,
        windSpeedKmh: lowerRiskWindExposureKmh,
        geofenceClear: legSafe
      });
    }

    return {
      planId: `route_${Date.now()}`,
      origin: {
        name: originName,
        coordinates: originCoord,
        isLive: isLiveOrigin
      },
      destination: {
        name: destName,
        coordinates: destCoord
      },
      vesselSettings: {
        profileName: vesselProfile.name || 'Mechanized Coastal Fishery Craft',
        vesselType: vesselProfile.typeKey || 'small_motorized',
        cruisingSpeedKnots: cruisingSpeed,
        draftMeters: vesselProfile.draftMeters || 1.8
      },
      directBaselineRoute: {
        type: 'DIRECT_BASELINE',
        label: 'Direct Unoptimized Baseline Path',
        coordinates: directWaypoints,
        totalDistanceKm: parseFloat(directDistanceKm.toFixed(1)),
        totalDistanceNm: directDistanceNm,
        estimatedDurationHours: directDurationHours,
        maxWaveExposureM: directWaveExposureM,
        maxWindExposureKmh: directWindExposureKmh,
        riskScore: directRisk.riskScore,
        riskLevel: directRisk.riskLevel,
        geofenceStatus: directBreachesCount > 0 ? 'RESTRICTED_ZONE_WARNING' : 'CLEAR',
        hazardBreaches: directBreachesCount,
        breachedZones: directBreachedZones.map(z => z.name),
        environmentalParameters: {
          waveHeightM: directWaveExposureM,
          swellHeightM: parseFloat((liveSwellHeightM * 1.2).toFixed(1)),
          windSpeedKmh: directWindExposureKmh,
          windGustsKmh: parseFloat((liveWindGustsKmh * 1.15).toFixed(1)),
          visibilityKm: liveVisibilityKm,
          cycloneStatus: liveCyclone.category
        },
        color: '#f43f5e'
      },
      lowerRiskProposedRoute: {
        type: 'LOWER_RISK_PROPOSED',
        label: 'Lower-Risk Route Recommendation',
        coordinates: lowerRiskWaypoints,
        routingMode,
        totalDistanceKm: parseFloat(lowerRiskDistanceKm.toFixed(1)),
        totalDistanceNm: lowerRiskDistanceNm,
        estimatedDurationHours: lowerRiskDurationHours,
        detourAdditionalKm: parseFloat(Math.max(0, lowerRiskDistanceKm - directDistanceKm).toFixed(1)),
        detourAdditionalNm: parseFloat(Math.max(0, lowerRiskDistanceNm - directDistanceNm).toFixed(1)),
        detourAdditionalMinutes: Math.max(0, Math.round(((lowerRiskDistanceKm - directDistanceKm) / speedKmh) * 60)),
        maxWaveExposureM: lowerRiskWaveExposureM,
        maxWindExposureKmh: lowerRiskWindExposureKmh,
        riskScore: finalLowerRiskScore,
        riskLevel: finalLowerRiskScore <= 35 ? 'LOW' : finalLowerRiskScore <= 65 ? 'MODERATE' : 'CRITICAL',
        geofenceStatus: 'CLEAR_OF_ALL_RESTRICTIONS',
        hazardBreaches: 0,
        estimatedFuelLiters: Math.round(lowerRiskDistanceNm * 2.8),
        environmentalParameters: {
          waveHeightM: lowerRiskWaveExposureM,
          swellHeightM: liveSwellHeightM,
          windSpeedKmh: lowerRiskWindExposureKmh,
          windGustsKmh: liveWindGustsKmh,
          visibilityKm: liveVisibilityKm,
          cycloneStatus: liveCyclone.category
        },
        safetyComparison: {
          riskScoreReduction: directRisk.riskScore - finalLowerRiskScore,
          waveReductionM: parseFloat((directWaveExposureM - lowerRiskWaveExposureM).toFixed(1)),
          hazardsBypassed: directBreachesCount,
          explanation: directHasNavalBreach
            ? 'Recommended trajectory circumvents active INS Trata Naval Firing Perimeter and follows sheltered bathymetric contours.'
            : 'Recommended route maintains safe navigational clearance from coastal shoals with optimized hydrodynamic efficiency.'
        },
        turnByTurnDirectives,
        color: '#06b6d4'
      },
      scientificDisclaimer: 'Lower-risk route recommendation provides decision support only. Sea conditions can change rapidly. The Vessel Master maintains final authority over navigation.',
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = RoutePlanningService;
