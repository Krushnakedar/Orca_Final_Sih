const BaseProvider = require("../base/BaseProvider");
const config = require("../../config");
const MockPFZProvider = require("./MockPFZProvider");

class RealPFZProvider extends BaseProvider {
  constructor() {
    super("ORCA-PFZ-LiveProvider", "POTENTIAL_FISHING_ZONE", "1.0.0", false);
    this.mockProvider = new MockPFZProvider();
  }

  async getPFZs(location, date = new Date()) {
    const lat = parseFloat(location?.lat) || 18.922;
    const lon = parseFloat(location?.lon) || 72.8347;

    try {
      const sst = await this._fetchLiveSST(lat, lon);
      const zones = this._buildZones(lat, lon, sst);

      return this.standardizeResponse(
        {
          queryLocation: { lat, lon },
          queryDate: new Date(date).toISOString(),
          zoneCount: zones.length,
          nearestZone: zones[0] || null,
          zones,
          source: {
            mode: "live",
            provider: "Open-Meteo Marine / ORCA PFZ Engine",
            isDemoData: false,
            isFallback: false,
            sstMode: "live",
            chlorophyllMode: "baseline_estimate",
            thermalGradientMode: "demo",
          },
        },
        {
          dataset: "Open-Meteo Marine SST + ORCA PFZ Template Composite",
          origin: "ECMWF WAM / NEMO Live Model (SST only)",
          updateFrequency: "Hourly SST / Static Zone Templates",
        },
      );
    } catch (err) {
      console.warn(
        "[RealPFZProvider] Live fetch failed, falling back to mock:",
        err.message,
      );

      if (!config.pfz.fallbackEnabled) {
        throw err;
      }

      const fallback = await this.mockProvider.getPFZs(location, date);
      if (fallback && fallback.source) {
        fallback.source.mode = "fallback";
        fallback.source.isFallback = true;
        fallback.source.isDemoData = true;
      }
      return fallback;
    }
  }

  async _fetchLiveSST(lat, lon) {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=sea_surface_temperature`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(config.pfz.timeoutMs),
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const sst = data?.current?.sea_surface_temperature;

    if (typeof sst !== "number" || sst < 10 || sst > 35) {
      throw new Error(`Invalid SST value: ${sst}`);
    }

    return sst;
  }

  _buildZones(lat, lon, liveSst) {
    const isKochi = lat < 12.0;
    const baselineChlorophyll = isKochi ? 1.62 : 1.25;
    const validUntilDate = new Date(Date.now() + 48 * 3600000);
    const validDateStr = validUntilDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const validityWindow = `Valid until ${validDateStr} (48h active window)`;

    if (isKochi) {
      return [
        {
          id: "pfz_kerala_south_01",
          name: "Kochi Offshore Upwelling Zone Charlie",
          centerLat: 9.96,
          centerLon: 76.04,
          distanceKm: 18.4,
          bearingDegrees: 275,
          bearingCardinal: "W",
          confidenceRatingPct: 88,
          recommendationLabel: "Potentially Favourable Fishing Zone",
          seaSurfaceTempC: liveSst,
          chlorophyllConcentrationMgM3: baselineChlorophyll,
          thermalGradientCPerKm: 0.12,
          targetSpecies: [
            "Oil Sardine (Sardinella longiceps)",
            "Indian Mackerel",
            "Squid (Loligo duvauceli)",
          ],
          depthRangeMeters: "30 - 48m",
          validityWindow,
          validUntil: validUntilDate.toISOString(),
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [75.98, 9.98],
                [76.08, 10.02],
                [76.12, 9.92],
                [76.01, 9.88],
                [75.98, 9.98],
              ],
            ],
          },
        },
      ];
    }

    return [
      {
        id: "pfz_mumbai_west_01",
        name: "Mumbai High Thermal Gradient Alpha",
        centerLat: 18.91,
        centerLon: 72.64,
        distanceKm: 16.2,
        bearingDegrees: 265,
        bearingCardinal: "W",
        confidenceRatingPct: 86,
        recommendationLabel: "Potentially Favourable Fishing Zone",
        seaSurfaceTempC: liveSst,
        chlorophyllConcentrationMgM3: baselineChlorophyll,
        thermalGradientCPerKm: 0.09,
        targetSpecies: ["Indian Mackerel", "Carangids (Trevally)", "Seer Fish"],
        depthRangeMeters: "35 - 52m",
        validityWindow,
        validUntil: validUntilDate.toISOString(),
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [72.58, 18.95],
              [72.69, 18.98],
              [72.72, 18.89],
              [72.61, 18.85],
              [72.58, 18.95],
            ],
          ],
        },
      },
      {
        id: "pfz_alibaug_deeps_02",
        name: "Alibaug Continental Slope Zone Bravo",
        centerLat: 18.69,
        centerLon: 72.57,
        distanceKm: 23.8,
        bearingDegrees: 220,
        bearingCardinal: "SW",
        confidenceRatingPct: 79,
        recommendationLabel: "Potentially Favourable Fishing Zone",
        seaSurfaceTempC: liveSst,
        chlorophyllConcentrationMgM3: baselineChlorophyll,
        thermalGradientCPerKm: 0.08,
        targetSpecies: ["Yellowfin Tuna", "Ribbonfish", "Anchovies"],
        depthRangeMeters: "45 - 65m",
        validityWindow,
        validUntil: validUntilDate.toISOString(),
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [72.5, 18.72],
              [72.62, 18.76],
              [72.65, 18.66],
              [72.52, 18.62],
              [72.5, 18.72],
            ],
          ],
        },
      },
    ];
  }
}

module.exports = RealPFZProvider;
