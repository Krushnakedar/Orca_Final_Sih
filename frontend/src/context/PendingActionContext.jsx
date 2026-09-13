import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { listAll, discard, clearAll as outboxClear } from '../offline/outbox';

const PendingActionContext = createContext(null);

/**
 * Backwards-compatible wrapper. Old callers still get { pending, remember,
 * forget, clear }, but now 'pending' reflects the durable IndexedDB outbox
 * instead of in-memory React state.
 *
 * 'remember' is kept for callers that only want a UI hint (it is a no-op
 * on the queue — the queue is driven by api.js).
 */
export function PendingActionProvider({ children }) {
  const [pending, setPending] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const all = await listAll();
      setPending(
        all.map((a) => ({
          id: a.id,
          label: `${a.method.toUpperCase()} ${a.url}`,
          addedAt: a.createdAt,
          status: a.status,
        })),
      );
    } catch {
      setPending([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 4000);
    return () => clearInterval(iv);
  }, [refresh]);

  // Legacy API — kept for compatibility but is now a no-op because
  // real queuing happens in api.js. Returns a synthetic id.
  const remember = useCallback((label) => {
    return `ui_${Date.now()}_${label}`;
  }, []);

  const forget = useCallback(async (id) => {
    if (typeof id === 'string' && id.startsWith('act_')) {
      await discard(id);
    }
    refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    await outboxClear();
    refresh();
  }, [refresh]);

  return (
    <PendingActionContext.Provider value={{ pending, remember, forget, clear }}>
      {children}
    </PendingActionContext.Provider>
  );
}

export function usePendingActions() {
  const ctx = useContext(PendingActionContext);
  if (!ctx) {
    throw new Error(
      'usePendingActions must be used within a PendingActionProvider'
    );
  }
  return ctx;
}