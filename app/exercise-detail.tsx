// app/exercise-detail.tsx
// THE BOARD's entry (docs/architecture/board-thesis.md §7): "What
// this lift is." The NAME is the statement; the number to beat
// renders AS A PLATE STACK — LAST in furniture caps, the row-scale
// stack of your most recent top load, the figure line (weight ×
// reps · sets · date) in Spline — you see the iron you're walking in
// to beat, not just read it. Instructions read as one body block;
// the muscle measure draws as bare INK lines (color is load's —
// muscles never borrow the ramp); equipment whispers once. When a
// draft session is active, ADD TO SESSION is the page's one verb.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  MobilePrimaryButton,
  MobileActionFooter,
} from '../components/MobilePremium';
import { BoardShell, PlateStack } from '../components/composed';
import { useAppTheme, useToast } from '../context';
import { safeGoBack } from '../navigation';
import { useExerciseDetail, useTopSetsByName } from '../hooks';
import { useWorkoutStore } from '../stores';
import {
  EQUIPMENT_DISPLAY_NAMES,
  EXERCISE_TYPE_DISPLAY,
  MUSCLE_DISPLAY_NAMES,
  type EquipmentSlug,
  type MuscleSlug,
} from '../shared/exercises';
import { BOARD, theme, PAGE_GUTTER } from '../constants';
import type { ExerciseKey } from '../shared/exercises';

function equipmentLabel(e: EquipmentSlug | { slug: EquipmentSlug }): string {
  return EQUIPMENT_DISPLAY_NAMES[typeof e === 'string' ? e : e.slug];
}

export default function ExerciseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const query = useExerciseDetail(slug ?? null);
  const topSets = useTopSetsByName();
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
      weight: fact.weight,
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

          {/* THE NUMBER TO BEAT — drawn. LAST in furniture caps, the
              stack, then the figure line. */}
          <View style={styles.lastBlock}>
            {lastTime ? (
              <>
                <Text style={[styles.lastLabel, { color: colors.brandText }]}>
                  THE NUMBER TO BEAT
                </Text>
                <PlateStack kg={lastTime.weight} scale="counter" testID="entry-last-stack" />
                <Text style={[styles.lastLine, { color: colors.text }]} numberOfLines={1}>
                  {`${lastTime.weight} × ${lastTime.reps} · ${lastTime.sets} set${lastTime.sets === 1 ? '' : 's'} · ${lastTime.when}`}
                </Text>
              </>
            ) : (
              <Text style={[styles.typeLine, { color: colors.textMuted }]} numberOfLines={1}>
                {typeLabel}
              </Text>
            )}
          </View>

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

          {/* The measure — what the lift trains, as bare INK lines:
              a prime mover fills, an assistant fills 40%. Muscles
              never borrow the plate ramp — color is load's. */}
          {exercise.primaryMuscles.length + exercise.secondaryMuscles.length > 0 ? (
            <View style={styles.block}>
              <View>
                {exercise.primaryMuscles.map((m) => (
                  <View
                    key={m}
                    style={styles.targetRow}
                    accessibilityLabel={`Primary muscle ${MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}`}
                  >
                    <Text style={[styles.targetName, { color: colors.text }]}>
                      {MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}
                    </Text>
                    <View style={styles.targetTrack}>
                      <View style={[styles.targetBar, { backgroundColor: colors.text }]} />
                    </View>
                  </View>
                ))}
                {exercise.secondaryMuscles.map((m) => (
                  <View
                    key={m}
                    style={styles.targetRow}
                    accessibilityLabel={`Secondary muscle ${MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}`}
                  >
                    <Text style={[styles.targetName, { color: colors.textMuted }]}>
                      {MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}
                    </Text>
                    <View style={styles.targetTrack}>
                      <View
                        style={[
                          styles.targetBar,
                          styles.targetBarSecondary,
                          { backgroundColor: colors.textMuted },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Equipment — one whisper line. */}
          {exercise.equipment.length > 0 ? (
            <View style={styles.block}>
              <Text style={[styles.equipmentLine, { color: colors.textMuted }]} numberOfLines={1}>
                {exercise.equipment.map(equipmentLabel).join(' · ')}
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
    ...BOARD.block,
  },
  headline: {
    ...BOARD.statement,
  },
  // The number-to-beat block sits in the statement's halo.
  lastBlock: {
    marginTop: 20,
    gap: 6,
  },
  lastLabel: {
    ...theme.typography.mobileEyebrow,
  },
  lastLine: {
    ...theme.typography.mobileFigure,
    fontWeight: '700',
  },
  typeLine: {
    ...BOARD.whisperLine,
  },
  bodyText: { ...theme.typography.mobileBody },
  tips: { ...theme.typography.mobileMeta, marginTop: 10 },
  missing: { ...theme.typography.mobileMeta },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 40,
  },
  targetName: {
    ...theme.typography.mobileItemTitle,
    width: 116,
  },
  targetTrack: {
    flex: 1,
    alignItems: 'flex-start',
  },
  targetBar: {
    width: '72%',
    height: 6,
    borderRadius: 2,
  },
  targetBarSecondary: {
    width: '32%',
  },
  equipmentLine: {
    ...theme.typography.mobileLedger,
  },
});
