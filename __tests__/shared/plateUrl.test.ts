// __tests__/shared/plateUrl.test.ts
// THE PLATE SEAM — the one place plates decide where they live.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { plateUrl } from '../../shared/exercises';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('plateUrl', () => {
  it('without a base, the catalog path is served as-is (local dev + screenshots)', () => {
    vi.stubEnv('EXPO_PUBLIC_PLATE_BASE', '');
    expect(plateUrl('/exercise-plates/leg-press.jpg')).toBe('/exercise-plates/leg-press.jpg');
  });

  it('with a base, the path prefixes the Blob store URL', () => {
    vi.stubEnv('EXPO_PUBLIC_PLATE_BASE', 'https://abc123.public.blob.vercel-storage.com');
    expect(plateUrl('/exercise-plates/leg-press.jpg')).toBe(
      'https://abc123.public.blob.vercel-storage.com/exercise-plates/leg-press.jpg',
    );
  });

  it('a trailing slash on the base never double-slashes', () => {
    vi.stubEnv('EXPO_PUBLIC_PLATE_BASE', 'https://abc123.public.blob.vercel-storage.com/');
    expect(plateUrl('/exercise-plates/leg-press.jpg')).toBe(
      'https://abc123.public.blob.vercel-storage.com/exercise-plates/leg-press.jpg',
    );
  });

  it('absent paths stay undefined (the render guards keep their job)', () => {
    vi.stubEnv('EXPO_PUBLIC_PLATE_BASE', 'https://abc123.public.blob.vercel-storage.com');
    expect(plateUrl(undefined)).toBeUndefined();
    expect(plateUrl(null)).toBeUndefined();
    expect(plateUrl('')).toBeUndefined();
  });
});
