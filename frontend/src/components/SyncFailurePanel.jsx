import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { listAll } from '../offline/outbox';

/**
 * Expandable panel listing failed queue items. Only shows if there is at
 * least one failed action. Users can retry individually or discard.
 */
export default function SyncFailurePanel() {
  const { failed, retryOne, discardOne } = useSyncStatus();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      const all = await listAll();
      if (!alive) return;
      setItems(all.filter((a) => a.status === 'failed'));
    })();
    return () => {
      alive = false;
    };
  }, [open, failed]);

  if (failed === 0) return null;

  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
      >
        <span className="flex items-center gap-1.5 font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          {failed} queued action{failed === 1 ? '' : 's'} failed to sync
        </span>
        <span className="text-[11px]">{open ? 'Hide' : 'Review'}</span>
      </button>

      {open && (
        <div className="border-t border-rose-500/20 divide-y divide-rose-500/10">
          {items.map((a) => (
            <div key={a.id} className="px-3 py-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase text-rose-300">
                  {a.method} {a.url}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => retryOne(a.id)}
                    className="p-1 rounded hover:bg-rose-500/10 text-rose-200"
                    title="Retry"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => discardOne(a.id)}
                    className="p-1 rounded hover:bg-rose-500/10 text-rose-200"
                    title="Discard"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p
                className="text-[11px] text-rose-200/70 truncate"
                title={a.lastError}
              >
                {a.lastError || 'Unknown error'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}