# ORCA Offline Sync

Online-first PWA with an offline fallback. This directory contains the
mutation outbox that records user actions when offline and replays them
when connectivity returns.

## Layers

- `syncPolicy.js` — **single source of truth**. Edit this file to add or
  remove queueable endpoints.
- `syncDb.js` — IndexedDB schema for the outbox (`orca-sync` DB).
- `outbox.js` — public API for enqueue / list / retry / discard.
- `syncEngine.js` — drain loop + global triggers.
- `idempotency.js` — per-action idempotency key generation.

## Adding a new queueable endpoint

1. Confirm the endpoint is a mutation.
2. Confirm it is **safe to replay** (idempotent, or naturally safe).
3. Confirm it is **not**: auth, payment, admin, LLM-heavy, or stateful.
4. Add an entry to `QUEUEABLE` in `syncPolicy.js` with:
   - `method`, `path` (regex)
   - `synthesize(body)` → the shape the caller sees while offline
   - `maxAttempts`, `backoffMs`
5. Write a test in `__tests__/syncPolicy.test.js`.

## Why only `/alerts/acknowledge` queues today

- It is naturally idempotent (ack an already-acked alert = no-op).
- It is user-scoped (only affects the caller's own view).
- It has no LLM, payment, or admin side-effects.

Chat, route planning, risk evaluation, agent execution, admin
broadcasts, and auth are all **online-only by design**.

## Logout policy

`LOGOUT_POLICY` in `syncPolicy.js` controls what happens to queued
actions on logout:

- `discard` (default) — drop the queue. Safest for shared devices.
- `flush` — attempt to sync, then drop.
- `retain` — keep in IDB, restore on next login (same user only).

## Background Sync

`registerBackgroundSync()` registers the `orca-outbox-sync` tag on
Chromium browsers. It is a **best-effort enhancement**; the primary
drain path is the page-side triggers (`online`, `visibilitychange`, boot).