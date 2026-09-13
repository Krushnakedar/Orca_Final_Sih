import { describe, it, expect } from 'vitest';
import { isQueueable, matchPolicy, LOGOUT_POLICY } from '../syncPolicy';

describe('syncPolicy', () => {
  it('queues POST /alerts/acknowledge', () => {
    expect(isQueueable('post', '/alerts/acknowledge')).toBe(true);
  });

  it('does NOT queue auth endpoints', () => {
    expect(isQueueable('post', '/auth/login')).toBe(false);
    expect(isQueueable('post', '/auth/register')).toBe(false);
    expect(isQueueable('post', '/auth/logout')).toBe(false);
  });

  it('does NOT queue LLM-heavy endpoints', () => {
    expect(isQueueable('post', '/chat/message')).toBe(false);
    expect(isQueueable('post', '/agents/execute')).toBe(false);
    expect(isQueueable('post', '/explain/package')).toBe(false);
  });

  it('does NOT queue compute endpoints', () => {
    expect(isQueueable('post', '/routes/plan')).toBe(false);
    expect(isQueueable('post', '/risk/evaluate')).toBe(false);
    expect(isQueueable('post', '/geofence/check')).toBe(false);
    expect(isQueueable('post', '/geofence/simulate')).toBe(false);
  });

  it('does NOT queue admin endpoints', () => {
    expect(isQueueable('post', '/alerts/broadcast')).toBe(false);
    expect(isQueueable('post', '/alerts/simulate')).toBe(false);
  });

  it('does NOT queue GETs', () => {
    expect(isQueueable('get', '/alerts')).toBe(false);
    expect(isQueueable('get', '/dashboard')).toBe(false);
  });

  it('synthesize returns a shape callers can consume', () => {
    const policy = matchPolicy('post', '/alerts/acknowledge');
    const out = policy.synthesize({ id: 'alert_123' });
    expect(out.success).toBe(true);
    expect(out.data.id).toBe('alert_123');
    expect(out.data.status).toBe('ACKNOWLEDGED');
  });

  it('defaults to discard on logout', () => {
    expect(LOGOUT_POLICY).toBe('discard');
  });
});