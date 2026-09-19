// components/composed/index.ts
// Barrel for composed components (domain-specific rows/cards composed
// from MobilePremium primitives).

export { BoardShell, type BoardShellProps } from './BoardShell';
export { SessionStrip } from './SessionStrip';
export { RegisterLine, type RegisterLineProps } from './RegisterLine';
export { TheLogger, type TheLoggerProps } from './TheLogger';
export { StageSetRow, type StageSetRowProps } from './StageSetRow';
export { SetRow, type SetRowProps } from './SetRow';
export { TagChips, type TagChipsProps } from './TagChips';
export { InkRail, SwapGlyph, type InkRailProps } from './InkRail';
export { ExerciseListItem, type ExerciseListItemProps } from './ExerciseListItem';
export { EditionLine, type EditionLineProps } from './EditionLine';
export { SearchStatement, type SearchStatementProps } from './SearchStatement';
export { NextStation, type NextStationProps } from './NextStation';
export { TrainingConsistencyGrid, type TrainingConsistencyGridProps } from './TrainingConsistencyGrid';
export { WorkoutListSkeleton } from './WorkoutListSkeleton';
// THE GAUGE figures (docs/architecture/gauge-thesis.md) — the pin
// rail (load), the set pips, the flip tile, the rolling counter.
export { PinRail, formatLoad, type PinRailProps } from './PinRail';
export { SetPips, type SetPipsProps } from './SetPips';
export { WallGauge, type WallGaugeProps } from './WallGauge';
export { TrajectoryChart, type TrajectoryChartProps } from './TrajectoryChart';
export { FlipTile, type FlipTileProps, type FlipTileTone } from './FlipTile';
export { RollingCounter, type RollingCounterProps } from './RollingCounter';
export { Floor } from './Floor';
export { Receipt, type ReceiptProps } from './Receipt';
export { BoardHead, type BoardHeadProps } from './BoardHead';
export { QueryErrorNote, type QueryErrorNoteProps } from './QueryErrorNote';

// Shell composed layer (synced from arqavellum)
export { RootGestureProvider } from './RootGestureProvider';
export { ScreenScaffold } from './ScreenScaffold';
export { MusicSheet } from './MusicSheet';
export { SessionSyncWatcher } from './SessionSyncWatcher';
