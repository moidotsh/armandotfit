// hooks/queries/useWorkouts.ts
// Read paths for training sessions. Pulls userId from the auth store so
// callers don't have to thread it through.
//
// TWO shared cache entries own the wire (the fetch-overlap law):
//   • history  — nested sessions (exercises + sets), limit 100. Every
//     details consumer slices/derives from it via select — the nested
//     payload is fetched exactly once per stale window, never per key.
//   • activity — headers-only, limit 200. Streaks, weekly counts, the
//     consistency grid, and next-day suggestions read this one.
// Per-session detail (the receipt) keeps its own keyed entry.

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { WorkoutService } from '../../services';
import { queryKeys } from '../../lib/react-query';
import { useAuthStore } from '../../stores';
import type { TrainingSession, SessionWithDetails, ID } from '../../shared/types';

/** The shared history depth — sessions with full nesting. */
export const HISTORY_LIMIT = 100;
/** The activity-log depth — headers only, deeper than history. */
export const ACTIVITY_LIMIT = 200;

async function fetchHistory(userId: string): Promise<SessionWithDetails[]> {
  const res = await WorkoutService.getRecentWithDetails(userId, HISTORY_LIMIT);
  if (!res.success) throw res.error;
  return res.data;
}

async function fetchActivity(userId: string): Promise<TrainingSession[]> {
  const res = await WorkoutService.getRecentSessions(userId, ACTIVITY_LIMIT);
  if (!res.success) throw res.error;
  return res.data;
}

/**
 * THE SHARED HISTORY — every nested-session consumer derives from this
 * one query (select slices, useMemo derivations). Prefer this or
 * `useRecentSessionDetails`; never add another nested-fetching key.
 */
export function useSessionHistory() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: queryKeys.workouts.history(),
    queryFn: () => (userId ? fetchHistory(userId) : Promise.resolve([])),
    enabled: !!userId,
  });
}

/**
 * Recent nested sessions, sliced from the shared history — the read
 * path for surfaces that show per-session volume/lift counts. `limit`
 * only bounds the slice; the fetch is shared.
 */
export function useRecentSessionDetails(limit = 10) {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: queryKeys.workouts.history(),
    queryFn: () => (userId ? fetchHistory(userId) : Promise.resolve([])),
    enabled: !!userId,
    select: (rows: SessionWithDetails[]) => rows.slice(0, limit),
  });
}

/**
 * Recent session headers, sliced from the shared activity log (the
 * next-day suggestion reads just the newest row).
 */
export function useRecentWorkouts(limit = 10) {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: queryKeys.workouts.activity(),
    queryFn: () => (userId ? fetchActivity(userId) : Promise.resolve([])),
    enabled: !!userId,
    select: (rows: TrainingSession[]) => rows.slice(0, limit),
  });
}

/** The shared activity log (headers, deeper than history). */
export function useActivityLog() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: queryKeys.workouts.activity(),
    queryFn: () => (userId ? fetchActivity(userId) : Promise.resolve([])),
    enabled: !!userId,
  });
}

/** Full session detail (header + exercises + sets). */
export function useWorkoutDetail(
  id: ID | null | undefined,
  options?: Omit<
    UseQueryOptions<SessionWithDetails | null>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const enabled = !!id;
  return useQuery({
    queryKey: queryKeys.workouts.detail(id ?? 'unknown'),
    queryFn: async () => {
      if (!id) return null;
      const res = await WorkoutService.getSessionDetail(id);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled,
    ...options,
  });
}
