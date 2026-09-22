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

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { useWorkoutDetail, useDeleteSession, useWeightUnit, useLastUsedTags } from '../../hooks';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query';
import { navigateToWorkoutDetail, safeGoBack } from '../../navigation';
import { resolveSlots, sumVolume } from '../../services';
import { effectiveSetWeight } from '../../utils/bodyweight';
import { getLatestWeight } from '../../utils/supabase/repositories';
import {
  rxLabel,
  useProgramOverrideStore,
  useSplitPreferenceStore,
  useWorkoutStore,
} from '../../stores';
import { INTERVAL, PAGE_GUTTER, theme } from '../../constants';
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
  // THE BODYWEIGHT — the latest weigh-in powers the volume of
  // bodyweight stations (factor × bodyweight = effective load).
  const bodyweightQuery = useQuery({
    queryKey: queryKeys.bodyWeight.latest(),
    queryFn: async () => {
      const r = await getLatestWeight();
      if (!r.success) throw r.error;
      return r.data;
    },
  });
  const bodyweightKg = bodyweightQuery.data?.weightKg ?? null;

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
              <View style={styles.receiptExHead}>
                <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                  {ex.exerciseName || 'Exercise'}
                </Text>
                {ex.tags.length > 0 ? (
                  <Text style={[styles.tagsLine, { color: colors.textMuted }]} numberOfLines={1}>
                    {joinFacts(ex.tags)}
                  </Text>
                ) : null}
              </View>
              {ex.tags.length === 0 && (lastTags.get(ex.exerciseName)?.length ?? 0) > 0 ? (
                <Text style={[styles.tagsLine, { color: colors.textMuted }]} numberOfLines={1}>
                  {joinFacts(['no tags', `last time: ${joinFacts(lastTags.get(ex.exerciseName)!)}`])}
                </Text>
              ) : null}
              {/* The session's best set wears the record red — the
                  sanctioned job (the receipt's ONLY red mark per
                  exercise; the tonnage stays ink: settled fact). */}
              {(() => {
                const bestWeight = Math.max(
                  ...ex.sets.map((s) => toDisplayWeight(s.weight ?? 0, unit)),
                  0,
                );
                return ex.sets.map((s) => (
                  <RegisterLine
                    key={s.id}
                    monoLabel
                    label={String(s.position)}
                    figure={`${roundDisplayWeight(toDisplayWeight(s.weight ?? 0, unit))} × ${s.reps}`}
                    figureTone={
                      toDisplayWeight(s.weight ?? 0, unit) === bestWeight && bestWeight > 0
                        ? 'record'
                        : 'ink'
                    }
                    testID={`receipt-set-${ex.id}-${s.position}`}
                  />
                ));
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
});

export default Receipt;
