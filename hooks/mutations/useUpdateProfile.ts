// hooks/mutations/useUpdateProfile.ts
// Update the current user's profile. Touches setQueryData +
// invalidateQueries to satisfy D3. Optimistic update on the restDays
// field specifically — the settings multi-select flips immediately.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userProfileRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import { logger } from '../../utils/logger';
import { useAuthStore } from '../../stores';
import type { Profile, ProfileUpdateDTO } from '../../shared/types';

interface UpdateProfileContext {
  previousProfile?: Profile | null;
}

/**
 * useUpdateProfile — patches the current user's profile row. Optimistically
 * applies the patch to the cached profile so the settings UI updates
 * immediately, rolls back on error, and invalidates on success so the
 * server-authoritative row takes over.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  const profileKey = queryKeys.profile.current();

  return useMutation<Profile, Error, ProfileUpdateDTO, UpdateProfileContext>({
    mutationFn: async (dto: ProfileUpdateDTO) => {
      if (!userId) {
        // s10-exempt: programmer-error guard. The settings screen only
        // renders for an authenticated user — an unset userId here is a
        // wiring bug, not a user-facing condition.
        throw new Error('Cannot update profile: no authenticated user');
      }
      const res = await userProfileRepository.update(userId, dto);
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (dto): Promise<UpdateProfileContext> => {
      await queryClient.cancelQueries({ queryKey: profileKey });
      const previousProfile = queryClient.getQueryData<Profile | null>(profileKey);
      if (previousProfile) {
        const optimistic: Profile = {
          ...previousProfile,
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : null),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : null),
          ...(dto.displayName !== undefined ? { displayName: dto.displayName } : null),
          ...(dto.preferredSplit !== undefined ? { preferredSplit: dto.preferredSplit } : null),
          ...(dto.weeklyGoal !== undefined ? { weeklyGoal: dto.weeklyGoal } : null),
          ...(dto.restDays !== undefined ? { restDays: dto.restDays } : null),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData<Profile | null>(profileKey, optimistic);
      }
      return { previousProfile };
    },
    onError: (err, _dto, context) => {
      logger.warn('mutations', 'useUpdateProfile failed, rolling back cache:', err.message);
      if (context?.previousProfile !== undefined) {
        queryClient.setQueryData(profileKey, context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current() });
    },
  });
}
