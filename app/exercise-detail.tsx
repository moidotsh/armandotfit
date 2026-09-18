// app/exercise-detail.tsx
// Detail card for a catalog exercise: instructions, tips, muscles,
// equipment. Muscles + equipment read as attribute chips — primary
// chips carry a border, secondary ones ride muted. When a draft session
// is active, an "Add to active session" CTA wires to addExerciseToDraft
// (coarse identity + slug); when not, a quiet line says so.

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
  CopyForAiButton,
} from '../components/MobilePremium';
import { useAppTheme, useToast } from '../context';
import { safeGoBack } from '../navigation';
import { useExerciseDetail, useAiPayload } from '../hooks';
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
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);
  const addExerciseToDraft = useWorkoutStore((s) => s.addExerciseToDraft);

  const exercise = query.data;

  const aiPayload = useAiPayload(
    exercise
      ? {
          title: exercise.name,
          contextLabel: EXERCISE_TYPE_DISPLAY[exercise.exerciseType],
          visibleContent: [
            `- Type: ${EXERCISE_TYPE_DISPLAY[exercise.exerciseType]}`,
            `- Muscles: ${[...exercise.primaryMuscles, ...exercise.secondaryMuscles]
              .map((m) => MUSCLE_DISPLAY_NAMES[m as MuscleSlug])
              .join(', ') || '—'}`,
            `- Equipment: ${exercise.equipment.map(equipmentLabel).join(', ') || '—'}`,
          ].join('\n'),
        }
      : undefined,
  );

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="instructions" />
      <MobileHeader
        onBack={safeGoBack}
        navRightAction={<CopyForAiButton payload={aiPayload} testID="exercise-detail-copy-for-ai" />}
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
            {/* The reference page: the name is the anchor — display
                scale, type riding above as the mono eyebrow. */}
            <Text style={[styles.typeEyebrow, { color: colors.textMuted }]}>
              {(EXERCISE_TYPE_DISPLAY[exercise.exerciseType] ?? '').toUpperCase()}
            </Text>
            <Text style={[styles.headline, { color: colors.text }]}>
              {exercise.name}
            </Text>

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
                  <View style={styles.chipWrap}>
                    {exercise.primaryMuscles.map((m) => (
                      <View
                        key={m}
                        style={[
                          styles.chip,
                          styles.chipPrimary,
                          { borderColor: colors.border, backgroundColor: colors.glass.inputBackground },
                        ]}
                        accessibilityLabel={`Primary muscle ${MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}`}
                      >
                        <Text style={[styles.chipText, { color: colors.text }]}>
                          {MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}
                        </Text>
                      </View>
                    ))}
                    {exercise.secondaryMuscles.map((m) => (
                      <View
                        key={m}
                        style={styles.chip}
                        accessibilityLabel={`Secondary muscle ${MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}`}
                      >
                        <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                          {MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.chipLegend, { color: colors.textMuted }]}>
                    Tinted are primary; the rest assist.
                  </Text>
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
                        style={[styles.chip, styles.chipPrimary, { borderColor: colors.border, backgroundColor: colors.glass.inputBackground }]}
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
    ...theme.typography.mobileTitle,
    marginBottom: 4,
  },
  bodyText: { ...theme.typography.mobileBody },
  tips: { ...theme.typography.mobileMeta, fontStyle: 'italic', marginTop: 10 },
  missing: { ...theme.typography.mobileMeta },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipPrimary: { borderWidth: 1 },
  chipText: { ...theme.typography.mobileTag },
  chipLegend: { ...theme.typography.mobileMeta, marginTop: 10 },
  sessionHint: { ...theme.typography.mobileMeta, textAlign: 'center' },
});
