// app/index.tsx
// Home — THE SCOREBOARD's front (docs/architecture/
// scoreboard-thesis.md §8). Question: "what am I walking into today?"
// The day's title is the statement (the page carries no name of its
// own); **THE DAY REGISTER** — the day's plan as register lines (name
// · leader · the prefill weight as a right-aligned mono figure),
// wearing the screen's one 2px rule — shows the session's numbers
// before you start it. START (or RESUME) is the one verb (ink). Jump
// rows keep their one fact each (the streak lives on the Progress
// row); recent sessions close the page as Martian lines. While a
// session runs, BoardShell pins the ticker under the folio.

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Dumbbell, Settings } from '@tamagui/lucide-icons-2';
import { MobilePrimaryButton, EmptyState } from '../components/MobilePremium';
import {
  BoardShell,
  BoardHead,
  EditionLine,
  WorkoutListSkeleton,
  QueryErrorNote,
  RegisterLine,
} from '../components/composed';
import { useAppTheme } from '../context';
import {
  theme,
  suggestNextSplitDay,
  suggestSessionWindow,
  SCOREBOARD,
  ROW_GAP,
  PAGE_GUTTER,
} from '../constants';
import {
  navigateToSettings,
  navigateToWorkoutDetail,
  navigateToSplitSelection,
  navigateToProgram,
  navigateToExerciseDatabase,
  navigateToProgression,
} from '../navigation';
import {
  getSlotsForDay,
  getDayTitle,
  SYSTEM_EXERCISES,
  SYSTEM_EXERCISES_BY_SLUG,
} from '../shared/exercises';
import { useSplitPreferenceStore, useWorkoutStore, useMusicStore } from '../stores';
import { useDashboardSummary, useRecentSessionDetails, useTopSetsByName, useWeightUnit } from '../hooks';
import { toDisplayWeight, roundDisplayWeight } from '../utils';

const RECENT_COUNT = 3;

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const recentQuery = useRecentSessionDetails(5);
  const topSets = useTopSetsByName();
  const preferredSplit = useSplitPreferenceStore((s) => s.splitType);
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);
  const setMusicOpen = useMusicStore((s) => s.setSheetOpen);
  const unit = useWeightUnit();

  const streak = summaryQuery.data?.streak;
  const recent = recentQuery.data ?? [];
  // THE FUNNEL ENTRY: day suggestion sticks to today's logged day (AM
  // then PM share it), the window follows the clock, the split is the
  // remembered program.
  const suggestedDay = recent.length > 0 ? suggestNextSplitDay(recent) : 1;
  const suggestedWindow = suggestSessionWindow();
  const suggestedSlots = useMemo(
    () => getSlotsForDay(preferredSplit, suggestedDay, suggestedWindow),
    [preferredSplit, suggestedDay, suggestedWindow],
  );
  const dayTitle = getDayTitle(preferredSplit, suggestedDay) || `Day ${suggestedDay}`;

  // The register rows' figures — the last TOP set per exercise name
  // (the shared derivation; the same rule that arms the Floor), in
  // display units. A bodyweight lift (null or 0) carries no figure.
  const prefillBySlot = useMemo(
    () =>
      suggestedSlots.map((slot) => {
        const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
        const name = entry?.name ?? slot.exercise;
        const kg = topSets.map.get(name.toLowerCase())?.weight ?? null;
        if (kg == null || kg <= 0) return null;
        return String(roundDisplayWeight(toDisplayWeight(kg, unit)));
      }),
    [suggestedSlots, topSets, unit],
  );

  const header = (
    <View style={styles.headerRow}>
      {/* The folio — the brand mark at whisper scale. The register's
          content is the brand; the masthead stays a folio line. */}
      <View style={styles.brand}>
        <Dumbbell size={16} color={colors.text} />
        <Text style={[styles.wordmark, { color: colors.text }]}>ARMANDOTFIT</Text>
      </View>
      <Pressable
        onPress={navigateToSettings}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        style={({ pressed }) => [styles.iconButton, pressed ? { opacity: 0.6 } : null]}
        testID="home-settings"
      >
        <Settings size={20} color={colors.text} />
      </Pressable>
    </View>
  );

  const jumpLine = (
    label: string,
    caption: string | null,
    onPress: () => void,
    testID: string,
  ) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={caption ? `${label} — ${caption}` : label}
      testID={testID}
      style={({ pressed }) => [styles.jumpRow, pressed ? { opacity: 0.6 } : null]}
    >
      <Text style={[styles.jumpLabel, { color: colors.text }]}>{label}</Text>
      {/* The caption is the row's one FACT — the number that makes the
          destination worth its tap. Content, not chrome. */}
      {caption ? (
        <Text style={[styles.jumpCaption, { color: colors.textMuted }]} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </Pressable>
  );

  return (
    <BoardShell surface="training" header={header} testID="home-scroll">
      {/* THE STATEMENT — the day itself, with the window whisper in
          red-ink furniture above it (the living position). */}
      <BoardHead
        statement={dayTitle}
        statementTestID="home-day-title"
        whisper={`${suggestedWindow === 'am' ? 'MORNING' : 'EVENING'} · DAY ${suggestedDay}`}
        whisperTone="record"
      />

      {/* THE DAY REGISTER — the day's plan as register lines wearing
          the screen's one 2px rule: name · leader · the prefill
          weight. The session's numbers, stated before you start. */}
      <View style={styles.block}>
        <View style={[styles.dayRegister, { borderTopColor: colors.text }]} testID="home-board">
          {suggestedSlots.length === 0 ? (
            <Text style={[styles.registerEmpty, { color: colors.textMuted }]}>
              No lifts programmed — start anyway and write your own.
            </Text>
          ) : (
            suggestedSlots.map((slot, i) => {
              const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
              const name = entry?.name ?? slot.exercise;
              return (
                <RegisterLine
                  key={slot.exercise + i}
                  label={name}
                  figure={prefillBySlot[i]}
                  testID={`home-board-row-${i}`}
                  figureTestID={`home-board-figure-${i}`}
                />
              );
            })
          )}
        </View>
      </View>

      {/* The one verb. */}
      <View style={styles.block}>
        <MobilePrimaryButton
          onPress={isSessionActive ? () => navigateToWorkoutDetail() : navigateToSplitSelection}
          testID={isSessionActive ? 'home-resume' : 'home-start'}
        >
          {isSessionActive ? 'RESUME' : 'START'}
        </MobilePrimaryButton>
      </View>

      {/* The jump rows — the Desk's only chrome, each with its fact. */}
      <View style={[styles.block, styles.jumpStack]}>
        {jumpLine(
          'Program',
          preferredSplit === 'oneADay' ? '4 days · full body' : '4 days · AM/PM',
          navigateToProgram,
          'home-index-program',
        )}
        {jumpLine(
          'Library',
          `${SYSTEM_EXERCISES.length} lifts`,
          navigateToExerciseDatabase,
          'home-index-library',
        )}
        {jumpLine(
          'Progress',
          streak?.current != null ? `${streak.current}-day streak` : null,
          navigateToProgression,
          'home-index-progress',
        )}
        {jumpLine('Music', 'search · play', () => setMusicOpen(true), 'home-index-music')}
      </View>

      {/* Recent sessions — one Martian line each; the latest leads. */}
      <View style={styles.block}>
        {recentQuery.isLoading ? (
          <WorkoutListSkeleton />
        ) : recentQuery.isError ? (
          <QueryErrorNote onRetry={() => void recentQuery.refetch()} testID="home-recent-error" />
        ) : recent.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            message="Log the first one and the record starts here."
            action={{ label: 'Start workout', onPress: navigateToSplitSelection }}
            testID="home-empty-state"
          />
        ) : (
          <View>
            {recent.slice(0, RECENT_COUNT).map((w, i) => (
              <EditionLine
                key={w.id}
                session={w}
                lead={i === 0}
                onPress={navigateToWorkoutDetail}
              />
            ))}
          </View>
        )}
      </View>
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: PAGE_GUTTER,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    ...theme.typography.mobileEyebrow,
    letterSpacing: 1.6,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Top-level blocks carry the air law.
  block: {
    ...SCOREBOARD.block,
  },
  // THE DAY REGISTER — the day's lines wearing the screen's one 2px
  // rule (the printed heading rule). No panel: ground + rule + lines.
  dayRegister: {
    borderTopWidth: 2,
    paddingTop: 4,
  },
  registerEmpty: {
    ...theme.typography.mobileMeta,
    paddingVertical: 8,
  },
  jumpStack: {
    gap: ROW_GAP / 2,
  },
  jumpRow: {
    minHeight: 48,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jumpLabel: {
    ...SCOREBOARD.row,
  },
  jumpCaption: {
    ...theme.typography.mobileLedger,
    flex: 1,
    textAlign: 'right',
  },
});
