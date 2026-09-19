// hooks/queries/useMusicPicks.ts
// The persisted recents list (music_picks, latest first — the list
// itself is the replay playlist). Falls back to an empty list while
// the user is unset; the sheet tolerates a failing query (the table
// is new — before the migration is applied on a project, the list
// simply reads empty and saves are logged-and-skipped).

import { useQuery } from '@tanstack/react-query';
import { musicPickRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import { useAuthStore } from '../../stores';
import type { MusicPick } from '../../shared/types';

export function useMusicPicks(limit = 20) {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<MusicPick[]>({
    queryKey: [...queryKeys.music.picks(), limit],
    queryFn: async () => {
      if (!userId) return [];
      const res = await musicPickRepository.findRecent(userId, limit);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}
