// navigation/NavigationHelper.tsx
//
// The single legitimate site for raw `router.push` / `router.replace` /
// `router.back` calls (audit C1 allows them here and in
// `hooks/useAuthNavigation.ts`). Every other file in the app navigates
// through the helpers exported from this file — that way the call sites
// read as intent (`replaceWithLogin()`) rather than mechanism
// (`router.replace('/login')`), and a global navigation change (e.g.
// swizzling every push with a transition) lands in one place.
//
// Naming convention:
//   - `navigateToX()` — `router.push` (drills in; adds to back-stack).
//   - `replaceWithX()` — `router.replace` (redirects; back-stack stays
//     where it was). Use for auth-flow redirects and "you can't go back
//     to where you were" transitions (post-login, post-logout, post-register).
//
// Vellum ships helpers for the shell routes only. Consumers add their
// own helpers for domain routes (workout, exercise, dashboard, …) by
// extending this file or by adding a sibling (e.g. `DomainNavigation.tsx`
// re-exported from `navigation/index.tsx`).

import { router, Router } from 'expo-router';
import { useAuthStore } from '../stores';

/**
 * Shell navigation paths. Consumers add their own routes to a sibling
 * enum (or extend this one) — the `navigationHierarchy` map below is
 * the source of truth for "what's the parent of X?" used by `goBack`.
 */
export enum NavigationPath {
  HOME = 'home',
  LOGIN = 'login',
  REGISTER = 'register',
  FORGOT_PASSWORD = 'forgot-password',
  SETTINGS = 'settings',
  DEV_PREMIUM = 'dev/premium',
  // armandotfit domain routes
  WORKOUT_DETAIL = 'workout-detail',
  EXERCISE_DATABASE = 'exercise-database',
  EXERCISE_DETAIL = 'exercise-detail',
  PROGRESSION = 'progression',
  ANALYTICS = 'analytics',
  WORKOUT_PROGRAMS = 'workout-programs',
  SPLIT_SELECTION = 'split-selection',
}

/**
 * Parent-of map used by `goBack(currentPath)`. Each value is the route
 * the user should land on if they hit "back" from the key route.
 *
 * Shell routes parent to HOME (the post-auth entry point) except for
 * FORGOT_PASSWORD, which parents to LOGIN (reached from the login screen
 * and meant to return there). Domain routes parent to HOME except for
 * detail/child routes which parent to their list view.
 */
export const navigationHierarchy: Record<string, NavigationPath> = {
  [NavigationPath.LOGIN]: NavigationPath.HOME,
  [NavigationPath.REGISTER]: NavigationPath.HOME,
  [NavigationPath.FORGOT_PASSWORD]: NavigationPath.LOGIN,
  [NavigationPath.SETTINGS]: NavigationPath.HOME,
  [NavigationPath.DEV_PREMIUM]: NavigationPath.HOME,
  // armandotfit domain routes
  [NavigationPath.WORKOUT_DETAIL]: NavigationPath.HOME,
  [NavigationPath.EXERCISE_DATABASE]: NavigationPath.HOME,
  [NavigationPath.EXERCISE_DETAIL]: NavigationPath.EXERCISE_DATABASE,
  [NavigationPath.PROGRESSION]: NavigationPath.HOME,
  [NavigationPath.ANALYTICS]: NavigationPath.HOME,
  [NavigationPath.WORKOUT_PROGRAMS]: NavigationPath.HOME,
  [NavigationPath.SPLIT_SELECTION]: NavigationPath.HOME,
};

// ─── Push helpers (drill in) ────────────────────────────────────────────

export function navigateToHome() {
  router.push('/');
}

export function navigateToLogin() {
  router.push('/login');
}

export function navigateToRegister() {
  router.push('/register');
}

export function navigateToForgotPassword() {
  router.push('/forgot-password');
}

export function navigateToSettings() {
  router.push('/settings');
}

/**
 * Navigate to the design-system showcase. Useful while developing — not
 * linked from any user-facing surface by default.
 */
export function navigateToPremiumShowcase() {
  router.push('/dev/premium');
}

// ─── armandotfit domain navigation ────────────────────────────────────

/** Open an existing workout session detail, or start a new one (no id). */
export function navigateToWorkoutDetail(workoutId?: string) {
  if (workoutId) {
    router.push({ pathname: '/workout-detail', params: { id: workoutId } });
  } else {
    router.push('/workout-detail');
  }
}

/** Open the exercise library browse screen. */
export function navigateToExerciseDatabase() {
  router.push('/exercise-database');
}

/** Open a specific exercise's detail card. */
export function navigateToExerciseDetail(exerciseId: string) {
  router.push({ pathname: '/exercise-detail', params: { id: exerciseId } });
}

/** Open the progression dashboard (PR tracking + volume trends). */
export function navigateToProgression() {
  router.push('/progression');
}

/** Open the analytics screen (charts + history). */
export function navigateToAnalytics() {
  router.push('/analytics');
}

/** Open the workout programs/templates browser. */
export function navigateToWorkoutPrograms() {
  router.push('/workout-programs');
}

/** Open the split-selection flow (Full Body vs AM/PM, day-of-week). */
export function navigateToSplitSelection() {
  router.push('/split-selection');
}

// ─── Replace helpers (redirects) ────────────────────────────────────────

export function replaceWithHome() {
  router.replace('/');
}

export function replaceWithLogin() {
  router.replace('/login');
}

export function replaceWithRegister() {
  router.replace('/register');
}

/**
 * Replace with the forgot-password screen. Reached from the login
 * screen's "forgot password?" link. `push` is usually right there
 * (login should stay in the back-stack) — this variant is for the rare
 * redirect-from-deep-link case.
 */
export function replaceWithForgotPassword() {
  router.replace('/forgot-password');
}

// ─── Back navigation ────────────────────────────────────────────────────

/**
 * Safe back navigation — prefers `router.back()` when there's history to
 * go back to, otherwise falls back to home (if authenticated) or login.
 *
 * Use this instead of `router.back()` anywhere a user can hit "back"
 * without a guaranteed parent route (deep links, refreshed PWA tabs).
 *
 * Reads auth state via `useAuthStore.getState()` (non-reactive) so the
 * decision reflects the current auth state at call time without
 * subscribing the helper to the store.
 */
export function safeGoBack() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  const { status } = useAuthStore.getState();
  if (status === 'authenticated') {
    router.replace('/');
  } else {
    router.replace('/login');
  }
}

/**
 * Hierarchy-respecting back navigation. Given the current path, jumps
 * to its declared parent (see `navigationHierarchy`) instead of
 * trusting the browser's history stack.
 *
 * Prefer `safeGoBack()` for the common case — this variant is for
 * flows where the parent route is meaningfully different from "the page
 * you came from" (e.g. settings deep-linked from a notification should
 * back to home, not to the notification).
 */
export function goBack(currentPath: NavigationPath | string) {
  if (Object.values(NavigationPath).includes(currentPath as NavigationPath)) {
    const parentPath = navigationHierarchy[currentPath] || NavigationPath.HOME;
    if (parentPath === NavigationPath.HOME) {
      router.push('/');
      return;
    }
    router.push(`/${parentPath}`);
    return;
  }

  router.push('/');
}

// Re-export the underlying router instance + type for consumers that
// need to pass it along (e.g. a navigation context provider).
export { router as routerInstance };
export type { Router };
