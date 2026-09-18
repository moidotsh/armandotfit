// app/exercise-detail.tsx
// The reference page for a catalog exercise (broadsheet-thesis §7):
// the name anchors as THE HEADLINE (display scale, Rokkitt), the type
// rides above as the agate kicker, LAST TIME rides beneath in agate —
// the number you're walking in to beat — instructions read as body on
// the field, equipment rides as marking chips, and MUSCLES draw as
// MEASURED BARS: a prime mover fills the track in ink, an assistant
// fills 40% — what the lift trains, at a glance, measurable in pixels.
// When a draft session is active, an "Add to active session" CTA wires
// to addExerciseToDraft (coarse identity + slug); when not, a quiet
// line says so.

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileHeader,
  MobileSectionEyebrow,
  MobilePrimaryButton,
  MobileActionFooter,
} from '../components/MobilePremium';
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
import { SCREEN_BODY_STYLE, theme } from '../constants';
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


  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="instructions" />
      <MobileHeader
        onBack={safeGoBack}
        hideAccentDot
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {!exercise ? (
          <Text style={[styles.missing, { color: colors.textSecondary }]}>
            Unknown exercise.
          </Text>
        ) : (
          <>
            {/* The reference page: the name is the anchor — the page's
                one display-scale element, type riding above as the
                agate kicker. */}
            <Text style={[styles.typeEyebrow, { color: colors.textMuted }]}>
              {(EXERCISE_TYPE_DISPLAY[exercise.exerciseType] ?? '').toUpperCase()}
            </Text>
            <Text style={[styles.headline, { color: colors.text }]} numberOfLines={2}>
              {exercise.name}
            </Text>
            {lastTime ? (
              <Text style={[styles.lastLine, { color: colors.text }]}>
                {`LAST — ${lastTime.weight}×${lastTime.reps} · ${lastTime.sets} set${lastTime.sets === 1 ? '' : 's'} · ${lastTime.when}`}
              </Text>
            ) : null}

            <MobileSectionEyebrow rule flush={false}>
              Instructions
            </MobileSectionEyebrow>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              {exercise.instructions || 'No instructions available.'}
            </Text>
            {exercise.tips ? (
              <Text style={[styles.tips, { color: colors.textMuted }]}>
                Tip: {exercise.tips}
              </Text>
            ) : null}

            {exercise.primaryMuscles.length + exercise.secondaryMuscles.length > 0 && (
              <>
                <MobileSectionEyebrow rule flush={false}>
                  Muscles worked
                </MobileSectionEyebrow>
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
                      {/* The measure — a prime mover fills the track in
                          ink (pixel-probe: bar width ≈ track width). */}
                      <View style={[styles.targetTrack, { backgroundColor: colors.mobilePremium.hairlineBorder }]}>
                        <View style={[styles.targetBar, { backgroundColor: colors.text }]} />
                      </View>
                      <Text style={[styles.targetWeight, { color: colors.text }]}>
                        PRIME
                      </Text>
                    </View>
                  ))}
                  {exercise.secondaryMuscles.map((m) => (
                    <View
                      key={m}
                      style={styles.targetRow}
                      accessibilityLabel={`Secondary muscle ${MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}`}
                    >
                      <Text style={[styles.targetName, { color: colors.textSecondary }]}>
                        {MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}
                      </Text>
                      {/* An assistant fills 40% — the measure carries
                          the hierarchy, not the color. */}
                      <View style={[styles.targetTrack, { backgroundColor: colors.mobilePremium.hairlineBorder }]}>
                        <View style={[styles.targetBar, styles.targetBarSecondary, { backgroundColor: colors.textSecondary }]} />
                      </View>
                      <Text style={[styles.targetWeight, { color: colors.textMuted }]}>
                        ASSIST
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {exercise.equipment.length > 0 && (
              <>
                <MobileSectionEyebrow rule flush={false}>
                  Equipment
                </MobileSectionEyebrow>
                <View>
                  <View style={styles.chipWrap}>
                    {exercise.equipment.map((e, i) => (
                      <View
                        key={`${e}-${i}`}
                        style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.glass.inputBackground }]}
                      >
                        <Text style={[styles.chipText, { color: colors.text }]}>
                          {equipmentLabel(e)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}

            {!isSessionActive ? (
              <>
                <View style={{ height: 16 }} />
                <Text style={[styles.sessionHint, { color: colors.textColors.tertiary }]}>
                  Start a session to add this exercise to your day.
                </Text>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
      {isSessionActive && exercise ? (
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
            Add to active session
          </MobilePrimaryButton>
        </MobileActionFooter>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 },
  typeEyebrow: {
    ...theme.typography.mobileEyebrow,
  },
  headline: {
    ...theme.typography.mobileDisplay,
    marginBottom: 4,
  },
  lastLine: {
    ...theme.typography.mobileEyebrow,
    fontSize: 10,
    marginBottom: 6,
  },
  bodyText: { ...theme.typography.mobileBody },
  tips: { ...theme.typography.mobileMeta, fontStyle: 'italic', marginTop: 10 },
  missing: { ...theme.typography.mobileMeta },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
  },
  targetName: {
    ...theme.typography.mobileItemTitle,
    fontSize: 15,
    width: 108,
  },
  targetTrack: {
    flex: 1,
    height: 8,
    borderRadius: 2,
    overflow: 'hidden',
  },
  targetBar: {
    width: '100%',
    height: '100%',
  },
  targetBarSecondary: {
    width: '40%',
  },
  targetWeight: {
    ...theme.typography.mobileEyebrow,
    fontSize: 9,
    width: 44,
    textAlign: 'right',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: theme.shapes.tag,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  chipText: { ...theme.typography.mobileTag },
  sessionHint: { ...theme.typography.mobileMeta, textAlign: 'center' },
});
