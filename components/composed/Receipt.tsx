// components/composed/Receipt.tsx
//
// THE RECEIPT — the read-only session view (board-thesis §7): "That
// was N kg". Self-contained: owns its detail query and the delete
// flow (two-step, toast + back on success). The tonnage is the
// FIGURE-STATEMENT (Spline at counter scale — a figure IS the
// statement here); one fact whisper carries date/window/counts;
// exercises read as ledgers with drawn plate stacks per set.

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  MobilePrimaryButton,
  MobileActionFooter,
  EmptyState,
} from '../MobilePremium';
import { LoadingSpinner } from '../primitives';
import { BoardShell } from './BoardShell';
import { SetRow } from './SetRow';
import { QueryErrorNote } from './QueryErrorNote';
import { useToast, useAppTheme } from '../../context';
import { useWorkoutDetail, useDeleteSession } from '../../hooks';
import { safeGoBack } from '../../navigation';
import { sumVolume, formatVolume } from '../../services';
import { BOARD, PAGE_GUTTER, theme } from '../../constants';

export interface ReceiptProps {
  /** The session id from the route (?id=). */
  id: string;
}

export function Receipt({ id }: ReceiptProps) {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
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
          {/* THE FIGURE-STATEMENT — tonnage. The receipt's one
              sentence is "that was N kg"; the fact line carries
              the rest. */}
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
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 120 },
  bodyText: { ...theme.typography.mobileBody },
  receiptBlock: {
    ...BOARD.block,
  },
  receiptStatement: {
    ...theme.typography.mobileCounter,
  },
  receiptFact: {
    ...BOARD.fact,
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

export default Receipt;
