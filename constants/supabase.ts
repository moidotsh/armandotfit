// constants/supabase.ts
// Supabase project coordinates. Behavior on missing env vars is split by
// environment so the shell works as a starter AND fails loudly in production:
//
//   - Development: warn once via logger and fall back to '' so the design-
//     system showcase at /dev/premium renders before Supabase is configured.
//     Auth/data flows will fail at runtime with a clear "Invalid URL" error
//     from the Supabase SDK — that's the right shape for "not set up yet."
//
//   - Production: throw at module load (bundle time). A production deploy
//     with missing env is a misconfiguration that should fail the build,
//     not silently degrade in users' browsers.
//
// The dynamic `process.env[key]` access in requiredEnv is intentional: the
// helper exists to avoid restating the throw/warn boilerplate for each of
// the two required vars below. Expo's bundler inlines the static access in
// the call sites (the exports below) — this helper just centralizes the guard.
/* eslint-disable expo/no-dynamic-env-var */

import { logger } from '../utils/logger';

const isProduction = process.env.NODE_ENV === 'production';

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (value) return value;

  const message = `Missing required env var: ${key}. Vellum needs EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY set in .env.local (or your host's env). See utils/envValidation.ts.`;

  if (isProduction) {
    // s10-exempt: production bundle-time fail-fast. AppError's domain
    // machinery doesn't add anything for a missing build-time env var;
    // the throw needs to fire during `expo export` so the broken deploy
    // never lands.
    throw new Error(message);
  }

  // Dev: warn and fall back. The shell showcase needs to render before
  // the consumer has configured Supabase. Auth/data flows will surface
  // a runtime error from the Supabase SDK if invoked in this state.
  logger.warn('env', `${message} — falling back to '' in dev so the showcase can render.`);
  return '';
}

export const SUPABASE_URL: string = requiredEnv('EXPO_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY: string = requiredEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');
export const SUPABASE_FUNCTIONS_URL: string = `${SUPABASE_URL}/functions/v1`;
