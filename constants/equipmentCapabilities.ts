// constants/equipmentCapabilities.ts
//
// SOC-clean fitness-domain data: the capability inventory model that
// powers equipment onboarding (Phase 2) + later eligibility (Phase 3).
// Mirrors `constants/workoutSplits.ts` in shape — runtime data +
// helpers decoupled from theme.
//
// Two layers live here:
//   1. Capability catalog — 26 user-facing equipment concepts grouped
//      by fitness category. The catalog is the source of truth for the
//      onboarding UI's option list.
//   2. Resolver — pure functions mapping a capability selection to the
//      concrete EquipmentSlug values that Phase 1's requirement paths
//      key against. Most capabilities map 1:1; four are detail-bearing
//      (bench, cable-station, leg-curl, calf-raise) and resolve to
//      multiple slugs based on the details struct.
//
// The DB stores capability_slug as TEXT (see migration
// 20260722000000_user_equipment_capabilities.sql); this file owns the
// canonical TS-side slug union. The four-place contract from
// CLAUDE.md invariant #9 doesn't apply here — capabilities are a
// consumer-owned concept, not a system-exercise attribute. Adding a
// capability means: extending this file, the wizard UI, and the
// resolver's mapping. No DB migration needed unless a new capability
// introduces a new detail shape that warrants a CHECK.

import { EquipmentSlug } from '../shared/exercises/data';

// ──────────────────────────────────────────────────────────────────────
// Capability slug union
// ──────────────────────────────────────────────────────────────────────

export const EquipmentCapabilitySlug = {
  // Free weights
  DUMBBELLS: 'dumbbells',
  BARBELL: 'barbell',
  KETTLEBELL: 'kettlebell',
  // Bench + rack
  BENCH: 'bench',
  SQUAT_RACK: 'squat-rack',
  PULL_UP_BAR: 'pull-up-bar',
  // Cables (detail-bearing)
  CABLE_STATION: 'cable-station',
  // Upper-body machines
  CHEST_PRESS: 'chest-press',
  CHEST_FLY: 'chest-fly',
  LAT_PULLDOWN: 'lat-pulldown',
  SEATED_ROW: 'seated-row',
  SHOULDER_PRESS: 'shoulder-press',
  TRICEP_EXTENSION: 'tricep-extension',
  DIP_MACHINE: 'dip-machine',
  SHRUG: 'shrug',
  ABDOMINAL: 'abdominal',
  // Lower-body machines
  LEG_PRESS: 'leg-press',
  HACK_SQUAT: 'hack-squat',
  LEG_EXTENSION: 'leg-extension',
  LEG_CURL: 'leg-curl', // detail-bearing (seated / lying)
  CALF_RAISE: 'calf-raise', // detail-bearing (standing / seated / leg-press)
  HIP_ADDUCTION: 'hip-adduction',
  TIBIALIS_RAISE: 'tibialis-raise',
  // Stations
  CAPTAINS_CHAIR: 'captains-chair',
  BACK_EXTENSION: 'back-extension',
  // Accessory / floor
  RESISTANCE_BAND: 'resistance-band',
  FLOOR_SPACE: 'floor-space',
} as const;

export type EquipmentCapabilitySlug =
  (typeof EquipmentCapabilitySlug)[keyof typeof EquipmentCapabilitySlug];

export const EQUIPMENT_CAPABILITY_SLUGS: readonly EquipmentCapabilitySlug[] =
  Object.values(EquipmentCapabilitySlug);

// ──────────────────────────────────────────────────────────────────────
// Detail shapes (only capabilities whose resolution depends on details)
// ──────────────────────────────────────────────────────────────────────

export type CableAttachmentSlug = 'rope' | 'straight-bar' | 'v-bar' | 'lat-bar' | 'handle';
export type CableHeightSlug = 'low' | 'mid' | 'high' | 'adjustable';

export interface CableStationDetails {
  attachments: CableAttachmentSlug[];
  heights: CableHeightSlug[];
}

export type BenchPositionSlug = 'flat' | 'incline' | 'decline';

export interface BenchDetails {
  positions: BenchPositionSlug[];
}

export type LegCurlVariantSlug = 'seated' | 'lying';

export interface LegCurlDetails {
  variants: LegCurlVariantSlug[];
}

export type CalfRaiseVariantSlug = 'standing' | 'seated' | 'leg-press';

export interface CalfRaiseDetails {
  variants: CalfRaiseVariantSlug[];
}

// Union of every detail-bearing capability slug. Used to narrow types
// at resolver + validation call sites.
export type DetailBearingCapabilitySlug =
  | typeof EquipmentCapabilitySlug.CABLE_STATION
  | typeof EquipmentCapabilitySlug.BENCH
  | typeof EquipmentCapabilitySlug.LEG_CURL
  | typeof EquipmentCapabilitySlug.CALF_RAISE;

// ──────────────────────────────────────────────────────────────────────
// Display metadata
// ──────────────────────────────────────────────────────────────────────

export type EquipmentCapabilityGroup =
  | 'free-weights'
  | 'bench-rack'
  | 'cable'
  | 'upper-machines'
  | 'lower-machines'
  | 'stations'
  | 'accessory';

export interface EquipmentCapabilityInfo {
  slug: EquipmentCapabilitySlug;
  label: string;
  description: string;
  group: EquipmentCapabilityGroup;
  /** True if the resolver needs details to compute equipment slugs. */
  hasDetails: boolean;
}

export const EQUIPMENT_CAPABILITY_GROUPS: Array<{
  id: EquipmentCapabilityGroup;
  label: string;
}> = [
  { id: 'free-weights', label: 'Free weights' },
  { id: 'bench-rack', label: 'Benches & racks' },
  { id: 'cable', label: 'Cables' },
  { id: 'upper-machines', label: 'Machines — upper body' },
  { id: 'lower-machines', label: 'Machines — lower body' },
  { id: 'stations', label: 'Specialty stations' },
  { id: 'accessory', label: 'Accessories & floor' },
];

export const EQUIPMENT_CAPABILITIES: Record<EquipmentCapabilitySlug, EquipmentCapabilityInfo> = {
  // Free weights
  [EquipmentCapabilitySlug.DUMBBELLS]: {
    slug: EquipmentCapabilitySlug.DUMBBELLS,
    label: 'Dumbbells',
    description: 'Pair of dumbbells with enough weight for pressing, curling, and rowing.',
    group: 'free-weights',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.BARBELL]: {
    slug: EquipmentCapabilitySlug.BARBELL,
    label: 'Barbell',
    description: 'Standard Olympic barbell with plates for compound lifts.',
    group: 'free-weights',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.KETTLEBELL]: {
    slug: EquipmentCapabilitySlug.KETTLEBELL,
    label: 'Kettlebell',
    description: 'At least one kettlebell for swings, carries, and goblet work.',
    group: 'free-weights',
    hasDetails: false,
  },
  // Bench + rack
  [EquipmentCapabilitySlug.BENCH]: {
    slug: EquipmentCapabilitySlug.BENCH,
    label: 'Weight bench',
    description: 'A bench with adjustable or fixed positions. Configure which positions you have.',
    group: 'bench-rack',
    hasDetails: true,
  },
  [EquipmentCapabilitySlug.SQUAT_RACK]: {
    slug: EquipmentCapabilitySlug.SQUAT_RACK,
    label: 'Squat rack',
    description: 'Power rack or squat stand sturdy enough for barbell work.',
    group: 'bench-rack',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.PULL_UP_BAR]: {
    slug: EquipmentCapabilitySlug.PULL_UP_BAR,
    label: 'Pull-up bar',
    description: 'Wall-mounted, doorway, or rack-mounted pull-up bar.',
    group: 'bench-rack',
    hasDetails: false,
  },
  // Cables
  [EquipmentCapabilitySlug.CABLE_STATION]: {
    slug: EquipmentCapabilitySlug.CABLE_STATION,
    label: 'Cable station',
    description: 'Adjustable cable column or dual-pulley station. Configure attachments and heights.',
    group: 'cable',
    hasDetails: true,
  },
  // Upper-body machines
  [EquipmentCapabilitySlug.CHEST_PRESS]: {
    slug: EquipmentCapabilitySlug.CHEST_PRESS,
    label: 'Chest press machine',
    description: 'Selectorized or plate-loaded chest press.',
    group: 'upper-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.CHEST_FLY]: {
    slug: EquipmentCapabilitySlug.CHEST_FLY,
    label: 'Chest fly / pec deck',
    description: 'Chest fly machine or pec deck station.',
    group: 'upper-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.LAT_PULLDOWN]: {
    slug: EquipmentCapabilitySlug.LAT_PULLDOWN,
    label: 'Lat pulldown machine',
    description: 'Dedicated lat pulldown station (separate from a cable column).',
    group: 'upper-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.SEATED_ROW]: {
    slug: EquipmentCapabilitySlug.SEATED_ROW,
    label: 'Seated row machine',
    description: 'Selectorized seated-row machine (separate from a cable column).',
    group: 'upper-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.SHOULDER_PRESS]: {
    slug: EquipmentCapabilitySlug.SHOULDER_PRESS,
    label: 'Shoulder press machine',
    description: 'Selectorized or plate-loaded overhead press machine.',
    group: 'upper-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.TRICEP_EXTENSION]: {
    slug: EquipmentCapabilitySlug.TRICEP_EXTENSION,
    label: 'Tricep extension machine',
    description: 'Dedicated tricep pushdown or extension machine.',
    group: 'upper-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.DIP_MACHINE]: {
    slug: EquipmentCapabilitySlug.DIP_MACHINE,
    label: 'Assisted dip machine',
    description: 'Machine with platform for assisted or weighted dips.',
    group: 'upper-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.SHRUG]: {
    slug: EquipmentCapabilitySlug.SHRUG,
    label: 'Shrug machine',
    description: 'Plate-loaded or selectorized shrug machine.',
    group: 'upper-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.ABDOMINAL]: {
    slug: EquipmentCapabilitySlug.ABDOMINAL,
    label: 'Ab crunch machine',
    description: 'Selectorized abdominal crunch machine.',
    group: 'upper-machines',
    hasDetails: false,
  },
  // Lower-body machines
  [EquipmentCapabilitySlug.LEG_PRESS]: {
    slug: EquipmentCapabilitySlug.LEG_PRESS,
    label: 'Leg press',
    description: '45° or vertical leg press machine.',
    group: 'lower-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.HACK_SQUAT]: {
    slug: EquipmentCapabilitySlug.HACK_SQUAT,
    label: 'Hack squat machine',
    description: 'Plate-loaded hack squat or pendulum squat.',
    group: 'lower-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.LEG_EXTENSION]: {
    slug: EquipmentCapabilitySlug.LEG_EXTENSION,
    label: 'Leg extension machine',
    description: 'Selectorized leg extension.',
    group: 'lower-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.LEG_CURL]: {
    slug: EquipmentCapabilitySlug.LEG_CURL,
    label: 'Leg curl machine',
    description: 'Seated and/or lying leg curl. Configure which variants you have.',
    group: 'lower-machines',
    hasDetails: true,
  },
  [EquipmentCapabilitySlug.CALF_RAISE]: {
    slug: EquipmentCapabilitySlug.CALF_RAISE,
    label: 'Calf raise',
    description: 'Standing, seated, or leg-press calf raise. Configure which variants you have.',
    group: 'lower-machines',
    hasDetails: true,
  },
  [EquipmentCapabilitySlug.HIP_ADDUCTION]: {
    slug: EquipmentCapabilitySlug.HIP_ADDUCTION,
    label: 'Hip adduction machine',
    description: 'Selectorized hip adduction / abduction machine.',
    group: 'lower-machines',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.TIBIALIS_RAISE]: {
    slug: EquipmentCapabilitySlug.TIBIALIS_RAISE,
    label: 'Tibialis raise',
    description: 'Dedicated tib-raise machine or resistance band anchor for dorsiflexion.',
    group: 'lower-machines',
    hasDetails: false,
  },
  // Stations
  [EquipmentCapabilitySlug.CAPTAINS_CHAIR]: {
    slug: EquipmentCapabilitySlug.CAPTAINS_CHAIR,
    label: "Captain's chair",
    description: 'Vertical knee / leg-raise station.',
    group: 'stations',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.BACK_EXTENSION]: {
    slug: EquipmentCapabilitySlug.BACK_EXTENSION,
    label: 'Back extension station',
    description: 'Roman chair or 45° back extension station.',
    group: 'stations',
    hasDetails: false,
  },
  // Accessory / floor
  [EquipmentCapabilitySlug.RESISTANCE_BAND]: {
    slug: EquipmentCapabilitySlug.RESISTANCE_BAND,
    label: 'Resistance band',
    description: 'Loop or tube resistance band for mobility and accessory work.',
    group: 'accessory',
    hasDetails: false,
  },
  [EquipmentCapabilitySlug.FLOOR_SPACE]: {
    slug: EquipmentCapabilitySlug.FLOOR_SPACE,
    label: 'Floor space',
    description: 'Clear floor space for bodyweight work (leg raises, stretches).',
    group: 'accessory',
    hasDetails: false,
  },
};

/** Ordered list grouped by `EquipmentCapabilityGroup`. Stable for selectors. */
export const EQUIPMENT_CAPABILITY_LIST: EquipmentCapabilityInfo[] = EQUIPMENT_CAPABILITY_SLUGS.map(
  (slug) => EQUIPMENT_CAPABILITIES[slug],
);

// ──────────────────────────────────────────────────────────────────────
// Option lists for detail multi-selects (used by the onboarding wizard)
// ──────────────────────────────────────────────────────────────────────

export const CABLE_ATTACHMENT_OPTIONS: Array<{ id: CableAttachmentSlug; label: string }> = [
  { id: 'rope', label: 'Rope' },
  { id: 'straight-bar', label: 'Straight bar' },
  { id: 'v-bar', label: 'V-bar' },
  { id: 'lat-bar', label: 'Lat pulldown bar' },
  { id: 'handle', label: 'Single handle' },
];

export const CABLE_HEIGHT_OPTIONS: Array<{ id: CableHeightSlug; label: string }> = [
  { id: 'low', label: 'Low' },
  { id: 'mid', label: 'Mid' },
  { id: 'high', label: 'High' },
  { id: 'adjustable', label: 'Adjustable column' },
];

export const BENCH_POSITION_OPTIONS: Array<{ id: BenchPositionSlug; label: string }> = [
  { id: 'flat', label: 'Flat' },
  { id: 'incline', label: 'Incline' },
  { id: 'decline', label: 'Decline' },
];

export const LEG_CURL_VARIANT_OPTIONS: Array<{ id: LegCurlVariantSlug; label: string }> = [
  { id: 'seated', label: 'Seated' },
  { id: 'lying', label: 'Lying (prone)' },
];

export const CALF_RAISE_VARIANT_OPTIONS: Array<{ id: CalfRaiseVariantSlug; label: string }> = [
  { id: 'standing', label: 'Standing machine' },
  { id: 'seated', label: 'Seated machine' },
  { id: 'leg-press', label: 'Leg press platform' },
];

// ──────────────────────────────────────────────────────────────────────
// 1:1 capability → equipment slug map (non-detail-bearing capabilities)
// ──────────────────────────────────────────────────────────────────────

const SIMPLE_CAPABILITY_TO_EQUIPMENT: Partial<Record<EquipmentCapabilitySlug, EquipmentSlug>> = {
  [EquipmentCapabilitySlug.DUMBBELLS]: EquipmentSlug.DUMBBELL,
  [EquipmentCapabilitySlug.BARBELL]: EquipmentSlug.BARBELL,
  [EquipmentCapabilitySlug.KETTLEBELL]: EquipmentSlug.KETTLEBELL,
  [EquipmentCapabilitySlug.SQUAT_RACK]: EquipmentSlug.SQUAT_RACK,
  [EquipmentCapabilitySlug.PULL_UP_BAR]: EquipmentSlug.PULL_UP_BAR,
  [EquipmentCapabilitySlug.CHEST_PRESS]: EquipmentSlug.CHEST_PRESS_MACHINE,
  [EquipmentCapabilitySlug.CHEST_FLY]: EquipmentSlug.CHEST_FLY_MACHINE,
  [EquipmentCapabilitySlug.LAT_PULLDOWN]: EquipmentSlug.LAT_PULLDOWN_MACHINE,
  [EquipmentCapabilitySlug.SEATED_ROW]: EquipmentSlug.SEATED_ROW_MACHINE,
  [EquipmentCapabilitySlug.SHOULDER_PRESS]: EquipmentSlug.SHOULDER_PRESS_MACHINE,
  [EquipmentCapabilitySlug.TRICEP_EXTENSION]: EquipmentSlug.TRICEP_EXTENSION_MACHINE,
  [EquipmentCapabilitySlug.DIP_MACHINE]: EquipmentSlug.DIP_MACHINE,
  [EquipmentCapabilitySlug.SHRUG]: EquipmentSlug.SHRUG_MACHINE,
  [EquipmentCapabilitySlug.ABDOMINAL]: EquipmentSlug.ABDOMINAL_MACHINE,
  [EquipmentCapabilitySlug.LEG_PRESS]: EquipmentSlug.LEG_PRESS_MACHINE,
  [EquipmentCapabilitySlug.HACK_SQUAT]: EquipmentSlug.HACK_SQUAT_MACHINE,
  [EquipmentCapabilitySlug.LEG_EXTENSION]: EquipmentSlug.LEG_EXTENSION_MACHINE,
  [EquipmentCapabilitySlug.HIP_ADDUCTION]: EquipmentSlug.HIP_ADDUCTION_MACHINE,
  [EquipmentCapabilitySlug.TIBIALIS_RAISE]: EquipmentSlug.TIBIA_RAISE_MACHINE,
  [EquipmentCapabilitySlug.CAPTAINS_CHAIR]: EquipmentSlug.CAPTAINS_CHAIR,
  [EquipmentCapabilitySlug.BACK_EXTENSION]: EquipmentSlug.BACK_EXTENSION_STATION,
  [EquipmentCapabilitySlug.RESISTANCE_BAND]: EquipmentSlug.RESISTANCE_BAND,
  [EquipmentCapabilitySlug.FLOOR_SPACE]: EquipmentSlug.FLOOR_SPACE,
};

const CABLE_ATTACHMENT_TO_EQUIPMENT: Record<CableAttachmentSlug, EquipmentSlug> = {
  rope: EquipmentSlug.CABLE_ROPE,
  'straight-bar': EquipmentSlug.CABLE_STRAIGHT_BAR,
  'v-bar': EquipmentSlug.CABLE_V_BAR,
  'lat-bar': EquipmentSlug.CABLE_LAT_BAR,
  handle: EquipmentSlug.CABLE_HANDLE,
};

const BENCH_POSITION_TO_EQUIPMENT: Record<BenchPositionSlug, EquipmentSlug> = {
  flat: EquipmentSlug.FLAT_BENCH,
  incline: EquipmentSlug.INCLINE_BENCH,
  decline: EquipmentSlug.DECLINE_BENCH,
};

const LEG_CURL_VARIANT_TO_EQUIPMENT: Record<LegCurlVariantSlug, EquipmentSlug> = {
  seated: EquipmentSlug.LEG_CURL_MACHINE,
  lying: EquipmentSlug.LYING_LEG_CURL_MACHINE,
};

const CALF_RAISE_VARIANT_TO_EQUIPMENT: Record<CalfRaiseVariantSlug, EquipmentSlug> = {
  standing: EquipmentSlug.CALF_RAISE_MACHINE,
  seated: EquipmentSlug.SEATED_CALF_RAISE_MACHINE,
  'leg-press': EquipmentSlug.LEG_PRESS_MACHINE,
};

// ──────────────────────────────────────────────────────────────────────
// Selection shape (input to the resolver)
// ──────────────────────────────────────────────────────────────────────

/**
 * A selected capability with its detail payload (if any). The detail
 * shape narrows per capability — the resolver validates the shape and
 * reads only the fields relevant to that capability.
 */
export interface SelectedCapability {
  slug: EquipmentCapabilitySlug;
  details?: Record<string, unknown>;
}

export type ValidationResult = { ok: true } | { ok: false; error: string };

// ──────────────────────────────────────────────────────────────────────
// Validator + resolver
// ──────────────────────────────────────────────────────────────────────

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function pickKnown<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T[] | null {
  if (!isStringArray(value)) return null;
  const allowedSet = new Set(allowed);
  const known = value.filter((v): v is T => allowedSet.has(v as T));
  // Unknown values in the array are silently dropped (not a hard error)
  // — the resolver only cares that at least one known value survives.
  return known;
}

/**
 * Validate the details payload for a detail-bearing capability. Returns
 * a normalized details object on success or an error string on failure.
 * Non-detail-bearing capabilities accept any details (including
 * undefined) and validate as `{}`.
 */
export function validateCapabilityDetails(
  slug: EquipmentCapabilitySlug,
  details: Record<string, unknown> | undefined,
): { ok: true; details: Record<string, unknown> } | { ok: false; error: string } {
  if (slug === EquipmentCapabilitySlug.CABLE_STATION) {
    const rawAttachments = details?.attachments;
    const rawHeights = details?.heights;
    const attachments = pickKnown(rawAttachments, CABLE_ATTACHMENT_OPTIONS.map((o) => o.id));
    if (attachments === null) {
      return { ok: false, error: 'cable-station.attachments must be a string array' };
    }
    if (attachments.length === 0) {
      return { ok: false, error: 'cable-station requires at least one attachment' };
    }
    // heights are optional; if provided, must be a known string array.
    const heights = rawHeights === undefined
      ? []
      : pickKnown(rawHeights, CABLE_HEIGHT_OPTIONS.map((o) => o.id));
    if (heights === null) {
      return { ok: false, error: 'cable-station.heights must be a string array' };
    }
    return { ok: true, details: { attachments, heights } };
  }
  if (slug === EquipmentCapabilitySlug.BENCH) {
    const positions = pickKnown(details?.positions, BENCH_POSITION_OPTIONS.map((o) => o.id));
    if (positions === null) {
      return { ok: false, error: 'bench.positions must be a string array' };
    }
    if (positions.length === 0) {
      return { ok: false, error: 'bench requires at least one position' };
    }
    return { ok: true, details: { positions } };
  }
  if (slug === EquipmentCapabilitySlug.LEG_CURL) {
    const variants = pickKnown(details?.variants, LEG_CURL_VARIANT_OPTIONS.map((o) => o.id));
    if (variants === null) {
      return { ok: false, error: 'leg-curl.variants must be a string array' };
    }
    if (variants.length === 0) {
      return { ok: false, error: 'leg-curl requires at least one variant' };
    }
    return { ok: true, details: { variants } };
  }
  if (slug === EquipmentCapabilitySlug.CALF_RAISE) {
    const variants = pickKnown(details?.variants, CALF_RAISE_VARIANT_OPTIONS.map((o) => o.id));
    if (variants === null) {
      return { ok: false, error: 'calf-raise.variants must be a string array' };
    }
    if (variants.length === 0) {
      return { ok: false, error: 'calf-raise requires at least one variant' };
    }
    return { ok: true, details: { variants } };
  }
  // Non-detail-bearing: ignore details entirely.
  return { ok: true, details: {} };
}

/**
 * Validate a full selection list. Rejects duplicate slugs, unknown
 * slugs, and detail-shape violations. Returns the normalized selections
 * on success (details trimmed to the canonical fields per capability).
 */
export function validateSelections(
  selections: ReadonlyArray<SelectedCapability>,
): { ok: true; selections: SelectedCapability[] } | { ok: false; error: string } {
  const seen = new Set<EquipmentCapabilitySlug>();
  const out: SelectedCapability[] = [];
  for (const sel of selections) {
    if (!EQUIPMENT_CAPABILITY_SLUGS.includes(sel.slug)) {
      return { ok: false, error: `unknown capability slug: ${String(sel.slug)}` };
    }
    if (seen.has(sel.slug)) {
      return { ok: false, error: `duplicate capability slug: ${sel.slug}` };
    }
    const detailsRes = validateCapabilityDetails(sel.slug, sel.details);
    if (!detailsRes.ok) return detailsRes;
    seen.add(sel.slug);
    out.push({ slug: sel.slug, details: detailsRes.details });
  }
  return { ok: true, selections: out };
}

/**
 * Resolve a single capability selection to its concrete EquipmentSlug
 * values. Detail-bearing capabilities return multiple slugs (deduped
 * within the capability). Returns an empty array only if the selection
 * is detail-bearing and the details validate as empty (the validator
 * rejects this case at the boundary, but the resolver is defensive).
 */
export function resolveCapabilityToEquipmentSlugs(
  selection: SelectedCapability,
): EquipmentSlug[] {
  switch (selection.slug) {
    case EquipmentCapabilitySlug.CABLE_STATION: {
      const attachments = pickKnown(
        selection.details?.attachments,
        CABLE_ATTACHMENT_OPTIONS.map((o) => o.id),
      );
      if (!attachments || attachments.length === 0) return [];
      const out = new Set<EquipmentSlug>();
      for (const a of attachments) out.add(CABLE_ATTACHMENT_TO_EQUIPMENT[a]);
      return [...out];
    }
    case EquipmentCapabilitySlug.BENCH: {
      const positions = pickKnown(
        selection.details?.positions,
        BENCH_POSITION_OPTIONS.map((o) => o.id),
      );
      if (!positions || positions.length === 0) return [];
      const out = new Set<EquipmentSlug>();
      for (const p of positions) out.add(BENCH_POSITION_TO_EQUIPMENT[p]);
      return [...out];
    }
    case EquipmentCapabilitySlug.LEG_CURL: {
      const variants = pickKnown(
        selection.details?.variants,
        LEG_CURL_VARIANT_OPTIONS.map((o) => o.id),
      );
      if (!variants || variants.length === 0) return [];
      const out = new Set<EquipmentSlug>();
      for (const v of variants) out.add(LEG_CURL_VARIANT_TO_EQUIPMENT[v]);
      return [...out];
    }
    case EquipmentCapabilitySlug.CALF_RAISE: {
      const variants = pickKnown(
        selection.details?.variants,
        CALF_RAISE_VARIANT_OPTIONS.map((o) => o.id),
      );
      if (!variants || variants.length === 0) return [];
      const out = new Set<EquipmentSlug>();
      for (const v of variants) out.add(CALF_RAISE_VARIANT_TO_EQUIPMENT[v]);
      return [...out];
    }
    default: {
      const direct = SIMPLE_CAPABILITY_TO_EQUIPMENT[selection.slug];
      return direct ? [direct] : [];
    }
  }
}

/**
 * Resolve a list of capability selections to a deduped EquipmentSlug
 * set. The dedup matters because calf-raise with variant=leg-press
 * overlaps with leg-press, and chest-fly with the pec-deck equipment
 * overlaps with itself under multiple substitution paths.
 */
export function resolveCapabilitiesToEquipmentSlugs(
  selections: ReadonlyArray<SelectedCapability>,
): EquipmentSlug[] {
  const out = new Set<EquipmentSlug>();
  for (const sel of selections) {
    for (const slug of resolveCapabilityToEquipmentSlugs(sel)) {
      out.add(slug);
    }
  }
  return [...out];
}

// ──────────────────────────────────────────────────────────────────────
// Inverse resolver (Phase 6): equipment slugs → capability slugs
// ──────────────────────────────────────────────────────────────────────
//
// Phase 6 presets are capability-scoped. To decide which presets are
// eligible for a given exercise, we need the inverse of the resolver
// above: given an exercise's EquipmentSlug list (from SYSTEM_EXERCISES
// in shared/exercises/data.ts), return the set of capability slugs
// whose resolver could produce any of those equipment slugs.
//
// For simple capabilities the inverse is 1:1. For detail-bearing
// capabilities (bench, cable-station, leg-curl, calf-raise) the
// inverse considers the UNION of every possible detail permutation
// (e.g. cable-station matches when the exercise lists any of
// cable-rope / cable-straight-bar / cable-v-bar / cable-lat-bar /
// cable-handle).
//
// Precomputed once at module load; reused by capabilitiesForExercise.

const CAPABILITY_TO_ALL_EQUIPMENT_SLUGS: Record<
  EquipmentCapabilitySlug,
  EquipmentSlug[]
> = (() => {
  const out: Partial<Record<EquipmentCapabilitySlug, EquipmentSlug[]>> = {};
  for (const [slug, eq] of Object.entries(SIMPLE_CAPABILITY_TO_EQUIPMENT)) {
    out[slug as EquipmentCapabilitySlug] = [eq];
  }
  out[EquipmentCapabilitySlug.CABLE_STATION] = Object.values(CABLE_ATTACHMENT_TO_EQUIPMENT);
  out[EquipmentCapabilitySlug.BENCH] = Object.values(BENCH_POSITION_TO_EQUIPMENT);
  out[EquipmentCapabilitySlug.LEG_CURL] = Object.values(LEG_CURL_VARIANT_TO_EQUIPMENT);
  out[EquipmentCapabilitySlug.CALF_RAISE] = Object.values(CALF_RAISE_VARIANT_TO_EQUIPMENT);
  return out as Record<EquipmentCapabilitySlug, EquipmentSlug[]>;
})();

const EQUIPMENT_SLUG_TO_CAPABILITIES: Map<EquipmentSlug, EquipmentCapabilitySlug[]> = (() => {
  const m = new Map<EquipmentSlug, EquipmentCapabilitySlug[]>();
  for (const [cap, slugs] of Object.entries(CAPABILITY_TO_ALL_EQUIPMENT_SLUGS)) {
    for (const eq of slugs) {
      const list = m.get(eq) ?? [];
      list.push(cap as EquipmentCapabilitySlug);
      m.set(eq, list);
    }
  }
  return m;
})();

/**
 * Return the set of EquipmentCapabilitySlug values whose resolver could
 * produce any of the given equipment slugs. Used by the Phase 6 preset
 * picker + the apply-time compatibility check. Pure + total — empty
 * input returns an empty array.
 *
 * Note: calf-raise with variant=leg-press resolves to LEG_PRESS_MACHINE,
 * which is also produced by the leg-press capability. An exercise with
 * LEG_PRESS_MACHINE in its equipment list therefore matches BOTH
 * calf-raise and leg-press capabilities. The caller decides whether to
 * narrow further.
 */
export function capabilitiesForExercise(
  equipmentSlugs: ReadonlyArray<EquipmentSlug>,
): EquipmentCapabilitySlug[] {
  const out = new Set<EquipmentCapabilitySlug>();
  for (const slug of equipmentSlugs) {
    const caps = EQUIPMENT_SLUG_TO_CAPABILITIES.get(slug);
    if (caps) {
      for (const c of caps) out.add(c);
    }
  }
  return [...out];
}

