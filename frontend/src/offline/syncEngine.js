import api from '../services/api';
import { matchPolicy, SYNC_TAG } from './syncPolicy';
import {
  listAll,
  markSyncing,
  markDone,
  markFailed,
} from './outbox';
import { IDEMPOTENCY_HEADER } from './idempotency';

/**
 * Drains the outbox. Safe to call many times in parallel — the internal
 * `running` flag serializes execution.
 *
 * Retry semantics:
 *   - On 4xx other than 401/408/429 → fail permanently (mark 'failed').
 *   - On 401 → pause entire drain; caller must re-login.
 *   - On 5xx / network / timeout → backoff and retry up to maxAttempts.
 *   - On success → delete from queue.
 */
let running = false;
const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(event) {
  for (const fn of listeners) {
    try { fn(event); } catch { /* swallow listener errors */ }
  }
}

function backoffFor(policy, attempts) {
  const list = policy.backoffMs || [60_000];
  return list[Math.min(attempts - 1, list.length - 1)];
}

export async function drain({ force = false } = {}) {
  if (running) return { skipped: true };
  if (!navigator.onLine) return { skipped: true, reason: 'offline' };
  running = true;
  const results = [];

  try {
    const actions = await listAll();
    // Sort: pending first, then failed; within each, oldest first.
    actions.sort((a, b) => a.createdAt - b.createdAt);

    for (const action of actions) {
      if (action.status === 'done' || action.status === 'syncing') continue;
      const policy = matchPolicy(action.method, action.url);
      if (!policy) continue;
      if (!force && action.nextAttemptAt && action.nextAttemptAt > Date.now()) {
        continue;
      }

      await markSyncing(action.id);
      emit({ type: 'syncing', action });

      try {
        const headers = { ...action.headers };
        headers[IDEMPOTENCY_HEADER] = action.idempotencyKey;

        const response = await api.request({
          method: action.method,
          url: action.url,
          data: action.body,
          headers,
          // Skip the offline-fallback branch inside api.js — we're
          // explicitly draining, we want the real network call.
          _isSyncReplay: true,
        });

        await markDone(action.id, response);
        results.push({ id: action.id, ok: true });
        emit({ type: 'synced', action });
      } catch (err) {
        const status = err?.status || 0;

        if (status === 401) {
          // Auth expired. Pause the queue; caller must re-login.
          await markFailed(
            action.id,
            'AUTH_REQUIRED',
            Number.MAX_SAFE_INTEGER,
          );
          emit({ type: 'auth-required', action });
          break;
        }

        if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
          // Permanent client error (validation, not-found, etc.).
          await markFailed(action.id, err.message || `HTTP ${status}`, Number.MAX_SAFE_INTEGER);
          emit({ type: 'failed', action, error: err });
          results.push({ id: action.id, ok: false, permanent: true });
          continue;
        }

        // Transient — schedule a retry.
        const policy2 = matchPolicy(action.method, action.url) || policy;
        const attemptCount = (action.attempts || 0) + 1;
        const willGiveUp = attemptCount >= (policy2.maxAttempts || 8);
        const backoff = willGiveUp ? Number.MAX_SAFE_INTEGER : backoffFor(policy2, attemptCount);
        await markFailed(action.id, err.message || 'network', backoff);
        emit({ type: willGiveUp ? 'failed' : 'retry-scheduled', action, error: err });
        results.push({ id: action.id, ok: false, retry: !willGiveUp });
      }
    }
  } finally {
    running = false;
    emit({ type: 'drain-complete', results });
  }

  return { results };
}

/**
 * Register Background Sync if supported. Falls back silently.
 * The page-side triggers (online / visibilitychange / boot) are the
 * primary path; this is a Chromium-only enhancement.
 */
export async function registerBackgroundSync() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.sync) return false;
    await reg.sync.register(SYNC_TAG);
    return true;
  } catch {
    return false;
  }
}

/**
 * Attach global triggers. Idempotent — safe to call multiple times.
 */
let triggersAttached = false;
export function attachTriggers() {
  if (triggersAttached || typeof window === 'undefined') return;
  triggersAttached = true;

  const tryDrain = () => { drain().catch(() => {}); };

  window.addEventListener('online', () => {
    tryDrain();
    registerBackgroundSync();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tryDrain();
  });

  // Initial drain on boot if we're online.
  if (navigator.onLine) {
    tryDrain();
    registerBackgroundSync();
  }
}