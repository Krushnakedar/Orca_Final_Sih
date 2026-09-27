import api from './api';

export const mapService = {
  async getLayers(sector = 'all') {
    return await api.get(`/map/layers?sector=${encodeURIComponent(sector)}`);
  },
  async getOceanField(params) {
    return await api.get('/map/ocean-field', { params });
  },
  async getSvasLayer(params) {
    return await api.get('/map/svas', { params });
  }
};
