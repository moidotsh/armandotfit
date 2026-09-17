// hooks/queries/useLastUsedTags.ts
// The "what did I use last time" prefill: the caller's most-recent tags
// per exercise name. One bounded round-trip at session start; disabled
// until the draft has exercises.

import { useQuery } from '@tanstack/react-query';
import { WorkoutService } from '../../services';
import { queryKeys } from '../../lib/react-query';

export function useLastUsedTags(names: string[] | null) {
  const key = names ? [...names].sort().join(',') : '';
  return useQuery<Map<string, string[]>>({
    queryKey: queryKeys.workouts.lastTags(key),
    queryFn: async () => {
      if (!names || names.length === 0) return new Map<string, string[]>();
      const res = await WorkoutService.getLastTagsByExerciseNames(names);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!names && names.length > 0,
    staleTime: 30_000, // fresh enough for a session start; cheap to refetch
  });
}
