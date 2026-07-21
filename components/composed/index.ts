// components/composed/index.ts
// Barrel for the composed tier: components that compose MobilePremium
// primitives + Text/View into domain-specific rows, cards, and charts.
// One tier above primitives (MobilePremium, components/primitives), one
// tier below feature components (which live inside their route files).

export { WorkoutSessionItem } from './WorkoutSessionItem';
export type { WorkoutSessionItemProps } from './WorkoutSessionItem';

export { ExerciseListItem } from './ExerciseListItem';
export type { ExerciseListItemProps } from './ExerciseListItem';

export { SetRow } from './SetRow';
export type { SetRowProps } from './SetRow';

export { EditableSetRow } from './EditableSetRow';
export type { EditableSetRowProps } from './EditableSetRow';

export { SplitExerciseRow } from './SplitExerciseRow';
export type { SplitExerciseRowProps } from './SplitExerciseRow';

export { HamburgerButton } from './HamburgerButton';
export type { HamburgerButtonProps } from './HamburgerButton';

export { DashboardSkeleton } from './DashboardSkeleton';
export { WorkoutListSkeleton } from './WorkoutListSkeleton';
export type { WorkoutListSkeletonProps } from './WorkoutListSkeleton';

export { TrainingConsistencyGrid } from './TrainingConsistencyGrid';
export type { TrainingConsistencyGridProps } from './TrainingConsistencyGrid';

export {
  PlanLookupErrorAlert,
  HydrationErrorState,
} from './PlanLaunchErrors';
export type {
  PlanLookupErrorAlertProps,
  HydrationErrorStateProps,
} from './PlanLaunchErrors';

export { ExerciseSetupRow } from './ExerciseSetupRow';
export type { ExerciseSetupRowProps } from './ExerciseSetupRow';

export { SetupPresetPicker } from './SetupPresetPicker';
export type { SetupPresetPickerProps } from './SetupPresetPicker';

export { SaveSetupCta } from './SaveSetupCta';
export type { SaveSetupCtaProps } from './SaveSetupCta';
