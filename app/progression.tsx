// app/progression.tsx
// THE BOARD's record book (docs/architecture/board-thesis.md §7):
// "The streak is 12." No nameplate, no "COMPUTED AT READ" shout —
// the streak NUMBER is the figure-statement (Spline at counter
// scale, in record-orange — one of the brand hue's three
// appearances), alone in its halo; one fact line carries "day
// streak · best"; the totals collapse to one figure line; the
// TROPHY WALL curates to five best lifts — name + the best set
// DRAWN as a row-scale plate stack + the reps figure in the
// record-mark read — the wall is literally the biggest iron you've
// loaded. The e1RM column stays dead (it never answered a question
// the owner asked). All computed at read from raw sessions; nothing
// stored.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { BoardShell, BoardHead, QueryErrorNote, PlateStack } from '../components/composed';
import { useAppTheme } from '../context';
import {
  navigateToExerciseDetail,
  navigateToAnalytics,
  navigateToSplitSelection,
  safeGoBack,
} from '../navigation';
import { useDashboardSummary, usePersonalBests } from '../hooks';
import { SYSTEM_EXERCISES } from '../shared/exercises';
import { BOARD, theme, PAGE_GUTTER } from '../constants';

const PB_COUNT = 5;

export default function ProgressionScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const pbQuery = usePersonalBests();
  const summary = summaryQuery.data;
  const isEmpty = (summary?.totalSessions ?? 0) === 0;
  const pbs = (pbQuery.data ?? []).slice(0, PB_COUNT);

  return (
    <BoardShell
      surface="goal"
      onBack={safeGoBack}
      testID="record-scroll"
      compact={{
        title: 'The record book',
        figure: (
          <Text style={[styles.compactFigure, { color: colors.brandText }]}>
            {`${summary?.streak.current ?? 0}D`}
          </Text>
        ),
      }}
      contentContainerStyle={styles.bodyContent}
    >
      {summaryQuery.isLoading ? (
        <LoadingSpinner />
      ) : summaryQuery.isError ? (
        <QueryErrorNote onRetry={() => void summaryQuery.refetch()} testID="progression-error" />
      ) : isEmpty ? (
        <EmptyState
          title="Nothing to progress yet"
          message="Log your first session and the streak, totals, and bests start here."
          action={{ label: 'Start workout', onPress: navigateToSplitSelection }}
          testID="progression-empty"
        />
      ) : (
        <>
          {/* THE FIGURE-STATEMENT — the streak itself, in record
              orange at counter scale, alone in its halo. */}
          <BoardHead
            statement={String(summary?.streak.current ?? 0)}
            fact={`day streak · best ${summary?.streak.best ?? 0}`}
            variant="figure"
            tone="record"
          />

          {/* Totals — one figure line. */}
          <View style={styles.block}>
            <Text style={[styles.totals, { color: colors.text }]} numberOfLines={1}>
              {`${summary?.thisWeekSessions ?? 0} this week · ${summary?.totalSessions ?? 0} all time`}
            </Text>
          </View>

          {/* THE TROPHY WALL — five best lifts, the iron drawn. */}
          {pbs.length > 0 ? (
            <View style={styles.block}>
              <Text style={[styles.sectionWhisper, { color: colors.textMuted }]}>
                THE TROPHY WALL
              </Text>
              <View>
                {pbs.map((pb) => {
                  // Identity joins by NAME (data.ts) — resolve the
                  // slug for the route at read time.
                  const slug = SYSTEM_EXERCISES.find((e) => e.name === pb.exerciseName)?.slug;
                  return (
                    <Pressable
                      key={pb.exerciseName}
                      onPress={slug ? () => navigateToExerciseDetail(slug) : undefined}
                      accessibilityRole="button"
                      accessibilityLabel={`${pb.exerciseName} — best ${pb.bestWeight} kilograms for ${pb.bestReps}`}
                      style={({ pressed }) => [styles.pbRow, pressed ? { opacity: 0.6 } : null]}
                    >
                      <Text style={[styles.pbName, { color: colors.text }]} numberOfLines={1}>
                        {pb.exerciseName}
                      </Text>
                      <PlateStack kg={pb.bestWeight} scale="row" />
                      <Text style={[styles.pbReps, { color: colors.brandText }]}>
                        {String(pb.bestReps)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </>
      )}
      <Pressable
        onPress={navigateToAnalytics}
        accessibilityRole="button"
        accessibilityLabel="View analytics"
        style={({ pressed }) => [styles.analyticsLink, pressed ? { opacity: 0.6 } : null]}
      >
        <Text style={[styles.analyticsLinkText, { color: colors.text }]}>Analytics</Text>
      </Pressable>
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 80 },
  compactFigure: {
    ...theme.typography.mobileEyebrow,
  },
  block: {
    ...BOARD.block,
  },
  totals: {
    ...BOARD.figure,
  },
  sectionWhisper: {
    ...BOARD.whisper,
    marginBottom: 4,
  },
  pbRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pbName: {
    ...BOARD.row,
    flex: 1,
  },
  pbReps: {
    ...BOARD.figure,
    minWidth: 24,
    textAlign: 'right',
  },
  analyticsLink: { marginTop: BOARD.block.marginTop, minHeight: 48, justifyContent: 'center' },
  analyticsLinkText: {
    ...theme.typography.mobileItemTitle,
  },
});
