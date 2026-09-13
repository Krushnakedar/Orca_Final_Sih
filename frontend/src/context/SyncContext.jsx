import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import * as outbox from '../offline/outbox';
import { drain, subscribe, attachTriggers } from '../offline/syncEngine';

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const [summary, setSummary] = useState({
    total: 0, pending: 0, syncing: 0, failed: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [authRequired, setAuthRequired] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const s = await outbox.summary();
      setSummary(s);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    attachTriggers();
    refresh();

    const unsub = subscribe((event) => {
      setLastEvent(event);
      if (event.type === 'syncing') setIsSyncing(true);
      if (event.type === 'drain-complete') setIsSyncing(false);
      if (event.type === 'auth-required') setAuthRequired(true);
      // refresh counters after any state change
      refresh();
    });
    return unsub;
  }, [refresh]);

  const manualDrain = useCallback(async () => {
    setIsSyncing(true);
    try {
      await drain({ force: true });
    } finally {
      setIsSyncing(false);
      refresh();
    }
  }, [refresh]);

  const retryOne = useCallback(async (id) => {
    await outbox.resetForRetry(id);
    await manualDrain();
  }, [manualDrain]);

  const discardOne = useCallback(async (id) => {
    await outbox.discard(id);
    refresh();
  }, [refresh]);

  const clearAuthGate = useCallback(() => setAuthRequired(false), []);

  const value = {
    ...summary,
    isSyncing,
    lastEvent,
    authRequired,
    manualDrain,
    retryOne,
    discardOne,
    clearAuthGate,
  };

  return (
    <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
  );
}

export function useSyncInternal() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}