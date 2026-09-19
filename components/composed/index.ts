// components/composed/index.ts
// Barrel for composed components (domain-specific rows/cards composed
// from MobilePremium primitives).

export { BoardShell, type BoardShellProps } from './BoardShell';
export { SessionStrip } from './SessionStrip';
export { TheLogger, type TheLoggerProps } from './TheLogger';
export { StageSetRow, type StageSetRowProps } from './StageSetRow';
export { SetRow, type SetRowProps } from './SetRow';
export { EditableSetRow, type EditableSetRowProps } from './EditableSetRow';
export { TagChips, type TagChipsProps } from './TagChips';
export { InkRail, SwapGlyph, type InkRailProps } from './InkRail';
export { SplitExerciseRow, type SplitExerciseRowProps } from './SplitExerciseRow';
export { ExerciseListItem, type ExerciseListItemProps } from './ExerciseListItem';
export { EditionLine, type EditionLineProps } from './EditionLine';
export { SearchStatement, type SearchStatementProps } from './SearchStatement';
export { NextStation, type NextStationProps } from './NextStation';
export { TrainingConsistencyGrid, type TrainingConsistencyGridProps } from './TrainingConsistencyGrid';
export { WorkoutListSkeleton } from './WorkoutListSkeleton';
export { PlateStack, type PlateStackProps } from './PlateStack';
export { TallyGates, type TallyGatesProps } from './TallyGates';
export { Floor } from './Floor';
export { Receipt, type ReceiptProps } from './Receipt';
export { BoardHead, type BoardHeadProps } from './BoardHead';
export { QueryErrorNote, type QueryErrorNoteProps } from './QueryErrorNote';

// Shell composed layer (synced from arqavellum)
export { AppShellHeader } from './AppShellHeader';
export { RootGestureProvider } from './RootGestureProvider';
export { ScreenScaffold } from './ScreenScaffold';
