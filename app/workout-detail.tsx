// app/workout-detail.tsx
// Active workout session. Two modes:
//   - id param: read-only detail of a past session
//   - no id: live logging against workoutStore.draft
// Save path flushes via useLogWorkout and clears the store.

import React, { useEffect, useRef } from 'react';
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
  CopyForAiButton,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { SetRow, EditableSetRow } from '../components/composed';
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
  useSuggestedExercises,
  useAiPayload,
} from '../hooks';
import { useWorkoutStore } from '../stores';
import { getSystemExercise, getDayTitle } from '../shared/exercises';
import { SCREEN_BODY_STYLE } from '../constants';
import type { ExerciseSet, ID } from '../shared/types';

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
  const hydrateSuggestedExercises = useWorkoutStore(
    (s) => s.hydrateSuggestedExercises,
  );
  const addSetToDraft = useWorkoutStore((s) => s.addSetToDraft);
  const updateSetInDraft = useWorkoutStore((s) => s.updateSetInDraft);
  const removeSetFromDraft = useWorkoutStore((s) => s.removeSetFromDraft);
  const removeExerciseFromDraft = useWorkoutStore(
    (s) => s.removeExerciseFromDraft,
  );

  const logMutation = useLogWorkout();

  const draftAiPayload = useAiPayload(
    draft
      ? {
          title: 'Active session',
          visibleContent: [
            `- Split: ${draft.splitType === 'oneADay' ? '1-a-day' : 'AM/PM'}`,
            `- Day: ${draft.day}${draft.splitType === 'twoADay' ? ` (${draft.sessionMode})` : ''}`,
            `- Exercises: ${draft.exercises.length}`,
            `- Duration: ${draft.duration}m`,
          ].join('\n'),
        }
      : undefined,
  );

  // Pre-hydrate the draft from the day's suggested exercises once per
  // session. Idempotent via hydratedRef + the empty-draft check, so a
  // user who discards all exercises and re-adds manually won't get
  // re-seeded. The session mode (AM/PM) is threaded through from the
  // draft so twoADay sessions hydrate the correct exercise list.
  const suggestedQuery = useSuggestedExercises(
    draft?.splitType ?? 'oneADay',
    draft?.day ?? 1,
    draft?.sessionMode ?? 'am',
    Boolean(draft),
  );
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!draft) {
      hydratedRef.current = false;
      return;
    }
    if (hydratedRef.current) return;
    if (draft.exercises.length > 0) return;
    const suggested = suggestedQuery.data;
    if (!suggested || suggested.length === 0) return;
    const payload = suggested.flatMap((ex) => {
      const local = ex.slug ? getSystemExercise(ex.slug) : undefined;
      if (!local) return [];
      return [{
        exerciseId: ex.id as ID,
        exerciseName: ex.name,
        variation: local.variation ?? null,
        defaultSets: local.defaultSets,
        defaultReps: local.defaultReps,
      }];
    });
    if (payload.length === 0) return;
    hydratedRef.current = true;
    hydrateSuggestedExercises(payload);
  }, [draft, suggestedQuery.data, hydrateSuggestedExercises]);

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
          navRightAction={<CopyForAiButton payload={draftAiPayload} testID="workout-detail-readonly-copy-for-ai" />}
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
                      <SetRow
                        key={s.id}
                        setNumber={s.setNumber}
                        actualReps={s.actualReps}
                        weight={s.weight}
                        completed={s.completed}
                      />
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

  // Header eyebrow surfaces the day title when available (e.g. "Full Body
  // Day 1"); falls back to the split-type + day number for rest days / v1
  // splits without title metadata. For twoADay, suffix the session mode
  // so AM vs PM is visible at a glance.
  const dayTitle = getDayTitle(draft.splitType, draft.day);
  const sessionSuffix =
    draft.splitType === 'twoADay' ? ` · ${draft.sessionMode.toUpperCase()}` : '';
  const eyebrow = dayTitle
    ? `${dayTitle}${sessionSuffix}`
    : `${draft.splitType === 'oneADay' ? '1-a-day' : 'AM/PM'} · day ${draft.day}${sessionSuffix}`;

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="training" />
      <MobileHeader
        title="Active session"
        eyebrow={eyebrow}
        onBack={safeGoBack}
        navRightAction={<CopyForAiButton payload={draftAiPayload} testID="workout-detail-active-copy-for-ai" />}
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
          suggestedQuery.isLoading ||
          (suggestedQuery.data != null && suggestedQuery.data.length > 0) ? (
            <MobileSurface padding={20}>
              <LoadingSpinner />
            </MobileSurface>
          ) : (
            <MobileSurface padding={20}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No exercises planned for this day. Tap below to add your own.
              </Text>
            </MobileSurface>
          )
        ) : (
          draft.exercises.map((ex) => (
            <View key={ex.localId} style={{ marginBottom: 12 }}>
              <MobileSurface padding={12}>
                <View style={styles.exerciseHeader}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>
                    {ex.exerciseName}
                  </Text>
                  <Pressable
                    onPress={() => removeExerciseFromDraft(ex.localId)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${ex.exerciseName} from session`}
                    hitSlop={8}
                  >
                    <Text
                      style={[
                        styles.removeExerciseCta,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Remove
                    </Text>
                  </Pressable>
                </View>
                {ex.sets.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    {ex.sets.map((s) => (
                      <EditableSetRow
                        key={s.localId}
                        setNumber={s.setNumber}
                        weight={s.weight}
                        reps={s.actualReps}
                        completed={s.completed}
                        repRange={s.repRange}
                        onChangeWeight={(w) =>
                          updateSetInDraft(ex.localId, s.localId, { weight: w })
                        }
                        onChangeReps={(r) =>
                          updateSetInDraft(ex.localId, s.localId, { actualReps: r })
                        }
                        onToggleComplete={() =>
                          updateSetInDraft(ex.localId, s.localId, {
                            completed: !s.completed,
                          })
                        }
                        onRemove={() =>
                          removeSetFromDraft(ex.localId, s.localId)
                        }
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No sets logged.
                  </Text>
                )}
                <Pressable
                  onPress={() => addSetToDraft(ex.localId)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add set to ${ex.exerciseName}`}
                  hitSlop={6}
                  style={styles.addSetCta}
                >
                  <Text style={[styles.addCta, { color: colors.brand }]}>
                    + Add set
                  </Text>
                </Pressable>
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
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  bodyText: { fontSize: 14, lineHeight: 20 },
  emptyText: { fontSize: 13, lineHeight: 18 },
  exerciseName: { fontSize: 14, fontWeight: '600', flex: 1 },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  removeExerciseCta: { fontSize: 12, fontWeight: '500' },
  addSetCta: { marginTop: 8, alignSelf: 'flex-start' },
  addCta: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  errorText: { fontSize: 12, lineHeight: 16 },
});
