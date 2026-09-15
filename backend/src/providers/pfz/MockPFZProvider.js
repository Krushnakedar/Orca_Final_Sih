const BaseProvider = require("../base/BaseProvider");
const IPFZsProvider = require("./IPFZsProvider");

class MockPFZProvider extends BaseProvider {
  constructor() {
    super(
      "Mock-INCOIS-PFZ-AdvisoryProvider",
      "POTENTIAL_FISHING_ZONE",
      "1.0.0",
      true,
    );
  }

  async getPFZs(location, date = new Date()) {
    try {
      const lat = parseFloat(location?.lat) || 18.922;
      const lon = parseFloat(location?.lon) || 72.8347;
      const sector = location?.sectorName || (lat < 12.0 ? 'Kochi Harbor' : lat > 20.0 ? 'Porbandar' : lon > 81.0 ? 'Visakhapatnam' : lon > 78.0 ? 'Chennai Offshore' : 'Mumbai Coast');

      const validUntilDate = new Date(Date.now() + 48 * 3600000);
      const validDateStr = validUntilDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const validityWindow = `Valid until ${validDateStr} (48h active window)`;

      let rawZones = [];

      if (sector === 'Kochi Harbor' || lat < 12.0) {
        rawZones = [
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
            seaSurfaceTempC: 28.4,
            chlorophyllConcentrationMgM3: 1.62,
            thermalGradientCPerKm: 0.14,
            targetSpecies: [
              "Oil Sardine (Sardinella longiceps)",
              "Indian Mackerel",
              "Yellowfin Tuna",
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
          {
            id: "pfz_kerala_alappuzha_02",
            name: "Alappuzha Mud Bank Pelagic Front",
            centerLat: 9.55,
            centerLon: 76.15,
            distanceKm: 26.2,
            bearingDegrees: 210,
            bearingCardinal: "SSW",
            confidenceRatingPct: 85,
            recommendationLabel: "Potentially Favourable Fishing Zone",
            seaSurfaceTempC: 28.2,
            chlorophyllConcentrationMgM3: 1.85,
            thermalGradientCPerKm: 0.16,
            targetSpecies: ["Oil Sardine", "Penaeid Prawns", "Anchovies", "Sole Fish"],
            depthRangeMeters: "22 - 38m",
            validityWindow,
            validUntil: validUntilDate.toISOString(),
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [76.10, 9.60],
                  [76.20, 9.62],
                  [76.22, 9.50],
                  [76.12, 9.48],
                  [76.10, 9.60],
                ],
              ],
            },
          }
        ];
      } else if (sector === 'Chennai Offshore' || (lon > 78.0 && lat < 16.0)) {
        rawZones = [
          {
            id: "pfz_chennai_east_01",
            name: "Chennai Offshore Coromandel Front Alpha",
            centerLat: 13.12,
            centerLon: 80.48,
            distanceKm: 21.5,
            bearingDegrees: 85,
            bearingCardinal: "E",
            confidenceRatingPct: 86,
            recommendationLabel: "Potentially Favourable Fishing Zone",
            seaSurfaceTempC: 29.8,
            chlorophyllConcentrationMgM3: 1.12,
            thermalGradientCPerKm: 0.11,
            targetSpecies: ["Skipjack Tuna", "Horse Mackerel", "Barracuda", "Sardines"],
            depthRangeMeters: "32 - 50m",
            validityWindow,
            validUntil: validUntilDate.toISOString(),
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [80.42, 13.18],
                  [80.52, 13.19],
                  [80.55, 13.06],
                  [80.44, 13.05],
                  [80.42, 13.18],
                ],
              ],
            },
          }
        ];
      } else if (sector === 'Visakhapatnam' || lon > 81.0) {
        rawZones = [
          {
            id: "pfz_vizag_northeast_01",
            name: "Waltair Continental Shelf Front Alpha",
            centerLat: 17.75,
            centerLon: 83.45,
            distanceKm: 24.1,
            bearingDegrees: 110,
            bearingCardinal: "ESE",
            confidenceRatingPct: 87,
            recommendationLabel: "Potentially Favourable Fishing Zone",
            seaSurfaceTempC: 30.1,
            chlorophyllConcentrationMgM3: 1.25,
            thermalGradientCPerKm: 0.13,
            targetSpecies: ["Yellowfin Tuna", "Seer Fish", "Anchovies", "Carangids"],
            depthRangeMeters: "35 - 58m",
            validityWindow,
            validUntil: validUntilDate.toISOString(),
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [83.40, 17.80],
                  [83.52, 17.82],
                  [83.54, 17.70],
                  [83.42, 17.68],
                  [83.40, 17.80],
                ],
              ],
            },
          }
        ];
      } else {
        // Mumbai Coast / Western Shelf default
        rawZones = [
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
            seaSurfaceTempC: 28.8,
            chlorophyllConcentrationMgM3: 1.28,
            thermalGradientCPerKm: 0.11,
            targetSpecies: [
              "Indian Mackerel",
              "Carangids (Trevally)",
              "Seer Fish",
              "Ribbon Fish",
            ],
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
            confidenceRatingPct: 81,
            recommendationLabel: "Potentially Favourable Fishing Zone",
            seaSurfaceTempC: 28.5,
            chlorophyllConcentrationMgM3: 1.15,
            thermalGradientCPerKm: 0.09,
            targetSpecies: ["Yellowfin Tuna", "Ribbonfish", "Anchovies", "Croakers"],
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

      return this.standardizeResponse(
        {
          queryLocation: { lat, lon },
          queryDate: new Date(date).toISOString(),
          sector,
          zoneCount: rawZones.length,
          nearestZone: rawZones[0] || null,
          zones: rawZones,
        },
        {
          dataset:
            "INCOIS Satellite Integrated PFZ Advisory & NOAA OceanColor Composite",
          origin: "Earth Observation Satellite (Oceansat / Sentinel-3 SLSTR)",
          updateFrequency: "Daily (Composite at 06:00 IST)",
        },
      );
    } catch (err) {
      return this.handleError(err, "getPFZs");
    }
  }
}

module.exports = MockPFZProvider;
