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
import { BoardShell, BoardHead, NextStation, QueryErrorNote, RegisterLine , SectionWhisper } from '../components/composed';
import { useAppTheme } from '../context';
import {
  navigateToExerciseDetail,
  navigateToAnalytics,
  navigateToSplitSelection,
  safeGoBack,
} from '../navigation';
import { useDashboardSummary, usePersonalBests, useWeightUnit, useRecentSessionDetails } from '../hooks';
import { SYSTEM_EXERCISES } from '../shared/exercises';
import { INTERVAL, PAGE_GUTTER, PRESS_DIP, theme } from '../constants';
import { e1rm } from '../services';
import { bodyweightAsOf } from '../utils/bodyweight';
import { useBodyweightHistory } from '../hooks/queries';
import { derivePrTimeline } from '../services';
import { toDisplayWeight, roundDisplayWeight, weightUnitLabel, formatWeight, joinFacts } from '../utils';

const PB_COUNT = 5;

/** The exercise acronym — first letter of each word, uppercased. */
function acronymFor(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

/** The tag acronym — first letter of each hyphen-separated word. */
function tagAcronym(tag: string): string {
  return tag
    .split('-')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export default function ProgressionScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const pbQuery = usePersonalBests();
  const unit = useWeightUnit();
  
  const historyQuery = useRecentSessionDetails(60);

  // THE BODYWEIGHT — calisthenic e1RMs compute from the effective
  // load (factor × as-of bodyweight + any added load), the same 'a'
  // the receipt declares. Raw weight alone understates bodyweight work.
  const bodyweightQuery = useBodyweightHistory();
  const bodyweightAt = (iso: string) =>
    bodyweightQuery.data && bodyweightQuery.data.length > 0
      ? bodyweightAsOf(bodyweightQuery.data, iso)
      : null;
  const calisthenicE1rm = (
    exerciseName: string,
    loggedWeight: number,
    reps: number,
    atIso: string,
    rawE1rm: number,
  ): number => {
    const entry = SYSTEM_EXERCISES.find((e) => e.name === exerciseName);
    const factor = entry?.bodyweightLoadFactor;
    if (factor == null || factor <= 0) return rawE1rm;
    const bw = bodyweightAt(atIso);
    if (bw == null || bw <= 0) return rawE1rm;
    const effective = factor * bw + loggedWeight;
    return e1rm(effective, reps);
  };

  // THE TAG MAP — exercise name → its most-recent tags (the acronym's
  // muted prefix: CCLR = captains-chair + Leg Raise).
  const tagMap = useMemo(() => {
    const map = new Map<string, string[]>();
    const history = historyQuery.data ?? [];
    for (const session of history) {
      for (const ex of session.exercises ?? []) {
        if (ex.exerciseName && ex.tags?.length > 0) {
          map.set(ex.exerciseName, ex.tags);
        }
      }
    }
    return map;
  }, [historyQuery.data]);

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
      {/* The loading posture asserts nothing — and "not loading" is
          not "settled": the query sits disabled until the auth store
          hydrates, so the empty state waits for a SUCCESSFUL read
          before it claims there is nothing to progress. */}
      {summaryQuery.isError ? (
        <QueryErrorNote onRetry={() => void summaryQuery.refetch()} testID="progression-error" />
      ) : !summaryQuery.isSuccess ? (
        <LoadingSpinner />
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
            whisper={joinFacts([
              'THE RECORD BOOK',
              summary?.streak.current != null &&
              summary.streak.current > 0 &&
              summary.streak.current >= (summary.streak.best ?? 0)
                ? 'BEST RUN'
                : null,
            ])}
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
              <SectionWhisper>
                THE BESTS
              </SectionWhisper>
              <View>
                {pbs.map((pb) => {
                  const lastTags = tagMap.get(pb.exerciseName) ?? [];
                  const tagPart = lastTags.map(tagAcronym).join('');

                  // Identity joins by NAME (data.ts) — resolve the
                  // slug + the bodyweight factor at read time.
                  const entry = SYSTEM_EXERCISES.find((e) => e.name === pb.exerciseName);
                  const slug = entry?.slug;
                  const isCalisthenic = (entry?.bodyweightLoadFactor ?? 0) > 0;
                  const adjustedE1rm = calisthenicE1rm(
                    pb.exerciseName,
                    pb.bestWeight,
                    pb.bestReps,
                    pb.bestAt,
                    pb.bestE1rm,
                  );
                  return (
                    <Pressable
                      key={pb.exerciseName}
                      onPress={slug ? () => navigateToExerciseDetail(slug) : undefined}
                      accessibilityRole={slug ? 'button' : undefined}
                      accessibilityLabel={`${pb.exerciseName} — e1RM ${Math.round(pb.bestE1rm)}, best ${pb.bestWeight} for ${pb.bestReps}`}
                      style={({ pressed }) => [
                        styles.bestsEntry,
                        pressed ? { opacity: PRESS_DIP } : null,
                      ]}
                      testID={`gauge-wall-row-${pb.exerciseName}`}
                    >
                      {/* The exercise IS the row — row rank, full ink. */}
                      <View style={styles.bestsHead}>
                        <Text style={[styles.bestsName, { color: colors.text }]} numberOfLines={1}>
                          {tagPart ? (
                            <Text style={{ color: colors.textMuted }}>{tagPart} </Text>
                          ) : null}
                          {pb.exerciseName}
                        </Text>
                        {/* e1RM — the headline number. */}
                        <Text style={[styles.bestsE1rm, { color: colors.text }]} numberOfLines={1}>
                          {isCalisthenic ? (
                            <Text style={{ color: colors.brandText }}>a+</Text>
                          ) : null}
                          {formatWeight(adjustedE1rm, unit)}
                        </Text>
                      </View>
                      {/* Metadata — muted, furniture rank. */}
                      <Text style={[styles.bestsMeta, { color: colors.textMuted }]} numberOfLines={1}>
                        {new Date(pb.bestAt).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                        {' · '}
                        {pb.bestWeight} × {pb.bestReps}
                        {' · e1RM'}
                      </Text>
                    </Pressable>
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
              <SectionWhisper>
                THE PR TIMELINE
              </SectionWhisper>
              <View testID="pr-timeline">
                {prTimeline.map((pr, i) => {
                  const lastTags = tagMap.get(pr.exerciseName) ?? [];
                  const tagPart = lastTags.map(tagAcronym).join('');
                  const prEntry = SYSTEM_EXERCISES.find((e) => e.name === pr.exerciseName);
                  const prIsCalisthenic = (prEntry?.bodyweightLoadFactor ?? 0) > 0;
                  return (
                  <RegisterLine
                    key={`${pr.at}-${pr.exerciseName}-${i}`}
                    monoPrefix={new Date(pr.at).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                    label={pr.exerciseName}
                    labelMuted={tagPart || undefined}
                    figure={`${formatWeight(pr.weight, unit)} × ${pr.reps}`}
                    accessibilityLabel={`${new Date(pr.at).toLocaleDateString()}: ${pr.exerciseName} new best, ${formatWeight(pr.weight, unit)} ${weightUnitLabel(unit)} for ${pr.reps}`}
                    testID={`pr-timeline-line-${i}`}
                  />
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* THE TAIL — the analytics door as the way-forward row: one
              grammar for every exit that points onward (the hairline
              row, the destination's thesis name, the chevron — not a
              stray label pretending it isn't a door). */}
          <NextStation
            name="Analytics"
            label="THE LEDGER"
            onPress={navigateToAnalytics}
            accessibilityLabel="View analytics"
            testID="progression-analytics-link"
          />
        </>
      )}
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  // THE BESTS — exercise as identity, e1RM as headline, metadata muted.
  bestsEntry: {
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  bestsHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  bestsName: {
    ...theme.typography.mobileItemTitle,
    fontSize: 18,
    fontWeight: '600',
    flexShrink: 1,
    flexGrow: 1,
  },
  bestsE1rm: {
    ...theme.typography.mobileFigure,
    fontSize: 18,
    fontWeight: '600',
  },
  bestsMeta: {
    ...theme.typography.mobileLedger,
    marginTop: 2,
  },
  bodyContent: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 80 },
  block: {
    ...INTERVAL.block,
  },
  totals: {
    ...INTERVAL.figure,
  },
});
