import React, { useEffect, useState } from 'react';
import { useOffline } from '../hooks/useOffline';
import { useSyncStatus } from '../hooks/useSyncStatus';

export default function BackOnlineToast() {
  const { isOnline } = useOffline();
  const { pending, failed, isSyncing } = useSyncStatus();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOnline && pending > 0 && !isSyncing) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(t);
    }
  }, [isOnline, pending, isSyncing]);

  if (!visible || pending === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-tealAccent-600/40 bg-slate-900 text-slate-100 shadow-2xl px-4 py-3 text-sm"
    >
      <div className="font-semibold text-tealAccent-400 mb-1">
        You're back online
      </div>
      <div className="text-slate-300 text-xs">
        {isSyncing
          ? `Syncing ${pending} queued action${pending === 1 ? '' : 's'}…`
          : failed > 0
            ? `${pending} queued · ${failed} failed. Review above.`
            : `${pending} action${pending === 1 ? '' : 's'} waiting to sync.`}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="mt-2 text-[11px] text-slate-400 hover:text-slate-200 transition"
      >
        Dismiss
      </button>
    </div>
  );
}