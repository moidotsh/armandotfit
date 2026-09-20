// app/progression.tsx
// THE RECORDS (docs/architecture/interval-thesis.md §8): "How
// strong, how consistent?" The streak NUMBER is the
// figure-statement — Martian at counter scale (72), in RED INK (the
// record mark IS the statement), alone in its halo; one fact line
// carries "day streak · best"; the totals collapse to one figure
// line; THE BESTS curates to five best lifts as ruled rows —
// name · air · `weight × reps` in red figures: the highest
// numbers you've printed. The e1RM column stays dead (it never
// answered a question the owner asked). All computed at read from
// raw sessions; nothing stored.

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { BoardShell, BoardHead, QueryErrorNote, RegisterLine } from '../components/composed';
import { useAppTheme } from '../context';
import {
  navigateToExerciseDetail,
  navigateToAnalytics,
  navigateToSplitSelection,
  safeGoBack,
} from '../navigation';
import { useDashboardSummary, usePersonalBests, useWeightUnit, useRecentSessionDetails } from '../hooks';
import { SYSTEM_EXERCISES } from '../shared/exercises';
import { INTERVAL, theme, PAGE_GUTTER } from '../constants';
import { derivePrTimeline } from '../services';
import { toDisplayWeight, roundDisplayWeight, weightUnitLabel, formatWeight } from '../utils';

const PB_COUNT = 5;

export default function ProgressionScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const pbQuery = usePersonalBests();
  const unit = useWeightUnit();
  const historyQuery = useRecentSessionDetails(60);
  const prTimeline = useMemo(
    () => derivePrTimeline(historyQuery.data ?? [], 8),
    [historyQuery.data],
  );
  const summary = summaryQuery.data;
  const isEmpty = (summary?.totalSessions ?? 0) === 0;
  const pbs = (pbQuery.data ?? []).slice(0, PB_COUNT)
    .map((pb) => ({
      ...pb,
      bestWeight: roundDisplayWeight(toDisplayWeight(pb.bestWeight, unit)),
    }));

  return (
    <BoardShell
      surface="goal"
      onBack={safeGoBack}
      testID="record-scroll"
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
          action={{ label: 'START WORKOUT', onPress: navigateToSplitSelection }}
          testID="progression-empty"
        />
      ) : (
        <>
          {/* THE FIGURE-STATEMENT — the streak itself, in red ink at
              counter scale, alone in its halo, under the page-identity
              whisper. */}
          <BoardHead
            statement={String(summary?.streak.current ?? 0)}
            whisper="THE RECORD BOOK"
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

          {/* THE BESTS — five best lifts as register lines: name ·
              leader · `weight × reps` in ink. RED IS RATIONED (the
              sight amendment): this list is a register of five equal
              facts — red at every row stopped marking and started
              wallpapering; the screen's record mark is the streak
              above. */}
          {pbs.length > 0 ? (
            <View style={styles.block}>
              <Text style={[styles.sectionWhisper, { color: colors.textMuted }]}>
                THE BESTS
              </Text>
              <View>
                {pbs.map((pb) => {
                  // Identity joins by NAME (data.ts) — resolve the
                  // slug for the route at read time.
                  const slug = SYSTEM_EXERCISES.find((e) => e.name === pb.exerciseName)?.slug;
                  return (
                    <RegisterLine
                      key={pb.exerciseName}
                      label={pb.exerciseName}
                      figure={`${pb.bestWeight} × ${pb.bestReps}`}
                      onPress={slug ? () => navigateToExerciseDetail(slug) : undefined}
                      accessibilityLabel={`${pb.exerciseName} — best ${pb.bestWeight} ${weightUnitLabel(unit)} for ${pb.bestReps}`}
                      testID={`gauge-wall-row-${pb.exerciseName}`}
                      figureTestID={`gauge-wall-figure-${pb.exerciseName}`}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* THE PR TIMELINE — when the records fell, latest first, as
              ruled rows: date left · air · the figure right, ink (the
              rationed red stays on the streak). It waits with the body
              — no ruled row asserts a record before the reads settle. */}
          {prTimeline.length > 0 ? (
            <View style={styles.block}>
              <Text style={[styles.sectionWhisper, { color: colors.textMuted }]}>
                THE PR TIMELINE
              </Text>
              <View testID="pr-timeline">
                {prTimeline.map((pr, i) => (
                  <RegisterLine
                    key={`${pr.at}-${pr.exerciseName}-${i}`}
                    label={`${new Date(pr.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${pr.exerciseName}`}
                    figure={`${formatWeight(pr.weight, unit)} × ${pr.reps}`}
                    accessibilityLabel={`${new Date(pr.at).toLocaleDateString()}: ${pr.exerciseName} new best, ${formatWeight(pr.weight, unit)} ${weightUnitLabel(unit)} for ${pr.reps}`}
                    testID={`pr-timeline-line-${i}`}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* THE TAIL — the analytics door waits with the body: a link
              under a bare spinner asserted a destination before the
              record book existed (the loading posture asserts
              nothing). */}
          <Pressable
            onPress={navigateToAnalytics}
            accessibilityRole="button"
            accessibilityLabel="View analytics"
            style={({ pressed }) => [styles.analyticsLink, pressed ? { opacity: 0.6 } : null]}
          >
            <Text style={[styles.analyticsLinkText, { color: colors.text }]}>Analytics</Text>
          </Pressable>
        </>
      )}
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 80 },
  block: {
    ...INTERVAL.block,
  },
  totals: {
    ...INTERVAL.figure,
  },
  sectionWhisper: {
    ...INTERVAL.whisper,
    marginBottom: 4,
  },
  analyticsLink: { marginTop: INTERVAL.block.marginTop, minHeight: 48, justifyContent: 'center' },
  analyticsLinkText: {
    ...theme.typography.mobileItemTitle,
  },
});
