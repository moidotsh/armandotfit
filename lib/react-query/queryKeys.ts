// lib/react-query/queryKeys.ts
// Centralized query-key factory. Arqavellum's cross-cutting keys (auth, user)
// + armandotfit's domain keys (profile, exercises, workouts, analytics,
// streaks, reference). Hooks use these via the `queryKeys` factory —
// inline `queryKey: [...]` arrays are banned by the S13 audit.

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

  /** Exercise library: system + current user's custom. */
  exercises: {
    all: ['exercises'] as const,
    list: <T = unknown>(filter?: T) =>
      [...queryKeys.exercises.all, 'list', filter] as const,
    detail: (id: string) => [...queryKeys.exercises.all, 'detail', id] as const,
    favorites: () => [...queryKeys.exercises.all, 'favorites'] as const,
  },

  /** Reference data: muscle categories, muscles, equipment types. */
  reference: {
    all: ['reference'] as const,
    muscleCategories: () => [...queryKeys.reference.all, 'muscleCategories'] as const,
    muscles: () => [...queryKeys.reference.all, 'muscles'] as const,
    equipmentTypes: () => [...queryKeys.reference.all, 'equipmentTypes'] as const,
  },

  /** User-owned equipment inventory. */
  userEquipment: {
    all: ['userEquipment'] as const,
    list: () => [...queryKeys.userEquipment.all, 'list'] as const,
  },

  /** Workout sessions: header list + per-session detail. */
  workouts: {
    all: ['workouts'] as const,
    recent: (limit = 10) => [...queryKeys.workouts.all, 'recent', limit] as const,
    detail: (id: string) => [...queryKeys.workouts.all, 'detail', id] as const,
  },

  /** Dashboard summary + chart data. */
  analytics: {
    all: ['analytics'] as const,
    summary: () => [...queryKeys.analytics.all, 'summary'] as const,
    history: (daysBack = 30) => [...queryKeys.analytics.all, 'history', daysBack] as const,
  },

  /** Streaks (RPC-computed). */
  streaks: {
    current: () => ['streaks', 'current'] as const,
  },
} as const;
