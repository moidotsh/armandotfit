// components/composed/index.ts
// Barrel for composed components (domain-specific rows/cards composed
// from MobilePremium primitives).

export { BoardShell, type BoardShellProps } from './BoardShell';
export { SessionStrip } from './SessionStrip';
export { RegisterLine, type RegisterLineProps } from './RegisterLine';
export { TheLogger, type TheLoggerProps } from './TheLogger';
export { TheCardioDock, type TheCardioDockProps } from './TheCardioDock';
export { TagChips, type TagChipsProps } from './TagChips';
export { InkRail, SwapGlyph, type InkRailProps } from './InkRail';
export { ExerciseListItem, type ExerciseListItemProps } from './ExerciseListItem';
export { EditionLine, type EditionLineProps } from './EditionLine';
export { SearchStatement, type SearchStatementProps } from './SearchStatement';
export { NextStation, type NextStationProps } from './NextStation';
export { WorkoutListSkeleton } from './WorkoutListSkeleton';
export { Floor } from './Floor';
export { Receipt, type ReceiptProps } from './Receipt';
export { BoardHead, type BoardHeadProps } from './BoardHead';
export { SectionWhisper, type SectionWhisperProps } from './SectionWhisper';
export { QueryErrorNote, type QueryErrorNoteProps } from './QueryErrorNote';
export { TrendGraph, SharePie, type TrendGraphProps, type SharePieProps, type PieSlice, type TrendPoint } from './TheCharts';

// Shell composed layer (synced from arqavellum)
export { RootGestureProvider } from './RootGestureProvider';
export { ScreenScaffold } from './ScreenScaffold';
export { SessionSyncWatcher } from './SessionSyncWatcher';
