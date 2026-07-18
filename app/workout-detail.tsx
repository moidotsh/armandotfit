// app/workout-detail.tsx
// Active workout session. Two modes:
//   - id param: read-only detail of a past session
//   - no id: live logging against workoutStore.draft
// Save path flushes via useLogWorkout and clears the store.

import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileSectionEyebrow,
  MobileInput,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { useToast } from '../context';
import { useAppTheme } from '../context';
import {
  navigateToExerciseDatabase,
  navigateToSplitSelection,
  safeGoBack,
} from '../navigation';
import {
  useWorkoutDetail,
  useLogWorkout,
} from '../hooks';
import { useWorkoutStore } from '../stores';
import type { ExerciseSet } from '../shared/types';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { showToast } = useToast();

  // Existing-session read path
  const existingQuery = useWorkoutDetail(id ?? null);

  // Draft state
  const draft = useWorkoutStore((s) => s.draft);
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);
  const isSaving = useWorkoutStore((s) => s.isSaving);
  const sessionError = useWorkoutStore((s) => s.sessionError);
  const setSaving = useWorkoutStore((s) => s.setSaving);
  const setSessionError = useWorkoutStore((s) => s.setSessionError);
  const setDraftNotes = useWorkoutStore((s) => s.setDraftNotes);
  const setDraftDuration = useWorkoutStore((s) => s.setDraftDuration);
  const resetSession = useWorkoutStore((s) => s.resetSession);
  const toLogWorkoutDTO = useWorkoutStore((s) => s.toLogWorkoutDTO);

  const logMutation = useLogWorkout();

  // If no id and no active draft, redirect to split-selection once.
  useEffect(() => {
    if (!id && !isSessionActive) {
      navigateToSplitSelection();
    }
  }, [id, isSessionActive]);

  // Reflect mutation state into the store so the UI shows saving state.
  useEffect(() => {
    setSaving(logMutation.isPending);
  }, [logMutation.isPending, setSaving]);

  // On successful save, toast + reset + go home.
  useEffect(() => {
    if (logMutation.isSuccess) {
      showToast('success', 'Workout saved');
      resetSession();
      safeGoBack();
    }
  }, [logMutation.isSuccess, showToast, resetSession]);

  // Surface mutation errors via the store.
  useEffect(() => {
    if (logMutation.isError) {
      setSessionError(
        logMutation.error instanceof Error
          ? logMutation.error.message
          : 'Save failed',
      );
    }
  }, [logMutation.isError, logMutation.error, setSessionError]);

  const handleSave = () => {
    const dto = toLogWorkoutDTO();
    if (!dto) {
      setSessionError('No active session to save.');
      return;
    }
    if (dto.exercises.length === 0) {
      setSessionError('Add at least one exercise before saving.');
      return;
    }
    if (dto.duration <= 0) {
      setDraftDuration(15); // sensible default if user forgot to set it
    }
    const finalDto = toLogWorkoutDTO();
    if (finalDto) {
      logMutation.mutate(finalDto);
    }
  };

  // ── Read-only mode (existing session) ──────────────────────────────
  if (id) {
    const session = existingQuery.data;
    return (
      <SafeAreaView
        style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
        edges={['top', 'bottom']}
      >
        <MobileAtmosphere surface="training" />
        <MobileHeader
          title={
            session
              ? new Date(session.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Workout'
          }
          eyebrow={session ? `${session.duration}m · day ${session.day}` : ''}
          onBack={safeGoBack}
        />
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {existingQuery.isLoading || !session ? (
            <LoadingSpinner />
          ) : (
            <>
              {session.notes ? (
                <>
                  <MobileSectionEyebrow>Notes</MobileSectionEyebrow>
                  <MobileSurface padding={16}>
                    <Text style={[styles.bodyText, { color: colors.text }]}>
                      {session.notes}
                    </Text>
                  </MobileSurface>
                  <View style={{ height: 16 }} />
                </>
              ) : null}
              {session.exercises.map((ex) => (
                <View key={ex.id} style={{ marginBottom: 12 }}>
                  <MobileSectionEyebrow>
                    {ex.exercise.name}
                  </MobileSectionEyebrow>
                  <MobileSurface padding={12}>
                    {ex.sets.map((s: ExerciseSet) => (
                      <View key={s.id} style={styles.setRow}>
                        <Text style={[styles.setNumber, { color: colors.textSecondary }]}>
                          {s.setNumber}
                        </Text>
                        <Text style={[styles.setText, { color: colors.text }]}>
                          {s.actualReps ?? '–'} reps @ {s.weight ?? '–'}
                        </Text>
                        <Text style={[styles.setStatus, { color: s.completed ? colors.brand : colors.textSecondary }]}>
                          {s.completed ? '✓' : '○'}
                        </Text>
                      </View>
                    ))}
                  </MobileSurface>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Live-logging mode (draft) ──────────────────────────────────────
  if (!draft) {
    // The redirect effect will fire; render a placeholder meanwhile.
    return (
      <SafeAreaView
        style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
        edges={['top', 'bottom']}
      >
        <MobileAtmosphere surface="setup" />
        <MobileHeader title="Starting session…" />
        <View style={styles.body}>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="training" />
      <MobileHeader
        title="Active session"
        eyebrow={`${draft.splitType === 'oneADay' ? '1-a-day' : 'AM/PM'} · day ${draft.day}`}
        onBack={safeGoBack}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <MobileSectionEyebrow>
          {draft.exercises.length} exercise{draft.exercises.length === 1 ? '' : 's'}
        </MobileSectionEyebrow>

        {draft.exercises.length === 0 ? (
          <MobileSurface padding={20}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No exercises yet. Tap below to add your first one.
            </Text>
          </MobileSurface>
        ) : (
          draft.exercises.map((ex) => (
            <View key={ex.localId} style={{ marginBottom: 12 }}>
              <MobileSurface padding={12}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>
                  {ex.exerciseName}
                </Text>
                {ex.sets.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    {ex.sets.map((s) => (
                      <View key={s.localId} style={styles.setRow}>
                        <Text style={[styles.setNumber, { color: colors.textSecondary }]}>
                          {s.setNumber}
                        </Text>
                        <Text style={[styles.setText, { color: colors.text }]}>
                          {s.actualReps ?? '–'} reps @ {s.weight ?? '–'}
                        </Text>
                        <Text style={[styles.setStatus, { color: s.completed ? colors.brand : colors.textSecondary }]}>
                          {s.completed ? '✓' : '○'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No sets logged.
                  </Text>
                )}
              </MobileSurface>
            </View>
          ))
        )}

        <View style={{ height: 8 }} />
        <Pressable onPress={navigateToExerciseDatabase} accessibilityRole="button">
          <MobileSurface padding={14}>
            <Text style={[styles.addCta, { color: colors.brand }]}>
              + Add exercise
            </Text>
          </MobileSurface>
        </Pressable>

        <View style={{ height: 16 }} />
        <MobileSectionEyebrow>Notes</MobileSectionEyebrow>
        <MobileInput
          label="Notes"
          value={draft.notes ?? ''}
          onChangeText={setDraftNotes}
          placeholder="How did it feel?"
        />

        {sessionError ? (
          <>
            <View style={{ height: 12 }} />
            <Text style={[styles.errorText, { color: colors.alert }]}>
              {sessionError}
            </Text>
          </>
        ) : null}
      </ScrollView>
      <MobileActionFooter>
        <MobilePrimaryButton
          variant="ghost"
          onPress={() => {
            resetSession();
            safeGoBack();
          }}
        >
          Discard
        </MobilePrimaryButton>
        <MobilePrimaryButton
          onPress={handleSave}
          loading={isSaving || logMutation.isPending}
          disabled={draft.exercises.length === 0}
        >
          Save workout
        </MobilePrimaryButton>
      </MobileActionFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  bodyText: { fontSize: 14, lineHeight: 20 },
  emptyText: { fontSize: 13, lineHeight: 18 },
  exerciseName: { fontSize: 14, fontWeight: '600' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  setNumber: { fontSize: 12, fontWeight: '600', minWidth: 18 },
  setText: { fontSize: 13, flex: 1 },
  setStatus: { fontSize: 14, fontWeight: '600' },
  addCta: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  errorText: { fontSize: 12, lineHeight: 16 },
});
