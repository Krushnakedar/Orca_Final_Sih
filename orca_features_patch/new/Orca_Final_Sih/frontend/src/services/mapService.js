import api from './api';

export async function fetchMapLayers(params = {}) {
  const { data } = await api.get('/map/layers', { params });
  return data;
}

export async function fetchOceanField(params = {}) {
  const { data } = await api.get('/map/ocean-field', { params });
  return data;
}

export async function fetchMhwLayer(params = {}) {
  const { data } = await api.get('/map/mhw', { params });
  return data;
}

export async function fetchSvasLayer(params = {}) {
  const { data } = await api.get('/map/svas', { params });
  return data;
}

export default {
  fetchMapLayers,
  fetchOceanField,
  fetchMhwLayer,
  fetchSvasLayer,
};
