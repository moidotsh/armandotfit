// hooks/queries/useProfile.ts
// Read path for the current user's profile. Caches under
// queryKeys.profile.current() and revalidates on focus/visibility via
// React Query defaults. Pulls userId from the auth store so callers
// don't have to thread it.

import { useQuery } from '@tanstack/react-query';
import { userProfileRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import { useAuthStore } from '../../stores';
import type { Profile } from '../../shared/types';

/**
 * The current user's profile row (auth.users extension, created by the
 * handle_new_user trigger). Returns null while the userId is unset or the
 * row hasn't been fetched yet — consumers should treat null + isLoading as
 * "still booting" and fall back to safe defaults (e.g. empty restDays).
 */
export function useProfile() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<Profile | null>({
    queryKey: queryKeys.profile.current(),
    queryFn: async () => {
      if (!userId) return null;
      const res = await userProfileRepository.findByUserId(userId);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}
