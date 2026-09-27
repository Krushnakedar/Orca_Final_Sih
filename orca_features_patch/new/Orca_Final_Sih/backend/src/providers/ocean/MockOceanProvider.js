const BaseProvider = require('../base/BaseProvider');
const IOceanProvider = require('./IOceanProvider');

class MockOceanProvider extends BaseProvider {
  constructor() {
    super('Mock-INCOIS-OceanProvider', 'OCEANOGRAPHY', '1.0.0', true);
  }

  async getOceanConditions(location, datetime = new Date()) {
    try {
      const lat = parseFloat(location?.lat) || 18.9220;
      const lon = parseFloat(location?.lon) || 72.8347;

      const isKochi = lat < 12.0;

      const oceanData = {
        location: { lat, lon },
        observationTime: new Date(datetime).toISOString(),
        seaSurfaceTemperatureC: isKochi ? 28.2 : 27.6,
        chlorophyllMgM3: isKochi ? 1.38 : 0.92,
        significantWaveHeightM: isKochi ? 1.55 : 1.85,
        maxWaveHeightM: isKochi ? 2.3 : 2.7,
        wavePeriodSec: 7.4,
        waveDirectionDegrees: 250,
        waveDirectionCardinal: 'WSW',
        swellHeightM: 1.2,
        swellPeriodSec: 9.8,
        swellDirectionDegrees: 240,
        swellDirectionCardinal: 'WSW',
        swell: {
          heightM: 1.2,
          periodSec: 9.8,
          directionDegrees: 240,
          directionCardinal: 'WSW',
        },
        tide: {
          type: 'Semi-diurnal',
          currentPhase: 'Ebb Tide (Falling)',
          waterLevelMeters: 1.15,
          nextHighTide: new Date(Date.now() + 14400000).toISOString(),
          nextLowTide: new Date(Date.now() + 36000000).toISOString(),
        },
        current: {
          speedMps: 0.42,
          speedKnots: 0.82,
          directionDegrees: 175,
          directionCardinal: 'S',
        },
        salinityPsu: 35.8,
        seaStateCode: 4, // Moderate sea
        seaStateDescription: 'Moderate sea condition with scattered whitecaps'
      };

      return this.standardizeResponse(oceanData, {
        dataset: 'INCOIS High-Resolution Ocean State Forecast Model (Prototype Simulation)',
        origin: 'Indian National Centre for Ocean Information Services (INCOIS)',
        updateFrequency: 'Every 6 Hours'
      });
    } catch (err) {
      return this.handleError(err, 'getOceanConditions');
    }
  }
}

module.exports = MockOceanProvider;
