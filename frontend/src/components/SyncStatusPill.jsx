import React from 'react';
import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useOffline } from '../hooks/useOffline';

/**
 * Small non-blocking status pill. Renders inline next to OfflineBanner.
 * Never takes focus, never blocks interaction.
 */
export default function SyncStatusPill() {
  const { isOnline } = useOffline();
  const { pending, syncing, failed, isSyncing, authRequired, manualDrain } =
    useSyncStatus();

  const totalPending = pending + syncing;

  if (authRequired) {
    return (
      <Pill tone="rose" icon={<AlertCircle className="w-3.5 h-3.5" />}>
        Session expired — sign in to sync {totalPending + failed} queued action
        {totalPending + failed === 1 ? '' : 's'}
      </Pill>
    );
  }

  if (!isOnline) {
    if (totalPending === 0 && failed === 0) return null;
    return (
      <Pill tone="amber" icon={<CloudOff className="w-3.5 h-3.5" />}>
        Offline — {totalPending} action{totalPending === 1 ? '' : 's'} queued
      </Pill>
    );
  }

  if (isSyncing) {
    return (
      <Pill tone="ocean" icon={<Loader2 className="w-3.5 h-3.5 animate-spin" />}>
        Syncing {totalPending} action{totalPending === 1 ? '' : 's'}…
      </Pill>
    );
  }

  if (failed > 0) {
    return (
      <button
        onClick={manualDrain}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25 transition"
        aria-live="polite"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        {failed} failed — retry
      </button>
    );
  }

  if (totalPending > 0) {
    return (
      <Pill tone="slate" icon={<Cloud className="w-3.5 h-3.5" />}>
        {totalPending} queued
      </Pill>
    );
  }

  return null;
}

function Pill({ tone, icon, children }) {
  const tones = {
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    ocean: 'bg-ocean-500/15 text-ocean-300 border-ocean-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    slate: 'bg-slate-800/60 text-slate-300 border-slate-700',
  };
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${tones[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}