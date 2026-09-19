// app/workout-detail.tsx
// Two screens behind one route (docs/architecture/board-thesis.md §7):
//
//   ?id=  the RECEIPT — a Desk page (components/composed/Receipt.tsx;
//         self-contained: its own query + delete flow).
//   none  the FLOOR — the live session, the flagship
//         (components/composed/Floor.tsx; store-direct, composing
//         useFloorSession for the draft lifecycle, stats, prefills).
//
// This file is the dispatcher only: param parsing, the no-session
// redirect, and the handoff. The data orchestration lives in
// hooks/useFloorSession.ts; the views own their mutations.

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingSpinner } from '../components/primitives';
import { Floor, Receipt } from '../components/composed';
import { useAppTheme } from '../context';
import { navigateToSplitSelection } from '../navigation';
import { useWorkoutStore } from '../stores';
import { SCREEN_BODY_STYLE } from '../constants';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);

  // If no id and no active draft, redirect to split-selection once.
  useEffect(() => {
    if (!id && !isSessionActive) {
      navigateToSplitSelection();
    }
  }, [id, isSessionActive]);

  if (id) {
    return <Receipt id={id} />;
  }

  // Live-logging mode — the Floor when a session runs; the redirect
  // effect + spinner cover the handoff otherwise.
  if (isSessionActive) {
    return <Floor />;
  }
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

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
});
