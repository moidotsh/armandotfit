// shared/exercises/plateUrl.ts
// THE PLATE SEAM — where plates are served from. The catalog data
// stays pure (root-relative paths: '/exercise-plates/<slug>.jpg');
// the URL resolves at render: EXPO_PUBLIC_PLATE_BASE, when set
// (production), prefixes the Blob store's base — the 61 MB of plates
// rides ONE Blob store instead of every deployment's output. Unset
// (local dev, screenshots), the path is served from public/ as
// always. One seam, both worlds.
//
// Setup (production): create a public Blob store, run
// `bun run plates:upload`, set EXPO_PUBLIC_PLATE_BASE in the Vercel
// project to the store's base URL (the
// https://<store-hash>.public.blob.vercel-storage.com prefix — no
// trailing slash). The deploy build strips dist/exercise-plates.

/**
 * Resolve a catalog plate path to its served URL. Returns undefined
 * for absent paths (the callers' own guards stay responsible for
 * rendering).
 */
export function plateUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  const base = process.env.EXPO_PUBLIC_PLATE_BASE;
  if (!base) return path;
  return `${base.replace(/\/+$/, '')}${path}`;
}
