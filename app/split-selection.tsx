// app/split-selection.tsx
// Pre-workout setup. Three picks the user makes here, in order:
//   1. Split archetype (oneADay / twoADay).
//   2. Workout day — a rolling 7-day strip. Each non-rest day is labeled
//      with its day-of-split (1..4), derived from the user's last logged
//      workout via getNextSplitDay. Rest days are visually deactivated
//      (reduced opacity, "Rest" label) but still tappable for override.
//   3. AM / PM — only shown for twoADay. AM and PM are separate session
//      rows in the DB (distinguished by their exercises), so sessionMode
//      lives on the draft as planning-time context, not as a column.
//
// On confirm, seeds workoutStore with a fresh draft (date, splitType, day,
// sessionMode) and navigates to the active session — which auto-hydrates
// from useSuggestedExercises using the same (split, day, session) tuple.

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileSectionEyebrow,
  MobileSelectionList,
  CopyForAiButton,
  type MobileSelectionOption,
} from '../components/MobilePremium';
import { SplitExerciseRow, PlanLookupErrorAlert } from '../components/composed';
import { useAppTheme } from '../context';
import { navigateToWorkoutDetail, safeGoBack } from '../navigation';
import {
  useProfile,
  useRecentWorkouts,
  useAiPayload,
  useVariantTree,
  useActivePlanForVariant,
} from '../hooks';
import { useWorkoutStore } from '../stores';
import {
  WORKOUT_SPLIT_LIST,
  SESSION_MODE_LIST,
  DAY_OF_WEEK_LABELS,
  getUpcomingWorkoutSlots,
  getNextSplitDay,
  SCREEN_BODY_STYLE,
  type SessionMode,
  type UpcomingWorkoutSlot,
} from '../constants';
import {
  SYSTEM_EXERCISES_BY_SLUG,
  getExercisesForDay,
  type SystemExerciseData,
} from '../shared/exercises';
import {
  SPLIT_TO_VARIANT_SLUG,
  sessionWindowForLaunch,
  isPlanComplete,
  buildTemplateSnapshot,
  buildVariantSnapshot,
} from '../services';
import type { PreferredSplit } from '../shared/types';

const SPLIT_OPTIONS: MobileSelectionOption[] = WORKOUT_SPLIT_LIST.map((s) => ({
  id: s.id,
  label: s.label,
  description: s.description,
}));

const SESSION_OPTIONS: MobileSelectionOption[] = SESSION_MODE_LIST.map((s) => ({
  id: s.id,
  label: s.label,
}));

/** Resolve slugs → exercise data, dropping any without a local entry. */
function resolveExercises(
  slugs: ReturnType<typeof getExercisesForDay>,
): SystemExerciseData[] {
  return slugs
    .map((slug) => SYSTEM_EXERCISES_BY_SLUG[slug])
    .filter((e): e is SystemExerciseData => Boolean(e));
}

export default function SplitSelectionScreen() {
  const { colors } = useAppTheme();
  const startSession = useWorkoutStore((s) => s.startSession);

  // Profile + recent workouts drive the cycle counter + rest-day map.
  // Both fall back to safe defaults while loading (empty rest days, no
  // last-completed-day) so the picker renders immediately on mount.
  const profileQuery = useProfile();
  const recentQuery = useRecentWorkouts(1);

  const restDays = profileQuery.data?.restDays ?? [];
  const lastCompletedDay = recentQuery.data?.[0]?.day ?? null;

  const [splitChoice, setSplitChoice] = useState<string>('oneADay');
  const [sessionChoice, setSessionChoice] = useState<string>('am');
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(null);

  const split = splitChoice as PreferredSplit;
  const session = sessionChoice as SessionMode;
  const isTwoADay = split === 'twoADay';

  // Phase 4 — plan-backed launch resolver. Look up the variant tree +
  // the user's active plan for that variant. If the plan is complete,
  // the session will hydrate from the saved plan; otherwise the static
  // suggested-split path remains the source. The lookups are cached so
  // toggling between splits is cheap after first resolution.
  //
  // Phase 4 resilience: activePlanQuery.isError is tracked separately
  // from `data == null`. A failed lookup is NOT the same as "no saved
  // plan" — the user may have an active plan that the request couldn't
  // reach. The error surfaces as an inline warning + a static-labeled
  // launch button so the user can still begin a workout but does so
  // knowingly (vs. silently mistaking the error for plan absence).
  const variantSlug = SPLIT_TO_VARIANT_SLUG[split];
  const variantTreeQuery = useVariantTree(variantSlug);
  const variantId = variantTreeQuery.data?.variant.id ?? null;
  const activePlanQuery = useActivePlanForVariant(variantId);
  const activePlan = activePlanQuery.data ?? null;
  const launchFromPlan = isPlanComplete(activePlan);
  const planLookupFailed = activePlanQuery.isError && !launchFromPlan;

  const aiPayload = useAiPayload({
    visibleContent: [
      `- Split: ${splitChoice === 'oneADay' ? '1-a-day' : 'AM/PM'}`,
      `- Next day-of-split: ${getNextSplitDay(lastCompletedDay)}`,
      `- Rest days configured: ${restDays.length}`,
      launchFromPlan ? '- Launch source: saved plan' : '- Launch source: static split',
    ].join('\n'),
  });

  const slots = useMemo(
    () => getUpcomingWorkoutSlots(7, restDays, lastCompletedDay),
    [restDays, lastCompletedDay],
  );

  // Selected slot = explicit pick if valid, else first non-rest day in the
  // window. Falls back to slots[0] (which may be a rest day) when every
  // upcoming day is a rest day — vanishingly rare (7-day rest-day pattern).
  const selectedSlot = useMemo<UpcomingWorkoutSlot | null>(() => {
    if (slots.length === 0) return null;
    if (selectedIsoDate) {
      const found = slots.find((s) => s.isoDate === selectedIsoDate);
      if (found) return found;
    }
    return slots.find((s) => !s.isRestDay) ?? slots[0];
  }, [slots, selectedIsoDate]);

  // The split-day to seed. Rest-day picks fall back to getNextSplitDay so
  // the draft always has a valid 1..4 value even if the user tapped a
  // deactivated rest slot.
  const draftDay =
    selectedSlot?.splitDay ?? getNextSplitDay(lastCompletedDay);

  // Preview the day's exercises. For twoADay, show AM + PM groups when
  // the chosen session is 'am' (full-day preview) — but the active session
  // only logs one of them, picked via the AM/PM toggle. To keep the
  // preview faithful to what will actually be logged, the preview matches
  // the chosen session.
  const previewExercises = resolveExercises(
    getExercisesForDay(split, draftDay, session),
  );

  const handleStart = () => {
    // Phase 4 — when an active complete plan exists for the chosen
    // variant, thread its identity into the draft so workout-detail can
    // hydrate from the plan slot prescription snapshot. The sessionWindow
    // is derived from the split + chosen AM/PM mode. Static fallback
    // omits the plan arg entirely.
    const plan =
      launchFromPlan && activePlan && variantTreeQuery.data
        ? {
            planId: activePlan.id,
            sessionWindow: sessionWindowForLaunch(split, session),
            templateSnapshot: buildTemplateSnapshot(variantTreeQuery.data.template),
            variantSnapshot: buildVariantSnapshot(variantTreeQuery.data.variant),
          }
        : undefined;
    startSession({
      splitType: split,
      day: draftDay,
      sessionMode: session,
      date: selectedSlot?.date.toISOString(),
      plan,
    });
    navigateToWorkoutDetail();
  };

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="setup" />
      <MobileHeader
        title="Start workout"
        eyebrow={
          selectedSlot
            ? `${selectedSlot.dayLabel} · ${selectedSlot.dateLabel}`
            : 'Pick your split'
        }
        onBack={safeGoBack}
        navRightAction={<CopyForAiButton payload={aiPayload} testID="split-selection-copy-for-ai" />}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <MobileSectionEyebrow>Split</MobileSectionEyebrow>
        <MobileSurface>
          <MobileSelectionList
            options={SPLIT_OPTIONS}
            selectedId={splitChoice}
            onSelect={setSplitChoice}
          />
        </MobileSurface>

        <View style={{ height: 16 }} />
        <MobileSectionEyebrow>Workout day</MobileSectionEyebrow>
        <MobileSurface padding={10}>
          <View style={styles.dayGrid}>
            {slots.map((slot) => {
              const isSelected = selectedSlot?.isoDate === slot.isoDate;
              const isRest = slot.isRestDay;
              const dowLabel = DAY_OF_WEEK_LABELS[slot.dayOfWeek].label.slice(0, 3);
              const dateNum = slot.date.getDate();
              const slotLabel = isRest ? 'Rest' : `Day ${slot.splitDay}`;
              return (
                <Pressable
                  key={slot.isoDate}
                  onPress={() => setSelectedIsoDate(slot.isoDate)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${dowLabel} ${dateNum}, ${slotLabel}`}
                  style={({ pressed }) => [
                    {
                      ...styles.dayTile,
                      borderColor: isSelected ? colors.brand : colors.border,
                      backgroundColor: isSelected
                        ? `${colors.brand}14`
                        : colors.glass.inputBackground,
                    },
                    isRest ? styles.dayTileRest : null,
                    pressed ? { opacity: 0.6 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayDow,
                      {
                        color: isSelected ? colors.brand : colors.textSecondary,
                      },
                    ]}
                  >
                    {dowLabel}
                  </Text>
                  <Text
                    style={[
                      styles.dayDate,
                      { color: isSelected ? colors.brand : colors.text },
                    ]}
                  >
                    {dateNum}
                  </Text>
                  <Text
                    style={[
                      styles.daySlotLabel,
                      {
                        color: isSelected
                          ? colors.brand
                          : isRest
                            ? colors.textColors.tertiary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {slotLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.restHint, { color: colors.textColors.tertiary }]}>
            Suggested from your last workout. Rest days are configured in settings.
          </Text>
        </MobileSurface>

        {isTwoADay ? (
          <>
            <View style={{ height: 16 }} />
            <MobileSectionEyebrow>Session</MobileSectionEyebrow>
            <MobileSurface>
              <MobileSelectionList
                options={SESSION_OPTIONS}
                selectedId={sessionChoice}
                onSelect={setSessionChoice}
              />
            </MobileSurface>
          </>
        ) : null}

        <View style={{ height: 16 }} />
        <MobileSectionEyebrow>
          {previewExercises.length === 0
            ? 'No exercises planned'
            : isTwoADay
              ? `${session.toUpperCase()} session · ${previewExercises.length} exercise${
                  previewExercises.length === 1 ? '' : 's'
                }`
              : `${previewExercises.length} exercise${
                  previewExercises.length === 1 ? '' : 's'
                }`}
        </MobileSectionEyebrow>

        {/* Phase 4 — saved-plan indicator. The preview list still renders
            the day's template exercises; the indicator surfaces that the
            active session will hydrate from the user's resolved plan
            (which may differ in equipment-specific alternatives). */}
        {launchFromPlan ? (
          <View style={styles.planBadgeWrap}>
            <View style={[styles.planBadge, { backgroundColor: `${colors.brand}14`, borderColor: `${colors.brand}55` }]}>
              <Text style={[styles.planBadgeText, { color: colors.brand }]}>
                Using your saved plan · resolves alternatives at session start
              </Text>
            </View>
          </View>
        ) : null}

        {/* Phase 4 resilience — plan-lookup failure surfaces here. NOT
            the same as "no saved plan" (which renders no badge and falls
            through to the normal static path silently). The warning makes
            the failed lookup visible + exposes the React Query refetch as
            the retry path. The static launch remains available via the
            footer's explicitly-labeled "Start static workout" button. */}
        {planLookupFailed ? (
          <PlanLookupErrorAlert
            onRetry={() => {
              void activePlanQuery.refetch();
            }}
            testID="split-selection-plan-lookup-error"
          />
        ) : null}

        {previewExercises.length === 0 ? (
          <MobileSurface padding={20}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No exercises planned for this day. Start a session anyway and
              add your own from the exercise database.
            </Text>
          </MobileSurface>
        ) : (
          <View style={styles.listStack}>
            {previewExercises.map((ex, i) => (
              <SplitExerciseRow key={ex.slug} exercise={ex} index={i + 1} />
            ))}
          </View>
        )}
      </ScrollView>
      <MobileActionFooter>
        <MobilePrimaryButton variant="ghost" onPress={safeGoBack}>
          Cancel
        </MobilePrimaryButton>
        <MobilePrimaryButton
          onPress={handleStart}
          testID="split-selection-start-session"
        >
          {/* Phase 4 resilience — when the plan lookup failed the user
              can still begin a workout, but the label makes the fallback
              intent explicit so they don't mistake the session for a
              plan-backed launch. */}
          {planLookupFailed ? 'Start static workout' : 'Start session'}
        </MobilePrimaryButton>
      </MobileActionFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Center the last row so a 7-day window renders as 4 + 3 with the
    // 3 centered, not left-aligned.
    justifyContent: 'center',
    gap: 6,
  },
  dayTile: {
    // 4 per row max so 7 days wraps to 4 + 3. The 24% width leaves room
    // for the 6px gap between tiles without forcing a tighter wrap.
    width: '24%',
    aspectRatio: 0.85,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dayTileRest: {
    opacity: 0.5,
  },
  dayDow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  daySlotLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  restHint: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: { fontSize: 13, lineHeight: 18 },
  listStack: { gap: 8 },
  planBadgeWrap: { marginTop: 8, marginBottom: 4 },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  planBadgeText: { fontSize: 11, fontWeight: '600', lineHeight: 14 },
});
