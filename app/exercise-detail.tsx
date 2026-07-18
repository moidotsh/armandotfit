// app/exercise-detail.tsx
// Detail card for a single exercise: instructions, tips, muscles worked,
// required equipment, variations. Read-only — adding to a workout goes
// through the active-session UI (a-Phase 5).

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobileSectionEyebrow,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { useAppTheme } from '../context';
import { safeGoBack } from '../navigation';
import { useExerciseDetail } from '../hooks';
import { useWorkoutStore } from '../stores';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const query = useExerciseDetail(id ?? null);
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);

  const exercise = query.data;

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
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {query.isLoading || !exercise ? (
          <LoadingSpinner />
        ) : (
          <>
            <MobileSectionEyebrow>Instructions</MobileSectionEyebrow>
            <MobileSurface padding={16}>
              <Text style={[styles.bodyText, { color: colors.text }]}>
                {exercise.instructions ?? 'No instructions available.'}
              </Text>
              {exercise.tips ? (
                <View style={{ height: 12 }} />
              ) : null}
              {exercise.tips ? (
                <Text style={[styles.tips, { color: colors.textSecondary }]}>
                  Tip: {exercise.tips}
                </Text>
              ) : null}
            </MobileSurface>

            {exercise.muscles.length > 0 && (
              <>
                <View style={{ height: 16 }} />
                <MobileSectionEyebrow>Muscles worked</MobileSectionEyebrow>
                <MobileSurface padding={16}>
                  {exercise.muscles.map((m) => (
                    <View key={m.muscle.id} style={styles.row}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        {m.muscle.displayName}
                      </Text>
                      <Text style={[styles.tag, { color: colors.textSecondary }]}>
                        {m.isPrimary ? 'primary' : 'secondary'}
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
                  {exercise.equipment.map((e) => (
                    <View key={e.equipmentType.id} style={styles.row}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        {e.equipmentType.displayName}
                      </Text>
                      <Text style={[styles.tag, { color: colors.textSecondary }]}>
                        {e.isRequired ? 'required' : 'optional'}
                      </Text>
                    </View>
                  ))}
                </MobileSurface>
              </>
            )}

            {exercise.variations.length > 0 && (
              <>
                <View style={{ height: 16 }} />
                <MobileSectionEyebrow>Variations</MobileSectionEyebrow>
                <MobileSurface padding={16}>
                  {exercise.variations.map((v) => (
                    <View key={v.variation.id} style={styles.row}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        {v.variation.name}
                      </Text>
                      {v.difficultyProgression != null && (
                        <Text style={[styles.tag, { color: colors.textSecondary }]}>
                          step {v.difficultyProgression}
                        </Text>
                      )}
                    </View>
                  ))}
                </MobileSurface>
              </>
            )}

            {isSessionActive ? (
              <>
                <View style={{ height: 24 }} />
                <Text style={[styles.note, { color: colors.textSecondary }]}>
                  Add this to your active session from the workout screen.
                </Text>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  bodyText: { fontSize: 14, lineHeight: 20 },
  tips: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: { fontSize: 14, fontWeight: '500' },
  tag: { fontSize: 12 },
  note: { fontSize: 12, lineHeight: 16, textAlign: 'center' },
});
