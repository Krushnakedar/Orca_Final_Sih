const { activeAdvisoryProvider } = require('../providers/advisory');
const svasService = require('./svas.service');

class AdvisoryService {
  constructor(provider = activeAdvisoryProvider) {
    this.provider = provider;
  }

  async getAdvisories(location, options = {}) {
    const result = await this.provider.getAdvisories(location);
    try {
      const lat = location?.lat;
      const lon = location?.lon;
      if (lat != null && lon != null) {
        const svas = svasService.getAdvice({
          lat,
          lon,
          boatLengthM: options.boatLengthM || location?.boatLengthM || 6,
          day: options.day || 1,
        });
        if (result && result.data) {
          result.data.svas = svas;
        } else if (result) {
          result.svas = svas;
        }
      }
    } catch (err) {
      console.warn('[AdvisoryService] SVAS attach failed:', err.message);
    }
    return result;
  }

  getSvasAdvice(location, options = {}) {
    return svasService.getAdvice({
      lat: location?.lat,
      lon: location?.lon,
      boatLengthM: options.boatLengthM || 6,
      day: options.day || 1,
    });
  }

  getSvasMapLayers(options = {}) {
    return svasService.getMapLayers(options);
  }
}

module.exports = new AdvisoryService();
