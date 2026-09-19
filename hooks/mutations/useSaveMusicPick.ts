// hooks/mutations/useSaveMusicPick.ts
// Persisting a pick (music_picks). Fire-and-forget by design: the
// pick saves while the song starts — a failed save (e.g. the table
// not yet applied on the project) logs and never interrupts
// playback. Invalidates the recents list (D3).

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { musicPickRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import { useAuthStore } from '../../stores';
import { logger } from '../../utils';
import type { MusicPick } from '../../shared/types';

export function useSaveMusicPick() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  return useMutation<MusicPick | null, Error, { videoId: string; title: string; artist: string | null }>({
    mutationFn: async (track) => {
      if (!userId) return null;
      const res = await musicPickRepository.create({
        userId,
        videoId: track.videoId,
        title: track.title,
        artist: track.artist,
      });
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.music.all });
    },
    onError: (err) => {
      logger.warn('mutations', 'music pick save failed:', err.message);
    },
  });
}
