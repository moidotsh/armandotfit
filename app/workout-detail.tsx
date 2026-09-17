// app/workout-detail.tsx
// Active session screen. Two modes:
//   - id param: read-only detail of a past session
//   - no id: live logging against workoutStore.draft
// The draft hydrates from the program slots (local data — no fetch) and
// saves via useLogWorkout once, at the end. A logged set is a done set;
// rows with missing reps/weight are dropped at save time.

import React, { useEffect, useRef, useState } from 'react';
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
import {
  SetRow,
  EditableSetRow,
  TagChips,
  InkRail,
} from '../components/composed';
import { EmptyState } from '../components/MobilePremium';
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
  useDeleteSession,
  useAiPayload,
  useLastUsedTags,
} from '../hooks';
import { useWorkoutStore, useProgramOverrideStore } from '../stores';
import { resolveSlots } from '../services';
import { getSlotsForDay, getDayTitle, TAG_VOCABULARY_SEED } from '../shared/exercises';
import {
  isSetFilled,
  sumVolume,
  formatVolume,
  formatElapsed,
} from '../services';
import { SCREEN_BODY_STYLE } from '../constants';

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
  const resetSession = useWorkoutStore((s) => s.resetSession);
  const toLogSessionDTO = useWorkoutStore((s) => s.toLogSessionDTO);
  const hydrateFromSplit = useWorkoutStore((s) => s.hydrateFromSplit);
  const programOverrides = useProgramOverrideStore((s) => s.overrides);
  const addSetToDraft = useWorkoutStore((s) => s.addSetToDraft);
  const updateSetInDraft = useWorkoutStore((s) => s.updateSetInDraft);
  const removeSetFromDraft = useWorkoutStore((s) => s.removeSetFromDraft);
  const removeExerciseFromDraft = useWorkoutStore(
    (s) => s.removeExerciseFromDraft,
  );
  const toggleDraftExerciseTag = useWorkoutStore(
    (s) => s.toggleDraftExerciseTag,
  );
  const setDraftExerciseTags = useWorkoutStore((s) => s.setDraftExerciseTags);
  const swapDraftExercise = useWorkoutStore((s) => s.swapDraftExercise);

  const logMutation = useLogWorkout();
  const deleteSessionMutation = useDeleteSession();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  useEffect(() => {
    if (deleteSessionMutation.isSuccess) {
      showToast('success', 'Session deleted');
      safeGoBack();
    }
  }, [deleteSessionMutation.isSuccess, showToast]);

  const draftAiPayload = useAiPayload(
    draft
      ? {
          title: 'Active session',
          visibleContent: [
            `- Split: ${draft.splitType === 'oneADay' ? '1-a-day' : 'AM/PM'}`,
            `- Day: ${draft.day}${draft.splitType === 'twoADay' ? ` (${draft.sessionMode})` : ''}`,
            `- Exercises: ${draft.exercises.length}`,
          ].join('\n'),
        }
      : undefined,
  );

  // Hydrate the draft from the program slots once per session. Local +
  // synchronous — the program is TypeScript data. Idempotent via
  // hydratedRef + the empty-draft check, so a user who discards all
  // exercises and re-adds manually won't get re-seeded.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!draft) {
      hydratedRef.current = false;
      return;
    }
    if (hydratedRef.current) return;
    if (draft.exercises.length > 0) return;
    hydratedRef.current = true;
    const slots = resolveSlots(
      draft.splitType,
      draft.day,
      draft.sessionMode,
      programOverrides,
    );
    if (slots.length > 0) {
      hydrateFromSplit(slots);
    }
  }, [draft, hydrateFromSplit, programOverrides]);

  // Live session stats: elapsed, filled sets, tonnage. One interval,
  // paired cleanup (R4a).
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const sessionSets = draft
    ? draft.exercises.reduce(
        (n, e) => n + e.sets.filter(isSetFilled).length,
        0,
      )
    : 0;
  const sessionKg = draft
    ? draft.exercises.reduce((n, e) => n + sumVolume(e.sets), 0)
    : 0;
  const elapsed = draft?.date ? formatElapsed(draft.date, nowTick) : '00:00';

  // "What did I use last time" — the caller's most recent tags per
  // exercise replace the program's suggested prefill exactly once per
  // session (guarded by ref). Program tags remain one tap away in the
  // chip suggestions.
  const draftNames = draft && draft.exercises.length > 0
    ? draft.exercises.map((e) => e.exerciseName)
    : null;
  const lastTagsQuery = useLastUsedTags(draftNames);
  const lastTagsRef = useRef(false);
  useEffect(() => {
    if (!draft || lastTagsRef.current) return;
    const byName = lastTagsQuery.data;
    if (!byName || byName.size === 0) return;
    lastTagsRef.current = true;
    for (const ex of draft.exercises) {
      const last = byName.get(ex.exerciseName.toLowerCase());
      if (last && last.length > 0) {
        setDraftExerciseTags(ex.localId, last);
      }
    }
  }, [draft, lastTagsQuery.data, setDraftExerciseTags]);

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

  // On successful save, toast + reset + go back.
  useEffect(() => {
    if (logMutation.isSuccess) {
      showToast('success', 'Session saved');
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
    const dto = toLogSessionDTO();
    if (!dto) {
      setSessionError('No active session to save.');
      return;
    }
    const hasLoggedSets = dto.exercises.some((e) => e.sets.length > 0);
    if (!hasLoggedSets) {
      setSessionError('Log at least one set before saving.');
      return;
    }
    logMutation.mutate(dto);
  };

  const handleDiscard = () => {
    resetSession();
    safeGoBack();
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
              ? new Date(session.startedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Session'
          }
          eyebrow={
            session
              ? session.splitDay != null
                ? `day ${session.splitDay}`
                : 'ad-hoc'
              : ''
          }
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
              {session.note ? (
                <>
                  <MobileSectionEyebrow>Notes</MobileSectionEyebrow>
                  <MobileSurface padding={16}>
                    <Text style={[styles.bodyText, { color: colors.text }]}>
                      {session.note}
                    </Text>
                  </MobileSurface>
                  <View style={{ height: 16 }} />
                </>
              ) : null}
              {session.exercises.length === 0 ? (
                <EmptyState
                 
                  title="No exercises logged"
                  message="This session was saved with a note only."
                  testID="workout-detail-empty"
                />
              ) : null}
              {session.exercises.map((ex) => (
                <View key={ex.id} style={{ marginBottom: 12 }}>
                  <MobileSectionEyebrow>
                    {ex.exerciseName || 'Exercise'}
                  </MobileSectionEyebrow>
                  <MobileSurface padding={12}>
                    {ex.tags.length > 0 ? (
                      <Text style={[styles.tagsLine, { color: colors.textSecondary }]}>
                        {ex.tags.join(' · ')}
                      </Text>
                    ) : null}
                    {ex.sets.map((s) => (
                      <SetRow
                        key={s.id}
                        position={s.position}
                        reps={s.reps}
                        weight={s.weight}
                      />
                    ))}
                  </MobileSurface>
                </View>
              ))}
            </>
          )}
        </ScrollView>
        <MobileActionFooter>
          <MobilePrimaryButton
            variant="ghost"
            onPress={() => {
              if (!id) return;
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              deleteSessionMutation.mutate(id);
            }}
            loading={deleteSessionMutation.isPending}
            testID="workout-detail-delete"
          >
            {confirmDelete ? 'Tap again to delete' : 'Delete session'}
          </MobilePrimaryButton>
        </MobileActionFooter>
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
        <View style={[styles.statsStrip, { borderBottomColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.brand }]}>{elapsed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>elapsed</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{sessionSets}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>sets</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatVolume(sessionKg)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>kg</Text>
          </View>
        </View>

        <MobileSectionEyebrow>
          {draft.exercises.length} exercise{draft.exercises.length === 1 ? '' : 's'}
        </MobileSectionEyebrow>

        {draft.exercises.length === 0 ? (
          <MobileSurface padding={20}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No exercises planned for this day. Tap below to add your own.
            </Text>
          </MobileSurface>
        ) : (
          draft.exercises.map((ex) => {
            const repsHint = ex.targetRx?.split('×')[1]?.trim() ?? null;
            const suggestions = TAG_VOCABULARY_SEED.filter(
              (t) => !ex.tags.includes(t),
            ).slice(0, 6);
            return (
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
                  <InkRail
                    currentSlug={ex.exerciseSlug}
                    onSwap={(next) => {
                      swapDraftExercise(ex.localId, {
                        exerciseName: next.exerciseName,
                        exerciseSlug: next.exerciseSlug,
                      });
                      showToast('success', next.exerciseName);
                    }}
                   
                    testID={`ink-rail-${ex.localId}`}
                  />
                  {ex.targetRx ? (
                    <Text style={[styles.rxLine, { color: colors.textSecondary }]}>
                      Target {ex.targetRx}
                    </Text>
                  ) : null}
                  <Text style={[styles.progressLine, { color: colors.textSecondary }]}>
                    {ex.sets.filter(isSetFilled).length}/{ex.sets.length} sets
                    {sumVolume(ex.sets) > 0 ? ` · ${formatVolume(sumVolume(ex.sets))} kg` : ''}
                  </Text>
                  {/* Realization tags — the single context surface. */}
                  <TagChips
                    tags={ex.tags}
                    suggestions={suggestions}
                    onToggleTag={(tag) => toggleDraftExerciseTag(ex.localId, tag)}
                    onAddTag={(tag) => toggleDraftExerciseTag(ex.localId, tag)}
                    testID={`tag-chips-${ex.localId}`}
                  />
                  {ex.sets.length > 0 ? (
                    <View style={{ marginTop: 8 }}>
                      {ex.sets.map((s) => (
                        <EditableSetRow
                          key={s.localId}
                          position={s.position}
                          weight={s.weight}
                          reps={s.reps}
                          repsHint={repsHint}
                          onChangeWeight={(w) =>
                            updateSetInDraft(ex.localId, s.localId, { weight: w })
                          }
                          onChangeReps={(r) =>
                            updateSetInDraft(ex.localId, s.localId, { reps: r })
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
                    onPress={() => {
                      // Weight carry-forward: the last filled weight
                      // pre-fills the new set — logging repeats far more
                      // than it changes.
                      const lastFilled = [...ex.sets]
                        .reverse()
                        .find(isSetFilled);
                      addSetToDraft(ex.localId, { weight: lastFilled?.weight ?? null });
                    }}
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
            );
          })
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
        <MobilePrimaryButton variant="ghost" onPress={handleDiscard}>
          Discard
        </MobilePrimaryButton>
        <MobilePrimaryButton
          onPress={handleSave}
          loading={isSaving || logMutation.isPending}
          disabled={draft.exercises.length === 0}
        >
          Save session
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
  rxLine: { fontSize: 12, marginTop: 2 },
  progressLine: { fontSize: 11, marginTop: 2 },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  tagsLine: { fontSize: 12, lineHeight: 16, marginBottom: 6 },
  removeExerciseCta: { fontSize: 12, fontWeight: '500' },
  addSetCta: { marginTop: 8, alignSelf: 'flex-start' },
  addCta: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  errorText: { fontSize: 12, lineHeight: 16 },
});
