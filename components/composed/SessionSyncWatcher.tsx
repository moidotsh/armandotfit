// components/composed/SessionSyncWatcher.tsx
// The offline queue's other half: mounted once inside the provider
// stack, it flushes queued session saves whenever the app is online
// (boot + every reconnect) and reports what landed. Invalidations
// refresh every computed-at-read surface for the synced sessions.

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sessionSaveQueue } from '../../services';
import { queryKeys } from '../../lib/react-query';
import { useIsOnline } from '../../stores';
import { useToast } from '../../context';

export function SessionSyncWatcher() {
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    void (async () => {
      const result = await sessionSaveQueue.flush();
      if (cancelled || result.synced === 0) return;
      // The workouts root prefix-matches the shared history, the
      // activity log, detail, and last-tags — every derived surface
      // recomputes from the refetched entries.
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
      showToast(
        'success',
        result.synced === 1
          ? 'Session synced'
          : `${result.synced} sessions synced`,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [isOnline, queryClient, showToast]);

  return null;
}
