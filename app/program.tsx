// app/program.tsx
// My Program — the split display. Every day, every session window, every
// slot with its Rx and suggested tags — plus plan-time Swap: a standing
// per-slot substitution (persisted client-side; the authored program in
// splits.ts is never edited). Swapped slots carry their Rx forward and
// reset with one tap.

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileHeader,
  MobileSurface,
  MobileSectionEyebrow,
  MobileSelectionList,
  MobilePrimaryButton,
  CopyForAiButton,
  type MobileSelectionOption,
} from '../components/MobilePremium';
import { InkRail, SwapGlyph } from '../components/composed';
import { useAppTheme, useToast } from '../context';
import { safeGoBack } from '../navigation';
import { useAiPayload, } from '../hooks';
import { useSplitPreferenceStore, useProgramOverrideStore } from '../stores';
import { resolveSlots, slotKey } from '../services';
import {
  TWO_A_DAY_SPLITS,
  ONE_A_DAY_SPLITS,
  SYSTEM_EXERCISES_BY_SLUG,
  getSlotsForDay,
  type SessionWindow,
} from '../shared/exercises';
import { SCREEN_BODY_STYLE, WORKOUT_SPLIT_LIST } from '../constants';
import type { PreferredSplit } from '../shared/types';

const SPLIT_OPTIONS: MobileSelectionOption[] = WORKOUT_SPLIT_LIST.map((s) => ({
  id: s.id,
  label: s.label,
  description: s.description,
}));

function rxLabel(sets: [number, number], reps: [number, number]): string {
  const s = sets[1] > 0 ? sets[1] : sets[0];
  return `${s} × ${reps[0]}–${reps[1]}`;
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

  const aiPayload = useAiPayload({
    title: 'My Program',
    contextLabel: 'The split',
    visibleContent: [
      `- Split: ${split === 'oneADay' ? '1-a-day' : 'AM/PM'}`,
      `- Days: 4, slots: ${split === 'oneADay' ? 28 : 32}`,
      `- Standing substitutions: ${overriddenCount}`,
    ].join('\n'),
  });

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
    const programmedSlot = getSlotsForDay(split, day, window)[position - 1];

    return (
      <View key={key}>
      <View
        style={[
          styles.slotRow,
          {
            borderBottomColor: colors.border,
            borderLeftColor: isOverridden ? colors.brand : 'transparent',
          },
        ]}
      >
        <Text style={[styles.slotIndex, { color: colors.brand }]}>{position}</Text>
        <View style={styles.slotMain}>
          <View style={styles.nameRow}>
            <Text style={[styles.slotName, { color: colors.text }]} numberOfLines={2}>
              {name}
            </Text>
            <SwapGlyph onPress={() => setPickerFor(key)} label={name} />
          </View>
          <Text style={[styles.slotMeta, { color: colors.textSecondary }]}>
            {rxLabel(slot.sets, slot.reps)}
            {slot.suggestedTags.length > 0 ? ` · ${slot.suggestedTags.join(' · ')}` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
  }

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="analytics" />
      <MobileHeader
        title="My Program"
        eyebrow={
          split === 'oneADay' ? 'Full body · 4 days' : 'AM/PM · 4 days'
        }
        onBack={safeGoBack}
        navRightAction={
          <CopyForAiButton payload={aiPayload} testID="program-copy-for-ai" />
        }
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <MobileSurface>
          <MobileSelectionList
            options={SPLIT_OPTIONS}
            selectedId={splitChoice}
            onSelect={setSplitChoice}
          />
        </MobileSurface>

        {days.map((day) => (
          <View key={day.day} style={styles.dayBlock}>
            <MobileSectionEyebrow>{day.title}</MobileSectionEyebrow>
            {split === 'twoADay' ? (
              (['am', 'pm'] as const).map((window) => (
                <MobileSurface key={window} padding={14} style={styles.sessionCard}>
                  <Text
                    style={[styles.windowLabel, { color: colors.brand }]}
                  >
                    {window.toUpperCase()}
                  </Text>
                  {renderSlot(day.day, window, 1)}
                  {renderSlot(day.day, window, 2)}
                  {renderSlot(day.day, window, 3)}
                  {renderSlot(day.day, window, 4)}
                </MobileSurface>
              ))
            ) : (
              <MobileSurface padding={14} style={styles.sessionCard}>
                {renderSlot(day.day, 'single', 1)}
                {renderSlot(day.day, 'single', 2)}
                {renderSlot(day.day, 'single', 3)}
                {renderSlot(day.day, 'single', 4)}
                {renderSlot(day.day, 'single', 5)}
                {renderSlot(day.day, 'single', 6)}
                {renderSlot(day.day, 'single', 7)}
              </MobileSurface>
            )}
          </View>
        ))}

        {overriddenCount > 0 ? (
          <MobilePrimaryButton
            variant="ghost"
            onPress={() => {
              Object.keys(overrides).forEach(clearOverride);
              showToast('success', 'All substitutions cleared');
            }}
            testID="program-reset-all"
          >
            Clear all substitutions ({overriddenCount})
          </MobilePrimaryButton>
        ) : null}
      </ScrollView>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  dayBlock: { marginTop: 16 },
  sessionCard: { gap: 0 },
  windowLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderLeftWidth: 3,
    paddingLeft: 8,
  },
  slotIndex: { fontSize: 13, fontWeight: '700', minWidth: 18 },
  slotMain: { flex: 1, gap: 2 },
  slotName: { fontSize: 14, fontWeight: '600' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotMeta: { fontSize: 12, lineHeight: 16 },
});
