// navigation/NavigationHelper.tsx
//
// The single legitimate site for raw `router.push` / `router.replace` /
// `router.back` calls (audit C1 allows them here and in
// `hooks/useAuthNavigation.ts`). Every other file in the app navigates
// through the helpers exported from this file — that way the call sites
// read as intent (`replaceWithLogin()`) rather than mechanism
// (`replace('/login')`), and a global navigation change (e.g.
// swizzling every push with a transition) lands in one place.
//
// Naming convention:
//   - `navigateToX()` — `router.push` (drills in; adds to back-stack).
//   - `replaceWithX()` — `router.replace` (redirects; back-stack stays
//     where it was). Use for auth-flow redirects and "you can't go back
//     to where you were" transitions (post-login, post-logout, post-register).
//
// Arqavellum ships helpers for the shell routes only. Consumers add their
// own helpers for domain routes (workout, exercise, dashboard, …) by
// extending this file or by adding a sibling (e.g. `DomainNavigation.tsx`
// re-exported from `navigation/index.tsx`).

import { router, Router, type Href } from 'expo-router';
import { withRouteCurtain } from '../utils';
import { useAuthStore } from '../stores';

// Every navigation routes through `withRouteCurtain` — the route-curtain
// seam declared by `theme.transition.style`. Inert under 'none' (no
// behavior change); under 'curtain' (the ink dialect's preset) the plate
// covers before the swap and the destination stamps on.
//
// THE BACK-STACK LAW (the owner's correction): the chevron must never
// re-serve the same page. Two polluters, both handled at this seam:
//   1. A rapid double-tap fires two pushes of the same href before the
//      first settles (the curtain hides it) — a stale entry that reads
//      as "back came back to the same page". Guarded by a short
//      duplicate window.
//   2. Same-path-different-params pushes (browsing spec sheets) stack
//      sibling entries — replaced instead, so one back always returns
//      to the list the user actually came from.
const lastPushRef = { href: '', at: 0 };
const DUP_WINDOW_MS = 400;

const webUrl = () =>
  typeof window !== 'undefined'
    ? { pathname: window.location.pathname, search: window.location.search }
    : null;

const push = (path: string | Href) => {
  const href = typeof path === 'string' ? path : '';
  const now = Date.now();
  // Same href twice inside the window: the first tap is already in
  // flight — this one is a bounce, drop it.
  if (href && lastPushRef.href === href && now - lastPushRef.at < DUP_WINDOW_MS) return;
  lastPushRef.href = href;
  lastPushRef.at = now;
  // Same path: the family rule — never stack siblings.
  const url = webUrl();
  const targetPath = href.split('?')[0];
  const targetSearch = href.includes('?') ? href.slice(href.indexOf('?')) : '';
  if (url && targetPath && url.pathname === targetPath) {
    if (url.search === targetSearch) return; // already here — a twin helps nobody
    withRouteCurtain(() => router.replace(path as never), 'up');
    return;
  }
  withRouteCurtain(() => router.push(path as never), 'up');
};
const replace = (path: string | Href) => withRouteCurtain(() => router.replace(path as never), 'up');
const back = () => withRouteCurtain(() => router.back(), 'down');

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
  PROGRAM = 'program',
  SPLIT_SELECTION = 'split-selection',
  COUPLE = 'couple',
  SPLIT_LAB = 'split-lab',
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
  [NavigationPath.PROGRAM]: NavigationPath.HOME,
  [NavigationPath.COUPLE]: NavigationPath.HOME,
  [NavigationPath.SPLIT_SELECTION]: NavigationPath.HOME,
  // The lab drills in from the program overview and backs to it.
  [NavigationPath.SPLIT_LAB]: NavigationPath.PROGRAM,
};

// ─── Push helpers (drill in) ────────────────────────────────────────────

export function navigateToHome() {
  push('/');
}

export function navigateToLogin() {
  push('/login');
}

export function navigateToRegister() {
  push('/register');
}

export function navigateToForgotPassword() {
  push('/forgot-password');
}

export function navigateToSettings() {
  push('/settings');
}

/**
 * Navigate to the design-system showcase. Useful while developing — not
 * linked from any user-facing surface by default.
 */
export function navigateToPremiumShowcase() {
  push('/dev/premium');
}

// ─── armandotfit domain navigation ────────────────────────────────────

/** Open an existing workout session detail, or start a new one (no id). */
export function navigateToWorkoutDetail(workoutId?: string) {
  if (workoutId) {
    push({ pathname: '/workout-detail', params: { id: workoutId } });
  } else {
    push('/workout-detail');
  }
}

/** Open the exercise library browse screen. */
export function navigateToExerciseDatabase() {
  push('/exercise-database');
}

/** Open a specific exercise's detail card (catalog slug keyed). */
export function navigateToExerciseDetail(exerciseSlug: string) {
  push({ pathname: '/exercise-detail', params: { slug: exerciseSlug } });
}

/** Open the progression dashboard (PR tracking + volume trends). */
export function navigateToProgression() {
  push('/progression');
}

/** Open My Program — the overview (no edition) or the edition's days. */
export function navigateToCouple(mode?: 'twoADay' | 'oneADay') {
  push(mode ? `/couple?mode=${mode}` : '/couple');
}

export function navigateToProgram(edition?: 'twoADay' | 'oneADay') {
  push(edition ? `/program?edition=${edition}` : '/program');
}

/** Open a starter program's days (the authored PPL / Upper-Lower /
 *  Bro rotations on the program page). */
export function navigateToStarterProgram(program: 'ppl' | 'upperLower' | 'broSplit' | 'fullyEqual') {
  push(`/program?program=${program}`);
}

/** Open OTHER SPLITS — the starter cards + the generator link. */
export function navigateToOtherSplits() {
  push('/program?view=other');
}

/** Open the analytics screen (charts + history). */
export function navigateToAnalytics() {
  push('/analytics');
}

/** Open the Split Lab — read-only alternative programs generated from
 *  the split-constraint laws. Preview-only: nothing applies. With a
 *  program type, opens straight to that board's days. */
export function navigateToSplitLab(program?: string) {
  push(program ? `/split-lab?program=${program}` : '/split-lab');
}


/** Open the split-selection flow (Full Body vs AM/PM, day-of-week). */
export function navigateToSplitSelection() {
  push('/split-selection');
}





// ─── Replace helpers (redirects) ────────────────────────────────────────

export function replaceWithHome() {
  replace('/');
}

/**
 * Replace with the selector — the dead-floor redirect (workout-detail
 * with no session and no id, whatever brought it there: save, discard,
 * or a stale URL). REPLACE, never push: the dead stage entry must not
 * stay in the back stack, and the redirect must be the FLOW'S ONE
 * navigation — a back() fired beside it races the reset re-render and
 * the late pop eats the redirect (the stranded-spinner bug).
 */
export function replaceWithSplitSelection() {
  replace('/split-selection');
}

/**
 * Return to the live session by REPLACING the current entry — the
 * session strip and resume paths must never stack a second stage on
 * top of a hidden one (duplicate mounted screens grow the stack every
 * minimize/return cycle).
 */
export function replaceWithWorkoutDetail() {
  replace('/workout-detail');
}

export function replaceWithLogin() {
  replace('/login');
}

export function replaceWithRegister() {
  replace('/register');
}

/**
 * Replace with the forgot-password screen. Reached from the login
 * screen's "forgot password?" link. `push` is usually right there
 * (login should stay in the back-stack) — this variant is for the rare
 * redirect-from-deep-link case.
 */
export function replaceWithForgotPassword() {
  replace('/forgot-password');
}

// ─── Back navigation ────────────────────────────────────────────────────

/**
 * Safe back navigation — prefers `back()` when there's history to
 * go back to, otherwise falls back to home (if authenticated) or login.
 *
 * Use this instead of `back()` anywhere a user can hit "back"
 * without a guaranteed parent route (deep links, refreshed PWA tabs).
 *
 * Reads auth state via `useAuthStore.getState()` (non-reactive) so the
 * decision reflects the current auth state at call time without
 * subscribing the helper to the store.
 */
export function safeGoBack() {
  if (router.canGoBack()) {
    back();
    return;
  }

  const { status } = useAuthStore.getState();
  if (status === 'authenticated') {
    replace('/');
  } else {
    replace('/login');
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
      push('/');
      return;
    }
    push(`/${parentPath}`);
    return;
  }

  push('/');
}

// Re-export the underlying router instance + type for consumers that
// need to pass it along (e.g. a navigation context provider).
export { router as routerInstance };
export type { Router };
