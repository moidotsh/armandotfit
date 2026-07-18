// constants/index.ts
// Barrel export for the constants module. Vellum's barrel is intentionally
// slimmer than qep-tracker's — domain constants (bundles, grids, tips, etc.)
// land in consumer repos, not the shell.

export { theme } from './theme';
export type { ColorScheme, ColorPalette } from './theme';
export { DURATION, ANIMATION_CONFIG, RESIZE_MEASUREMENT_DEBOUNCE, ANIMATION } from './animation';
export {
  BREAKPOINTS,
  CONTAINER_THRESHOLDS,
  COMPONENT_THRESHOLDS,
  COMPONENT_VARIANT_THRESHOLDS,
  HEIGHT_THRESHOLDS,
  RESIZE_DEBOUNCE_MS,
  SPACING_BY_MODE,
  LAYOUT,
  getLayoutMode,
  getContainerSize,
  isContainerConstrained,
  isContainerShort,
  getComponentVariant,
  shouldUseDesktopStyle,
  getPreviewRowCount,
  shouldShowExpandedContent,
  canFitMultipleColumns,
} from './breakpoints';
export type {
  LayoutMode,
  ContainerSizeCategory,
  ContainerMeasurement,
  ComponentVariant,
} from './breakpoints';

// Re-export the supabase project coordinates (defined here, not in a separate
// supabase.ts, because vellum has only the two canonical env vars). Throws
// at startup if the env vars are missing — see utils/envValidation.ts.
export {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_FUNCTIONS_URL,
} from './supabase';

// Centralized style constants. Complement theme.ts with layout/visual
// values that don't belong in the theme hook (border radius, input dims,
// card padding, z-index layers).
export { BORDER_RADIUS, INPUT, CARD, Z_INDEX } from './styles';
