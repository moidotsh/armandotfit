// components/primitives/AuthGuard.tsx
// Central auth-flow redirect wrapper. Reads the live auth status from
// authStore + the current top-most route segment from expo-router, and
// redirects when the two disagree:
//
//   • unauthenticated + app route      → /login
//   • authenticated  + auth route      → /
//
// Sits inside <AuthProvider> in _layout.tsx and wraps the <Stack/>.
// Idempotent: re-runs only when status or the root segment changes.
//
// While status is 'idle' (initial store state on every boot — authStore
// no longer persists status, see stores/authStore.ts) or 'loading'
// (restore in flight), the guard renders children unchanged so the
// restore window doesn't flash a redirect. The AuthProvider's
// mount-time setStatus('loading') call is what guarantees 'loading' is
// observed; without it, status would stay at 'idle' through the first
// render. AuthGuard treats both identically, so the explicit flip is
// belt-and-suspenders.

import React, { useEffect } from 'react';
import { useSegments } from 'expo-router';
import { useAuthStore } from '../../stores';
import { replaceWithHome, replaceWithLogin } from '../../navigation';

const AUTH_SEGMENTS = new Set(['login', 'register', 'forgot-password']);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const segments = useSegments();
  const root = segments[0];

  useEffect(() => {
    if (status === 'idle' || status === 'loading') return;
    const inAuthGroup =
      typeof root === 'string' && AUTH_SEGMENTS.has(root);
    if (status === 'unauthenticated' && !inAuthGroup) {
      replaceWithLogin();
    } else if (status === 'authenticated' && inAuthGroup) {
      replaceWithHome();
    }
  }, [status, root]);

  return <>{children}</>;
}

export default AuthGuard;
