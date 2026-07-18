// constants/styles.ts
// Centralized style constants for consistent UI across components.
// Complements theme.ts with commonly used layout and visual values.
//
// Deliberately omits:
//   - FOCUS_GLOW (qep-tracker ports this with hardcoded #0A84FF; vellum
//     uses useFocusRing from components/premium/shared/Motion.tsx, which
//     resolves the ring color from theme.brand at runtime).
//   - SPACING (duplicates theme.spacing; use useAppTheme().spacing).

/**
 * Border radius values (in pixels). Kept in sync with theme.borderRadius
 * for non-themed consumers (StyleSheet objects that don't read the
 * theme hook).
 */
export const BORDER_RADIUS = {
  /** Small radius - subtle rounding */
  sm: 8,
  /** Medium radius - standard cards */
  md: 12,
  /** Default radius - most common */
  default: 14,
  /** Large radius - prominent cards/modals */
  lg: 16,
  /** Extra large radius - feature elements */
  xl: 20,
  /** Pill shape - fully rounded */
  pill: 9999,
} as const;

/**
 * Standard input component dimensions.
 */
export const INPUT = {
  /** Standard input height */
  height: 54,
  /** Compact input height for dense layouts */
  heightCompact: 44,
  /** Standard horizontal padding */
  paddingX: 16,
} as const;

/**
 * Card layout constants.
 */
export const CARD = {
  /** Standard card padding */
  padding: 16,
  /** Compact card padding */
  paddingCompact: 12,
  /** Card accent bar width */
  accentBarWidth: 3,
} as const;

/**
 * Z-index layers for common UI elements. Use sparingly — most layering is
 * handled by DOM order + the dialog/toast portals. Reach for these only
 * when two surfaces genuinely compete (e.g. a sticky header vs. a popover).
 */
export const Z_INDEX = {
  /** Base layer - normal content */
  base: 0,
  /** Dropdowns and popovers */
  dropdown: 100,
  /** Sticky headers */
  sticky: 200,
  /** Overlays and backdrops */
  overlay: 300,
  /** Modals */
  modal: 400,
  /** Tooltips */
  tooltip: 500,
  /** Toast notifications */
  toast: 600,
} as const;
