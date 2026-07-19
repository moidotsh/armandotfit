// constants/index.ts
// Barrel export for the constants module. Arqavellum's barrel is intentionally
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
// supabase.ts, because arqavellum has only the two canonical env vars). Throws
// at startup if the env vars are missing — see utils/envValidation.ts.
export {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_FUNCTIONS_URL,
} from './supabase';

// Centralized style constants. Complement theme.ts with layout/visual
// values that don't belong in the theme hook (border radius, input dims,
// card padding, z-index layers).
export { BORDER_RADIUS, INPUT, CARD, Z_INDEX, SCREEN_BODY_STYLE } from './styles';

// App-level layout config (cross-cutting switches for screen composition).
export { APP_LAYOUT } from './layout';
export type { NavDrawerBrandPersistence, NavDrawerAnchor } from './layout';

// Workout split metadata (decoupled from theme for SOC). The day→exercise
// assignments live in shared/exercises/splits.ts because they're typed
// against the ExerciseKey union there.
export {
  WORKOUT_SPLITS,
  WORKOUT_SPLIT_LIST,
  SESSION_MODE_LIST,
  MIN_SPLIT_DAY,
  MAX_SPLIT_DAY,
  DAY_OF_WEEK_LABELS,
  getNextSplitDay,
  parseDayId,
  isRestDay,
  getUpcomingDays,
  getUpcomingWorkoutSlots,
  nextWorkoutDay,
} from './workoutSplits';
export type {
  WorkoutSplitInfo,
  SessionMode,
  UpcomingDay,
  UpcomingWorkoutSlot,
} from './workoutSplits';
