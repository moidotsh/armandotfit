// constants/programTemplates.ts
//
// Known program-template + variant slugs. Phase 3 ships only the
// seeded template (arman-fit-commercial-gym-v1) with two variants
// (one-a-day, two-a-day). When Phase 4+ adds dynamic template
// discovery (a findAllTemplates repository method), this constant
// becomes a fallback for first-paint before the templates query
// resolves — not the source of truth.

export const KNOWN_PROGRAM_TEMPLATE_SLUG = 'arman-fit-commercial-gym-v1';

export interface KnownProgramVariant {
  slug: string;
  name: string;
  description: string;
}

/**
 * Known variants for the seeded template. The descriptions mirror the
 * seed migration's program_schedule_variants.description columns so
 * the browse UI doesn't need a DB round-trip for first paint.
 */
export const KNOWN_PROGRAM_VARIANTS: KnownProgramVariant[] = [
  {
    slug: 'one-a-day',
    name: 'One-a-Day',
    description:
      'Single combined daily session. Four-day cycle with intentional omissions relative to the two-a-day schedule.',
  },
  {
    slug: 'two-a-day',
    name: 'Two-a-Day (AM/PM)',
    description:
      'Separate AM and PM sessions per day. Four-day cycle with the full exercise set split across morning and evening blocks.',
  },
];
