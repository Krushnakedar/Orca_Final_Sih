import { useSyncInternal } from '../context/SyncContext';

export function useSyncStatus() {
  return useSyncInternal();
}