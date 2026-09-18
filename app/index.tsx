// app/index.tsx
// Home — THE QUIET PAGE's front page (docs/architecture/
// quiet-page-thesis.md §6). No tab bar: the Desk is a stack and home
// is its hub. The page IS its content: the day's title is the
// statement (sentence case — the page carries no name of its own),
// one lede line names the opening lift, and START (or RESUME) is the
// one verb. Three label-only jump rows lead to Program, Library,
// Progress; the recent editions close the page as one whisper line
// each. Blocks separate by air (BLOCK_GAP), not rules. While a
// session runs, DeskShell pins the wire ticker under the header.

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Settings } from '@tamagui/lucide-icons-2';
import { MobilePrimaryButton, EmptyState } from '../components/MobilePremium';
import {
  DeskShell,
  EditionLine,
  WorkoutListSkeleton,
  QueryErrorNote,
} from '../components/composed';
import { useAppTheme } from '../context';
import {
  theme,
  suggestNextSplitDay,
  suggestSessionWindow,
  BLOCK_GAP,
  ROW_GAP,
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
  SYSTEM_EXERCISES_BY_SLUG,
} from '../shared/exercises';
import { useSplitPreferenceStore, useWorkoutStore } from '../stores';
import { useRecentSessionDetails } from '../hooks';

const RECENT_COUNT = 3;

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const recentQuery = useRecentSessionDetails(5);
  const preferredSplit = useSplitPreferenceStore((s) => s.splitType);
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);

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
  const suggestedCount = suggestedSlots.length;
  const dayTitle = getDayTitle(preferredSplit, suggestedDay) || `Day ${suggestedDay}`;
  // The lede names the day's opening lift — the answer to "what am I
  // walking into?" without leaving the front page.
  const firstLift = suggestedSlots.length > 0
    ? SYSTEM_EXERCISES_BY_SLUG[suggestedSlots[0].exercise]?.name ?? null
    : null;

  const header = (
    <View style={styles.headerRow}>
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

  const jumpLine = (label: string, onPress: () => void, testID: string) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [styles.jumpRow, pressed ? { opacity: 0.6 } : null]}
    >
      <Text style={[styles.jumpLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );

  return (
    <DeskShell surface="training" header={header} testID="home-scroll">
      {/* THE STATEMENT — the day itself. The page has no nameplate:
          its loudest thing is what is happening today. */}
      <View>
        <Text
          testID="home-day-title"
          style={[styles.dayTitle, { color: colors.text }]}
          numberOfLines={2}
        >
          {dayTitle}
        </Text>
      </View>

      {/* The lede + the one verb. */}
      <View style={styles.block}>
        {firstLift ? (
          <Text style={[styles.lede, { color: colors.text }]} numberOfLines={1}>
            {`${firstLift}${suggestedCount > 1 ? `, then ${suggestedCount - 1} more` : ''}`}
          </Text>
        ) : (
          <Text style={[styles.lede, { color: colors.textMuted }]} numberOfLines={2}>
            {isSessionActive
              ? 'A session is on the floor.'
              : 'Start when you hit the floor.'}
          </Text>
        )}
        <MobilePrimaryButton
          onPress={isSessionActive ? () => navigateToWorkoutDetail() : navigateToSplitSelection}
          testID={isSessionActive ? 'home-resume' : 'home-start'}
        >
          {isSessionActive ? 'RESUME' : 'START'}
        </MobilePrimaryButton>
      </View>

      {/* The jump rows — the tab bar's replacement, label-only. */}
      <View style={[styles.block, styles.jumpStack]}>
        {jumpLine('Program', navigateToProgram, 'home-index-program')}
        {jumpLine('Library', navigateToExerciseDatabase, 'home-index-library')}
        {jumpLine('Progress', navigateToProgression, 'home-index-progress')}
      </View>

      {/* Recent editions — one whisper line each. */}
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
            {recent.slice(0, RECENT_COUNT).map((w) => (
              <EditionLine key={w.id} session={w} onPress={navigateToWorkoutDetail} />
            ))}
          </View>
        )}
      </View>
    </DeskShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 52,
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Top-level blocks carry the air law: BLOCK_GAP above each (the
  // statement leads with none — it is the page's first word).
  block: {
    marginTop: BLOCK_GAP,
  },
  dayTitle: {
    ...theme.typography.mobileDisplay,
    marginTop: 4,
  },
  lede: {
    ...theme.typography.mobileItemTitle,
    marginBottom: 24,
  },
  jumpStack: {
    gap: ROW_GAP / 2,
  },
  jumpRow: {
    minHeight: 48,
    justifyContent: 'center',
  },
  jumpLabel: {
    ...theme.typography.mobileItemTitle,
  },
});
