// lib/react-query/queryKeys.ts
// Centralized query-key factory. Arqavellum's cross-cutting keys (auth,
// user) + armandotfit's domain keys (profile, exercises, workouts,
// music). Hooks use these via the `queryKeys` factory — inline
// `queryKey: [...]` arrays are banned by the S13 audit.

import type { ID } from '../../shared/types';

export const queryKeys = {
  // Authentication
  auth: {
    session: () => ['auth', 'session'] as const,
    status: () => ['auth', 'status'] as const,
  },

  // Current user (profile, settings, etc. — whatever the consumer defines
  // as "the user"). Kept generic so the auth flow has a cache primitive to
  // invalidate on login/logout.
  user: {
    all: ['user'] as const,
    detail: (userId?: string) => [...queryKeys.user.all, 'detail', userId] as const,
  },

  // ── armandotfit domain keys ──────────────────────────────────────────

  /** Current user's profile (one row, owned by handle_new_user trigger). */
  profile: {
    current: () => ['profile', 'current'] as const,
  },

  /** Body weight — the weigh-in log (Settings panel). */
  bodyWeight: {
    all: ['bodyWeight'] as const,
    history: () => ['bodyWeight', 'history'] as const,
    latest: () => ['bodyWeight', 'latest'] as const,
  },

  /** Training partner — the couples link (connect, read-through). */
  partner: {
    all: ['partner'] as const,
    myCode: () => ['partner', 'myCode'] as const,
    current: () => ['partner', 'current'] as const,
    sessions: () => ['partner', 'sessions'] as const,
  },

  /** Exercise library (local catalog; key kept for cache namespacing). */
  exercises: {
    all: ['exercises'] as const,
    list: <T = unknown>(filter?: T) =>
      [...queryKeys.exercises.all, 'list', filter] as const,
    detail: (id: string) => [...queryKeys.exercises.all, 'detail', id] as const,
  },

  /** Workout sessions: the shared history + activity log + detail. */
  workouts: {
    all: ['workouts'] as const,
    /**
     * THE SHARED HISTORY — nested sessions (exercises + sets), one
     * generous limit for the single user. Every details consumer
     * (recent lists, top sets, PBs, trajectory, PR timeline, muscle
     * share) derives from this one cache entry via select/useMemo —
     * the payload never rides the wire twice under different keys.
     */
    history: () => [...queryKeys.workouts.all, 'history'] as const,
    /**
     * Headers-only activity log — deeper than history (streaks and
     * the consistency grid look further back than any details
     * consumer needs).
     */
    activity: () => [...queryKeys.workouts.all, 'activity'] as const,
    detail: (id: string) => [...queryKeys.workouts.all, 'detail', id] as const,
    /** Most-recent tags per exercise-name list (session-start prefill). */
    lastTags: (namesKey: string) =>
      [...queryKeys.workouts.all, 'last-tags', namesKey] as const,
  },

  /** Music picks (the persisted recents list). */
  music: {
    all: ['music'] as const,
    picks: () => [...queryKeys.music.all, 'picks'] as const,
  },
} as const;
