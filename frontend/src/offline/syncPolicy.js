/**
 * The single source of truth for what ORCA queues offline.
 *
 * RULE: an endpoint is queueable ONLY IF all of these are true:
 *   1. It is a mutation (POST/PUT/PATCH/DELETE).
 *   2. Replaying it later produces the same end state (idempotent or
 *      naturally safe to retry).
 *   3. It does not fire an LLM call, a payment, a login, or an admin action.
 *   4. Its response can be meaningfully synthesized for the caller while
 *      offline (we return an optimistic success shape).
 *
 * If any rule fails, the mutation is treated as ONLINE-ONLY and the existing
 * api.js behaviour (reject with { offline: true }) is preserved unchanged.
 */

export const LOGOUT_POLICY = 'discard'; // 'discard' | 'flush' | 'retain'

export const SYNC_TAG = 'orca-outbox-sync';

const QUEUEABLE = [
  {
    // Natural idempotency: acknowledging an already-acknowledged alert
    // is a no-op on the server. Safe to replay. The server returns
    // { success: true, data: alert, message: 'Alert acknowledged' }
    // so we synthesize the same shape optimistically.
    method: 'post',
    path: /^\/alerts\/acknowledge\/?$/,
    synthesize: (body) => ({
      success: true,
      data: { id: body?.id, status: 'ACKNOWLEDGED', _queuedOffline: true },
      message: 'Alert acknowledged (queued — will sync when online)',
    }),
    maxAttempts: 8,
    // Backoff schedule in milliseconds; last entry is used for all
    // subsequent retries until maxAttempts is exhausted.
    backoffMs: [5_000, 15_000, 60_000, 300_000, 900_000, 1_800_000],
  },
];

export function matchPolicy(method, url) {
  if (!method || !url) return null;
  const m = String(method).toLowerCase();
  // Strip baseURL prefix if present; policies match the path portion only.
  const path = url.replace(/^\/api/, '') || url;
  for (const p of QUEUEABLE) {
    if (p.method === m && p.path.test(path)) return p;
  }
  return null;
}

export function isQueueable(method, url) {
  return matchPolicy(method, url) !== null;
}