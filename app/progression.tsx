// app/progression.tsx
// THE QUIET PAGE's record book (docs/architecture/
// quiet-page-thesis.md §6): "The streak is 12." No nameplate, no
// "COMPUTED AT READ" shout — the streak NUMBER is the statement, in
// the record red, alone in its halo; one fact line carries "day
// streak · best"; the totals collapse to one figure line; the ledger
// curates to five best lifts (name + best set in the record-mark
// read; the e1RM column dies — it never answered a question the
// owner asked). All computed at read from raw sessions; nothing
// stored.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { DeskShell, QueryErrorNote } from '../components/composed';
import { useAppTheme } from '../context';
import {
  navigateToExerciseDetail,
  navigateToAnalytics,
  navigateToSplitSelection,
  safeGoBack,
} from '../navigation';
import { useDashboardSummary, usePersonalBests } from '../hooks';
import { SYSTEM_EXERCISES } from '../shared/exercises';
import { BLOCK_GAP, QUIET, theme } from '../constants';

const PB_COUNT = 5;

export default function ProgressionScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const pbQuery = usePersonalBests();
  const summary = summaryQuery.data;
  const isEmpty = (summary?.totalSessions ?? 0) === 0;
  const pbs = (pbQuery.data ?? []).slice(0, PB_COUNT);

  return (
    <DeskShell surface="goal" onBack={safeGoBack} testID="record-scroll">
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
          {/* THE STATEMENT — the streak itself, in the record red,
              alone in its halo. The unit rides the fact line. */}
          <View>
            <Text style={[styles.streak, { color: colors.brand }]}>
              {summary?.streak.current ?? 0}
            </Text>
            <Text style={[styles.streakFact, { color: colors.textMuted }]} numberOfLines={1}>
              {`day streak · best ${summary?.streak.best ?? 0}`}
            </Text>
          </View>

          {/* Totals — one figure line. */}
          <View style={styles.block}>
            <Text style={[styles.totals, { color: colors.text }]} numberOfLines={1}>
              {`${summary?.thisWeekSessions ?? 0} this week · ${summary?.totalSessions ?? 0} all time`}
            </Text>
          </View>

          {/* The ledger — five best lifts, one line each. */}
          {pbs.length > 0 ? (
            <View style={styles.block}>
              <Text style={[styles.sectionWhisper, { color: colors.textMuted }]}>
                BEST LIFTS
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
                      <Text style={[styles.pbValue, { color: colors.brandText }]}>
                        {`${pb.bestWeight}×${pb.bestReps}`}
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
    </DeskShell>
  );
}

const styles = StyleSheet.create({
  block: {
    ...QUIET.block,
  },
  streak: {
    ...QUIET.statement,
  },
  // The fact line waits outside the statement's halo.
  streakFact: {
    ...QUIET.fact,
  },
  totals: {
    ...QUIET.figure,
  },
  sectionWhisper: {
    ...QUIET.whisper,
    marginBottom: 4,
  },
  pbRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pbName: {
    ...QUIET.row,
    flex: 1,
  },
  pbValue: {
    ...QUIET.figure,
  },
  analyticsLink: { marginTop: BLOCK_GAP, minHeight: 48, justifyContent: 'center' },
  analyticsLinkText: {
    ...theme.typography.mobileItemTitle,
  },
});
