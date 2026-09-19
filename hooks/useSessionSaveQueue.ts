// hooks/useSessionSaveQueue.ts
// Reactive reads over the session save queue (D4): the count for the
// offline banner + watcher UIs. useSyncExternalStore over
// BaseQueueService's subscribe/notify — no React Query involved (the
// queue is client state, not server cache).

import { useSyncExternalStore } from 'react';
import { sessionSaveQueue } from '../services';

/** Pending offline session saves (0 when everything is synced). */
export function usePendingSessionSaves(): number {
  return useSyncExternalStore(
    (onChange) => sessionSaveQueue.subscribe(onChange),
    () => sessionSaveQueue.count(),
    () => 0,
  );
}
