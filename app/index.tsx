// app/index.tsx
// Home — THE GAUGE's front (docs/architecture/gauge-thesis.md §8).
// Question: "what am I walking into today?" The day's title is the
// statement (the page carries no name of its own); **THE DAY PANEL**
// — the day's plan on one enamel panel wearing the screen's one 2px
// instrument rule — shows each lift with its pin rail at the prefill
// weight, so you SEE the session's load profile before you start
// (every rail reads against the day's one ceiling — the skyline).
// START (or RESUME) is the one verb (ink). Three jump rows keep
// their one fact each (the streak lives on the Progress row);
// recent sessions close the page as Martian lines. While a session
// runs, BoardShell pins the ticker under the folio.

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
  PinRail,
} from '../components/composed';
import { useAppTheme } from '../context';
import {
  theme,
  suggestNextSplitDay,
  suggestSessionWindow,
  GAUGE,
  ROW_GAP,
  PAGE_GUTTER,
  railMaxFor,
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
import { useSplitPreferenceStore, useWorkoutStore } from '../stores';
import { useDashboardSummary, useRecentSessionDetails, useTopSetsByName } from '../hooks';

const RECENT_COUNT = 3;

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const recentQuery = useRecentSessionDetails(5);
  const topSets = useTopSetsByName();
  const preferredSplit = useSplitPreferenceStore((s) => s.splitType);
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);

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

  // The panel rows' prefills — the last TOP set per exercise name
  // (the shared derivation; the same rule that arms the Floor).
  const prefillBySlot = useMemo(
    () =>
      suggestedSlots.map((slot) => {
        const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
        const name = entry?.name ?? slot.exercise;
        return topSets.map.get(name.toLowerCase())?.weight ?? null;
      }),
    [suggestedSlots, topSets],
  );
  // THE DAY'S CEILING — every skyline rail reads against one scale:
  // the heaviest prefill on the panel, rounded up to the next 25.
  const dayRailMax = useMemo(
    () => railMaxFor(Math.max(0, ...prefillBySlot.map((w) => w ?? 0))),
    [prefillBySlot],
  );

  const header = (
    <View style={styles.headerRow}>
      {/* The folio — the brand mark at whisper scale. The panel's
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
          signal furniture above it. */}
      <BoardHead
        statement={dayTitle}
        statementTestID="home-day-title"
        whisper={`${suggestedWindow === 'am' ? 'MORNING' : 'EVENING'} · DAY ${suggestedDay}`}
        whisperTone="record"
      />

      {/* THE DAY PANEL — the day's plan on one enamel panel wearing
          the 2px instrument rule: name + Rx whisper + the pin rail at
          the prefill weight. You see the session's load profile
          before you start it. */}
      <View style={styles.block}>
        <View
          style={[
            styles.dayPanel,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              borderTopColor: colors.text,
            },
          ]}
          testID="home-board"
        >
          {suggestedSlots.length === 0 ? (
            <Text style={[styles.panelEmpty, { color: colors.textMuted }]}>
              No lifts programmed — start anyway and set your own pins.
            </Text>
          ) : (
            suggestedSlots.map((slot, i) => {
              const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
              const name = entry?.name ?? slot.exercise;
              const prefill = prefillBySlot[i];
              const sets = slot.sets[1] > 0 ? slot.sets[1] : slot.sets[0];
              return (
                <View key={slot.exercise + i} style={styles.panelRow}>
                  <View style={styles.panelNameHold}>
                    <Text style={[styles.panelName, { color: colors.text }]} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={[styles.panelRx, { color: colors.textMuted }]}>
                      {`${sets}×${slot.reps[0]}–${slot.reps[1]}`}
                    </Text>
                  </View>
                  <PinRail
                    kg={prefill}
                    scale="whisper"
                    railMax={dayRailMax}
                    testID={`home-board-rail-${i}`}
                  />
                </View>
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
    ...GAUGE.block,
  },
  // THE DAY PANEL — the enamel panel wearing the screen's one 2px
  // instrument rule (the printed face).
  dayPanel: {
    borderWidth: 1,
    borderTopWidth: 2,
    borderRadius: theme.shapes.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  panelEmpty: {
    ...theme.typography.mobileMeta,
    paddingVertical: 8,
  },
  panelRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  panelNameHold: {
    flex: 1,
  },
  panelName: {
    ...GAUGE.row,
  },
  panelRx: {
    ...theme.typography.mobileLedger,
    marginTop: 0,
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
    ...GAUGE.row,
  },
  jumpCaption: {
    ...theme.typography.mobileLedger,
    flex: 1,
    textAlign: 'right',
  },
});
