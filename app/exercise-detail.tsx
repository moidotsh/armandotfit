// app/exercise-detail.tsx
// Detail card for a catalog exercise: instructions, tips, muscles,
// equipment. When a draft session is active, an "Add to active session"
// CTA wires to addExerciseToDraft (coarse identity + slug).

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
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
  MUSCLE_DISPLAY_NAMES,
  type EquipmentSlug,
  type MuscleSlug,
} from '../shared/exercises';
import { SCREEN_BODY_STYLE } from '../constants';
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
          contextLabel: exercise.exerciseType,
          visibleContent: [
            `- Type: ${exercise.exerciseType}`,
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
        title={exercise?.name ?? 'Exercise'}
        eyebrow={exercise?.exerciseType ?? ''}
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
            <MobileSectionEyebrow>Instructions</MobileSectionEyebrow>
            <MobileSurface padding={16}>
              <Text style={[styles.bodyText, { color: colors.text }]}>
                {exercise.instructions || 'No instructions available.'}
              </Text>
              {exercise.tips ? (
                <>
                  <View style={{ height: 12 }} />
                  <Text style={[styles.tips, { color: colors.textSecondary }]}>
                    Tip: {exercise.tips}
                  </Text>
                </>
              ) : null}
            </MobileSurface>

            {exercise.primaryMuscles.length + exercise.secondaryMuscles.length > 0 && (
              <>
                <View style={{ height: 16 }} />
                <MobileSectionEyebrow>Muscles worked</MobileSectionEyebrow>
                <MobileSurface padding={16}>
                  {exercise.primaryMuscles.map((m) => (
                    <View key={m} style={styles.row}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        {MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}
                      </Text>
                      <Text style={[styles.tag, { color: colors.textSecondary }]}>
                        primary
                      </Text>
                    </View>
                  ))}
                  {exercise.secondaryMuscles.map((m) => (
                    <View key={m} style={styles.row}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        {MUSCLE_DISPLAY_NAMES[m as MuscleSlug]}
                      </Text>
                      <Text style={[styles.tag, { color: colors.textSecondary }]}>
                        secondary
                      </Text>
                    </View>
                  ))}
                </MobileSurface>
              </>
            )}

            {exercise.equipment.length > 0 && (
              <>
                <View style={{ height: 16 }} />
                <MobileSectionEyebrow>Equipment</MobileSectionEyebrow>
                <MobileSurface padding={16}>
                  {exercise.equipment.map((e, i) => (
                    <View key={`${e}-${i}`} style={styles.row}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        {equipmentLabel(e)}
                      </Text>
                    </View>
                  ))}
                </MobileSurface>
              </>
            )}
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
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  bodyText: { fontSize: 14, lineHeight: 20 },
  tips: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  missing: { fontSize: 13, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: { fontSize: 14, fontWeight: '500' },
  tag: { fontSize: 12 },
});
