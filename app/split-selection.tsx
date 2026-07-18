// app/split-selection.tsx
// Pre-workout setup: pick the split type + day, see the planned exercises
// with attributes (equipment, muscles, sets×reps), then start the session.
// On confirm, seeds workoutStore with a fresh draft and navigates to the
// active session — which auto-hydrates from the same suggested-exercises
// source so the user lands ready to log.

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { SplitExerciseRow } from '../components/composed';
import { useAppTheme } from '../context';
import { navigateToWorkoutDetail, safeGoBack } from '../navigation';
import { useWorkoutStore } from '../stores';
import {
  WORKOUT_SPLIT_LIST,
  DAY_OF_WEEK_LIST,
  parseDayId,
} from '../constants';
import {
  SYSTEM_EXERCISES_BY_SLUG,
  getExercisesForDay,
  type SystemExerciseData,
} from '../shared/exercises';
import type { PreferredSplit } from '../shared/types';

// Map the canonical split + day-of-week metadata into the shape
// MobileSelectionList expects.
const SPLIT_OPTIONS: MobileSelectionOption[] = WORKOUT_SPLIT_LIST.map((s) => ({
  id: s.id,
  label: s.label,
  description: s.description,
}));

const DAY_OPTIONS: MobileSelectionOption[] = DAY_OF_WEEK_LIST.map((d) => ({
  id: d.id,
  label: d.label,
}));

/** Resolve slugs → exercise data, dropping any without a local entry. */
function resolveExercises(slugs: ReturnType<typeof getExercisesForDay>): SystemExerciseData[] {
  return slugs
    .map((slug) => SYSTEM_EXERCISES_BY_SLUG[slug])
    .filter((e): e is SystemExerciseData => Boolean(e));
}

export default function SplitSelectionScreen() {
  const { colors } = useAppTheme();
  const startSession = useWorkoutStore((s) => s.startSession);
  const [splitChoice, setSplitChoice] = useState<string>('oneADay');
  const [dayChoice, setDayChoice] = useState<string>('1');

  const split = splitChoice as PreferredSplit;
  const dayNum = parseDayId(dayChoice);
  const amExercises = resolveExercises(getExercisesForDay(split, dayNum, 'am'));
  const pmExercises = resolveExercises(getExercisesForDay(split, dayNum, 'pm'));
  const isRestDay = amExercises.length === 0 && pmExercises.length === 0;
  // For oneADay, pmExercises is always [] — the day has a single list.
  // For twoADay, both groups apply (separate AM/PM sessions).
  const isTwoADay = split === 'twoADay';

  const handleStart = () => {
    startSession({ splitType: split, day: dayNum });
    navigateToWorkoutDetail();
  };

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="setup" />
      <MobileHeader title="Start workout" eyebrow="Pick your split" />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={{ height: 16 }} />
        <MobileSectionEyebrow>
          {isRestDay
            ? "Today's plan: rest"
            : isTwoADay
              ? `Today's plan: ${amExercises.length} AM + ${pmExercises.length} PM`
              : `Today's plan: ${amExercises.length} exercises`}
        </MobileSectionEyebrow>

        {isRestDay ? (
          <MobileSurface padding={20}>
            <Text style={[styles.restText, { color: colors.textSecondary }]}>
              No exercises planned for this day. Start a session anyway and
              add your own from the exercise database.
            </Text>
          </MobileSurface>
        ) : isTwoADay ? (
          <View style={styles.planStack}>
            <View>
              <Text style={[styles.groupLabel, { color: colors.brand }]}>
                AM session
              </Text>
              <View style={styles.listStack}>
                {amExercises.map((ex, i) => (
                  <SplitExerciseRow key={ex.slug} exercise={ex} index={i + 1} />
                ))}
              </View>
            </View>
            {pmExercises.length > 0 ? (
              <View>
                <Text style={[styles.groupLabel, { color: colors.brand }]}>
                  PM session
                </Text>
                <View style={styles.listStack}>
                  {pmExercises.map((ex, i) => (
                    <SplitExerciseRow key={ex.slug} exercise={ex} index={i + 1} />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.listStack}>
            {amExercises.map((ex, i) => (
              <SplitExerciseRow key={ex.slug} exercise={ex} index={i + 1} />
            ))}
          </View>
        )}
      </ScrollView>
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
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  restText: { fontSize: 13, lineHeight: 18 },
  planStack: { gap: 16 },
  listStack: { gap: 8 },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 2,
  },
});
