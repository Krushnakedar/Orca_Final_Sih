import api from './api';

export const alertService = {
  async getAlerts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.sector) params.append('sector', filters.sector);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    if (filters.feedType) params.append('feedType', filters.feedType);
    return await api.get(`/alerts?${params.toString()}`);
  },

  async broadcastAlert(payload) {
    return await api.post('/alerts/broadcast', payload);
  },

  async acknowledgeAlert(id) {
    return await api.post('/alerts/acknowledge', { id });
  },

  async unacknowledgeAlert(id) {
    return await api.post('/alerts/unacknowledge', { id });
  },

  async simulateAlert(scenario) {
    return await api.post('/alerts/simulate', { scenario });
  }
};
