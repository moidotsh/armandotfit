// app/workout-detail.tsx
// Active session screen — the logbook's working page (see
// docs/architecture/logbook-thesis.md §7). Two modes:
//   - id param: read-only receipt of a past session — the tonnage is
//     the headline of history (display figure), exercises as ledger
//     tables on paper.
//   - no id: live logging against workoutStore.draft — sticky exercise
//     headers answer "what am I on and how far" at arm's length while
//     the sets scroll under them; inputs sized for gloves and glare.
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
  MobileHeader,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileSectionEyebrow,
  MobileInput,
  CopyForAiButton,
  Figure,
  EmptyState,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import {
  SetRow,
  EditableSetRow,
  TagChips,
  InkRail,
  SwapGlyph,
  QueryErrorNote,
} from '../components/composed';
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
import { getDayTitle, TAG_VOCABULARY_SEED } from '../shared/exercises';
import {
  isSetFilled,
  sumVolume,
  formatVolume,
  formatElapsed,
} from '../services';
import { SCREEN_BODY_STYLE, theme } from '../constants';

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

  // Read-only copy payload — describes the LOADED session, not the
  // (usually absent) draft. Computed at read; nothing stored.
  const loadedSession = existingQuery.data;
  const readonlyAiPayload = useAiPayload(
    loadedSession
      ? {
          title: 'Session',
          visibleContent: [
            `- Date: ${new Date(loadedSession.startedAt).toLocaleString()}`,
            `- Day: ${loadedSession.splitDay ?? 'ad-hoc'}`,
            ...loadedSession.exercises.map(
              (ex) =>
                `- ${ex.exerciseName}: ${ex.sets
                  .map((s) => `${s.weight}kg × ${s.reps}`)
                  .join(', ') || 'no sets'}`,
            ),
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
              ? `${
                  session.splitDay != null ? `day ${session.splitDay}` : 'ad-hoc'
                }${windowLabel ? ` · ${windowLabel}` : ''}`
              : ''
          }
          onBack={safeGoBack}
          navRightAction={<CopyForAiButton payload={readonlyAiPayload} testID="workout-detail-readonly-copy-for-ai" />}
        />
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
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
              {/* The receipt head: the tonnage is the headline of
                  history; the count rides beside it. */}
              <MobileSectionEyebrow rule flush={false}>
                {`Receipt · started ${new Date(session.startedAt).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}`}
              </MobileSectionEyebrow>
              <View style={styles.receiptHead}>
                <Figure
                  value={formatVolume(totalKg)}
                  unit="kg"
                  label="moved"
                  size="display"
                  tone="brand"
                />
                <View style={styles.receiptSide}>
                  <Figure
                    value={session.exercises.length}
                    label="lifts"
                    size="md"
                    align="right"
                  />
                  <Figure
                    value={totalSets}
                    label="sets"
                    size="md"
                    align="right"
                  />
                </View>
              </View>

              {session.note ? (
                <>
                  <MobileSectionEyebrow rule flush={false}>
                    Note
                  </MobileSectionEyebrow>
                  <Text style={[styles.bodyText, { color: colors.text }]}>
                    {session.note}
                  </Text>
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
                <View key={ex.id} style={styles.receiptExercise}>
                  <View style={styles.receiptExHead}>
                    <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                      {ex.exerciseName || 'Exercise'}
                    </Text>
                    <Text style={[styles.receiptExCount, { color: colors.textMuted }]}>
                      {`${ex.sets.length} set${ex.sets.length === 1 ? '' : 's'}`}
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
            </>
          )}
        </ScrollView>
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

  // The sticky-header scroll: stats strip + eyebrow, then per exercise a
  // pinned header (name + done/total) above its scrolling body.
  const scrollChildren: React.ReactElement[] = [];
  const stickyIndices: number[] = [];

  scrollChildren.push(
    <View key="stats" style={styles.statsStrip}>
      <Figure value={elapsed} label="elapsed" tone="brand" size="sm" style={styles.stat} />
      <Figure value={sessionSets} label="sets done" size="sm" style={styles.stat} />
      <Figure
        value={formatVolume(sessionKg)}
        unit="kg"
        label="moved"
        size="sm"
        align="right"
        style={styles.stat}
      />
    </View>,
  );
  scrollChildren.push(
    <MobileSectionEyebrow key="count" rule flush={false}>
      {draft.exercises.length} exercise{draft.exercises.length === 1 ? '' : 's'}
    </MobileSectionEyebrow>,
  );

  draft.exercises.forEach((ex, i) => {
    const filledCount = ex.sets.filter(isSetFilled).length;
    const repsHint = ex.targetRx?.split('×')[1]?.trim() ?? null;
    const suggestions = TAG_VOCABULARY_SEED.filter(
      (t) => !ex.tags.includes(t),
    ).slice(0, 6);
    stickyIndices.push(scrollChildren.length);
    scrollChildren.push(
      <View
        key={`h-${ex.localId}`}
        style={[
          styles.exHeader,
          { backgroundColor: colors.backgroundDeep, borderBottomColor: colors.mobilePremium.hairlineBorder },
        ]}
      >
        <Text style={[styles.exIndex, { color: colors.brandText }]}>{i + 1}</Text>
        <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
          {ex.exerciseName}
        </Text>
        <Text
          style={[
            styles.exProgress,
            { color: filledCount === ex.sets.length && ex.sets.length > 0 ? colors.brandText : colors.textMuted },
          ]}
        >
          {`${filledCount}/${ex.sets.length}`}
        </Text>
      </View>,
    );
    scrollChildren.push(
      <View key={`b-${ex.localId}`} style={styles.exBody}>
        <View style={styles.exControls}>
          {ex.targetRx ? (
            <Text style={[styles.rxLine, { color: colors.textMuted }]} numberOfLines={1}>
              {`Target ${ex.targetRx}`}
            </Text>
          ) : (
            <View />
          )}
          <SwapGlyph onPress={() => setPickerFor(ex.localId)} label={ex.exerciseName} />
          <Pressable
            onPress={() => removeExerciseFromDraft(ex.localId)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${ex.exerciseName} from session`}
            style={styles.removeExerciseCta}
          >
            <Text style={[styles.removeExerciseText, { color: colors.textMuted }]}>
              Remove
            </Text>
          </Pressable>
        </View>
        {/* Realization tags — the single context surface. */}
        <TagChips
          tags={ex.tags}
          suggestions={suggestions}
          onToggleTag={(tag) => toggleDraftExerciseTag(ex.localId, tag)}
          onAddTag={(tag) => toggleDraftExerciseTag(ex.localId, tag)}
          testID={`tag-chips-${ex.localId}`}
        />
        {ex.sets.length > 0 ? (
          <View style={styles.setList}>
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
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No sets logged.
          </Text>
        )}
        <Pressable
          onPress={() => {
            // Weight carry-forward: the last filled weight pre-fills the
            // new set — logging repeats far more than it changes.
            const lastFilled = [...ex.sets].reverse().find(isSetFilled);
            addSetToDraft(ex.localId, { weight: lastFilled?.weight ?? null });
          }}
          accessibilityRole="button"
          accessibilityLabel={`Add set to ${ex.exerciseName}`}
          style={styles.addSetCta}
        >
          <Text style={[styles.addCta, { color: colors.brandText }]}>
            + Add set
          </Text>
        </Pressable>
      </View>,
    );
  });

  scrollChildren.push(
    <Pressable
      key="add-exercise"
      onPress={navigateToExerciseDatabase}
      accessibilityRole="button"
      accessibilityLabel="Add exercise from library"
      style={({ pressed }) => [
        styles.addExerciseCta,
        { borderColor: colors.border },
        pressed ? { opacity: 0.6 } : null,
      ]}
    >
      <Text style={[styles.addCta, { color: colors.brandText }]}>
        + Add exercise
      </Text>
    </Pressable>,
  );

  scrollChildren.push(
    <View key="notes" style={styles.notesWrap}>
      <MobileInput
        label="Notes"
        value={draft.notes ?? ''}
        onChangeText={setDraftNotes}
        placeholder="How did it feel?"
      />
    </View>,
  );

  if (sessionError) {
    scrollChildren.push(
      <Text key="error" style={[styles.errorText, { color: colors.alert }]}>
        {sessionError}
      </Text>,
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
        eyebrow={eyebrow}
        onBack={safeGoBack}
        navRightAction={<CopyForAiButton payload={draftAiPayload} testID="workout-detail-active-copy-for-ai" />}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={stickyIndices}
      >
        {scrollChildren}
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
          {sessionSets > 0
            ? `Save session · ${sessionSets} set${sessionSets === 1 ? '' : 's'}`
            : 'Save session'}
        </MobilePrimaryButton>
      </MobileActionFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 },
  bodyText: { ...theme.typography.mobileBody },
  emptyText: { ...theme.typography.mobileMeta, marginTop: 8 },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 4,
    paddingBottom: 2,
  },
  stat: { flex: 1 },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginTop: 12,
  },
  exIndex: {
    ...theme.typography.mobileLedger,
    minWidth: 20,
  },
  exerciseName: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  exProgress: {
    ...theme.typography.mobileLedger,
  },
  exBody: {
    paddingTop: 8,
  },
  exControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  rxLine: {
    ...theme.typography.mobileLedger,
    flex: 1,
  },
  removeExerciseCta: {
    height: 44,
    justifyContent: 'center',
  },
  removeExerciseText: {
    ...theme.typography.mobileTag,
  },
  setList: {
    marginTop: 4,
  },
  addSetCta: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingRight: 12,
  },
  addCta: {
    ...theme.typography.mobileLedger,
  },
  addExerciseCta: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: theme.shapes.tile,
    minHeight: 48,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesWrap: { marginTop: 20 },
  errorText: { ...theme.typography.mobileMeta, marginTop: 12 },
  receiptHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  receiptSide: {
    gap: 12,
    paddingBottom: 4,
  },
  receiptExercise: {
    marginTop: 20,
  },
  receiptExHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  receiptExCount: {
    ...theme.typography.mobileMeta,
  },
  tagsLine: { ...theme.typography.mobileMeta, marginTop: 2 },
});
