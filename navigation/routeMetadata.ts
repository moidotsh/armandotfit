// navigation/routeMetadata.ts
// Consumer-owned registry of per-route "Copy for AI" metadata for
// armandotfit. The shell scaffolding (mirrored from arqavellum) ships
// an empty map; this file fills it with armandotfit's routes.
//
// Lookup is path-keyed, normalised to a leading-slash-less form
// (e.g. '/analytics' → 'analytics'). The root index is ''. Prefix
// fallback lets a nested route like '/dev/premium' inherit '/dev'
// if only the parent is registered.
//
// When you add a new route wired to <CopyForAiButton>, add an entry
// here in the same change (per armandotfit/CLAUDE.md doc maintenance).

export interface AiRouteMeta {
  /** Optional human-readable title for the route. */
  title?: string;
  /** Optional "where am I / how did I get here" eyebrow label. */
  contextLabel?: string;
}

const ROUTE_AI_METADATA: Record<string, AiRouteMeta> = {
  '': { title: 'Dashboard', contextLabel: 'Home' },
  'split-selection': { title: 'Start workout', contextLabel: 'Plan a session' },
  'workout-detail': { title: 'Workout', contextLabel: 'Active session / history' },
  'exercise-database': { title: 'Exercises', contextLabel: 'Library' },
  'exercise-detail': { title: 'Exercise', contextLabel: 'Library detail' },
  progression: { title: 'Progression', contextLabel: 'Lifetime totals' },
  analytics: { title: 'Analytics', contextLabel: 'History' },
  'workout-programs': { title: 'Programs', contextLabel: 'Templates' },
  'equipment-inventory': { title: 'Equipment', contextLabel: 'Capability wizard' },
  'plan-preview': { title: 'Plan preview', contextLabel: 'Phase 3 planner' },
  'plan-replacement': { title: 'Replace slot', contextLabel: 'Phase 3 planner' },
  settings: { title: 'Settings', contextLabel: 'Preferences' },
  dev: { title: 'Dev', contextLabel: 'Internal' },
};

function normaliseKey(pathname: string): string {
  if (typeof pathname !== 'string') return '';
  const trimmed = pathname.trim();
  if (trimmed === '' || trimmed === '/') return '';
  return trimmed.replace(/^\//, '');
}

/**
 * Look up AI metadata for a pathname. Falls back through progressively
 * shorter path prefixes (so '/dev/premium' inherits '/dev' if only the
 * parent is registered). Returns an empty object when nothing matches.
 */
export function getAiRouteMetadata(pathname: string): AiRouteMeta {
  const key = normaliseKey(pathname);
  if (key === '') return ROUTE_AI_METADATA[''] ?? {};
  const segments = key.split('/');
  for (let i = segments.length; i > 0; i -= 1) {
    const candidate = segments.slice(0, i).join('/');
    const entry = ROUTE_AI_METADATA[candidate];
    if (entry) return entry;
  }
  return ROUTE_AI_METADATA[''] ?? {};
}
