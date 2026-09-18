// app/exercise-detail.tsx
// THE QUIET PAGE's entry (docs/architecture/quiet-page-thesis.md §6):
// "What this lift is." The NAME is the statement; one fact whisper
// beneath carries the number to beat (LAST — weight × reps · sets ·
// date) or the type when history is empty. Instructions read as one
// body block; the muscle measure draws as bare ink lines (a prime
// mover fills, an assistant fills 40% — the measure carries the
// hierarchy, no labels); equipment whispers once as a line. No
// section chrome. When a draft session is active, ADD TO SESSION is
// the page's one verb.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  MobilePrimaryButton,
  MobileActionFooter,
} from '../components/MobilePremium';
import { DeskShell } from '../components/composed';
import { useAppTheme, useToast } from '../context';
import { safeGoBack } from '../navigation';
import { useExerciseDetail, useRecentSessionDetails } from '../hooks';
import { useWorkoutStore } from '../stores';
import {
  EQUIPMENT_DISPLAY_NAMES,
  EXERCISE_TYPE_DISPLAY,
  MUSCLE_DISPLAY_NAMES,
  type EquipmentSlug,
  type MuscleSlug,
} from '../shared/exercises';
import { BLOCK_GAP, QUIET, theme } from '../constants';
import type { ExerciseKey } from '../shared/exercises';

function equipmentLabel(e: EquipmentSlug | { slug: EquipmentSlug }): string {
  return EQUIPMENT_DISPLAY_NAMES[typeof e === 'string' ? e : e.slug];
}

export default function ExerciseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const query = useExerciseDetail(slug ?? null);
  const recentQuery = useRecentSessionDetails(10);
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);
  const addExerciseToDraft = useWorkoutStore((s) => s.addExerciseToDraft);

  const exercise = query.data;

  // LAST TIME — this exercise's most recent logged set, computed at
  // read from history (identity joins by name). The number you're
  // walking in to beat.
  const lastTime = React.useMemo(() => {
    if (!exercise) return null;
    const key = exercise.name.toLowerCase();
    for (const session of recentQuery.data ?? []) {
      const found = session.exercises.find(
        (ex) => ex.exerciseName.toLowerCase() === key,
      );
      if (found && found.sets.length > 0) {
        const last = found.sets[found.sets.length - 1];
        return {
          weight: last.weight,
          reps: last.reps,
          sets: found.sets.length,
          when: new Date(session.startedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
        };
      }
    }
    return null;
  }, [exercise, recentQuery.data]);

  const typeLabel = exercise
    ? (EXERCISE_TYPE_DISPLAY[exercise.exerciseType] ?? '')
    : '';

  return (
    <DeskShell
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
          {/* THE STATEMENT — the name. One fact line beneath, outside
              the halo: the number to beat, or the type. */}
          <View>
            <Text style={[styles.headline, { color: colors.text }]} numberOfLines={2}>
              {exercise.name}
            </Text>
            <Text style={[styles.factLine, { color: colors.textMuted }]} numberOfLines={1}>
              {lastTime
                ? `LAST — ${lastTime.weight}×${lastTime.reps} · ${lastTime.sets} set${lastTime.sets === 1 ? '' : 's'} · ${lastTime.when}`
                : typeLabel}
            </Text>
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

          {/* The measure — what the lift trains, as bare ink lines:
              a prime mover fills, an assistant fills 40%. */}
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
    </DeskShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  block: {
    ...QUIET.block,
  },
  headline: {
    ...QUIET.statement,
  },
  // The fact line waits outside the statement's halo.
  factLine: {
    ...QUIET.fact,
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
