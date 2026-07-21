// __tests__/constants/equipmentCapabilities.test.ts
// Locks the Phase 2 capability catalog + resolver + validator contract:
//   - 26 capabilities across 7 groups
//   - Detail-bearing vs simple capability distinction
//   - Resolver correctness (1:1 mapping for simple, multi-slug for detail-bearing)
//   - Cross-capability dedup (calf-raise leg-press + leg-press capability)
//   - Validation rejects unknown slugs, duplicates, empty detail arrays
//   - Idempotent resolution (same input → same output, no side effects)
//   - Round-trip: selections persisted in user_equipment_capabilities can
//     be rehydrated into the wizard state via the slug + details shape
//     that the resolver consumes.
//
// A regression here is the single biggest source of "why doesn't this
// capability hydrate / save / resolve to the right equipment" bugs.

import { describe, it, expect } from 'vitest';
import {
  EquipmentCapabilitySlug,
  EQUIPMENT_CAPABILITIES,
  EQUIPMENT_CAPABILITY_LIST,
  EQUIPMENT_CAPABILITY_GROUPS,
  EQUIPMENT_CAPABILITY_SLUGS,
  CABLE_ATTACHMENT_OPTIONS,
  CABLE_HEIGHT_OPTIONS,
  BENCH_POSITION_OPTIONS,
  LEG_CURL_VARIANT_OPTIONS,
  CALF_RAISE_VARIANT_OPTIONS,
  validateSelections,
  validateCapabilityDetails,
  resolveCapabilityToEquipmentSlugs,
  resolveCapabilitiesToEquipmentSlugs,
  capabilitiesForExercise,
  type SelectedCapability,
} from '../../constants/equipmentCapabilities';
import { EquipmentSlug } from '../../shared/exercises/data';

// ──────────────────────────────────────────────────────────────────────
// Catalog integrity
// ──────────────────────────────────────────────────────────────────────

describe('equipment capability catalog', () => {
  it('has exactly 27 capabilities', () => {
    expect(EQUIPMENT_CAPABILITY_SLUGS).toHaveLength(27);
    expect(EQUIPMENT_CAPABILITY_LIST).toHaveLength(27);
    expect(Object.keys(EQUIPMENT_CAPABILITIES)).toHaveLength(27);
  });

  it('has no duplicate slugs', () => {
    const slugs = EQUIPMENT_CAPABILITY_LIST.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every capability is referenced by exactly one group', () => {
    const groupIds = new Set(EQUIPMENT_CAPABILITY_GROUPS.map((g) => g.id));
    for (const cap of EQUIPMENT_CAPABILITY_LIST) {
      expect(groupIds.has(cap.group), `${cap.slug} has unknown group ${cap.group}`).toBe(true);
    }
  });

  it('every capability has label + description', () => {
    for (const cap of EQUIPMENT_CAPABILITY_LIST) {
      expect(cap.label.length).toBeGreaterThan(0);
      expect(cap.description.length).toBeGreaterThan(0);
    }
  });

  it('exactly four capabilities are detail-bearing', () => {
    const detailBearers = EQUIPMENT_CAPABILITY_LIST.filter((c) => c.hasDetails);
    expect(detailBearers.map((c) => c.slug).sort()).toEqual(
      [
        EquipmentCapabilitySlug.BENCH,
        EquipmentCapabilitySlug.CABLE_STATION,
        EquipmentCapabilitySlug.LEG_CURL,
        EquipmentCapabilitySlug.CALF_RAISE,
      ].sort(),
    );
  });

  it('cable attachments + heights + bench positions + leg-curl + calf-raise variants each have ≥2 options', () => {
    expect(CABLE_ATTACHMENT_OPTIONS.length).toBeGreaterThanOrEqual(2);
    expect(CABLE_HEIGHT_OPTIONS.length).toBeGreaterThanOrEqual(2);
    expect(BENCH_POSITION_OPTIONS.length).toBeGreaterThanOrEqual(2);
    expect(LEG_CURL_VARIANT_OPTIONS.length).toBeGreaterThanOrEqual(2);
    expect(CALF_RAISE_VARIANT_OPTIONS.length).toBeGreaterThanOrEqual(2);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Resolver: simple (non-detail-bearing) capabilities
// ──────────────────────────────────────────────────────────────────────

describe('resolver — simple capabilities map 1:1', () => {
  const cases: Array<[EquipmentCapabilitySlug, EquipmentSlug]> = [
    [EquipmentCapabilitySlug.DUMBBELLS, EquipmentSlug.DUMBBELL],
    [EquipmentCapabilitySlug.BARBELL, EquipmentSlug.BARBELL],
    [EquipmentCapabilitySlug.KETTLEBELL, EquipmentSlug.KETTLEBELL],
    [EquipmentCapabilitySlug.SQUAT_RACK, EquipmentSlug.SQUAT_RACK],
    [EquipmentCapabilitySlug.PULL_UP_BAR, EquipmentSlug.PULL_UP_BAR],
    [EquipmentCapabilitySlug.CHEST_PRESS, EquipmentSlug.CHEST_PRESS_MACHINE],
    [EquipmentCapabilitySlug.CHEST_FLY, EquipmentSlug.CHEST_FLY_MACHINE],
    [EquipmentCapabilitySlug.LAT_PULLDOWN, EquipmentSlug.LAT_PULLDOWN_MACHINE],
    [EquipmentCapabilitySlug.SEATED_ROW, EquipmentSlug.SEATED_ROW_MACHINE],
    [EquipmentCapabilitySlug.SHOULDER_PRESS, EquipmentSlug.SHOULDER_PRESS_MACHINE],
    [EquipmentCapabilitySlug.TRICEP_EXTENSION, EquipmentSlug.TRICEP_EXTENSION_MACHINE],
    [EquipmentCapabilitySlug.DIP_MACHINE, EquipmentSlug.DIP_MACHINE],
    [EquipmentCapabilitySlug.SHRUG, EquipmentSlug.SHRUG_MACHINE],
    [EquipmentCapabilitySlug.ABDOMINAL, EquipmentSlug.ABDOMINAL_MACHINE],
    [EquipmentCapabilitySlug.LEG_PRESS, EquipmentSlug.LEG_PRESS_MACHINE],
    [EquipmentCapabilitySlug.HACK_SQUAT, EquipmentSlug.HACK_SQUAT_MACHINE],
    [EquipmentCapabilitySlug.LEG_EXTENSION, EquipmentSlug.LEG_EXTENSION_MACHINE],
    [EquipmentCapabilitySlug.HIP_ADDUCTION, EquipmentSlug.HIP_ADDUCTION_MACHINE],
    [EquipmentCapabilitySlug.TIBIALIS_RAISE, EquipmentSlug.TIBIA_RAISE_MACHINE],
    [EquipmentCapabilitySlug.CAPTAINS_CHAIR, EquipmentSlug.CAPTAINS_CHAIR],
    [EquipmentCapabilitySlug.BACK_EXTENSION, EquipmentSlug.BACK_EXTENSION_STATION],
    [EquipmentCapabilitySlug.RESISTANCE_BAND, EquipmentSlug.RESISTANCE_BAND],
    [EquipmentCapabilitySlug.FLOOR_SPACE, EquipmentSlug.FLOOR_SPACE],
  ];

  for (const [slug, expectedEquipment] of cases) {
    it(`${slug} → [${expectedEquipment}]`, () => {
      const resolved = resolveCapabilityToEquipmentSlugs({ slug });
      expect(resolved).toEqual([expectedEquipment]);
    });
  }
});

// ──────────────────────────────────────────────────────────────────────
// Resolver: detail-bearing capabilities
// ──────────────────────────────────────────────────────────────────────

describe('resolver — cable-station', () => {
  it('maps each attachment to its equipment slug', () => {
    const resolved = resolveCapabilityToEquipmentSlugs({
      slug: EquipmentCapabilitySlug.CABLE_STATION,
      details: {
        attachments: ['rope', 'lat-bar', 'handle', 'straight-bar', 'v-bar'],
        heights: ['high'],
      },
    });
    expect(resolved.sort()).toEqual(
      [
        EquipmentSlug.CABLE_ROPE,
        EquipmentSlug.CABLE_LAT_BAR,
        EquipmentSlug.CABLE_HANDLE,
        EquipmentSlug.CABLE_STRAIGHT_BAR,
        EquipmentSlug.CABLE_V_BAR,
      ].sort(),
    );
  });

  it('returns one slug per attachment (deduped within capability)', () => {
    const resolved = resolveCapabilityToEquipmentSlugs({
      slug: EquipmentCapabilitySlug.CABLE_STATION,
      details: { attachments: ['rope', 'rope', 'rope'], heights: [] },
    });
    expect(resolved).toEqual([EquipmentSlug.CABLE_ROPE]);
  });

  it('returns [] when attachments is missing', () => {
    const resolved = resolveCapabilityToEquipmentSlugs({
      slug: EquipmentCapabilitySlug.CABLE_STATION,
      details: { heights: ['high'] },
    });
    expect(resolved).toEqual([]);
  });

  it('heights alone do not produce any equipment slug', () => {
    // The resolver intentionally ignores heights — they're a UI hint for
    // Phase 3 (e.g. station-vs-column distinction), not a slug driver.
    const resolved = resolveCapabilityToEquipmentSlugs({
      slug: EquipmentCapabilitySlug.CABLE_STATION,
      details: { attachments: ['rope'], heights: ['low', 'mid', 'high', 'adjustable'] },
    });
    expect(resolved).toEqual([EquipmentSlug.CABLE_ROPE]);
  });
});

describe('resolver — bench', () => {
  it('flat-only → [flat-bench]', () => {
    expect(
      resolveCapabilityToEquipmentSlugs({
        slug: EquipmentCapabilitySlug.BENCH,
        details: { positions: ['flat'] },
      }),
    ).toEqual([EquipmentSlug.FLAT_BENCH]);
  });

  it('flat + incline → [flat-bench, incline-bench]', () => {
    expect(
      resolveCapabilityToEquipmentSlugs({
        slug: EquipmentCapabilitySlug.BENCH,
        details: { positions: ['flat', 'incline'] },
      }).sort(),
    ).toEqual([EquipmentSlug.FLAT_BENCH, EquipmentSlug.INCLINE_BENCH].sort());
  });

  it('all three positions → all three bench slugs', () => {
    expect(
      resolveCapabilityToEquipmentSlugs({
        slug: EquipmentCapabilitySlug.BENCH,
        details: { positions: ['flat', 'incline', 'decline'] },
      }).sort(),
    ).toEqual(
      [EquipmentSlug.FLAT_BENCH, EquipmentSlug.INCLINE_BENCH, EquipmentSlug.DECLINE_BENCH].sort(),
    );
  });

  it('empty positions → []', () => {
    expect(
      resolveCapabilityToEquipmentSlugs({
        slug: EquipmentCapabilitySlug.BENCH,
        details: { positions: [] },
      }),
    ).toEqual([]);
  });
});

describe('resolver — leg-curl', () => {
  it('seated-only → [leg-curl-machine]', () => {
    expect(
      resolveCapabilityToEquipmentSlugs({
        slug: EquipmentCapabilitySlug.LEG_CURL,
        details: { variants: ['seated'] },
      }),
    ).toEqual([EquipmentSlug.LEG_CURL_MACHINE]);
  });

  it('lying-only → [lying-leg-curl-machine]', () => {
    expect(
      resolveCapabilityToEquipmentSlugs({
        slug: EquipmentCapabilitySlug.LEG_CURL,
        details: { variants: ['lying'] },
      }),
    ).toEqual([EquipmentSlug.LYING_LEG_CURL_MACHINE]);
  });

  it('both variants → both slugs', () => {
    expect(
      resolveCapabilityToEquipmentSlugs({
        slug: EquipmentCapabilitySlug.LEG_CURL,
        details: { variants: ['seated', 'lying'] },
      }).sort(),
    ).toEqual([EquipmentSlug.LEG_CURL_MACHINE, EquipmentSlug.LYING_LEG_CURL_MACHINE].sort());
  });
});

describe('resolver — calf-raise', () => {
  it('standing-only → [calf-raise-machine]', () => {
    expect(
      resolveCapabilityToEquipmentSlugs({
        slug: EquipmentCapabilitySlug.CALF_RAISE,
        details: { variants: ['standing'] },
      }),
    ).toEqual([EquipmentSlug.CALF_RAISE_MACHINE]);
  });

  it('seated-only → [seated-calf-raise-machine]', () => {
    expect(
      resolveCapabilityToEquipmentSlugs({
        slug: EquipmentCapabilitySlug.CALF_RAISE,
        details: { variants: ['seated'] },
      }),
    ).toEqual([EquipmentSlug.SEATED_CALF_RAISE_MACHINE]);
  });

  it('leg-press variant → [leg-press-machine]', () => {
    expect(
      resolveCapabilityToEquipmentSlugs({
        slug: EquipmentCapabilitySlug.CALF_RAISE,
        details: { variants: ['leg-press'] },
      }),
    ).toEqual([EquipmentSlug.LEG_PRESS_MACHINE]);
  });

  it('all three variants → all three slugs', () => {
    expect(
      resolveCapabilityToEquipmentSlugs({
        slug: EquipmentCapabilitySlug.CALF_RAISE,
        details: { variants: ['standing', 'seated', 'leg-press'] },
      }).sort(),
    ).toEqual(
      [
        EquipmentSlug.CALF_RAISE_MACHINE,
        EquipmentSlug.SEATED_CALF_RAISE_MACHINE,
        EquipmentSlug.LEG_PRESS_MACHINE,
      ].sort(),
    );
  });
});

// ──────────────────────────────────────────────────────────────────────
// Cross-capability dedup
// ──────────────────────────────────────────────────────────────────────

describe('resolver — dedup across capabilities', () => {
  it('calf-raise leg-press variant + leg-press capability produces one leg-press-machine slug', () => {
    const selections: SelectedCapability[] = [
      {
        slug: EquipmentCapabilitySlug.CALF_RAISE,
        details: { variants: ['leg-press'] },
      },
      { slug: EquipmentCapabilitySlug.LEG_PRESS },
    ];
    const resolved = resolveCapabilitiesToEquipmentSlugs(selections);
    const legPressCount = resolved.filter((s) => s === EquipmentSlug.LEG_PRESS_MACHINE).length;
    expect(legPressCount).toBe(1);
  });

  it('chest-fly capability + pec-deck equipment share the same slug (single)', () => {
    // Chest-fly capability maps to CHEST_FLY_MACHINE. Pec-deck is a
    // different equipment_type slug (PEC_DECK_MACHINE) so there's no
    // overlap here — this test documents the non-overlap.
    const resolved = resolveCapabilityToEquipmentSlugs({
      slug: EquipmentCapabilitySlug.CHEST_FLY,
    });
    expect(resolved).toEqual([EquipmentSlug.CHEST_FLY_MACHINE]);
    expect(resolved).not.toContain(EquipmentSlug.PEC_DECK_MACHINE);
  });

  it('empty selection list → []', () => {
    expect(resolveCapabilitiesToEquipmentSlugs([])).toEqual([]);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Validator
// ──────────────────────────────────────────────────────────────────────

describe('validateCapabilityDetails', () => {
  it('accepts non-detail-bearing capabilities with no details', () => {
    const res = validateCapabilityDetails(EquipmentCapabilitySlug.DUMBBELLS, undefined);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.details).toEqual({});
  });

  it('rejects cable-station with no attachments', () => {
    const res = validateCapabilityDetails(EquipmentCapabilitySlug.CABLE_STATION, {
      attachments: [],
      heights: [],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/attachment/);
  });

  it('rejects cable-station with non-array attachments', () => {
    const res = validateCapabilityDetails(EquipmentCapabilitySlug.CABLE_STATION, {
      attachments: 'rope',
    });
    expect(res.ok).toBe(false);
  });

  it('rejects bench with no positions', () => {
    const res = validateCapabilityDetails(EquipmentCapabilitySlug.BENCH, { positions: [] });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/position/);
  });

  it('rejects leg-curl with no variants', () => {
    const res = validateCapabilityDetails(EquipmentCapabilitySlug.LEG_CURL, { variants: [] });
    expect(res.ok).toBe(false);
  });

  it('rejects calf-raise with no variants', () => {
    const res = validateCapabilityDetails(EquipmentCapabilitySlug.CALF_RAISE, { variants: [] });
    expect(res.ok).toBe(false);
  });

  it('silently drops unknown attachment values (defensive)', () => {
    const res = validateCapabilityDetails(EquipmentCapabilitySlug.CABLE_STATION, {
      attachments: ['rope', 'unknown-attachment', 'lat-bar'],
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.details.attachments).toEqual(['rope', 'lat-bar']);
    }
  });
});

describe('validateSelections', () => {
  it('rejects unknown slug', () => {
    const res = validateSelections([{ slug: 'definitely-not-a-capability' as never }]);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/unknown/);
  });

  it('rejects duplicate slug', () => {
    const res = validateSelections([
      { slug: EquipmentCapabilitySlug.DUMBBELLS },
      { slug: EquipmentCapabilitySlug.DUMBBELLS },
    ]);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/duplicate/);
  });

  it('accepts a valid mixed list and normalizes details', () => {
    const res = validateSelections([
      { slug: EquipmentCapabilitySlug.DUMBBELLS },
      {
        slug: EquipmentCapabilitySlug.CABLE_STATION,
        details: { attachments: ['rope'], heights: ['low'] },
      },
      { slug: EquipmentCapabilitySlug.BENCH, details: { positions: ['flat'] } },
    ]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.selections).toHaveLength(3);
      // Non-detail-bearing: details trimmed to {}
      expect(res.selections[0].details).toEqual({});
      // Detail-bearing: details preserved with only known keys
      expect(res.selections[1].details).toEqual({ attachments: ['rope'], heights: ['low'] });
    }
  });

  it('rejects when a detail-bearing capability has invalid details', () => {
    const res = validateSelections([
      { slug: EquipmentCapabilitySlug.CABLE_STATION, details: { attachments: [] } },
    ]);
    expect(res.ok).toBe(false);
  });

  it('accepts an empty selection list (clearing the inventory)', () => {
    const res = validateSelections([]);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.selections).toEqual([]);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Idempotency + round-trip
// ──────────────────────────────────────────────────────────────────────

describe('resolver — idempotency + round-trip', () => {
  const sampleSelections: SelectedCapability[] = [
    { slug: EquipmentCapabilitySlug.DUMBBELLS },
    {
      slug: EquipmentCapabilitySlug.CABLE_STATION,
      details: { attachments: ['rope', 'lat-bar'], heights: ['high'] },
    },
    {
      slug: EquipmentCapabilitySlug.CALF_RAISE,
      details: { variants: ['standing', 'leg-press'] },
    },
    { slug: EquipmentCapabilitySlug.LEG_PRESS },
  ];

  it('resolving the same selection list twice produces identical output', () => {
    const first = resolveCapabilitiesToEquipmentSlugs(sampleSelections);
    const second = resolveCapabilitiesToEquipmentSlugs(sampleSelections);
    expect(second).toEqual(first);
  });

  it('resolving is pure — does not mutate the input', () => {
    const snapshot = JSON.parse(JSON.stringify(sampleSelections));
    resolveCapabilitiesToEquipmentSlugs(sampleSelections);
    expect(sampleSelections).toEqual(snapshot);
  });

  it('round-trip: validate → resolve → re-validate yields equivalent selections', () => {
    const validated = validateSelections(sampleSelections);
    if (!validated.ok) throw new Error('expected valid');
    // The validated selections should re-validate cleanly.
    const reValidated = validateSelections(validated.selections);
    expect(reValidated.ok).toBe(true);
    if (reValidated.ok) {
      expect(reValidated.selections).toEqual(validated.selections);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────
// Inverse resolver (Phase 6): capabilitiesForExercise
// ──────────────────────────────────────────────────────────────────────

describe('capabilitiesForExercise — inverse resolver', () => {
  it('returns an empty array for an empty equipment list', () => {
    expect(capabilitiesForExercise([])).toEqual([]);
  });

  it('resolves a simple 1:1 capability (dumbbell)', () => {
    expect(capabilitiesForExercise([EquipmentSlug.DUMBBELL])).toEqual([
      EquipmentCapabilitySlug.DUMBBELLS,
    ]);
  });

  it('resolves a simple 1:1 capability (barbell)', () => {
    expect(capabilitiesForExercise([EquipmentSlug.BARBELL])).toEqual([
      EquipmentCapabilitySlug.BARBELL,
    ]);
  });

  it('resolves cable-station when the exercise lists any cable attachment (detail-bearing union)', () => {
    // cable-station is detail-bearing; its full resolved set spans all
    // 5 attachments. An exercise with any one of them should resolve
    // back to the cable-station capability.
    for (const slug of [
      EquipmentSlug.CABLE_ROPE,
      EquipmentSlug.CABLE_STRAIGHT_BAR,
      EquipmentSlug.CABLE_V_BAR,
      EquipmentSlug.CABLE_LAT_BAR,
      EquipmentSlug.CABLE_HANDLE,
    ]) {
      const caps = capabilitiesForExercise([slug]);
      expect(caps, `expected cable-station for ${slug}`).toContain(
        EquipmentCapabilitySlug.CABLE_STATION,
      );
    }
  });

  it('resolves bench when the exercise lists any bench position (detail-bearing union)', () => {
    for (const slug of [
      EquipmentSlug.FLAT_BENCH,
      EquipmentSlug.INCLINE_BENCH,
      EquipmentSlug.DECLINE_BENCH,
    ]) {
      const caps = capabilitiesForExercise([slug]);
      expect(caps, `expected bench for ${slug}`).toContain(EquipmentCapabilitySlug.BENCH);
    }
  });

  it('resolves leg-curl for both seated + lying variants', () => {
    expect(capabilitiesForExercise([EquipmentSlug.LEG_CURL_MACHINE])).toContain(
      EquipmentCapabilitySlug.LEG_CURL,
    );
    expect(capabilitiesForExercise([EquipmentSlug.LYING_LEG_CURL_MACHINE])).toContain(
      EquipmentCapabilitySlug.LEG_CURL,
    );
  });

  it('resolves calf-raise for standing + seated + leg-press variants', () => {
    expect(capabilitiesForExercise([EquipmentSlug.CALF_RAISE_MACHINE])).toContain(
      EquipmentCapabilitySlug.CALF_RAISE,
    );
    expect(capabilitiesForExercise([EquipmentSlug.SEATED_CALF_RAISE_MACHINE])).toContain(
      EquipmentCapabilitySlug.CALF_RAISE,
    );
  });

  it('returns BOTH calf-raise AND leg-press for LEG_PRESS_MACHINE (cross-resolution)', () => {
    // calf-raise with variant=leg-press resolves to LEG_PRESS_MACHINE,
    // which is also produced by the leg-press capability. An exercise
    // with LEG_PRESS_MACHINE in its equipment list therefore matches
    // BOTH capabilities — the caller decides whether to narrow further.
    const caps = capabilitiesForExercise([EquipmentSlug.LEG_PRESS_MACHINE]);
    expect(caps).toContain(EquipmentCapabilitySlug.LEG_PRESS);
    expect(caps).toContain(EquipmentCapabilitySlug.CALF_RAISE);
  });

  it('dedupes capabilities across multiple equipment slugs', () => {
    // Multiple cable attachments should still produce a single
    // cable-station capability entry.
    const caps = capabilitiesForExercise([
      EquipmentSlug.CABLE_ROPE,
      EquipmentSlug.CABLE_V_BAR,
      EquipmentSlug.DUMBBELL,
    ]);
    const cableCount = caps.filter((c) => c === EquipmentCapabilitySlug.CABLE_STATION).length;
    expect(cableCount).toBe(1);
    expect(caps).toContain(EquipmentCapabilitySlug.DUMBBELLS);
  });

  it('is pure — calling twice with the same input yields the same reference shape', () => {
    // Result is a fresh array each call, but contents + order are stable.
    const a = capabilitiesForExercise([EquipmentSlug.DUMBBELL, EquipmentSlug.BARBELL]);
    const b = capabilitiesForExercise([EquipmentSlug.DUMBBELL, EquipmentSlug.BARBELL]);
    expect(a).toEqual(b);
  });

  it('skips equipment slugs that have no capability mapping', () => {
    // An equipment slug that doesn't appear in any capability's
    // resolved set is silently skipped — no throw, no undefined entry.
    // (Currently every EquipmentSlug maps to at least one capability,
    // but this test guards against future additions.)
    const caps = capabilitiesForExercise([
      EquipmentSlug.DUMBBELL,
      // Add a non-existent cast to test the skip path; the resolver
      // treats unknown values as no-ops via Map.get returning undefined.
      'nonexistent-equipment-slug' as unknown as EquipmentSlug,
    ]);
    expect(caps).toEqual([EquipmentCapabilitySlug.DUMBBELLS]);
  });
});
