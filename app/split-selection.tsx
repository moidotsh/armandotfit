// app/split-selection.tsx
// Pre-workout setup: pick the split type + day-of-week. On confirm,
// seeds workoutStore with a fresh draft and navigates to the active
// session. Single-purpose route — the user is in and out in 10 seconds.

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileSectionEyebrow,
  MobileSelectionList,
  type MobileSelectionOption,
} from '../components/MobilePremium';
import { useAppTheme } from '../context';
import { navigateToWorkoutDetail, safeGoBack } from '../navigation';
import { useWorkoutStore } from '../stores';
import type { PreferredSplit } from '../shared/types';

const SPLIT_OPTIONS: MobileSelectionOption[] = [
  {
    id: 'oneADay',
    label: '1-a-day',
    description: 'Full Body / Push-Pull-Legs / etc. — one session today.',
  },
  {
    id: 'twoADay',
    label: 'AM / PM',
    description: 'Two sessions today (morning + evening).',
  },
];

const DAY_OPTIONS: MobileSelectionOption[] = [
  { id: '1', label: 'Monday' },
  { id: '2', label: 'Tuesday' },
  { id: '3', label: 'Wednesday' },
  { id: '4', label: 'Thursday' },
  { id: '5', label: 'Friday' },
  { id: '6', label: 'Saturday' },
  { id: '7', label: 'Sunday' },
];

export default function SplitSelectionScreen() {
  const { colors } = useAppTheme();
  const startSession = useWorkoutStore((s) => s.startSession);
  const [splitChoice, setSplitChoice] = useState<string>('oneADay');
  const [dayChoice, setDayChoice] = useState<string>('1');

  const handleStart = () => {
    startSession({
      splitType: splitChoice as PreferredSplit,
      day: parseInt(dayChoice, 10),
    });
    navigateToWorkoutDetail();
  };

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="setup" />
      <MobileHeader title="Start workout" eyebrow="Step 1 of 1" />
      <View style={styles.body}>
        <MobileSectionEyebrow>Split</MobileSectionEyebrow>
        <MobileSurface padding={4}>
          <MobileSelectionList
            options={SPLIT_OPTIONS}
            selectedId={splitChoice}
            onSelect={setSplitChoice}
          />
        </MobileSurface>

        <View style={{ height: 16 }} />
        <MobileSectionEyebrow>Day of week</MobileSectionEyebrow>
        <MobileSurface padding={4}>
          <MobileSelectionList
            options={DAY_OPTIONS}
            selectedId={dayChoice}
            onSelect={setDayChoice}
          />
        </MobileSurface>
      </View>
      <MobileActionFooter>
        <MobilePrimaryButton variant="ghost" onPress={safeGoBack}>
          Cancel
        </MobilePrimaryButton>
        <MobilePrimaryButton onPress={handleStart}>
          Start session
        </MobilePrimaryButton>
      </MobileActionFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
});
