import {
  addAction,
  updateAction,
  getAction,
  listActions,
  listByStatus,
  deleteAction,
  clearAll as dbClearAll,
} from './syncDb';
import { newIdempotencyKey } from './idempotency';
import { matchPolicy } from './syncPolicy';

const MAX_QUEUE = 200; // safety cap; drop oldest if exceeded

/**
 * Enqueue a mutation that failed offline.
 * Returns the persisted action object (with id, status, attempts, etc.).
 */
export async function enqueue({ method, url, body, headers = {} }) {
  const policy = matchPolicy(method, url);
  if (!policy) throw new Error('Endpoint is not queueable');

  const all = await listActions();
  if (all.length >= MAX_QUEUE) {
    // Drop the oldest failed or pending item so the queue never grows
    // unbounded on a device left offline for weeks.
    const victim = all.find((a) => a.status !== 'syncing') || all[0];
    if (victim) await deleteAction(victim.id);
  }

  const now = Date.now();
  const action = {
    id: `act_${now}_${Math.random().toString(36).slice(2, 8)}`,
    method: String(method).toLowerCase(),
    url,
    body,
    headers,
    idempotencyKey: newIdempotencyKey(),
    createdAt: now,
    updatedAt: now,
    status: 'pending', // pending | syncing | failed | done
    attempts: 0,
    lastError: null,
    nextAttemptAt: 0,
  };

  await addAction(action);
  return action;
}

export async function markSyncing(id) {
  const a = await getAction(id);
  if (!a) return null;
  a.status = 'syncing';
  a.attempts += 1;
  a.updatedAt = Date.now();
  await updateAction(a);
  return a;
}

export async function markDone(id, response) {
  const a = await getAction(id);
  if (!a) return;
  a.status = 'done';
  a.response = response;
  a.updatedAt = Date.now();
  await updateAction(a);
  // Garbage-collect immediately — we don't keep a history of synced items.
  await deleteAction(id);
}

export async function markFailed(id, error, backoffMs) {
  const a = await getAction(id);
  if (!a) return;
  a.status = 'failed';
  a.lastError = String(error || 'unknown');
  a.nextAttemptAt = Date.now() + (backoffMs || 60_000);
  a.updatedAt = Date.now();
  await updateAction(a);
}

export async function resetForRetry(id) {
  const a = await getAction(id);
  if (!a) return;
  a.status = 'pending';
  a.nextAttemptAt = 0;
  a.lastError = null;
  a.updatedAt = Date.now();
  await updateAction(a);
}

export function listAll() {
  return listActions();
}

export function listPending() {
  return listByStatus('pending');
}

export function listFailed() {
  return listByStatus('failed');
}

export async function discard(id) {
  await deleteAction(id);
}

export async function clearAll() {
  await dbClearAll();
}

export async function summary() {
  const all = await listActions();
  return {
    total: all.length,
    pending: all.filter((a) => a.status === 'pending').length,
    syncing: all.filter((a) => a.status === 'syncing').length,
    failed: all.filter((a) => a.status === 'failed').length,
  };
}