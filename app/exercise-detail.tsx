// app/exercise-detail.tsx
// THE SPEC SHEET (docs/architecture/interval-thesis.md §8): "What
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
import { Image, Pressable, StyleSheet, Text, View, type ImageStyle } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  MobilePrimaryButton,
  MobileActionFooter,
} from '../components/MobilePremium';
import { BoardShell, RegisterLine , SectionWhisper } from '../components/composed';
import { FilterChip, FilterChipGroup } from '../components/MobilePremium';
import { useAppTheme, useToast } from '../context';
import { safeGoBack } from '../navigation';
import { plateOffsetFor } from '../shared/exercises/plateOffsets';
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
import { INTERVAL, theme, PAGE_GUTTER, PRESS_DIP } from '../constants';
import {
  cardioStationBySlug,
  formatCardioDuration,
  formatCardioDistance,
  formatCardioDelta,
  CARDIO_STATIONS,
} from '../shared/exercises/cardio';
import type { LoggedCardio } from '../shared/types';
import { toDisplayWeight, roundDisplayWeight, joinFacts } from '../utils';
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
  const addCardioToDraft = useWorkoutStore((s) => s.addCardioToDraft);

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
  // CARDIO (pass C3): the spec sheet's cardio branch — the station's
  // sittings across recent history, newest first, with the duration Δ
  // (the ladder's first customer: the chart is printed figures).
  const stationKey = exercise ? cardioStationBySlug(exercise.slug) : null;
  const cardioHistory: Array<LoggedCardio & { startedAt: string }> = useMemo(() => {
    if (!stationKey) return [];
    const out: Array<LoggedCardio & { startedAt: string }> = [];
    for (const session of historyQuery.data ?? []) {
      for (const row of session.cardio) {
        if (row.station === stationKey) out.push({ ...row, startedAt: session.startedAt });
      }
    }
    return out.slice(0, 10);
  }, [historyQuery.data, stationKey]);

  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set());
  const [plateFrame, setPlateFrame] = useState(0);
  // THE PLATE ALIGNMENT — the B frame's camera offset, applied as a
  // translate so the crossfade shows only the movement.
  const plateOffset = plateOffsetFor(exercise?.slug ?? '');
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

          {/* THE PLATE (the field-guide pass): the exercise's figure as
              a PRINT — monochrome (grayscale, a breath of sepia toward
              the cream ground), square-cut, bounded by hairline rules
              top and bottom. A field guide's engraving, not a photo
              grid: one figure per entry, static, the instructions
              carry the meaning. */}
          {exercise.image ? (
            <Pressable
              onPress={() => (exercise.imageB ? setPlateFrame((f) => (f === 0 ? 1 : 0)) : undefined)}
              accessibilityRole="imagebutton"
              accessibilityLabel={
                exercise.imageB
                  ? `Plate: ${exercise.name} — ${plateFrame === 0 ? 'concentric' : 'eccentric'} frame; tap to flip`
                  : `Plate: ${exercise.name}`
              }
              style={({ pressed }) => [
                styles.plate,
                {
                  borderTopColor: colors.mobilePremium.hairlineBorder,
                  borderBottomColor: colors.mobilePremium.hairlineBorder,
                },
                pressed ? { opacity: PRESS_DIP } : null,
              ]}
              testID="entry-plate"
            >
              {/* Both frames stay mounted — the B frame pre-loads
                  (cached by the time you flip) and the exchange is a
                  pure opacity crossfade: the still system's repaint. */}
              <View style={styles.plateStack}>
                <Image
                  source={{ uri: exercise.image }}
                  style={[
                    styles.plateImage,
                    styles.plateFrameA,
                    { opacity: plateFrame === 0 ? 1 : 0 },
                  ]}
                  accessibilityElementsHidden
                  testID="entry-plate-image-a"
                  resizeMode="contain"
                />
                {exercise.imageB ? (
                  <Image
                    source={{ uri: exercise.imageB }}
                    style={[
                      styles.plateImage,
                      styles.plateFrameB,
                      {
                        opacity: plateFrame === 1 ? 1 : 0,
                        transform: plateOffset
                          ? ([{ translateX: -plateOffset.dx, translateY: -plateOffset.dy }] as unknown as ImageStyle['transform'])
                          : undefined,
                      },
                    ]}
                    accessibilityElementsHidden
                    testID="entry-plate-image-b"
                    resizeMode="contain"
                  />
                ) : null}
              </View>
              {exercise.imageB ? (
                <Text style={[styles.plateWord, { color: colors.textMuted }]}>
                  {plateFrame === 0 ? '1 · 2' : '2 · 2'}
                </Text>
              ) : null}
            </Pressable>
          ) : null}

          {/* THE NUMBER TO BEAT — the last top set as a ruled row
              under its whisper. The FIGURE is the record (red); the
              LABEL is furniture — muted ink, never red
              (interval-thesis §2: furniture never wears the red).
              CARDIO branches: the last sitting's time is the number to
              beat (ink, not red — a machine sitting is a fact, and the
              red stays rationed to barbell records). */}
          {stationKey && cardioHistory.length > 0 ? (
            <View style={styles.lastBlock}>
              <Text style={[styles.lastLabel, { color: colors.textMuted }]}>
                THE TIME TO BEAT
              </Text>
              <RegisterLine
                monoPrefix={formatCardioDuration(cardioHistory[0].durationSec)}
                label={CARDIO_STATIONS[cardioHistory[0].station].name}
                figure={new Date(cardioHistory[0].startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                figureTone="muted"
                testID="entry-cardio-last"
              />
              <Text style={[styles.typeLine, { color: colors.textMuted }]} numberOfLines={1}>
                {typeLabel}
              </Text>
            </View>
          ) : null}
          {!stationKey ? (
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
          ) : null}

          {/* THE CARDIO TRAJECTORY — the ladder: every sitting a rung
              (duration prefix · prescription label → outcomes figure),
              the Δ duration as the second figure — ink when the time
              went DOWN (the improvement), muted when it went up. Nothing
              drawn; the trend is printed. */}
          {stationKey && cardioHistory.length >= 1 ? (
            <View style={styles.block}>
              <SectionWhisper>
                {`THE LADDER · ${cardioHistory.length} SITTING${cardioHistory.length === 1 ? '' : 'S'}`}
              </SectionWhisper>
              {cardioHistory.map((row, i) => {
                const prev = cardioHistory[i + 1];
                const delta = prev ? formatCardioDelta(row.durationSec, prev.durationSec) : null;
                const improved = prev != null && row.durationSec < prev.durationSec;
                const outcomes = joinFacts([
                  row.distanceM != null ? formatCardioDistance(row.distanceM) : null,
                  row.kcal != null ? `${row.kcal} kcal` : null,
                ]);
                return (
                  <RegisterLine
                    key={row.id}
                    monoPrefix={formatCardioDuration(row.durationSec)}
                    label={new Date(row.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    figure={delta ?? (outcomes || null)}
                    muted={prev != null && !improved}
                    accessibilityLabel={`${formatCardioDuration(row.durationSec)}${delta ? `, ${delta} versus last time` : ''}${outcomes ? `, ${outcomes}` : ''}`}
                    testID={`entry-cardio-ladder-${i}`}
                  />
                );
              })}
            </View>
          ) : null}

          {/* THE TRAJECTORY — the top set per session as register
              lines (newest first); variants merge by default and the
              owner excludes/re-includes at will. One logged session
              renders its one rung — the count label says it honestly;
              the block is absent only when there is nothing to show
              (zero sessions — the number-to-beat's absence already
              says it). */}
          {!stationKey && trajectory && trajectory.points.length >= 1 ? (
            <View style={styles.block}>
              <SectionWhisper>
                {`THE TRAJECTORY · ${trajectory.points.length} SESSION${trajectory.points.length === 1 ? '' : 'S'}`}
              </SectionWhisper>
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
                  {/* The trajectory's own first line — first → last, the
                      trend stated in one line of pure figures (the
                      session count rides the section whisper; a word
                      inside a figure line broke the line mid-figure). */}
                  {(() => {
                    const first = visiblePoints[0];
                    const last = visiblePoints[visiblePoints.length - 1];
                    const w0 = roundDisplayWeight(toDisplayWeight(first.weight, unit));
                    const w1 = roundDisplayWeight(toDisplayWeight(last.weight, unit));
                    const pct = w0 > 0 ? Math.round(((w1 - w0) / w0) * 100) : 0;
                    return (
                      <Text style={[styles.trendLine, { color: colors.text }]} testID="entry-trend">
                        {`${w0} → ${w1} ${unit} · ${pct >= 0 ? '+' : ''}${pct}%`}
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
              <SectionWhisper>
                {`THE WORK · WEEKLY · ${unit}`}
              </SectionWhisper>
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
                {joinFacts(equipmentSlugs(exercise).map((slug) => EQUIPMENT_DISPLAY_NAMES[slug]))}
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
                // The adder dispatch: cardio stations join the draft as
                // machine stations (the cardio dock's grammar), barbell
                // lifts as exercise stations.
                const cardioKey = cardioStationBySlug(exercise.slug);
                if (cardioKey) {
                  addCardioToDraft(cardioKey);
                } else {
                  addExerciseToDraft({
                    exerciseName: exercise.name,
                    exerciseSlug: exercise.slug as ExerciseKey | '',
                  });
                }
                showToast('success', `Added ${exercise.name} to session`);
                safeGoBack();
              }}
            >
              {/* The verb prints caps — the touch amendment's delta 2,
                  reached on the last sentence-case call site. */}
              ADD TO SESSION
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
  // THE PLATE — a figure between rules: full column width, contained,
  // monochrome print (the filter tints toward the ground — the image
  // reads as an engraving on the cream card, not a photo on a screen).
  // RN does not type `filter`; RN-web renders it (the grain/grain cast).
  plate: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginTop: 12,
  },
  plateWord: {
    ...theme.typography.mobileEyebrow,
    marginTop: 4,
    textAlign: 'center',
  },
  plateImage: {
    width: '100%',
    height: 220,
    // RN does not type `filter`; RN-web renders it — the monochrome
    // print treatment (the cast keeps the literal out of ImageStyle).
    filter: 'grayscale(1) sepia(0.22) contrast(1.04) brightness(1.03)',
  } as unknown as ImageStyle,
  // THE PLATE STACK — both frames share the frame; opacity exchanges.
  plateStack: {
    position: 'relative' as const,
    height: 220,
  },
  plateFrameA: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    transition: 'opacity 180ms ease',
  } as unknown as ImageStyle,
  plateFrameB: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    transition: 'opacity 180ms ease',
  } as unknown as ImageStyle,
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
  variantChips: {
    marginBottom: 12,
  },
  trajectoryEmpty: {
    ...theme.typography.mobileMeta,
    paddingVertical: 12,
  },
});
