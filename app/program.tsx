// app/program.tsx
// My Program — THE QUIET PAGE's rotation (docs/architecture/
// quiet-page-thesis.md §6): "The rotation, day by day." No nameplate,
// no sticky chapter chrome, no per-day sets figure — the FIRST day's
// title is the statement (later chapters at subhead scale), each day
// is one air-separated block, and slots are quiet rows: name + Rx
// whisper, no hairlines, no index numerals. A standing substitution
// marks by the record-mark read (the Rx turns record-text); the
// authored program in splits.ts is never edited. Plan-time Swap rides
// the same InkRail bench as the Floor.

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MobilePrimaryButton } from '../components/MobilePremium';
import { DeskShell, InkRail, SwapGlyph } from '../components/composed';
import { safeGoBack } from '../navigation';
import { useAppTheme, useToast } from '../context';
import { useSplitPreferenceStore, useProgramOverrideStore } from '../stores';
import { resolveSlots, slotKey } from '../services';
import {
  TWO_A_DAY_SPLITS,
  ONE_A_DAY_SPLITS,
  SYSTEM_EXERCISES_BY_SLUG,
  getSlotsForDay,
  type SessionWindow,
} from '../shared/exercises';
import { QUIET, ROW_GAP, theme } from '../constants';
import type { PreferredSplit } from '../shared/types';

function rxLabel(sets: [number, number], reps: [number, number]): string {
  const s = sets[1] > 0 ? sets[1] : sets[0];
  return `${s}×${reps[0]}–${reps[1]}`;
}

export default function ProgramScreen() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const split = useSplitPreferenceStore((s) => s.splitType);

  const overrides = useProgramOverrideStore((s) => s.overrides);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const setOverride = useProgramOverrideStore((s) => s.setOverride);
  const clearOverride = useProgramOverrideStore((s) => s.clearOverride);

  const days = split === 'oneADay' ? ONE_A_DAY_SPLITS : TWO_A_DAY_SPLITS;
  const overriddenCount = Object.keys(overrides).length;
  const isTwoADay = split === 'twoADay';

  const renderSlot = (
    day: number,
    window: SessionWindow,
    position: number,
  ) => {
    const slots = resolveSlots(split, day, window, overrides);
    const slot = slots[position - 1];
    if (!slot) return null;
    const key = slotKey(split, day, window, position);
    const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
    const name = entry?.name ?? slot.exercise;
    const isOverridden = key in overrides;

    return (
      <View key={key} style={styles.slotRow}>
        <Text
          style={[styles.slotName, { color: isOverridden ? colors.brandText : colors.text }]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <SwapGlyph onPress={() => setPickerFor(key)} label={name} />
        <Text
          style={[styles.slotRx, { color: isOverridden ? colors.brandText : colors.textMuted }]}
        >
          {rxLabel(slot.sets, slot.reps)}
        </Text>
      </View>
    );
  };

  // Per-day lift count across its windows — computed from the split
  // data at read time; nothing stored.
  const dayLifts = (day: number) => {
    const windows: SessionWindow[] = isTwoADay ? ['am', 'pm'] : ['single'];
    let lifts = 0;
    for (const w of windows) {
      lifts += resolveSlots(split, day, w, overrides).length;
    }
    return lifts;
  };

  return (
    <DeskShell surface="analytics" onBack={safeGoBack} testID="program-scroll">
      {days.map((day, di) => {
        const windows: SessionWindow[] = isTwoADay ? ['am', 'pm'] : ['single'];
        return (
          <View key={day.day} style={di === 0 ? styles.dayFirst : styles.day}>
            {/* Day head: the first day is the page's statement; the
                rest are subheads. One fact line beneath. */}
            <Text
              style={[di === 0 ? styles.dayTitleLead : styles.dayTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {day.title}
            </Text>
            <Text
              style={[styles.dayFact, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {`${isTwoADay ? 'AM + PM · ' : ''}${dayLifts(day.day)} lifts`}
            </Text>
            {windows.map((window) => (
              <View key={window} style={styles.windowBlock}>
                {isTwoADay ? (
                  <Text style={[styles.windowLabel, { color: colors.textMuted }]}>
                    {window.toUpperCase()}
                  </Text>
                ) : null}
                {resolveSlots(split, day.day, window, overrides).map((_, i) =>
                  renderSlot(day.day, window, i + 1),
                )}
              </View>
            ))}
          </View>
        );
      })}

      {overriddenCount > 0 ? (
        <MobilePrimaryButton
          variant="ghost"
          onPress={() => {
            Object.keys(overrides).forEach(clearOverride);
            showToast('success', 'All substitutions cleared');
          }}
          testID="program-reset-all"
        >
          {`Clear substitutions (${overriddenCount})`}
        </MobilePrimaryButton>
      ) : null}

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
  dayFirst: {
    ...QUIET.blockFirst,
  },
  day: {
    ...QUIET.block,
  },
  dayTitleLead: {
    ...QUIET.statement,
  },
  dayTitle: {
    ...theme.typography.mobileTitle,
  },
  // The statement's halo: the fact line waits outside the moat.
  dayFact: {
    ...QUIET.fact,
    marginBottom: 8,
  },
  windowBlock: {
    marginTop: ROW_GAP / 2,
  },
  windowLabel: {
    ...theme.typography.mobileEyebrow,
    marginTop: 8,
    marginBottom: 4,
  },
  slotRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotName: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  slotRx: {
    ...theme.typography.mobileLedger,
  },
});
