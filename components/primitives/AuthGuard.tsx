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
// While status is 'idle' (pre-restore persisted value) or 'loading'
// (restore in flight), the guard renders children unchanged so the
// restore window doesn't flash a redirect. The AuthProvider's setStatus
// flip to 'loading' on mount is what unblocks this — without it, the
// restored 'authenticated'/'unauthenticated' value would gate the very
// first render and we'd never see 'idle' anyway, but the explicit flip
// keeps the semantics clear.

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
