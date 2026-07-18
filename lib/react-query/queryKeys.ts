// lib/react-query/queryKeys.ts
// Centralized query-key factory. Vellum ships only the cross-cutting keys
// (auth, user) — domain keys (workouts, products, sessions, etc.) land in
// consumers via hooks/queries/* and append to this object.

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
} as const;
