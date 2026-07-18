// context/AuthContext.tsx
// Auth context — wires vellum's AuthService to the React tree. The
// `useAuth()` hook is the consumer-side surface; the provider reads
// the session once on mount and subscribes to Supabase auth state
// changes so sign-in / sign-out / token refresh propagate.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthService, type AuthSession } from '../utils/supabase';
import { logger } from '../utils';

interface AuthContextValue {
  session: AuthSession | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore session on mount + subscribe to auth state changes. The
  // `cancelled` flag guards every setState after the await window so
  // an unmount during restoreSession doesn't try to write into a
  // gone provider (audit R1).
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    (async () => {
      try {
        const restored = await AuthService.restoreSession();
        if (cancelled) return;
        setSession(restored);
        unsubscribe = AuthService.onAuthStateChange((next) => {
          if (cancelled) return;
          setSession(next);
        });
      } catch (e) {
        if (!cancelled) logger.warn('auth', 'AuthProvider restore failed', e);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      signIn: async (email, password) => {
        const r = await AuthService.signIn(email, password);
        if (r.success && r.session) setSession(r.session);
        return { success: r.success, error: r.error };
      },
      signUp: async (email, password) => {
        const r = await AuthService.signUp(email, password);
        if (r.success && r.session) setSession(r.session);
        return { success: r.success, error: r.error };
      },
      signOut: async () => {
        await AuthService.signOut();
        setSession(null);
      },
      resetPassword: async (email) => {
        const r = await AuthService.resetPassword(email);
        return { success: r.success, error: r.error };
      },
    }),
    [session, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // s10-exempt: programmer-error invariant — calling useAuth outside
    // <AuthProvider> is a wiring bug, not a runtime error to surface.
    // AppError's domain-categorization machinery doesn't add anything.
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

export default AuthProvider;
