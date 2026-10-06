// components/composed/ProgramEdit.tsx
// THE EDIT BENCH — the Edit Mode machinery shared by the three program
// previews (the edition days, the starter days, the Split Lab board):
//
//   EditToggleGlyph   the pencil in the page head (✎ editing / ✓ done)
//   RemoveSlotGlyph   the row's ✕ — two-tap confirm (the receipt-delete
//                     grammar), writing removed:true
//   RestoreSlotGlyph  the ↺ on a removed row's ghost — clears the edit
//   AddExerciseRow    the window's + ADD EXERCISE line (edit mode only)
//   RxEditSheet       the prescription bench: set range + rep range as
//                     steppers, the slot's DEFAULT one tap back
//   AddExerciseSheet  the catalog picker for adds — search, zone ticks,
//                     tap to add at the window's next free position
//
// Every write lands in the programOverrideStore as a ProgramSlotOverride;
// the authored program stays the DEFAULT and restoring is always one
// tap — the slot's DEFAULT row in the swap bench, the ghost row's ↺,
// or the page's RESTORE TO DEFAULTS.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Pencil, Plus } from '@tamagui/lucide-icons-2';
import { MobileSheet, MobilePrimaryButton, MobileStepper, SearchField } from '../MobilePremium';
import { useAppTheme } from '../../context';
import { SYSTEM_EXERCISES } from '../../shared/exercises';
import { theme, PRESS_DIP } from '../../constants';
import { zoneStepFor } from './InkRail';

// ── THE HEAD'S PENCIL ─────────────────────────────────────────────────

/** The edit sheets' captured state — everything about a slot at open
 * time, so the swap bench and the Rx bench never re-resolve or parse
 * keys. `default*` is the AUTHORED slot (the ↺ DEFAULT row); an empty
 * defaultSlug marks an added slot (no default — removing is its
 * restore). Shared by the program page's two previews and the lab. */
export interface SlotBench {
  mode: 'swap' | 'rx';
  key: string;
  currentSlug: string;
  currentName: string;
  sets: [number, number];
  reps: [number, number];
  defaultSlug: string;
  defaultName: string;
  defaultSets: [number, number];
  defaultReps: [number, number];
  isEdited: boolean;
}

/** The Edit Mode toggle — a 44×44 target; the pencil while reading,
 * the check while editing (the state the glyph names). */
export function EditToggleGlyph({
  editing,
  onPress,
  testID,
}: {
  editing: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const { colors } = useAppTheme();
  const Icon = editing ? Check : Pencil;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={editing ? 'Done editing' : 'Edit this program'}
      accessibilityState={{ selected: editing }}
      style={({ pressed }) => [styles.glyphBox, pressed ? { opacity: PRESS_DIP } : null]}
      testID={testID}
    >
      <Icon size={18} color={editing ? colors.brandText : colors.textMuted} />
    </Pressable>
  );
}

// ── THE ROW'S REMOVE / RESTORE ────────────────────────────────────────

/** The two-tap remove (the receipt-delete grammar): the first tap arms
 * the ✕ into an alert chip, the second — within a breath — removes. */
export function RemoveSlotGlyph({
  name,
  onRemove,
  testID,
}: {
  name: string;
  onRemove: () => void;
  testID?: string;
}) {
  const { colors } = useAppTheme();
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const press = () => {
    if (armed) {
      if (timer.current) clearTimeout(timer.current);
      setArmed(false);
      onRemove();
      return;
    }
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), 2600);
  };
  return (
    <Pressable
      onPress={press}
      accessibilityRole="button"
      accessibilityLabel={armed ? `Tap again to remove ${name}` : `Remove ${name}`}
      style={({ pressed }) => [
        styles.glyphBox,
        armed ? { backgroundColor: colors.alert, borderRadius: 4 } : null,
        pressed ? { opacity: PRESS_DIP } : null,
      ]}
      testID={testID}
    >
      <Text style={[styles.glyph, { color: armed ? colors.background : colors.alert }]}>
        {armed ? '!' : '\u2715'}
      </Text>
    </Pressable>
  );
}

/** The ↺ on a removed row's ghost — clears the slot's edit and the
 * programmed lift walks back in. */
export function RestoreSlotGlyph({
  name,
  onRestore,
  testID,
}: {
  name: string;
  onRestore: () => void;
  testID?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onRestore}
      accessibilityRole="button"
      accessibilityLabel={`Restore ${name}`}
      style={({ pressed }) => [styles.glyphBox, pressed ? { opacity: PRESS_DIP } : null]}
      testID={testID}
    >
      <Text style={[styles.glyph, { color: colors.textMuted }]}>{'\u21BA'}</Text>
    </Pressable>
  );
}

// ── THE WINDOW'S ADD LINE ─────────────────────────────────────────────

/** The + ADD EXERCISE line — edit mode only, closing each window's
 * slot list. */
export function AddExerciseRow({
  onPress,
  testID,
}: {
  onPress: () => void;
  testID?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add an exercise to this session"
      style={({ pressed }) => [styles.addRow, pressed ? { opacity: PRESS_DIP } : null]}
      testID={testID}
    >
      <Plus size={16} color={colors.textMuted} />
      <Text style={[styles.addRowLabel, { color: colors.textSecondary }]}>ADD EXERCISE</Text>
    </Pressable>
  );
}

// ── THE PRESCRIPTION BENCH ────────────────────────────────────────────

export interface RxEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  /** The slot's current prescription (edited or authored). */
  sets: [number, number];
  reps: [number, number];
  /** The authored prescription — the DEFAULT row restores it whole. */
  defaultSets: [number, number];
  defaultReps: [number, number];
  /** Whether a prescription edit is live (the DEFAULT row shows). */
  isEdited: boolean;
  onSave: (sets: [number, number], reps: [number, number]) => void;
  onRestoreDefault: () => void;
  testID?: string;
}

const rxWord = (sets: [number, number], reps: [number, number]): string =>
  `${sets[1] > 0 ? sets[1] : sets[0]}×${reps[0]}–${reps[1]}`;

/** Stepper row: the bound's name left, the value's − / + right. */
function RxBound({
  label,
  value,
  min,
  max,
  onChange,
  testID,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  testID?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[styles.rxBoundRow, { borderBottomColor: colors.mobilePremium.hairlineBorder }]}
    >
      <Text style={[styles.rxBoundLabel, { color: colors.textSecondary }]}>{label}</Text>
      <MobileStepper
        value={value}
        min={min}
        max={max}
        onChange={onChange}
        testID={testID}
      />
    </View>
  );
}

export function RxEditSheet({
  open,
  onOpenChange,
  exerciseName,
  sets: setsProp,
  reps: repsProp,
  defaultSets,
  defaultReps,
  isEdited,
  onSave,
  onRestoreDefault,
  testID,
}: RxEditSheetProps) {
  const { colors } = useAppTheme();
  const [sets, setSets] = useState<[number, number]>(setsProp);
  const [reps, setReps] = useState<[number, number]>(repsProp);
  // Re-sync the draft each time the bench opens (possibly for a
  // different slot) — the props are the resolved truth at open time.
  useEffect(() => {
    if (open) {
      setSets(setsProp);
      setReps(repsProp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exerciseName]);

  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      showHandle={false}
      showCloseButton={false}
      testID={testID}
    >
      <View style={[styles.plate, { backgroundColor: colors.card }]}>
        <Text style={[styles.plateEyebrow, { color: colors.textMuted }]}>THE PRESCRIPTION</Text>
        <Text numberOfLines={1} style={[styles.sheetName, { color: colors.text }]}>
          {exerciseName}
        </Text>
        <View style={styles.list}>
          <RxBound
            label="SETS FROM"
            value={sets[0]}
            min={1}
            max={9}
            onChange={(v) => setSets([v, Math.max(v, sets[1])])}
            testID={testID ? `${testID}-sets-min` : undefined}
          />
          <RxBound
            label="SETS TO"
            value={sets[1]}
            min={1}
            max={9}
            onChange={(v) => setSets([Math.min(sets[0], v), v])}
            testID={testID ? `${testID}-sets-max` : undefined}
          />
          <RxBound
            label="REPS FROM"
            value={reps[0]}
            min={1}
            max={40}
            onChange={(v) => setReps([v, Math.max(v, reps[1])])}
            testID={testID ? `${testID}-reps-min` : undefined}
          />
          <RxBound
            label="REPS TO"
            value={reps[1]}
            min={1}
            max={40}
            onChange={(v) => setReps([Math.min(reps[0], v), v])}
            testID={testID ? `${testID}-reps-max` : undefined}
          />
        </View>
        {isEdited ? (
          <Pressable
            onPress={() => {
              onOpenChange(false);
              onRestoreDefault();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Back to the default — ${rxWord(defaultSets, defaultReps)}`}
            style={({ pressed }) => [styles.defaultRow, pressed ? { opacity: PRESS_DIP } : null]}
            testID={testID ? `${testID}-default` : undefined}
          >
            <Text style={[styles.defaultGlyph, { color: colors.textMuted }]}>{'\u21BA'}</Text>
            <Text style={[styles.defaultWord, { color: colors.textMuted }]}>DEFAULT</Text>
            <Text style={[styles.defaultRx, { color: colors.textSecondary }]}>
              {rxWord(defaultSets, defaultReps)}
            </Text>
          </Pressable>
        ) : null}
        <MobilePrimaryButton
          onPress={() => {
            onSave(sets, reps);
            onOpenChange(false);
          }}
          testID={testID ? `${testID}-save` : undefined}
        >
          {`SAVE ${rxWord(sets, reps)}`}
        </MobilePrimaryButton>
      </View>
    </MobileSheet>
  );
}

// ── THE CATALOG PICKER (adds) ─────────────────────────────────────────

export interface AddExerciseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Slugs already in the session — the picker excludes them. */
  excludeSlugs: ReadonlySet<string>;
  onPick: (slug: string, name: string) => void;
  testID?: string;
}

const PICKER_ROW_CAP = 40;

export function AddExerciseSheet({
  open,
  onOpenChange,
  excludeSlugs,
  onPick,
  testID,
}: AddExerciseSheetProps) {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SYSTEM_EXERCISES.filter((e) => !excludeSlugs.has(e.slug)).filter(
      (e) => !q || e.name.toLowerCase().includes(q),
    );
  }, [query, excludeSlugs]);

  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      showHandle={false}
      showCloseButton={false}
      testID={testID}
    >
      <View style={[styles.plate, { backgroundColor: colors.card }]}>
        <Text style={[styles.plateEyebrow, { color: colors.textMuted }]}>ADD EXERCISE</Text>
        <View style={styles.searchHold}>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Search the catalog"
            autoFocus
            testID={testID ? `${testID}-search` : undefined}
          />
        </View>
        <View style={styles.list}>
          {rows.slice(0, PICKER_ROW_CAP).map((e, i) => (
            <Pressable
              key={e.slug}
              onPress={() => {
                onOpenChange(false);
                onPick(e.slug, e.name);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Add ${e.name}`}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.mobilePremium.hairlineBorder },
                i === Math.min(rows.length, PICKER_ROW_CAP) - 1
                  ? { borderBottomWidth: 0 }
                  : null,
                pressed ? { opacity: PRESS_DIP } : null,
              ]}
              testID={testID ? `${testID}-pick-${e.slug}` : undefined}
            >
              <View
                style={[styles.zoneTick, { backgroundColor: colors.meter[zoneStepFor(e.slug)] }]}
              />
              <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
                {e.name}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {(e.modality ?? 'machine').toUpperCase()}
              </Text>
            </Pressable>
          ))}
          {rows.length === 0 ? (
            <Text style={[styles.emptyNote, { color: colors.textMuted }]}>
              Nothing in the catalog matches.
            </Text>
          ) : null}
          {rows.length > PICKER_ROW_CAP ? (
            <Text style={[styles.emptyNote, { color: colors.textMuted }]}>
              {`Narrow the search — ${rows.length - PICKER_ROW_CAP} more hidden.`}
            </Text>
          ) : null}
        </View>
      </View>
    </MobileSheet>
  );
}

// ── THE STYLES (the bench's own plate grammar — InkRail's kin) ────────

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
  addRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addRowLabel: {
    ...theme.typography.mobileEyebrow,
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
  sheetName: {
    ...theme.typography.mobileItemTitle,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  searchHold: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  list: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
  },
  zoneTick: {
    width: 3,
    height: 26,
    borderRadius: 1,
  },
  name: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  meta: {
    ...theme.typography.mobileEyebrow,
  },
  emptyNote: {
    ...theme.typography.mobileTag,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  rxBoundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  rxBoundLabel: {
    ...theme.typography.mobileEyebrow,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  defaultGlyph: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
  },
  defaultWord: {
    ...theme.typography.mobileEyebrow,
  },
  defaultRx: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
});
