// constants/index.ts
// Barrel export for the constants module.
export { APP_DISPLAY_NAME } from './displayName';
// The shell barrel is intentionally
// slim — domain constants (records, items, tips, etc.) land in consumer
// repos, not the shell.

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

// Re-export the supabase project coordinates. Throws at module load in
// production if the env vars are missing — see ./supabase.ts:requiredEnv().
export {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_FUNCTIONS_URL,
} from './supabase';

// Centralized style constants. Complement theme.ts with layout/visual
// values that don't belong in the theme hook (border radius, input dims,
// card padding, z-index layers).
export {
  BORDER_RADIUS,
  INPUT,
  CARD,
  Z_INDEX,
  SCREEN_BODY_STYLE,
  CONTENT_WIDTH_MODE,
  MOBILE_CONTENT_MAX_WIDTH,
  MOBILE_DIALOG_MAX_WIDTH,
  MOBILE_CONTENT_WIDTH_STYLE,
  MOBILE_DIALOG_WIDTH_STYLE,
} from './styles';
export type { ContentWidthMode, DesktopLayoutMode } from './styles';
export { DESKTOP_LAYOUT_MODE } from './styles';

// App-level layout config (cross-cutting switches for screen composition).
export { APP_LAYOUT } from './layout';
export type { NavDrawerBrandPersistence, NavDrawerAnchor } from './layout';


// THE BOARD (docs/architecture/board-thesis.md) — the air law's live
// declaration point + THE PLATE CODE (denominations, per-scale slab
// geometry, greedy decomposition, tally geometry). Colors live in
// theme.colors.*.meter; this is the arithmetic.
export {
  BOARD,
  PAGE_GUTTER,
  BLOCK_GAP,
  ROW_GAP,
  HALO,
  PLATE_DENOMINATIONS,
  PLATE_SCALE,
  PLATE_QUANTUM,
  decomposeLoad,
  TALLY_SCALE,
} from './board';
export type { PlateSegment, PlateScale, MeterStep, TallyScale } from './board';

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
  suggestNextSplitDay,
  suggestSessionWindow,
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

