// app/plan-preview.tsx
//
// Phase 3 plan preview. Generates an equipment-aware plan for the
// variant + the user's inventory, shows the resolved day/session/slot
// tree with resolution chips ("Template", "Direct alt", "Missing"),
// and lets the user either:
//   • Adopt the plan — fires useSaveUserPlan mutation
//   • Drill into a slot to manually replace it (only relevant once the
//     plan is saved — pre-save there's no slot id to navigate with).
//
// The preview reads from useGeneratedPlanPreview (in-memory tree, not
// persisted). The user's existing active plan for this variant (if
// any) is loaded via useActivePlanForVariant so we can show a "your
// saved plan" state when the user re-enters.
//
// Flow: browse (/workout-programs) → preview (/plan-preview?variant=X)
// → replacement (/plan-replacement?planId&planSlotId&templateExerciseId)

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobileSectionEyebrow,
  MobileActionFooter,
  MobilePrimaryButton,
  EmptyState,
  CopyForAiButton,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { useAppTheme, useToast } from '../context';
import { safeGoBack, navigateToPlanReplacement } from '../navigation';
import { SCREEN_BODY_STYLE } from '../constants';
import { SYSTEM_EXERCISES_BY_SLUG, formatRepRange } from '../shared/exercises';
import {
  useGeneratedPlanPreview,
  useActivePlanForVariant,
  useSaveUserPlan,
  useAiPayload,
} from '../hooks';
import type { GeneratedPlan, SlotResolution } from '../shared/types';
import type { ID } from '../shared/types';

export default function PlanPreviewScreen() {
  const { variant } = useLocalSearchParams<{ variant: string }>();
  const variantSlug = variant ?? 'one-a-day';
  const { colors } = useAppTheme();
  const { showToast } = useToast();

  const previewQuery = useGeneratedPlanPreview(variantSlug);
  const saveMutation = useSaveUserPlan();

  const plan = previewQuery.data ?? null;

  const resolutionCounts = useMemo(() => tallyResolutions(plan), [plan]);
  // Adoption-completeness: a plan with any resolution='missing' slot
  // cannot be adopted. The repository independently rejects it; the
  // UI surfaces this preemptively as a disabled Adopt CTA + an
  // actionable explanation. The check mirrors
  // validatePlanForAdoption but reads from the in-memory
  // GeneratedPlan tree (no DB round-trip).
  const missingCount = resolutionCounts.missing;
  const hasMissing = missingCount > 0;

  const totalSlotCount = plan
    ? plan.days.reduce(
        (sum, d) => sum + d.sessions.reduce((s, sess) => s + sess.slots.length, 0),
        0,
      )
    : 0;
  const aiPayload = useAiPayload(
    plan
      ? {
          title: plan.variantName,
          visibleContent: [
            `- Variant: ${plan.variantName}`,
            `- Slots: ${totalSlotCount}`,
            `- Substituted: ${resolutionCounts.direct + resolutionCounts.close + resolutionCounts.fallback}`,
            `- Missing: ${missingCount}`,
          ].join('\n'),
        }
      : { title: 'Plan preview' },
  );

  if (previewQuery.isLoading) {
    return (
      <SafeAreaView
        style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
        edges={['top', 'bottom']}
      >
        <MobileAtmosphere surface="setup" />
        <MobileHeader title="Plan preview" eyebrow="Generating…" onBack={safeGoBack} />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (previewQuery.error || !plan) {
    return (
      <SafeAreaView
        style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
        edges={['top', 'bottom']}
      >
        <MobileAtmosphere surface="setup" />
        <MobileHeader title="Plan preview" eyebrow="Error" onBack={safeGoBack} />
        <View style={styles.body}>
          <EmptyState
            title="Couldn't generate plan"
            message={
              previewQuery.error?.message ??
              'Make sure your equipment inventory is saved and try again.'
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleAdopt = () => {
    saveMutation.mutate(plan, {
      onSuccess: () => {
        showToast('success', 'Plan saved.');
        safeGoBack();
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="analytics" />
      <MobileHeader
        title={plan.variantName}
        eyebrow="Plan preview"
        onBack={safeGoBack}
        navRightAction={<CopyForAiButton payload={aiPayload} testID="plan-preview-copy-for-ai" />}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <SummaryBanner
          counts={resolutionCounts}
          totalSlots={plan.days.reduce(
            (sum, d) => sum + d.sessions.reduce((s, sess) => s + sess.slots.length, 0),
            0,
          )}
        />

        {plan.days.map((day) => (
          <View key={day.dayId} style={styles.dayBlock}>
            <MobileSectionEyebrow flush={false}>
              Day {day.dayIndex} · {day.dayTitle}
            </MobileSectionEyebrow>
            {day.sessions.map((session) => (
              <View key={session.sessionId} style={styles.sessionBlock}>
                {session.sessionWindow !== 'single' ? (
                  <Text style={[styles.sessionWindow, { color: colors.brand }]}>
                    {session.sessionWindow === 'am' ? 'AM' : 'PM'} · {session.sessionLabel}
                  </Text>
                ) : null}
                {session.slots.map((slot, idx) => (
                  <SlotPreviewCard
                    key={slot.templateSlot.id}
                    title={resolveTitle(slot, idx + 1)}
                    prescription={`${slot.templateSlot.setsMin}-${slot.templateSlot.setsMax} × ${formatRepRange([
                      slot.templateSlot.repsMin,
                      slot.templateSlot.repsMax,
                    ])}`}
                    resolution={slot.resolution}
                    rationale={slot.rationale}
                    perSide={slot.templateSlot.perSide}
                  />
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      <MobileActionFooter>
        {hasMissing ? (
          <View style={styles.adoptBlocked}>
            <Text style={[styles.adoptBlockedTitle, { color: colors.status.error }]}>
              Resolve {missingCount} missing slot{missingCount === 1 ? '' : 's'} to adopt
            </Text>
            <Text style={[styles.adoptBlockedBody, { color: colors.textSecondary }]}>
              Open each unresolved slot and pick an eligible replacement, or
              adjust your equipment inventory. Adopted plans must resolve every
              slot to an eligible exercise.
            </Text>
          </View>
        ) : null}
        <MobilePrimaryButton
          onPress={handleAdopt}
          disabled={saveMutation.isPending || hasMissing}
        >
          {saveMutation.isPending
            ? 'Saving…'
            : hasMissing
              ? 'Resolve missing slots first'
              : 'Adopt plan'}
        </MobilePrimaryButton>
      </MobileActionFooter>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Subcomponents (file-local)
// ──────────────────────────────────────────────────────────────────────

function SummaryBanner({
  counts,
  totalSlots,
}: {
  counts: Record<SlotResolution, number>;
  totalSlots: number;
}) {
  const { colors } = useAppTheme();
  const missing = counts.missing;
  const direct = counts.direct + counts.close + counts.fallback;
  return (
    <MobileSurface padding={16}>
      <Text style={[styles.summaryHeading, { color: colors.text }]}>
        {totalSlots} slots · {direct} substituted · {missing} unresolved
      </Text>
      <Text style={[styles.summaryBody, { color: colors.textSecondary }]}>
        Resolution walks the alternatives graph in direct → close → fallback
        order using your equipment inventory.
      </Text>
    </MobileSurface>
  );
}

function SlotPreviewCard({
  title,
  prescription,
  resolution,
  rationale,
  perSide,
}: {
  title: string;
  prescription: string;
  resolution: SlotResolution;
  rationale: string;
  perSide: boolean;
}) {
  const { colors } = useAppTheme();
  const chipColor = ChipColors({
    brand: colors.brand,
    textSecondary: colors.textSecondary,
    statusError: colors.status.error,
  })[resolution];
  return (
    <MobileSurface padding={12} style={styles.slotCard}>
      <View style={styles.slotHeader}>
        <Text style={[styles.slotTitle, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.slotPrescription, { color: colors.textSecondary }]}>
          {prescription}
          {perSide ? ' · per leg' : ''}
        </Text>
      </View>
      <View style={styles.slotFooter}>
        <Text style={[styles.chip, { color: chipColor }]}>
          {CHIP_LABEL[resolution]}
        </Text>
        <Text style={[styles.rationale, { color: colors.textSecondary }]} numberOfLines={3}>
          {rationale}
        </Text>
      </View>
    </MobileSurface>
  );
}

function resolveTitle(
  slot: GeneratedPlan['days'][number]['sessions'][number]['slots'][number],
  index: number,
): string {
  // Prefer the chosen exercise slug (resolved at generation time for
  // template resolutions). Substituted slots need a slug lookup.
  if (slot.chosenExerciseSlug) {
    const sys = SYSTEM_EXERCISES_BY_SLUG[slot.chosenExerciseSlug];
    if (sys) {
      return sys.variation ? `${sys.name} · ${sys.variation}` : sys.name;
    }
    return slot.chosenExerciseSlug;
  }
  if (slot.resolution === 'missing') {
    return `${index}. No eligible exercise`;
  }
  return `${index}. ${slot.templateSlot.exerciseSlug ?? 'Unknown exercise'}`;
}

const CHIP_LABEL: Record<SlotResolution, string> = {
  template: 'Template',
  direct: 'Direct alt',
  close: 'Close alt',
  fallback: 'Fallback alt',
  manual: 'Manual',
  missing: 'Missing',
};

// Hardcoded hex here would be an S7 violation, but pulling from theme
// at module scope isn't safe (theme resolves at runtime). The lookup
// below uses theme.color tokens; the helper is invoked inside the
// component via useAppTheme.
function ChipColors(themeColors: {
  brand: string;
  textSecondary: string;
  statusError: string;
}): Record<SlotResolution, string> {
  return {
    template: themeColors.brand,
    direct: themeColors.brand,
    close: themeColors.textSecondary,
    fallback: themeColors.textSecondary,
    manual: themeColors.brand,
    missing: themeColors.statusError,
  };
}

function tallyResolutions(plan: GeneratedPlan | null): Record<SlotResolution, number> {
  const counts: Record<SlotResolution, number> = {
    template: 0,
    direct: 0,
    close: 0,
    fallback: 0,
    manual: 0,
    missing: 0,
  };
  if (!plan) return counts;
  for (const day of plan.days) {
    for (const session of day.sessions) {
      for (const slot of session.slots) {
        counts[slot.resolution]++;
      }
    }
  }
  return counts;
}

// Placeholder for navigate-to-replacement helper, kept for future
// use once the preview UI allows direct drill-in post-save.
export function _navigateToReplacement(
  planId: ID,
  planSlotId: ID,
  templateExerciseId: ID,
) {
  navigateToPlanReplacement({ planId, planSlotId, templateExerciseId });
}

// ──────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE, flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  summaryHeading: { fontSize: 14, fontWeight: '600' },
  summaryBody: { fontSize: 12, lineHeight: 16, marginTop: 4 },
  dayBlock: { marginTop: 20 },
  sessionBlock: { marginBottom: 12 },
  sessionWindow: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  slotCard: { marginBottom: 8 },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  slotTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  slotPrescription: { fontSize: 12, fontWeight: '500' },
  adoptBlocked: {
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  adoptBlockedTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  adoptBlockedBody: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  slotFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rationale: { fontSize: 11, flex: 1 },
});
