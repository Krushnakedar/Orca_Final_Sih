import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import * as outbox from '../outbox';

beforeEach(async () => {
  await outbox.clearAll();
});

describe('outbox', () => {
  it('enqueues a queueable action', async () => {
    const a = await outbox.enqueue({
      method: 'post',
      url: '/alerts/acknowledge',
      body: { id: 'alert_1' },
    });
    expect(a.id).toBeTruthy();
    expect(a.status).toBe('pending');
    const summary = await outbox.summary();
    expect(summary.pending).toBe(1);
  });

  it('rejects non-queueable actions', async () => {
    await expect(
      outbox.enqueue({ method: 'post', url: '/auth/login', body: {} }),
    ).rejects.toThrow();
  });

  it('generates a unique idempotency key per action', async () => {
    const a = await outbox.enqueue({
      method: 'post',
      url: '/alerts/acknowledge',
      body: { id: 'x' },
    });
    const b = await outbox.enqueue({
      method: 'post',
      url: '/alerts/acknowledge',
      body: { id: 'x' },
    });
    expect(a.idempotencyKey).not.toBe(b.idempotencyKey);
  });

  it('discards an action', async () => {
    const a = await outbox.enqueue({
      method: 'post',
      url: '/alerts/acknowledge',
      body: { id: 'y' },
    });
    await outbox.discard(a.id);
    const s = await outbox.summary();
    expect(s.total).toBe(0);
  });
});