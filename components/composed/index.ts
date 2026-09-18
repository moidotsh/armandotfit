// components/composed/index.ts
// Barrel for composed components (domain-specific rows/cards composed
// from MobilePremium primitives).

export { DeskShell, type DeskShellProps } from './DeskShell';
export { SessionStrip } from './SessionStrip';
export { CountBoard, type CountBoardProps } from './CountBoard';
export { StationStrip, type StationStripProps, type StationDatum } from './StationStrip';
export { StageSetRow, type StageSetRowProps } from './StageSetRow';
export { SetRow, type SetRowProps } from './SetRow';
export { EditableSetRow, type EditableSetRowProps } from './EditableSetRow';
export { TagChips, type TagChipsProps } from './TagChips';
export { InkRail, SwapGlyph, type InkRailProps } from './InkRail';
export { SplitExerciseRow, type SplitExerciseRowProps } from './SplitExerciseRow';
export { ExerciseListItem, type ExerciseListItemProps } from './ExerciseListItem';
export { WorkoutSessionItem, type WorkoutSessionItemProps } from './WorkoutSessionItem';
export { TrainingConsistencyGrid, type TrainingConsistencyGridProps } from './TrainingConsistencyGrid';
export { DashboardSkeleton } from './DashboardSkeleton';
export { WorkoutListSkeleton } from './WorkoutListSkeleton';
export { QueryErrorNote, type QueryErrorNoteProps } from './QueryErrorNote';

// Shell composed layer (synced from arqavellum)
export { AppShellHeader } from './AppShellHeader';
export { RootGestureProvider } from './RootGestureProvider';
export { ScreenScaffold } from './ScreenScaffold';
