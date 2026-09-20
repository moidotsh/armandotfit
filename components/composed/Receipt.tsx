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
import { QueryErrorNote } from './QueryErrorNote';
import { useToast, useAppTheme } from '../../context';
import { useWorkoutDetail, useDeleteSession, useWeightUnit, useLastUsedTags } from '../../hooks';
import { safeGoBack } from '../../navigation';
import { sumVolume } from '../../services';
import { INTERVAL, PAGE_GUTTER, theme } from '../../constants';
import { eraFor } from '../../shared/exercises';
import {
  toDisplayWeight,
  roundDisplayWeight,
  formatVolumeWeight,
  weightUnitLabel,
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
  const totalKg = session
    ? session.exercises.reduce((n, e) => n + sumVolume(e.sets), 0)
    : 0;

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
              {[
                new Date(session.startedAt).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }),
                // The era can be empty (a date before the first era) —
                // empty parts never join (the printed `· ·` was a
                // fact line lying about its segments).
                eraFor(new Date(session.startedAt).toISOString().slice(0, 10)) || null,
                session.splitDay != null ? `D${session.splitDay}` : 'ad-hoc',
                windowLabel,
                `${session.exercises.length} lifts`,
                `${totalSets} sets`,
              ]
                .filter(Boolean)
                .join(' · ')}
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
                    {ex.tags.join(' · ')}
                  </Text>
                ) : null}
              </View>
              {ex.tags.length === 0 && (lastTags.get(ex.exerciseName)?.length ?? 0) > 0 ? (
                <Text style={[styles.tagsLine, { color: colors.textMuted }]} numberOfLines={1}>
                  {`no tags · last time: ${lastTags.get(ex.exerciseName)!.join(' · ')}`}
                </Text>
              ) : null}
              {ex.sets.map((s) => (
                <RegisterLine
                  key={s.id}
                  monoLabel
                  label={String(s.position)}
                  figure={`${roundDisplayWeight(toDisplayWeight(s.weight ?? 0, unit))} × ${s.reps}`}
                  testID={`receipt-set-${ex.id}-${s.position}`}
                />
              ))}
            </View>
          ))}
          <View style={styles.receiptBlock}>
            <MobileActionFooter>
              {/* The destructive tail arms by ink, never by a second
                  red: unarmed is the quiet ghost whisper; the tap-again
                  step IS the armed state and reads the full ink plate
                  (ink is state — the verb stays ink in both steps). */}
              <MobilePrimaryButton
                variant={confirmDelete ? 'primary' : 'ghost'}
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
            </MobileActionFooter>
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
