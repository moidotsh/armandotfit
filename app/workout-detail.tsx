// app/workout-detail.tsx
// Two screens (docs/architecture/quiet-page-thesis.md §6):
//
//   ?id=  the RECEIPT — a Desk page. "That was N kg": tonnage is the
//         statement, one fact whisper carries the date/window/counts,
//         exercises read as quiet ledgers, delete behind a two-step
//         footer.
//
//   none  the FLOOR — the live report. One exercise at a time (one
//         STATION), its name at the statement scale, the next set
//         pre-armed at carry-forward weight as THE CALL (`100 × 10`,
//         agate at counter scale) — one thumb / one tap on LOG SET
//         locks the line in. The chromeless header is a clock with two
//         ways out (‹ minimize, FINISH); the station marks answer
//         "where am I"; totals wait in the finish sheet — mid-set,
//         nothing counts anything for you. The Floor follows the
//         user's mode — the register difference is density and scale,
//         not a second color scheme.
//
// The draft hydrates from the program slots (local data — no fetch);
// draft set rows exist only once logged (the armed-set model). A
// logged set is a done set; weight null → 0 (bodyweight) at commit.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from '@tamagui/lucide-icons-2';
import {
  MobilePrimaryButton,
  MobileActionFooter,
  MobileInput,
  MobileDialog,
  Figure,
  EmptyState,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import {
  DeskShell,
  SetRow,
  TagChips,
  InkRail,
  SwapGlyph,
  QueryErrorNote,
  CallBoard,
  StationStrip,
  StageSetRow,
} from '../components/composed';
import { useToast } from '../context';
import { useAppTheme } from '../context';
import {
  navigateToExerciseDatabase,
  replaceWithHome,
  navigateToSplitSelection,
  safeGoBack,
} from '../navigation';
import {
  useWorkoutDetail,
  useLogWorkout,
  useDeleteSession,
  useLastUsedTags,
  useRecentSessionDetails,
} from '../hooks';
import { useWorkoutStore, useProgramOverrideStore } from '../stores';
import { resolveSlots } from '../services';
import { getDayTitle, TAG_VOCABULARY_SEED } from '../shared/exercises';
import {
  sumVolume,
  formatVolume,
  formatElapsed,
} from '../services';
import { SCREEN_BODY_STYLE, theme, MOBILE_CONTENT_WIDTH_STYLE, BLOCK_GAP, HALO } from '../constants';
import { useReducedMotion } from '../components/premium/shared';

/** The armed set's editable values. */
interface Armed {
  weight: number | null;
  reps: number | null;
}

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
  const removeSetFromDraft = useWorkoutStore((s) => s.removeSetFromDraft);
  const removeExerciseFromDraft = useWorkoutStore(
    (s) => s.removeExerciseFromDraft,
  );
  const toggleDraftExerciseTag = useWorkoutStore(
    (s) => s.toggleDraftExerciseTag,
  );
  const setDraftExerciseTags = useWorkoutStore((s) => s.setDraftExerciseTags);
  const swapDraftExercise = useWorkoutStore((s) => s.swapDraftExercise);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const pickerExercise = draft?.exercises.find((e) => e.localId === pickerFor) ?? null;

  const logMutation = useLogWorkout();
  const deleteSessionMutation = useDeleteSession();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  useEffect(() => {
    if (deleteSessionMutation.isSuccess) {
      showToast('success', 'Session deleted');
      safeGoBack();
    }
  }, [deleteSessionMutation.isSuccess, showToast]);


  // Read-only copy payload — describes the LOADED session, not the
  // (usually absent) draft. Computed at read; nothing stored.
  const loadedSession = existingQuery.data;

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
    ? draft.exercises.reduce((n, e) => n + e.sets.length, 0)
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

  // Last performance (computed at read from recent sessions): the
  // most recent logged set per exercise NAME — the first-set prefill
  // for the armed slab when the exercise has no in-session sets yet.
  const recentForPrefill = useRecentSessionDetails(10);
  const lastPerformance = useMemo(() => {
    const map = new Map<string, { weight: number; reps: number }>();
    for (const session of recentForPrefill.data ?? []) {
      for (const ex of session.exercises) {
        const key = ex.exerciseName.toLowerCase();
        if (map.has(key)) continue;
        const last = ex.sets[ex.sets.length - 1];
        if (last) map.set(key, { weight: last.weight, reps: last.reps });
      }
    }
    return map;
  }, [recentForPrefill.data]);

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

  // ── Read-only mode (existing session) — the RECEIPT, Desk ────────
  if (id) {
    const session = existingQuery.data;
    // AM and PM are separate rows; the start hour restores the window.
    const windowLabel = session
      ? new Date(session.startedAt).getHours() < 12
        ? 'AM'
        : 'PM'
      : null;
    const totalSets = session
      ? session.exercises.reduce((n, e) => n + e.sets.length, 0)
      : 0;
    const totalKg = session
      ? session.exercises.reduce((n, e) => n + sumVolume(e.sets), 0)
      : 0;
    return (
      <DeskShell
        surface="training"
        onBack={safeGoBack}
        testID="receipt-scroll"
        contentContainerStyle={styles.bodyContent}
      >
        {existingQuery.isLoading ? (
          <LoadingSpinner />
        ) : existingQuery.isError ? (
          <QueryErrorNote
            onRetry={() => void existingQuery.refetch()}
            testID="workout-detail-error"
          />
        ) : !session ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* THE STATEMENT — tonnage. The receipt's one sentence is
                "that was N kg"; the fact line carries the rest. */}
            <View>
              <Text style={[styles.receiptStatement, { color: colors.text }]}>
                {`${formatVolume(totalKg)} kg`}
              </Text>
              <Text style={[styles.receiptFact, { color: colors.textMuted }]} numberOfLines={1}>
                {`${new Date(session.startedAt).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })} · ${session.splitDay != null ? `D${session.splitDay}` : 'ad-hoc'}${windowLabel ? ` · ${windowLabel}` : ''} · ${session.exercises.length} lifts · ${totalSets} sets`}
              </Text>
            </View>

            {session.note ? (
              <View style={styles.receiptBlock}>
                <Text style={[styles.bodyText, { color: colors.text }]}>
                  {session.note}
                </Text>
              </View>
            ) : null}

            {session.exercises.length === 0 ? (
              <EmptyState
                title="No exercises logged"
                message="This session was saved with a note only."
                testID="workout-detail-empty"
              />
            ) : null}
            {session.exercises.map((ex) => (
              <View key={ex.id} style={styles.receiptBlock}>
                <View style={styles.receiptExHead}>
                  <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                    {ex.exerciseName || 'Exercise'}
                  </Text>
                </View>
                {ex.tags.length > 0 ? (
                  <Text style={[styles.tagsLine, { color: colors.textMuted }]}>
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
              </View>
            ))}
            <View style={styles.receiptBlock}>
              <MobileActionFooter>
                <MobilePrimaryButton
                  variant="ghost"
                  accentColor={colors.alert}
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
            </View>
          </>
        )}
      </DeskShell>
    );
  }

  // ── Live-logging mode — the STAGE, the Floor ──────────────────────
  if (!draft) {
    // The redirect effect will fire; render a placeholder meanwhile.
    return (
      <SafeAreaView
        style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.body}>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Stage
      // Stage props (all the live-mode state above flows through).
      draft={draft}
      elapsed={elapsed}
      sessionSets={sessionSets}
      sessionKg={sessionKg}
      isSaving={isSaving || logMutation.isPending}
      sessionError={sessionError}
      armedPrefill={lastPerformance}
      pickerExercise={pickerExercise}
      pickerFor={pickerFor}
      setPickerFor={setPickerFor}
      addSetToDraft={addSetToDraft}
      removeSetFromDraft={removeSetFromDraft}
      removeExerciseFromDraft={removeExerciseFromDraft}
      toggleDraftExerciseTag={toggleDraftExerciseTag}
      swapDraftExercise={swapDraftExercise}
      setDraftNotes={setDraftNotes}
      toLogSessionDTO={toLogSessionDTO}
      onSave={(dto) => logMutation.mutate(dto)}
      onDiscard={() => {
        resetSession();
        safeGoBack();
      }}
      lastTagsQuery={lastTagsQuery}
    />
  );
}

// ── The Stage (the Floor) ──────────────────────────────────────────────

interface StageProps {
  draft: NonNullable<ReturnType<typeof useWorkoutStore.getState>['draft']>;
  elapsed: string;
  sessionSets: number;
  sessionKg: number;
  isSaving: boolean;
  sessionError: string | null;
  armedPrefill: Map<string, { weight: number; reps: number }>;
  pickerExercise: { localId: string; exerciseName: string; exerciseSlug: string | '' } | null;
  pickerFor: string | null;
  setPickerFor: (localId: string | null) => void;
  addSetToDraft: ReturnType<typeof useWorkoutStore.getState>['addSetToDraft'];
  removeSetFromDraft: ReturnType<typeof useWorkoutStore.getState>['removeSetFromDraft'];
  removeExerciseFromDraft: ReturnType<typeof useWorkoutStore.getState>['removeExerciseFromDraft'];
  toggleDraftExerciseTag: ReturnType<typeof useWorkoutStore.getState>['toggleDraftExerciseTag'];
  swapDraftExercise: ReturnType<typeof useWorkoutStore.getState>['swapDraftExercise'];
  setDraftNotes: ReturnType<typeof useWorkoutStore.getState>['setDraftNotes'];
  toLogSessionDTO: ReturnType<typeof useWorkoutStore.getState>['toLogSessionDTO'];
  onSave: (dto: NonNullable<ReturnType<ReturnType<typeof useWorkoutStore.getState>['toLogSessionDTO']>>) => void;
  onDiscard: () => void;
  lastTagsQuery: { data: Map<string, string[]> | undefined };
}

function Stage(props: StageProps) {
  const {
    draft,
    elapsed,
    sessionSets,
    sessionKg,
    isSaving,
    sessionError,
    armedPrefill,
    pickerExercise,
    pickerFor,
    setPickerFor,
    addSetToDraft,
    removeSetFromDraft,
    removeExerciseFromDraft,
    toggleDraftExerciseTag,
    swapDraftExercise,
    setDraftNotes,
    toLogSessionDTO,
    onSave,
    onDiscard,
  } = props;
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const reduced = useReducedMotion();
  const insets = { top: 0 };

  const [stationIndex, setStationIndex] = useState(0);
  const [finishOpen, setFinishOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [armedByExercise, setArmedByExercise] = useState<
    Record<string, Armed>
  >({});

  const exercises = draft.exercises;
  const index = Math.min(stationIndex, Math.max(0, exercises.length - 1));
  const exercise = exercises[index] ?? null;

  // The armed set for the current station: whatever the user has set,
  // else carry-forward from this exercise's last logged set, else the
  // last session's performance for this exercise name, else empty.
  const armed: Armed = useMemo(() => {
    const explicit = armedByExercise[exercise?.localId ?? ''];
    if (explicit) return explicit;
    const lastSet = exercise && exercise.sets.length > 0
      ? exercise.sets[exercise.sets.length - 1]
      : null;
    if (lastSet) return { weight: lastSet.weight, reps: lastSet.reps };
    const lastTime = exercise
      ? armedPrefill.get(exercise.exerciseName.toLowerCase())
      : undefined;
    if (lastTime) return { weight: lastTime.weight, reps: lastTime.reps };
    return { weight: null, reps: null };
  }, [armedByExercise, exercise, armedPrefill]);

  const setArmed = (next: Armed) => {
    if (!exercise) return;
    setArmedByExercise((prev) => ({ ...prev, [exercise.localId]: next }));
  };

  const repsHint = exercise?.targetRx?.split('×')[1]?.trim() ?? null;

  const handleLog = () => {
    if (!exercise) return;
    if (armed.reps == null) {
      showToast('error', 'Set the reps first');
      return;
    }
    // A logged set is a done set: weight null → 0 (bodyweight). The
    // armed values CARRY — the next set defaults to what just worked.
    addSetToDraft(exercise.localId, {
      weight: armed.weight ?? 0,
      reps: armed.reps,
    });
    setArmedByExercise((prev) => ({
      ...prev,
      [exercise.localId]: { weight: armed.weight ?? 0, reps: armed.reps },
    }));
  };

  const handleSave = () => {
    const dto = toLogSessionDTO();
    if (!dto) {
      setFinishOpen(false);
      return;
    }
    const hasLoggedSets = dto.exercises.some((e) => e.sets.length > 0);
    if (!hasLoggedSets) {
      setFinishOpen(false);
      showToast('error', 'Log at least one set before saving.');
      return;
    }
    onSave(dto);
    setFinishOpen(false);
  };

  const dayTitle = getDayTitle(draft.splitType, draft.day);

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      {/* The stage rides the mobile column like every Desk screen —
          the page field bleeds full-viewport, the content does not. */}
      <View style={[styles.stageColumn, MOBILE_CONTENT_WIDTH_STYLE]}>
      {/* Stage header — minimize, the clock, finish. The Floor's
          chromeless header: one number running, two words to leave
          by. Totals wait in the finish sheet. */}
      <View style={styles.stageHeader} testID="stage-header">
        <Pressable
          onPress={replaceWithHome}
          accessibilityRole="button"
          accessibilityLabel="Minimize session"
          style={({ pressed }) => [styles.iconButton, pressed ? { opacity: 0.6 } : null]}
          testID="stage-minimize"
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <View style={styles.stageHeaderCenter}>
          <Text style={[styles.stageClock, { color: colors.text }]} numberOfLines={1}>
            {elapsed}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setConfirmDiscard(false);
            setFinishOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Finish session"
          style={({ pressed }) => [
            styles.finishButton,
            pressed ? { opacity: 0.6 } : null,
          ]}
          testID="stage-finish"
        >
          <Text style={[styles.finishLabel, { color: colors.text }]}>
            FINISH
          </Text>
        </Pressable>
      </View>

      {/* Station strip — position + navigation. */}
      <StationStrip
        stations={exercises.map((ex, i) => ({
          key: ex.localId,
          position: i + 1,
          done: ex.sets.length > 0,
        }))}
        currentIndex={index}
        onSelect={setStationIndex}
        testID="stage-station-strip"
      />

      {/* The station. */}
      <ScrollView
        style={styles.stationScroll}
        contentContainerStyle={styles.stationContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {exercise ? (
          <>
            <View style={styles.stationHead}>
              <Text
                style={[styles.stationName, { color: colors.text }]}
                numberOfLines={2}
                testID="stage-station-name"
              >
                {exercise.exerciseName}
              </Text>
              <View style={styles.stationMeta}>
                {exercise.targetRx ? (
                  <Text style={[styles.stationRx, { color: colors.textMuted }]}>
                    {`TARGET ${exercise.targetRx}`}
                  </Text>
                ) : null}
                <SwapGlyph
                  onPress={() => setPickerFor(exercise.localId)}
                  label={exercise.exerciseName}
                />
                <Pressable
                  onPress={() => {
                    removeExerciseFromDraft(exercise.localId);
                    setStationIndex((i) => Math.max(0, i - 1));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${exercise.exerciseName} from session`}
                  style={({ pressed }) => [styles.removeCta, pressed ? { opacity: 0.6 } : null]}
                >
                  <Text style={[styles.removeLabel, { color: colors.textMuted }]}>
                    REMOVE
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Tags — one whisper line; the editor opens one tap
                deeper (tags prefill from last time; mid-set editing
                is the exception, not the default). */}
            <Pressable
              onPress={() => setTagsOpen((o) => !o)}
              accessibilityRole="button"
              accessibilityLabel={
                exercise.tags.length > 0
                  ? `Edit tags — ${exercise.tags.join(', ')}`
                  : 'Add tags'
              }
              style={({ pressed }) => [styles.tagsToggle, pressed ? { opacity: 0.6 } : null]}
            >
              <Text style={[styles.tagsToggleText, { color: colors.textMuted }]} numberOfLines={1}>
                {exercise.tags.length > 0 ? exercise.tags.join(' · ') : '+ TAGS'}
              </Text>
            </Pressable>
            {tagsOpen ? (
              <TagChips
                tags={exercise.tags}
                suggestions={TAG_VOCABULARY_SEED.filter(
                  (t) => !exercise.tags.includes(t),
                ).slice(0, 3)}
                onToggleTag={(tag) => toggleDraftExerciseTag(exercise.localId, tag)}
                onAddTag={(tag) => toggleDraftExerciseTag(exercise.localId, tag)}
                register="desk"
                testID={`tag-chips-${exercise.localId}`}
              />
            ) : null}

            {/* The ledger — every row a logged set, scoreboard-legible. */}
            {exercise.sets.length > 0 ? (
              <View style={styles.ledger}>
                {exercise.sets.map((s) => (
                  <StageSetRow
                    key={s.localId}
                    position={s.position}
                    weight={s.weight ?? 0}
                    reps={s.reps ?? 0}
                    onRemove={() => removeSetFromDraft(exercise.localId, s.localId)}
                    testID={`stage-set-row-${s.position}`}
                  />
                ))}
              </View>
            ) : (
              <Text style={[styles.ledgerEmpty, { color: colors.textMuted }]}>
                No sets logged yet — the board below arms your first.
              </Text>
            )}

            {index < exercises.length - 1 ? (
              <Pressable
                onPress={() => setStationIndex(index + 1)}
                accessibilityRole="button"
                accessibilityLabel={`Next station: ${exercises[index + 1].exerciseName}`}
                style={({ pressed }) => [
                  styles.nextStation,
                  pressed ? { opacity: 0.6 } : null,
                ]}
                testID="stage-next-station"
              >
                <Text style={[styles.nextStationLabel, { color: colors.text }]} numberOfLines={1}>
                  {`NEXT — ${exercises[index + 1].exerciseName}`}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={navigateToExerciseDatabase}
              accessibilityRole="button"
              accessibilityLabel="Add exercise from library"
              style={({ pressed }) => [styles.addExerciseCta, pressed ? { opacity: 0.6 } : null]}
            >
              <Text style={[styles.addExerciseLabel, { color: colors.textMuted }]}>
                + ADD EXERCISE
              </Text>
            </Pressable>

            {sessionError ? (
              <Text style={[styles.errorText, { color: colors.alert }]}>
                {sessionError}
              </Text>
            ) : null}
          </>
        ) : (
          <View>
            <Text style={[styles.ledgerEmpty, { color: colors.textMuted }]}>
              No exercises in this session.
            </Text>
            <Pressable
              onPress={navigateToExerciseDatabase}
              accessibilityRole="button"
              accessibilityLabel="Add exercise from library"
              style={({ pressed }) => [styles.addExerciseCta, pressed ? { opacity: 0.6 } : null]}
            >
              <Text style={[styles.addExerciseLabel, { color: colors.textMuted }]}>
                + ADD EXERCISE
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* THE CALL BOARD — docked, never scrolls away. The armed set
          (the call) + the one verb. */}
      {exercise ? (
        <CallBoard
          setNumber={exercise.sets.length + 1}
          weight={armed.weight}
          reps={armed.reps}
          repsHint={repsHint}
          onLog={handleLog}
          onChangeWeight={(weight) => setArmed({ ...armed, weight })}
          onChangeReps={(reps) => setArmed({ ...armed, reps })}
          testID="armed-set"
        />
      ) : null}

      {/* Finish — the summary sheet. */}
      <MobileDialog
        visible={finishOpen}
        onOpenChange={(open) => {
          if (!open) setFinishOpen(false);
        }}
        title="Finish session"
        testID="stage-finish-dialog"
      >
        <View style={styles.finishStats}>
          <Figure value={elapsed} label="elapsed" tone="ink" size="sm" style={styles.finishStat} />
          <Figure value={sessionSets} label={sessionSets === 1 ? 'set' : 'sets'} tone="ink" size="sm" style={styles.finishStat} />
          <Figure
            value={formatVolume(sessionKg)}
            unit="kg"
            label="moved"
            tone="ink"
            size="sm"
            align="right"
            style={styles.finishStat}
          />
        </View>
        <MobileInput
          label="Notes"
          value={draft.notes ?? ''}
          onChangeText={setDraftNotes}
          placeholder="How did it feel?"
        />
        <View style={{ height: 16 }} />
        <MobilePrimaryButton
          onPress={handleSave}
          loading={isSaving}
          disabled={sessionSets === 0}
          testID="stage-save"
        >
          {sessionSets > 0
            ? `Save session · ${sessionSets} set${sessionSets === 1 ? '' : 's'}`
            : 'Log a set first'}
        </MobilePrimaryButton>
        <View style={{ height: 8 }} />
        <MobilePrimaryButton
          variant="ghost"
          accentColor={colors.alert}
          onPress={() => {
            if (!confirmDiscard) {
              setConfirmDiscard(true);
              return;
            }
            setFinishOpen(false);
            onDiscard();
          }}
          testID="stage-discard"
        >
          {confirmDiscard ? 'Tap again to discard' : 'Discard session'}
        </MobilePrimaryButton>
      </MobileDialog>

      {/* Mid-workout swap — the swap bench over the stage. Catalog
          exercises rank alternatives; custom-named lifts (no slug) have
          nothing to rank and swap from the library instead. */}
      {pickerExercise && pickerExercise.exerciseSlug ? (
        <InkRail
          currentSlug={pickerExercise.exerciseSlug}
          open={pickerFor !== null}
          onOpenChange={(next) => {
            if (!next) setPickerFor(null);
          }}
          onSwap={(next) => {
            const target = pickerFor;
            if (!target) return;
            swapDraftExercise(target, next);
            setPickerFor(null);
            showToast('success', next.exerciseName);
          }}
          testID="live-swap-picker"
        />
      ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stageColumn: {
    flex: 1,
  },
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120 },
  bodyText: { ...theme.typography.mobileBody },
  // ── Stage ──
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 8,
    gap: 4,
  },
  stageHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The clock — the Floor's only running figure in the chrome.
  stageClock: {
    ...theme.typography.mobileFigure,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  finishLabel: {
    ...theme.typography.mobileEyebrow,
  },
  stationScroll: { flex: 1 },
  stationContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  stationHead: {
    gap: 4,
    marginBottom: 2,
  },
  stationName: {
    ...theme.typography.mobileTitleCondensed,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  stationRx: {
    ...theme.typography.mobileEyebrow,
    flex: 1,
  },
  removeCta: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  removeLabel: {
    ...theme.typography.mobileEyebrow,
  },
  ledger: {
    marginTop: 6,
  },
  tagsToggle: {
    minHeight: 44,
    justifyContent: 'center',
  },
  tagsToggleText: {
    ...theme.typography.mobileLedger,
  },
  ledgerEmpty: {
    ...theme.typography.mobileMeta,
    marginTop: 12,
    marginBottom: 12,
  },
  nextStation: {
    minHeight: 48,
    justifyContent: 'center',
    marginTop: 12,
  },
  nextStationLabel: {
    ...theme.typography.mobileItemTitle,
  },
  addExerciseCta: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addExerciseLabel: {
    ...theme.typography.mobileEyebrow,
  },
  errorText: { ...theme.typography.mobileMeta, marginTop: 12 },
  armedDock: {
    borderTopWidth: 1,
  },
  finishStats: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  finishStat: { flex: 1 },
  // ── Receipt (Desk) ──
  receiptBlock: {
    marginTop: BLOCK_GAP,
  },
  receiptStatement: {
    ...theme.typography.mobileDisplay,
  },
  receiptFact: {
    ...theme.typography.mobileLedger,
    marginTop: HALO,
  },
  receiptExHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  exerciseName: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  tagsLine: { ...theme.typography.mobileLedger, marginTop: 2, marginBottom: 4 },
});
