// app/program.tsx
// My Program — the split as a document (count-thesis §7): days are
// chapters (mono DAY 01 marking + Big Shoulders title + planned-sets
// figure in mono), and each chapter head PINS while its slots scroll
// under it — the reader always knows which day they're reading. Slots
// are the same numbered ledger rows the funnel preview speaks — one
// slot language everywhere. Plan-time Swap: a standing per-slot
// substitution (persisted client-side; the authored program in
// splits.ts is never edited). Swapped slots carry their Rx forward,
// mark with a 2px strike rule, and reset with one tap.

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  MobileSectionEyebrow,
  MobilePrimaryButton,
  SegmentedControl,
} from '../components/MobilePremium';
import { DeskShell, InkRail, SwapGlyph } from '../components/composed';
import { useAppTheme, useToast } from '../context';
import { useSplitPreferenceStore, useProgramOverrideStore } from '../stores';
import { resolveSlots, slotKey } from '../services';
import {
  TWO_A_DAY_SPLITS,
  ONE_A_DAY_SPLITS,
  SYSTEM_EXERCISES_BY_SLUG,
  MUSCLE_DISPLAY_NAMES,
  getSlotsForDay,
  type MuscleSlug,
  type SessionWindow,
} from '../shared/exercises';
import { WORKOUT_SPLIT_LIST, theme } from '../constants';
import type { PreferredSplit } from '../shared/types';

const SPLIT_SEGMENTS = WORKOUT_SPLIT_LIST.map((s) => ({ value: s.id, label: s.label }));

function rxLabel(sets: [number, number], reps: [number, number]): string {
  const s = sets[1] > 0 ? sets[1] : sets[0];
  return `${s}×${reps[0]}–${reps[1]}`;
}

export default function ProgramScreen() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const preferredSplit = useSplitPreferenceStore((s) => s.splitType);
  const [splitChoice, setSplitChoice] = useState<string>(preferredSplit);
  const split = splitChoice as PreferredSplit;

  const overrides = useProgramOverrideStore((s) => s.overrides);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const setOverride = useProgramOverrideStore((s) => s.setOverride);
  const clearOverride = useProgramOverrideStore((s) => s.clearOverride);

  const days = split === 'oneADay' ? ONE_A_DAY_SPLITS : TWO_A_DAY_SPLITS;
  const overriddenCount = Object.keys(overrides).length;


  const renderSlot = (
    day: number,
    window: SessionWindow,
    position: number,
    isLast: boolean,
  ) => {
    const slots = resolveSlots(split, day, window, overrides);
    const slot = slots[position - 1];
    if (!slot) return null;
    const key = slotKey(split, day, window, position);
    const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
    const name = entry?.name ?? slot.exercise;
    const isOverridden = key in overrides;
    const detail = [
      slot.suggestedTags.length > 0 ? slot.suggestedTags.join(' · ') : null,
      entry?.primaryMuscles[0]
        ? MUSCLE_DISPLAY_NAMES[entry.primaryMuscles[0] as MuscleSlug]
        : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <View
        key={key}
        style={[
          styles.slotRow,
          {
            borderBottomColor: colors.mobilePremium.hairlineBorder,
            borderLeftColor: isOverridden ? colors.brand : 'transparent',
          },
          isLast ? { borderBottomWidth: 0 } : null,
        ]}
      >
        <Text style={[styles.slotIndex, { color: colors.brandText }]}>
            {String(position).padStart(2, '0')}
          </Text>
        <View style={styles.slotMain}>
          <View style={styles.nameRow}>
            <Text style={[styles.slotName, { color: colors.text }]} numberOfLines={1}>
              {name}
            </Text>
            <SwapGlyph onPress={() => setPickerFor(key)} label={name} />
          </View>
          {detail ? (
            <Text style={[styles.slotDetail, { color: colors.textMuted }]} numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.slotRx, { color: colors.text }]}>
          {rxLabel(slot.sets, slot.reps)}
        </Text>
      </View>
    );
  };

  // Per-day planned volume — the day's programmed set count across its
  // windows (max of each slot's range). Computed from the split data at
  // read time; nothing stored.
  const dayVolume = (day: number) => {
    const windows: SessionWindow[] =
      split === 'twoADay' ? ['am', 'pm'] : ['single'];
    let sets = 0;
    let lifts = 0;
    for (const w of windows) {
      for (const slot of resolveSlots(split, day, w, overrides)) {
        lifts += 1;
        sets += slot.sets[1] > 0 ? slot.sets[1] : slot.sets[0];
      }
    }
    return { sets, lifts };
  };

  // The scroll is a flat child list; day heads are the sticky members
  // (stickyHeaderIndices — position: sticky on web, verified pinning).
  const scrollChildren: React.ReactElement[] = [];
  const stickyIndices: number[] = [];
  scrollChildren.push(
    <SegmentedControl<string>
      key="split"
      variant="selection"
      segments={SPLIT_SEGMENTS}
      value={splitChoice}
      onChange={setSplitChoice}
      accessibilityLabel="Split archetype"
      testID="program-split"
    />,
  );

  days.forEach((day, di) => {
    const volume = dayVolume(day.day);
    const windows: SessionWindow[] =
      split === 'twoADay' ? ['am', 'pm'] : ['single'];
    // The chapter head is its own sticky child; the chapter body follows.
    stickyIndices.push(scrollChildren.length);
    scrollChildren.push(
      <View
        key={`h-${day.day}`}
        style={[styles.dayHeadWrap, { backgroundColor: colors.backgroundDeep }]}
      >
        <View style={styles.dayHead}>
          <Text style={[styles.dayNumber, { color: colors.brandText }]}>
            {`DAY ${String(day.day).padStart(2, '0')}`}
          </Text>
          <Text style={[styles.dayTitle, { color: colors.text }]} numberOfLines={1}>
            {day.title}
          </Text>
          <Text style={[styles.daySets, { color: colors.text }]}>
            {`${volume.sets}`}
            <Text style={[styles.daySetsUnit, { color: colors.textMuted }]}>
              {' sets'}
            </Text>
          </Text>
        </View>
      </View>,
    );
    scrollChildren.push(
      <View key={`b-${day.day}`} style={styles.dayBlock}>
        {windows.map((window) => {
                const count = resolveSlots(split, day.day, window, overrides).length;
                return (
                  <View key={window} style={styles.windowBlock}>
                    {split === 'twoADay' ? (
                      <Text style={[styles.windowLabel, { color: colors.textMuted }]}>
                        {`${window.toUpperCase()} · ${count} LIFTS`}
                      </Text>
                    ) : null}
                    {renderSlot(day.day, window, 1, false)}
                    {renderSlot(day.day, window, 2, false)}
                    {renderSlot(day.day, window, 3, false)}
                    {split === 'twoADay'
                      ? renderSlot(day.day, window, 4, true)
                      : renderSlot(day.day, window, 4, false)}
                    {split === 'oneADay'
                      ? renderSlot(day.day, window, 5, false)
                      : null}
                    {split === 'oneADay'
                      ? renderSlot(day.day, window, 6, false)
                      : null}
                    {split === 'oneADay'
                      ? renderSlot(day.day, window, 7, true)
                      : null}
                  </View>
                );
        })}
        {di === days.length - 1 ? null : (
          <View
            style={[styles.dayRule, { backgroundColor: colors.mobilePremium.hairlineBorder }]}
          />
        )}
      </View>,
    );
  });

  if (overriddenCount > 0) {
    scrollChildren.push(
      <MobilePrimaryButton
        key="reset"
        variant="ghost"
        onPress={() => {
          Object.keys(overrides).forEach(clearOverride);
          showToast('success', 'All substitutions cleared');
        }}
        testID="program-reset-all"
      >
        Clear all substitutions ({overriddenCount})
      </MobilePrimaryButton>,
    );
  }

  return (
    <DeskShell
      surface="analytics"
      stickyHeaderIndices={stickyIndices}
      header={
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerEyebrow, { color: colors.textMuted }]}>
              {split === 'oneADay' ? 'FULL BODY · 4 DAYS' : 'AM/PM · 4 DAYS'}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Program</Text>
          </View>
        </View>
      }
    >
      {scrollChildren}
      {pickerFor ? (() => {
      const [sp, d, w, pos] = pickerFor.split(':');
      const slots = resolveSlots(sp as PreferredSplit, Number(d), w as never, overrides);
      const pickerSlot = slots[Number(pos) - 1] ?? null;
      const progSlot = getSlotsForDay(sp as PreferredSplit, Number(d), w as never);
      const prog = progSlot?.[Number(pos) - 1];
      return pickerSlot ? (
        <InkRail
          currentSlug={pickerSlot.exercise}
          programmed={
            prog && prog.exercise !== pickerSlot.exercise
              ? {
                  slug: prog.exercise,
                  name: SYSTEM_EXERCISES_BY_SLUG[prog.exercise]?.name ?? '',
                }
              : null
          }
          open={pickerFor !== null}
          onOpenChange={(next) => {
            if (!next) setPickerFor(null);
          }}
          onRestore={() => {
            clearOverride(pickerFor);
            setPickerFor(null);
            showToast('success', 'Back to the programmed exercise');
          }}
          onSwap={(next) => {
            setOverride(pickerFor, { slug: next.exerciseSlug, name: next.exerciseName });
            setPickerFor(null);
            showToast('success', next.exerciseName);
          }}
          testID="program-swap-picker"
        />
      ) : null;
    })() : null}
    </DeskShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  headerEyebrow: {
    ...theme.typography.mobileEyebrow,
    marginBottom: 2,
  },
  headerTitle: {
    ...theme.typography.mobileTitle,
  },
  dayHeadWrap: {
    // The sticky chapter head — page-colored so slots scroll under it.
    paddingTop: 24,
    marginBottom: 4,
  },
  dayBlock: {},
  dayHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 8,
  },
  dayNumber: {
    ...theme.typography.mobileEyebrow,
    paddingBottom: 5,
  },
  dayTitle: {
    ...theme.typography.mobileDisplay,
    fontSize: 34,
    lineHeight: 36,
    flex: 1,
  },
  daySets: {
    ...theme.typography.mobileFigure,
  },
  daySetsUnit: {
    ...theme.typography.mobileMeta,
    fontWeight: '400',
  },
  windowBlock: {
    marginBottom: 4,
  },
  windowLabel: {
    ...theme.typography.mobileEyebrow,
    marginTop: 10,
    marginBottom: 2,
  },
  dayRule: {
    height: 1,
    marginTop: 20,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderLeftWidth: 2,
    paddingLeft: 10,
  },
  slotIndex: {
    ...theme.typography.mobileLedger,
    minWidth: 18,
  },
  slotMain: { flex: 1, gap: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  slotName: { ...theme.typography.mobileItemTitle, flex: 1 },
  slotDetail: { ...theme.typography.mobileMeta },
  slotRx: {
    ...theme.typography.mobileLedger,
  },
});
