// components/composed/Receipt.tsx
//
// THE RECEIPT — the read-only session view (interval-thesis §8):
// "That was N kg." Self-contained: owns its detail query and the
// delete flow (two-step, toast + back on success). The tonnage is
// THE LIVE FIGURE'S Desk case — Martian at the 72 counter rank (the
// figure the screen's question names; a receipt is settled fact,
// not record — ink, never red), unit riding beside it at the
// whisper scale; one fact line carries date/era/window/counts;
// exercises read as RULED ROWS: name + tags whisper + one set line
// per logged set (ordinal left · air · weight × reps in mono). No
// panels, no rails.

import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus } from '@tamagui/lucide-icons-2';
import {
  MobilePrimaryButton,
  MobileActionFooter,
  EmptyState,
} from '../MobilePremium';
import { LoadingSpinner } from '../primitives';
import { BoardShell } from './BoardShell';
import { Figure } from '../MobilePremium';
import { RegisterLine } from './RegisterLine';
import { SectionWhisper } from './SectionWhisper';
import { NextStation } from './NextStation';
import { QueryErrorNote } from './QueryErrorNote';
import { useToast, useAppTheme } from '../../context';
import { useWorkoutDetail, useDeleteSession, useWeightUnit, useLastUsedTags, useRecentSessionDetails } from '../../hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query';
import { navigateToRegister, navigateToWorkoutDetail, safeGoBack } from '../../navigation';
import { resolveSlots, sumVolume, WorkoutService, derivePriorTopSets } from '../../services';
import { bodyweightAsOf } from '../../utils/bodyweight';
import { getWeightHistory } from '../../utils/supabase/repositories';
import {
  rxLabel,
  useAuthStore,
  useProgramOverrideStore,
  useSplitPreferenceStore,
  useWorkoutStore,
} from '../../stores';
import { INTERVAL, PAGE_GUTTER, PRESS_DIP, PRESS_DIP_PLATE, theme } from '../../constants';
import { eraFor, SYSTEM_EXERCISES, SYSTEM_EXERCISES_BY_SLUG } from '../../shared/exercises';
import {
  CARDIO_STATIONS,
  formatCardioDuration,
  formatCardioDistance,
} from '../../shared/exercises/cardio';
import {
  toDisplayWeight,
  roundDisplayWeight,
  formatVolumeWeight,
  weightUnitLabel,
  joinFacts,
} from '../../utils';

export interface ReceiptProps {
  /** The session id from the route (?id=). */
  id: string;
}

export function Receipt({ id }: ReceiptProps) {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const unit = useWeightUnit();
  const existingQuery = useWorkoutDetail(id);
  const deleteSessionMutation = useDeleteSession();
  // THE PRIOR RECORD (the upending pass): the all-time top per
  // exercise name from sessions that STARTED BEFORE this one — the
  // receipt's own rows never inflate their own baseline (the Floor's
  // law, mirrored: the draft cannot inflate its own bar). Shares the
  // history cache; a slice is all the baseline needs.
  const historyQuery = useRecentSessionDetails(60);
  const priorRecordKg = React.useMemo(
    () =>
      existingQuery.data
        ? derivePriorTopSets(historyQuery.data ?? [], existingQuery.data.startedAt)
        : new Map<string, number>(),
    [historyQuery.data, existingQuery.data],
  );

  // ── SET EDITING (the receipt's edit affordances) ──────────────────
  const [editingSet, setEditingSet] = useState<{
    setId: string;
    exerciseId: string;
    weight: string;
    reps: string;
  } | null>(null);
  const [confirmDeleteSet, setConfirmDeleteSet] = useState(false);

  // DISMISS — Enter saves, Escape cancels (the keyboard's natural
  // exits). The editing ref keeps the listener closure fresh.
  const editingRef = useRef(editingSet);
  editingRef.current = editingSet;
  // Reset the delete confirmation when the edit target changes.
  useEffect(() => { setConfirmDeleteSet(false); }, [editingSet?.setId]);
  // r1-exempt: fire-and-forget keypress save — React 18 no-ops the
  // post-unmount setState; the listener is properly paired-cleared.
  useEffect(() => {
    if (!editingSet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingSet(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cur = editingRef.current;
        if (!cur) return;
        const reps = parseInt(cur.reps, 10);
        if (Number.isFinite(reps) && reps > 0) {
          const weightKg = cur.weight.trim()
            ? unit === 'lb'
              ? parseFloat(cur.weight) / 2.20462
              : parseFloat(cur.weight)
            : null;
          void WorkoutService.updateSet(cur.setId, { reps, weight: weightKg }).then((r) => {
            if (r.success) {
              setEditingSet(null);
              queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
              showToast('success', 'Set updated');
            }
          });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingSet != null]); // eslint-disable-line react-hooks/exhaustive-deps
  const queryClient = useQueryClient();
  const invalidateSession = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
  };
  const handleSaveSet = async () => {
    if (!editingSet) return;
    const reps = parseInt(editingSet.reps, 10);
    if (!Number.isFinite(reps) || reps <= 0) return;
    const weightKg = editingSet.weight.trim()
      ? unit === 'lb'
        ? parseFloat(editingSet.weight) / 2.20462
        : parseFloat(editingSet.weight)
      : null;
    const r = await WorkoutService.updateSet(editingSet.setId, {
      reps,
      weight: weightKg,
    });
    if (r.success) {
      setEditingSet(null);
      invalidateSession();
      showToast('success', 'Set updated');
    } else {
      showToast('error', 'Failed to update set');
    }
  };
  const handleDeleteSet = async (setId: string) => {
    const r = await WorkoutService.deleteSet(setId);
    if (r.success) {
      setEditingSet(null);
      invalidateSession();
      showToast('success', 'Set deleted');
    }
  };
  const handleAddSet = async (exerciseId: string, weight: number | null, reps: number) => {
    const r = await WorkoutService.addSet(exerciseId, { weight, reps });
    if (r.success) {
      invalidateSession();
      showToast('success', 'Set added');
    }
  };
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (deleteSessionMutation.isSuccess) {
      showToast('success', 'Session deleted');
      safeGoBack();
    }
  }, [deleteSessionMutation.isSuccess, showToast]);

  const session = existingQuery.data;
  // The untagged nudge: an exercise logged bare, that HAS tags in
  // other sessions, whispers what it wore last time — history stays
  // immutable; the nudge aims the NEXT session's prefill.
  const lastTags = useLastUsedTags(
    session ? session.exercises.filter((e) => e.tags.length === 0).map((e) => e.exerciseName) : null,
  ).data ?? new Map<string, string[]>();
  // AM and PM are separate rows; the start hour restores the window.
  const windowLabel = session
    ? new Date(session.startedAt).getHours() < 12
      ? 'AM'
      : 'PM'
    : null;
  const totalSets = session
    ? session.exercises.reduce((n, e) => n + e.sets.length, 0)
    : 0;
  // THE BODYWEIGHT — point-in-time: the weigh-in closest to (and
  // preferably at-or-before) the session's own date. A receipt from
  // three weeks ago computes with the weight you carried three weeks
  // ago, not today's (the as-of resolution — history reads honest).
  const bodyweightQuery = useQuery({
    queryKey: queryKeys.bodyWeight.history(),
    queryFn: async () => {
      const r = await getWeightHistory(90);
      if (!r.success) throw r.error;
      return r.data;
    },
  });
  const bodyweightKg = session
    ? bodyweightAsOf(bodyweightQuery.data ?? [], session.startedAt)
    : null;

  const totalKg = session
    ? session.exercises.reduce((n, e) => {
        const entry = SYSTEM_EXERCISES.find(
          (sys) => sys.name === e.exerciseName,
        );
        const factor = entry?.bodyweightLoadFactor;
        const effectiveBw =
          factor != null && bodyweightKg != null
            ? factor * bodyweightKg
            : undefined;
        return n + sumVolume(e.sets, effectiveBw);
      }, 0)
    : 0;

  // CONTINUE THE DAY — the day continues as a NEW block SEEDED with
  // this session's own stations: names + tags carry, the program's Rx
  // recovers where the slot resolves (standing substitutions included),
  // set rows start fresh (the settled block's history stays right here
  // on its receipt). Cardio stations seed as machines. The wood-chops
  // case still works — add from the library on top.
  const continueSession = useWorkoutStore((s) => s.continueSession);
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);
  const splitType = useSplitPreferenceStore((s) => s.splitType);
  const handleContinue = () => {
    // THE GUEST GATE — continuing starts a session; sessions belong to
    // lifters. Guests land on the gate.
    if (useAuthStore.getState().status === 'unauthenticated') {
      navigateToRegister();
      return;
    }
    if (!session) return;
    const window = windowLabel === 'AM' ? 'am' : 'pm';
    // Rx recovery: match each logged name back to its programmed slot
    // (the override-aware resolution — a standing substitution carries).
    const slots =
      session.splitDay != null
        ? resolveSlots(
            splitType,
            session.splitDay,
            window,
            useProgramOverrideStore.getState().overrides,
          )
        : [];
    const exercises = session.exercises.map((ex) => {
      const slot =
        slots.find((sl) => SYSTEM_EXERCISES_BY_SLUG[sl.exercise]?.name === ex.exerciseName) ??
        null;
      return {
        exerciseName: ex.exerciseName,
        exerciseSlug:
          slot?.exercise ?? SYSTEM_EXERCISES.find((e) => e.name === ex.exerciseName)?.slug ?? '',
        tags: ex.tags,
        targetRx: slot ? rxLabel(slot) : null,
        sets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
      };
    });
    const cardio = [...new Set(session.cardio.map((c) => c.station))];
    continueSession({
      splitType,
      day: session.splitDay ?? null,
      sessionMode: window,
      exercises,
      cardio,
    });
    navigateToWorkoutDetail();
  };

  return (
    <BoardShell
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
          {/* THE LIVE FIGURE — tonnage at the 72 counter rank, the
              unit whispering beside it (Figure hero). The receipt's
              one sentence: "that was N kg" (interval-thesis §2). */}
          <View>
            <Text style={[styles.pageWhisper, { color: colors.textMuted }]}>
              THE RECEIPT
            </Text>
            <Figure
              value={formatVolumeWeight(totalKg, unit)}
              unit={weightUnitLabel(unit)}
              size="hero"
              testID="receipt-tonnage"
            />
            <Text style={[styles.factLine, { color: colors.textMuted }]} numberOfLines={1}>
              {joinFacts([
                new Date(session.startedAt).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }),
                // The era can be empty (a date before the first era) —
                // empty parts never join (joinFacts drops them).
                eraFor(new Date(session.startedAt).toISOString().slice(0, 10)) || null,
                session.splitDay != null ? `D${session.splitDay}` : 'ad-hoc',
                windowLabel,
                `${session.exercises.length} lifts`,
                `${totalSets} sets`,
                session.cardio.length > 0 ? `${session.cardio.length} cardio` : null,
              ])}
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
              {(() => {
                // THE HEAD — name left, + right. Always the same two
                // elements; the + never moves, the name never truncates.
                // The bodyweight declaration and tags share the sub-row.
                const entry = SYSTEM_EXERCISES.find(
                  (sys) => sys.name === ex.exerciseName,
                );
                const bwFactor = entry?.bodyweightLoadFactor;
                const hasBw = bwFactor != null && bwFactor > 0 && bodyweightKg != null;
                return (
                  <>
                    <View style={styles.receiptExHead}>
                      <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                        {ex.exerciseName || 'Exercise'}
                      </Text>
                      <Pressable
                        onPress={() => {
                          const last = ex.sets[ex.sets.length - 1];
                          void handleAddSet(
                            ex.id,
                            last?.weight ?? null,
                            last?.reps ?? 10,
                          );
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Add a set to ${ex.exerciseName}`}
                        style={({ pressed }) => [
                          styles.headAddBtn,
                          pressed ? { opacity: PRESS_DIP } : null,
                        ]}
                        testID={`receipt-add-set-${ex.id}`}
                      >
                        <Plus size={14} color={colors.textMuted} />
                      </Pressable>
                    </View>
                    {(hasBw || ex.tags.length > 0) ? (
                      <View style={styles.receiptSubHead}>
                        <Text
                          style={[
                            styles.tagsLine,
                            styles.subHeadTags,
                            { color: colors.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {ex.tags.length > 0 ? joinFacts(ex.tags) : ''}
                        </Text>
                        {hasBw ? (
                          <Text
                            style={[styles.tagsLine, { color: colors.brandText }]}
                            numberOfLines={1}
                            testID={`receipt-bw-decl-${ex.id}`}
                          >
                            let a = BW×{bwFactor} = {roundDisplayWeight(
                              toDisplayWeight(bwFactor! * bodyweightKg!, unit),
                            )}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                );
              })()}
              {ex.tags.length === 0 && (lastTags.get(ex.exerciseName)?.length ?? 0) > 0 ? (
                <Text style={[styles.tagsLine, { color: colors.textMuted }]} numberOfLines={1}>
                  {joinFacts(['no tags', `last time: ${joinFacts(lastTags.get(ex.exerciseName)!)}`])}
                </Text>
              ) : null}

              {/* A set wears the record red when it beats THE PRIOR
                  RECORD — the all-time top from sessions that started
                  before this one (the Floor's mark, settled). One red
                  meaning everywhere: a session-max that beats nothing
                  prints ink (the old rule wallpapered red on every
                  receipt's heaviest set); the tonnage stays ink
                  (settled fact). */}
              {(() => {
                // THE BODYWEIGHT ROW — a set with no loaded weight on a
                // bodyweight exercise reads 'a × 20' (bodyweight), an
                // added load 'a+62.5 × 8' — never '0 × 20' (the raw
                // null). The record red rides LOADED weight only (the
                // Floor's rule).
                const entry = SYSTEM_EXERCISES.find(
                  (sys) => sys.name === ex.exerciseName,
                );
                const bwFactor = entry?.bodyweightLoadFactor;
                const bwEffKg =
                  bwFactor != null && bodyweightKg != null
                    ? bwFactor * bodyweightKg
                    : null;
                const priorBest = priorRecordKg.get(ex.exerciseName) ?? 0;
                // ── ADD SET — the missed set joins the receipt ──
                const lastSet = ex.sets[ex.sets.length - 1];
                return (
                  <>
                    {ex.sets.map((s) => {
                      const hasLoad = s.weight != null && s.weight > 0;
                      const isBw = bwEffKg != null;
                      const isRecord = hasLoad && priorBest > 0 && s.weight! > priorBest;
                      const figure = isBw
                        ? hasLoad
                          ? `a+${roundDisplayWeight(toDisplayWeight(s.weight!, unit))} × ${s.reps}`
                          : `a × ${s.reps}`
                        : `${roundDisplayWeight(toDisplayWeight(s.weight ?? 0, unit))} × ${s.reps}`;
                      const isEditing = editingSet?.setId === s.id;
                      if (isEditing && editingSet) {
                        return (
                          <View
                            key={s.id}
                            style={styles.editRow}
                            testID={`receipt-set-edit-${ex.id}-${s.position}`}
                          >
                            <Text style={[styles.editPos, { color: colors.textMuted }]}>
                              {s.position}
                            </Text>
                            <TextInput
                              value={editingSet.weight}
                              onChangeText={(v) => setEditingSet({ ...editingSet, weight: v })}
                              placeholder="lb"
                              placeholderTextColor={colors.textMuted}
                              keyboardType="numeric"
                              style={[
                                styles.editInlineInput,
                                { backgroundColor: colors.glass.inputBackground, color: colors.text },
                              ]}
                              testID="set-edit-weight"
                              onSubmitEditing={() => void handleSaveSet()}
                            />
                            <Text style={[styles.editTimes, { color: colors.textMuted }]}>×</Text>
                            <TextInput
                              value={editingSet.reps}
                              onChangeText={(v) => setEditingSet({ ...editingSet, reps: v })}
                              placeholder="reps"
                              placeholderTextColor={colors.textMuted}
                              keyboardType="numeric"
                              style={[
                                styles.editInlineInput,
                                styles.editInlineInputNarrow,
                                { backgroundColor: colors.glass.inputBackground, color: colors.text },
                              ]}
                              testID="set-edit-reps"
                              onSubmitEditing={() => void handleSaveSet()}
                            />
                            <Pressable
                              onPress={() => {
                                if (confirmDeleteSet) {
                                  void handleDeleteSet(editingSet.setId);
                                  setConfirmDeleteSet(false);
                                } else {
                                  setConfirmDeleteSet(true);
                                }
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={confirmDeleteSet ? 'Tap again to delete set' : 'Delete set'}
                              style={({ pressed }) => [
                                styles.editMiniBtn,
                                confirmDeleteSet
                                  ? { backgroundColor: colors.alert }
                                  : null,
                                pressed ? { opacity: PRESS_DIP } : null,
                              ]}
                              testID="set-edit-delete"
                            >
                              <Text
                                style={[
                                  styles.editMiniLabel,
                                  { color: confirmDeleteSet ? colors.background : colors.alert },
                                ]}
                              >
                                {confirmDeleteSet ? '!' : '×'}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => setEditingSet(null)}
                              accessibilityRole="button"
                              accessibilityLabel="Cancel edit"
                              style={({ pressed }) => [
                                styles.editMiniBtn,
                                pressed ? { opacity: PRESS_DIP } : null,
                              ]}
                              testID="set-edit-cancel"
                            >
                              <Text style={[styles.editMiniLabel, { color: colors.text }]}>‹</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => void handleSaveSet()}
                              accessibilityRole="button"
                              accessibilityLabel="Save set"
                              style={({ pressed }) => [
                                styles.editMiniBtn,
                                { backgroundColor: colors.text },
                                pressed ? { opacity: PRESS_DIP_PLATE } : null,
                              ]}
                              testID="set-edit-save"
                            >
                              <Text style={[styles.editMiniLabel, { color: colors.background }]}>✓</Text>
                            </Pressable>
                          </View>
                        );
                      }
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() =>
                            setEditingSet({
                              setId: s.id,
                              exerciseId: ex.id,
                              weight:
                                s.weight != null
                                  ? String(roundDisplayWeight(toDisplayWeight(s.weight, unit)))
                                  : '',
                              reps: String(s.reps ?? ''),
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Edit set ${s.position}: ${figure}${isRecord ? ' — personal record' : ''}`}
                          style={({ pressed }) => [
                            { minHeight: 44, justifyContent: 'center' },
                            pressed ? { opacity: PRESS_DIP } : null,
                          ]}
                          testID={`receipt-set-${ex.id}-${s.position}`}
                        >
                          <RegisterLine
                            monoLabel
                            label={String(ex.sets.indexOf(s) + 1)}
                            figure={figure}
                            figureTone={isRecord ? 'record' : 'ink'}
                          />
                        </Pressable>
                      );
                    })}
                  </>
                );
              })()}
            </View>
          ))}
          {/* THE CARDIO — one ruled row per sitting: the duration as the
              mono prefix, the station + its prescription as the label,
              the console's outcomes right-aligned. Settled fact — ink,
              never red. */}
          {session.cardio.length > 0 ? (
            <View style={styles.receiptBlock}>
              <SectionWhisper>THE CARDIO</SectionWhisper>
              {session.cardio.map((row, i) => {
                const spec = CARDIO_STATIONS[row.station];
                const prescription = joinFacts([
                  row.speedKmh != null ? `${row.speedKmh} km/h` : null,
                  row.level != null ? (row.station === 'treadmill' ? `${row.level}%` : `level ${row.level}`) : null,
                ]);
                const outcomes = joinFacts([
                  row.distanceM != null ? formatCardioDistance(row.distanceM) : null,
                  row.kcal != null ? `${row.kcal} kcal` : null,
                ]);
                return (
                  <RegisterLine
                    key={row.id}
                    monoPrefix={formatCardioDuration(row.durationSec)}
                    label={prescription ? `${spec.name} · ${prescription}` : spec.name}
                    figure={outcomes || null}
                    figureTone="muted"
                    accessibilityLabel={`${spec.name}, ${formatCardioDuration(row.durationSec)}${prescription ? `, ${prescription}` : ''}${outcomes ? `, ${outcomes}` : ''}`}
                    testID={`receipt-cardio-${i}`}
                  />
                );
              })}
            </View>
          ) : null}

          {/* CONTINUE THE DAY — a WAY-FORWARD row, not the page's verb:
              the receipt is a SETTLED artifact you read, then leave
              (the chevron is the way out); continuing is the occasional
              wood-chops case, so it speaks the app-wide way-forward
              grammar (hairline, furniture word, chevron) — the same as
              progression's tail. Hidden while a session runs. */}
          {!isSessionActive ? (
            <NextStation
              label="NEW BLOCK"
              name="Continue the day"
              onPress={handleContinue}
              accessibilityLabel="Continue the day — start a new block seeded with this session"
              testID="receipt-continue"
            />
          ) : null}

          {/* The destructive tail — a quiet left-aligned ghost (the
              footer's full-width framing read as a third way out; the
              delete is a rare, deliberate act, not a destination). */}
          <View style={styles.deleteRow}>
            <MobilePrimaryButton
              variant={confirmDelete ? 'primary' : 'ghost'}
              size="sm"
              onPress={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                deleteSessionMutation.mutate(id);
              }}
              loading={deleteSessionMutation.isPending}
              testID="workout-detail-delete"
            >
              {confirmDelete ? 'TAP AGAIN TO DELETE' : 'DELETE SESSION'}
            </MobilePrimaryButton>
          </View>
  
      </>
      )}
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 120 },
  bodyText: { ...theme.typography.mobileBody },
  receiptBlock: {
    ...INTERVAL.block,
  },
  // The destructive tail — left-aligned, compact (the sm ghost), a
  // whisper among the settled rows.
  deleteRow: {
    marginTop: 28,
    alignItems: 'flex-start',
  },
  pageWhisper: {
    ...INTERVAL.whisper,
    marginBottom: 6,
  },
  factLine: {
    ...INTERVAL.fact,
  },
  // The exercise register's head: the name left, tags whisper right.
  subHeadTags: { flex: 1 },
  receiptSubHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  receiptExHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  exerciseName: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  tagsLine: { ...theme.typography.mobileLedger },

  // INLINE SET EDIT — the row IS the form.
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  editPos: {
    ...theme.typography.mobileFigure,
    width: 24,
  },
  editInlineInput: {
    // Constrained — flex:1 pushed the action buttons off mobile
    // screens. Fixed widths fit the digits they carry.
    width: 72,
    minHeight: 40,
    paddingHorizontal: 8,
    fontSize: 18,
    fontFamily: theme.fonts.mono,
    textAlign: 'center',
  },
  editInlineInputNarrow: { width: 52 },
  headAddBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  editTimes: {
    fontSize: 18,
    fontFamily: theme.fonts.mono,
  },
  editMiniBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editMiniLabel: {
    fontSize: 18,
    fontFamily: theme.fonts.mono,
    fontWeight: '600',
  },
});


export default Receipt;
