/**
 * @fileoverview Environment variable validation utility.
 *
 * Validates required environment variables on app startup. Logs warnings for
 * missing optional vars and throws for required ones. Vellum ships with the
 * Supabase URL + anon key pair as the required minimum — consumers adding
 * bridge secrets, analytics keys, etc. extend ENV_CONFIG.
 *
 * @example
 *   import { validateEnvironment } from './utils/envValidation';
 *   validateEnvironment();
 *
 * Note on dynamic env access: the Expo bundler inlines `process.env.EXPO_PUBLIC_*`
 * only when the access is statically analyzable (e.g. `process.env.EXPO_PUBLIC_FOO`).
 * This file iterates `ENV_CONFIG` and accesses env vars dynamically by design —
 * that's the whole point of a generic validator. Consumers calling
 * `validateEnvironment()` do so at module load (server / build time), where the
 * full `process.env` is available. The Expo client-side inlining caveat doesn't
 * apply because this file isn't in the hot path; `constants/supabase.ts` uses
 * static access for the values that DO flow to the client.
 */
/* eslint-disable expo/no-dynamic-env-var */

import { logger } from './logger';

interface EnvVarConfig {
  key: string;
  required: boolean;
  description: string;
  deprecated?: boolean;
  replacement?: string;
}

const ENV_CONFIG: EnvVarConfig[] = [
  {
    key: 'EXPO_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
  },
  {
    key: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key for client-side operations',
  },
];

export function validateEnvironment(throwOnMissing: boolean = false): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];
  const isDevelopment =
    typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

  for (const config of ENV_CONFIG) {
    const value = process.env[config.key];

    if (config.deprecated && value) {
      const message = config.replacement
        ? `${config.key} is deprecated. Use ${config.replacement} instead.`
        : `${config.key} is deprecated and will be removed in a future version.`;
      warnings.push(message);
      logger.warn('env', message);
    }

    if (config.required && !value) {
      missing.push(config.key);
      const message = `Missing required environment variable: ${config.key} (${config.description})`;
      logger.error('env', message);

      if (throwOnMissing) {
        // s10-exempt: module-load env validation. The caller asked for a
        // throw by setting throwOnMissing=true; AppError would just re-wrap
        // the same diagnostic string.
        throw new Error(message);
      }
    }

    if (!config.required && !value && !isDevelopment) {
      logger.debug('env', `Optional environment variable not set: ${config.key}`);
    }
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      new URL(supabaseUrl);
    } catch {
      warnings.push('EXPO_PUBLIC_SUPABASE_URL is not a valid URL');
      logger.warn('env', 'EXPO_PUBLIC_SUPABASE_URL is not a valid URL format');
    }
  }

  if (missing.length === 0 && warnings.length === 0) {
    logger.info('env', 'Environment validation passed');
  } else if (missing.length > 0) {
    logger.warn(
      'env',
      `Environment validation failed: ${missing.length} missing, ${warnings.length} warnings`,
    );
  } else {
    logger.warn('env', `Environment validation completed with ${warnings.length} warnings`);
  }

  return { isValid: missing.length === 0, missing, warnings };
}

export function isEnvironmentValid(): boolean {
  return ENV_CONFIG.filter((c) => c.required).every((c) => !!process.env[c.key]);
}

export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] ?? defaultValue;
}

export function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    // s10-exempt: module-load env access. Same rationale as
    // validateEnvironment — fail-fast at startup, AppError adds nothing.
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}
