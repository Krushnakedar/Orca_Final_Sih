/**
 * Generates and persists a per-action idempotency key.
 *
 * The key is created ONCE at enqueue time and never re-minted, so even if
 * the same logical action is retried dozens of times, the server sees the
 * same key. Today the ORCA backend does not use idempotency keys, but the
 * header is harmless and future-proofs us if the backend adds support.
 */
export function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (older Safari).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const IDEMPOTENCY_HEADER = 'Idempotency-Key';