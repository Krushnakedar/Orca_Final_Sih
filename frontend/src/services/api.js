import axios from 'axios';
import { isCacheable, putCached, getCached } from './offlineCache';
import { matchPolicy } from '../offline/syncPolicy';
import { enqueue } from '../offline/outbox';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Notify the OfflineContext when we serve cached data.
// This is a custom event — the context subscribes, nothing else does.
function emitOfflineHit(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('orca:offline-hit', { detail }));
  }
}

// ── OFFLINE MUTATION QUEUE ──────────────────────────────────────────────
// If we're offline AND the mutation endpoint is listed in syncPolicy.js,
// enqueue the request and synthesize the success response the caller
// expects. Everything else falls through to the normal error handler.
api.interceptors.request.use(async (config) => {
  if (typeof navigator !== 'undefined' && navigator.onLine) return config;
  if (config._isSyncReplay) return config;

  const method = (config.method || 'get').toLowerCase();
  if (method === 'get') return config;

  const policy = matchPolicy(method, config.url);
  if (!policy) return config;

  let parsedBody = null;
  try {
    parsedBody = config.data ? JSON.parse(config.data) : null;
  } catch {
    parsedBody = config.data || null;
  }

  const action = await enqueue({
    method,
    url: config.url,
    body: parsedBody,
    headers: { ...(config.headers || {}) },
  });

  const synthesized = policy.synthesize(action.body);
  config.adapter = async () => ({
    data: synthesized,
    status: 200,
    statusText: 'OK (queued offline)',
    headers: {},
    config,
    request: {},
  });
  return config;
});

api.interceptors.response.use(
  async (response) => {
    // SUCCESS PATH — unchanged shape. Just opportunistically cache
    // whitelisted GETs so we have data if the network later drops.
    try {
      const cfg = response.config || {};
      const method = (cfg.method || 'get').toLowerCase();
      if (method === 'get' && isCacheable(cfg.url)) {
        await putCached(cfg, response.data);
      }
    } catch {
      // Never let cache-write failures break a successful response.
    }
    return response.data;
  },

  async (error) => {
    const cfg = error.config || {};
    const method = (cfg.method || 'get').toLowerCase();

    // OFFLINE FALLBACK — only for whitelisted GETs, only on network failure.
    const isNetworkFailure =
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      (!error.response && error.request);

    if (isNetworkFailure && method === 'get' && isCacheable(cfg.url)) {
      try {
        const cached = await getCached(cfg);
        if (cached) {
          emitOfflineHit({
            url: cfg.url,
            cachedAt: cached.cachedAt,
            isStale: cached.isStale,
          });
          return cached.data;
        }
      } catch {
        // fall through to normal error
      }
    }

    const customError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred',
      status: error.response?.status || 0,
      data: error.response?.data || null,
      offline: isNetworkFailure,
    };
    return Promise.reject(customError);
  },
);

export default api;