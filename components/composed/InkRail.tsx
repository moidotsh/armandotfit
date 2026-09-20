// components/composed/InkRail.tsx
// The SWAP BENCH — the substitution picker, invisible until needed. The
// exercise row stays perfectly clean; one small ⇄ glyph sits in the
// station meta. Tap it and the bench slides up as a ruled sheet on the
// field (mode-following — chalk or iron per the user's preference):
// the current exercise marked in the strike tone, ranked alternatives
// as ruled bench rows, and — the metadata play — a WHY line per row:
// the shared muscles and equipment that earned the rank. The
// programmed lift is one tap back. Tap a name, done.

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MobileSheet } from '../MobilePremium';
import { useAppTheme } from '../../context';
import { joinFacts } from '../../utils';
import { rankAlternatives } from '../../services';
import {
  SYSTEM_EXERCISES_BY_SLUG,
  MUSCLE_DISPLAY_NAMES,
  EQUIPMENT_DISPLAY_NAMES,
  equipmentSlugs,
  type MuscleSlug,
  type EquipmentSlug,
  type SystemExerciseData,
} from '../../shared/exercises';
import { theme, type MeterStep,
  PRESS_DIP
} from '../../constants';

export interface InkRailProps {
  currentSlug: string;
  onSwap: (next: { exerciseName: string; exerciseSlug: string }) => void;
  programmed?: { slug: string; name: string } | null;
  onRestore?: () => void;
  /** Controlled open state — the parent owns the single sheet. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testID?: string;
}

/** The ⇄ trigger — a 44×44 target wearing a small glyph. */
export function SwapGlyph({ onPress, label }: { onPress: () => void; label: string }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Change ${label}`}
      style={({ pressed }) => [styles.glyphBox, pressed ? { opacity: PRESS_DIP } : null]}
    >
      <Text style={[styles.glyph, { color: colors.textMuted }]}>⇄</Text>
    </Pressable>
  );
}

/** The WHY line: shared primary muscles + shared equipment, mono micro. */
function whyLine(candidate: SystemExerciseData, current: SystemExerciseData): string {
  const sharedMuscles = candidate.primaryMuscles
    .filter((m) => current.primaryMuscles.includes(m))
    .map((m) => MUSCLE_DISPLAY_NAMES[m as MuscleSlug]);
  const currentEquipment = new Set(equipmentSlugs(current));
  const sharedEquipment = equipmentSlugs(candidate)
    .filter((e) => currentEquipment.has(e))
    .map((e) => EQUIPMENT_DISPLAY_NAMES[e as EquipmentSlug]);
  return joinFacts(
    [...sharedMuscles.slice(0, 2), ...sharedEquipment.slice(0, 1)]
      .filter(Boolean)
      .map((s) => s.toLowerCase()),
  );
}

interface BenchRow {
  slug: string;
  name: string;
  isCurrent: boolean;
  isProgrammed: boolean;
  why: string | null;
  /** The row's equipment zone — the tick's hue (the zone ramp). */
  step: MeterStep;
}

/** Equipment modality → the meter ramp's step (the zone ramp). */
const ZONE_STEP: Record<string, MeterStep> = {
  barbell: 'step1',
  dumbbell: 'step2',
  cable: 'step3',
  machine: 'step4',
  bodyweight: 'step5',
};
const stepFor = (slug: string): MeterStep => {
  const m = SYSTEM_EXERCISES_BY_SLUG[slug]?.modality ?? 'machine';
  return ZONE_STEP[m] ?? 'step6';
};

export function InkRail({
  currentSlug,
  onSwap,
  programmed,
  onRestore,
  open,
  onOpenChange,
  testID,
}: InkRailProps) {
  const { colors } = useAppTheme();

  const items = useMemo<{ rows: BenchRow[]; current: SystemExerciseData | undefined }>(() => {
    const current = currentSlug
      ? SYSTEM_EXERCISES_BY_SLUG[currentSlug]
      : undefined;
    if (!current) return { rows: [], current: undefined };

    const rows: BenchRow[] = [
      { slug: current.slug, name: current.name, isCurrent: true, isProgrammed: false, why: null, step: stepFor(current.slug) },
    ];
    if (programmed && programmed.slug !== current.slug) {
      rows.push({
        slug: programmed.slug,
        name: programmed.name,
        isCurrent: false,
        isProgrammed: true,
        why: null,
        step: stepFor(programmed.slug),
      });
    }
    for (const alt of rankAlternatives(current, 6)) {
      if (programmed && alt.exercise.slug === programmed.slug) continue;
      rows.push({
        slug: alt.exercise.slug,
        name: alt.exercise.name,
        isCurrent: false,
        isProgrammed: false,
        why: whyLine(alt.exercise, current),
        step: stepFor(alt.exercise.slug),
      });
    }
    return { rows, current };
  }, [currentSlug, programmed]);

  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      showHandle={false}
      showCloseButton={false}
      testID={testID}
    >
      <View style={[styles.plate, { backgroundColor: colors.card }]}>
        <Text style={[styles.plateEyebrow, { color: colors.textMuted }]}>
          THE SWAP BENCH
        </Text>
        <View style={styles.list}>
          {items.rows.map((item, i) => (
            <Pressable
              key={item.slug}
              onPress={() => {
                onOpenChange(false);
                if (item.isCurrent) return;
                if (item.isProgrammed && onRestore) {
                  onRestore();
                } else {
                  onSwap({ exerciseName: item.name, exerciseSlug: item.slug });
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={
                item.isCurrent
                  ? `${item.name}, current`
                  : item.isProgrammed
                    ? `Restore ${item.name}`
                    : `Swap to ${item.name}`
              }
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.mobilePremium.hairlineBorder },
                // The LAST row draws no rule — a hairline under the
                // final bench row is a rule to nowhere.
                i === items.rows.length - 1 ? { borderBottomWidth: 0 } : null,
                // The current pick reads as ink emphasis (quiet plate),
                // not a brand wash — the bench has no strike moment.
                item.isCurrent ? { backgroundColor: colors.cardAlt } : null,
                pressed ? { opacity: PRESS_DIP } : null,
              ]}
            >
              <View
                style={[styles.zoneTick, { backgroundColor: colors.meter[item.step] }]}
                testID={testID ? `${testID}-tick-${item.slug}` : undefined}
              />
              <View style={styles.rowMain}>
                <Text
                  numberOfLines={1}
                  style={[styles.name, { color: colors.text }]}
                >
                  {item.isProgrammed ? `↺ ${item.name}` : item.name}
                </Text>
                {item.why ? (
                  <Text numberOfLines={1} style={[styles.why, { color: colors.textMuted }]}>
                    {item.why}
                  </Text>
                ) : null}
              </View>
              <Text
                style={[
                  styles.meta,
                  { color: item.isCurrent ? colors.textSecondary : colors.textMuted },
                ]}
              >
                {item.isCurrent ? 'CURRENT' : item.isProgrammed ? 'RESTORE' : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </MobileSheet>
  );
}

const styles = StyleSheet.create({
  glyphBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
  },
  plate: {
    borderRadius: 0,
    paddingBottom: 16,
  },
  plateEyebrow: {
    ...theme.typography.mobileEyebrow,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  list: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
  },
  // The row's zone tick — walking distance reads in hue (the zone
  // ramp), the same line the library's geography draws.
  zoneTick: {
    width: 3,
    height: 26,
    borderRadius: 1,
  },
  rowMain: {
    flex: 1,
    gap: 1,
  },
  name: {
    // Bench rows are body voice (platform sans) — the display face is
    // reserved for statements, and these are choices, not statements.
    ...theme.typography.mobileItemTitle,
  },
  why: {
    ...theme.typography.mobileTag,
  },
  meta: {
    ...theme.typography.mobileEyebrow,
  },
});

export default InkRail;
