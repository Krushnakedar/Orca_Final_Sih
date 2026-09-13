import React from 'react';
import { useOffline } from '../hooks/useOffline';
import SyncStatusPill from './SyncStatusPill';

export default function OfflineBanner() {
  const { isOnline, lastOfflineHit, swUpdateAvailable, applyUpdate, retry } =
    useOffline();

  // SW update takes priority — it's a one-time, actionable message.
  if (swUpdateAvailable) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-tealAccent-600 text-slate-950 px-4 py-2 text-sm flex items-center justify-between"
      >
        <span>A new version of ORCA is available.</span>
        <button
          onClick={applyUpdate}
          className="ml-4 px-3 py-1 rounded bg-slate-950 text-tealAccent-400 font-medium hover:bg-navy-900"
        >
          Update now
        </button>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-amber-600/90 text-slate-950 px-4 py-2 text-sm flex items-center justify-between gap-3 flex-wrap"
      >
        <span>
          You're offline.{' '}
          {lastOfflineHit
            ? 'Showing cached data.'
            : 'Some features may be unavailable.'}
        </span>
        <div className="flex items-center gap-2">
          <SyncStatusPill />
          <button
            onClick={retry}
            className="px-3 py-1 rounded bg-slate-950 text-amber-400 font-medium hover:bg-navy-900"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (lastOfflineHit) {
    const age = Math.round((Date.now() - lastOfflineHit.cachedAt) / 60000);
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-navy-700 text-slate-100 px-4 py-2 text-sm flex items-center justify-between gap-3 flex-wrap"
      >
        <span>
          Showing cached data from {age < 1 ? 'just now' : `${age} min ago`}.
          {lastOfflineHit.isStale && ' This data may be outdated.'}
        </span>
        <SyncStatusPill />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end px-4 py-1 empty:hidden">
      <SyncStatusPill />
    </div>
  );
}