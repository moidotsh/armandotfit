// app/exercise-detail.tsx
// THE SPEC SHEET (docs/architecture/scoreboard-thesis.md §8): "What
// this lift is?" The NAME is the statement; the number to beat
// reads as a REGISTER LINE under a red-ink whisper (THE NUMBER TO
// BEAT — your last top set for this lift, weight × reps in mono,
// its date beside). The trajectory and the weekly work read as
// register lines too — aligned tabular lines beat drawn charts for
// exact lookup (the drawn line and the tonnage bars die with THE
// GAUGE); the record week's figure carries the red. Instructions
// read as one body block; the muscle measure reads as two text
// lines (prime movers / assistants — names carry it, bars are
// drawing); equipment whispers once. When a draft session is
// active, ADD TO SESSION is the page's one verb.

import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  MobilePrimaryButton,
  MobileActionFooter,
} from '../components/MobilePremium';
import { BoardShell, RegisterLine } from '../components/composed';
import { FilterChip, FilterChipGroup } from '../components/MobilePremium';
import { useAppTheme, useToast } from '../context';
import { safeGoBack } from '../navigation';
import { useExerciseDetail, useTopSetsByName, useWeightUnit, useRecentSessionDetails } from '../hooks';
import { deriveTrajectory, deriveExerciseVolumeByWeek } from '../services';
import { useWorkoutStore } from '../stores';
import {
  EQUIPMENT_DISPLAY_NAMES,
  EXERCISE_TYPE_DISPLAY,
  MUSCLE_DISPLAY_NAMES,
  equipmentSlugs,
  type MuscleSlug,
} from '../shared/exercises';
import { INTERVAL, theme, PAGE_GUTTER } from '../constants';
import { toDisplayWeight, roundDisplayWeight } from '../utils';
import type { ExerciseKey } from '../shared/exercises';

export default function ExerciseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const query = useExerciseDetail(slug ?? null);
  const topSets = useTopSetsByName();
  const unit = useWeightUnit();
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);
  const addExerciseToDraft = useWorkoutStore((s) => s.addExerciseToDraft);

  const exercise = query.data;

  // LAST TIME — this exercise's most recent TOP set, from the shared
  // derivation (the same rule that arms the Floor and draws the board
  // rows). The number you're walking in to beat.
  const lastTime = React.useMemo(() => {
    if (!exercise) return null;
    const fact = topSets.map.get(exercise.name.toLowerCase());
    if (!fact) return null;
    return {
      weight: roundDisplayWeight(toDisplayWeight(fact.weight, unit)),
      reps: fact.reps,
      sets: fact.sets,
      when: new Date(fact.startedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    };
  }, [exercise, topSets.map]);

  const typeLabel = exercise
    ? (EXERCISE_TYPE_DISPLAY[exercise.exerciseType] ?? '')
    : '';

  // THE TRAJECTORY — this lift's top set per session, each point
  // carrying its TAG SIGNATURE (machine / grip / technique). Variants
  // merge by default; the owner excludes or re-includes them at will —
  // a different machine IS a different trajectory.
  const historyQuery = useRecentSessionDetails(60);
  const trajectory = useMemo(
    () => (exercise ? deriveTrajectory(historyQuery.data ?? [], exercise.name) : null),
    [historyQuery.data, exercise],
  );
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set());
  const visiblePoints = useMemo(() => {
    if (!trajectory) return [];
    return trajectory.points.filter((p) => !excluded.has(p.signature));
  }, [trajectory, excluded]);
  // The work read: this lift's tonnage by week, same variant filter.
  const weeklyVolume = useMemo(
    () =>
      exercise
        ? deriveExerciseVolumeByWeek(historyQuery.data ?? [], exercise.name, excluded)
        : [],
    [historyQuery.data, exercise, excluded],
  );

  return (
    <BoardShell
      surface="instructions"
      onBack={safeGoBack}
      testID="entry-scroll"
      contentContainerStyle={styles.bodyContent}
    >
      {!exercise ? (
        <Text style={[styles.missing, { color: colors.textMuted }]}>
          Unknown exercise.
        </Text>
      ) : (
        <>
          {/* THE STATEMENT — the name. */}
          <View>
            <Text style={[styles.headline, { color: colors.text }]} numberOfLines={2}>
              {exercise.name}
            </Text>
          </View>

          {/* THE NUMBER TO BEAT — the last top set as a ruled row
              under its whisper. The FIGURE is the record (red); the
              LABEL is furniture — muted ink, never red
              (interval-thesis §2: furniture never wears the red). */}
          <View style={styles.lastBlock}>
            {lastTime ? (
              <>
                <Text style={[styles.lastLabel, { color: colors.textMuted }]}>
                  THE NUMBER TO BEAT
                </Text>
                <RegisterLine
                  label={`${lastTime.weight} × ${lastTime.reps}`}
                  labelTone="record"
                  figure={lastTime.when}
                  figureTone="muted"
                  testID="entry-last-line"
                />
                <Text style={[styles.typeLine, { color: colors.textMuted }]} numberOfLines={1}>
                  {`${lastTime.sets} set${lastTime.sets === 1 ? '' : 's'} last time · ${typeLabel}`}
                </Text>
              </>
            ) : (
              <Text style={[styles.typeLine, { color: colors.textMuted }]} numberOfLines={1}>
                {typeLabel}
              </Text>
            )}
          </View>

          {/* THE TRAJECTORY — the top set per session as register
              lines (newest first); variants merge by default and the
              owner excludes/re-includes at will. */}
          {trajectory && trajectory.points.length >= 2 ? (
            <View style={styles.block}>
              <Text style={[styles.sectionWhisper, { color: colors.textMuted }]}>
                THE TRAJECTORY
              </Text>
              {trajectory.groups.length > 1 ? (
                <View style={styles.variantChips}>
                  <FilterChipGroup>
                    {trajectory.groups.map((g) => (
                      <FilterChip
                        key={g.signature}
                        label={g.label}
                        selected={!excluded.has(g.signature)}
                        onPress={() =>
                          setExcluded((prev) => {
                            const next = new Set(prev);
                            if (next.has(g.signature)) next.delete(g.signature);
                            else next.add(g.signature);
                            return next;
                          })
                        }
                        accessibilityLabel={`${excluded.has(g.signature) ? 'Include' : 'Exclude'} variant ${g.label}`}
                      />
                    ))}
                  </FilterChipGroup>
                </View>
              ) : null}
              {visiblePoints.length >= 2 ? (
                <View testID="entry-trajectory">
                  {/* The trajectory's own first line — first → last,
                      the trend stated in one figure. */}
                  {(() => {
                    const first = visiblePoints[0];
                    const last = visiblePoints[visiblePoints.length - 1];
                    const w0 = roundDisplayWeight(toDisplayWeight(first.weight, unit));
                    const w1 = roundDisplayWeight(toDisplayWeight(last.weight, unit));
                    const pct = w0 > 0 ? Math.round(((w1 - w0) / w0) * 100) : 0;
                    return (
                      <Text style={[styles.trendLine, { color: colors.text }]} testID="entry-trend">
                        {`${w0} → ${w1} ${unit} · ${pct >= 0 ? '+' : ''}${pct}% · ${visiblePoints.length} SESSIONS`}
                      </Text>
                    );
                  })()}
                  {[...visiblePoints].reverse().map((p) => {
                    const d = new Date(p.at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    });
                    const w = roundDisplayWeight(toDisplayWeight(p.weight, unit));
                    return (
                      <RegisterLine
                        key={p.at}
                        label={d}
                        figure={`${w} × ${p.reps}`}
                        testID={`entry-trajectory-line-${p.at}`}
                      />
                    );
                  })}
                </View>
              ) : (
                <Text style={[styles.trajectoryEmpty, { color: colors.textMuted }]}>
                  Every variant is excluded — re-enable one to read the record.
                </Text>
              )}
            </View>
          ) : null}

          {/* THE WORK — this lift's tonnage by week as register lines
              (same variant filter as the trajectory); the record
              week's figure carries the red. */}
          {weeklyVolume.length >= 2 ? (
            <View style={styles.block}>
              <Text style={[styles.sectionWhisper, { color: colors.textMuted }]}>
                {`THE WORK · WEEKLY · ${unit}`}
              </Text>
              <View testID="entry-volume">
                {weeklyVolume.map((w) => {
                  const maxV = Math.max(...weeklyVolume.map((x) => x.volume));
                  const isRecord = w.volume === maxV && w.volume > 0;
                  return (
                    <RegisterLine
                      key={w.weekStart}
                      label={w.weekStart}
                      muted={!isRecord}
                      figureTone={isRecord ? 'record' : 'ink'}
                      figure={String(Math.round(toDisplayWeight(w.volume, unit)))}
                      accessibilityLabel={`Week of ${w.weekStart}: ${Math.round(toDisplayWeight(w.volume, unit))} ${unit}`}
                      testID={`entry-volume-line-${w.weekStart}`}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* The reading block. */}
          <View style={styles.block}>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              {exercise.instructions || 'No instructions available.'}
            </Text>
            {exercise.tips ? (
              <Text style={[styles.tips, { color: colors.textMuted }]}>
                Tip — {exercise.tips}
              </Text>
            ) : null}
          </View>

          {/* The measure — what the lift trains, as two text lines:
              the prime movers and the assistants. Names carry it; bars
              are drawing (the ink bars die with THE GAUGE). */}
          {exercise.primaryMuscles.length + exercise.secondaryMuscles.length > 0 ? (
            <View style={styles.block}>
              <View style={styles.measureRow}>
                <Text style={[styles.measureRole, { color: colors.textMuted }]}>PRIME</Text>
                <Text style={[styles.measureNames, { color: colors.text }]} numberOfLines={2}>
                  {exercise.primaryMuscles
                    .map((m) => MUSCLE_DISPLAY_NAMES[m as MuscleSlug])
                    .join(', ')}
                </Text>
              </View>
              {exercise.secondaryMuscles.length > 0 ? (
                <View style={styles.measureRow}>
                  <Text style={[styles.measureRole, { color: colors.textMuted }]}>ASSIST</Text>
                  <Text style={[styles.measureNames, { color: colors.textMuted }]} numberOfLines={2}>
                    {exercise.secondaryMuscles
                      .map((m) => MUSCLE_DISPLAY_NAMES[m as MuscleSlug])
                      .join(', ')}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Equipment — one whisper line. */}
          {exercise.equipment.length > 0 ? (
            <View style={styles.block}>
              <Text style={[styles.equipmentLine, { color: colors.textMuted }]} numberOfLines={1}>
                {equipmentSlugs(exercise)
                  .map((slug) => EQUIPMENT_DISPLAY_NAMES[slug])
                  .join(' · ')}
              </Text>
            </View>
          ) : null}
        </>
      )}

      {isSessionActive && exercise ? (
        <View style={styles.block}>
          <MobileActionFooter>
            <MobilePrimaryButton
              onPress={() => {
                addExerciseToDraft({
                  exerciseName: exercise.name,
                  exerciseSlug: exercise.slug as ExerciseKey | '',
                });
                showToast('success', `Added ${exercise.name} to session`);
                safeGoBack();
              }}
            >
              Add to session
            </MobilePrimaryButton>
          </MobileActionFooter>
        </View>
      ) : null}
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 40 },
  block: {
    ...INTERVAL.block,
  },
  headline: {
    ...INTERVAL.statement,
  },
  // The number-to-beat block sits in the statement's halo.
  lastBlock: {
    marginTop: 20,
    gap: 6,
  },
  lastLabel: {
    ...theme.typography.mobileEyebrow,
    marginBottom: 2,
  },
  // The trajectory's trend line — the summary before the entries.
  trendLine: {
    ...theme.typography.mobileFigure,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  typeLine: {
    ...INTERVAL.whisperLine,
    marginTop: 2,
  },
  bodyText: { ...theme.typography.mobileBody },
  tips: { ...theme.typography.mobileMeta, marginTop: 10 },
  missing: { ...theme.typography.mobileMeta },
  // The measure — role furniture + names, one line each.
  measureRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    minHeight: 32,
  },
  measureRole: {
    ...theme.typography.mobileEyebrow,
    width: 56,
  },
  measureNames: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  equipmentLine: {
    ...theme.typography.mobileLedger,
  },
  sectionWhisper: {
    ...INTERVAL.whisper,
    marginBottom: 8,
  },
  variantChips: {
    marginBottom: 12,
  },
  trajectoryEmpty: {
    ...theme.typography.mobileMeta,
    paddingVertical: 12,
  },
});
