// components/composed/ArmedSet.tsx
//
// THE ARMED SET — the stage's docked action slab and the app's fastest
// surface (docs/architecture/signal-thesis.md §1). The next set rides
// pre-armed at carry-forward weight: the most common log in existence
// (same weight, same reps as the last set) costs ONE THUMB, ONE TAP on
// LOG. Corrections are ± steppers beside numerals big enough to read
// at arm's length through glare; tapping a numeral opens a numeric
// keyboard input for large jumps.
//
// The slab is the one surface in the system that casts a shadow — it
// docks over the ledger and earns the lift. It never scrolls away and
// it is tappable at frame 1 (entrance motion never gates input).
//
// Inputs parse to number|null (empty string → null — Number('') is 0,
// which would false-positive as "0 kg").

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';

export interface ArmedSetProps {
  /** The next set's ordinal (logged sets + 1) — display only. */
  setNumber: number;
  weight: number | null;
  reps: number | null;
  /** Programmed rep-range hint ("8–10") — placeholder only. */
  repsHint?: string | null;
  onLog: () => void;
  onChangeWeight: (weight: number | null) => void;
  onChangeReps: (reps: number | null) => void;
  testID?: string;
}

function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** One editable numeral block: label, big value (tap → keyboard), ± row. */
function ValueBlock({
  label,
  value,
  step,
  stepLabel,
  placeholder,
  onChange,
  testID,
}: {
  label: string;
  value: number | null;
  step: number;
  stepLabel: string;
  placeholder: string;
  onChange: (next: number | null) => void;
  testID: string;
}) {
  const { colors } = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');

  const display = value == null ? placeholder : String(value);

  const commit = () => {
    onChange(parseNumber(draftText));
    setEditing(false);
  };

  const bump = (dir: 1 | -1) => {
    const base = value ?? 0;
    const next = Math.round((base + dir * step) * 100) / 100;
    onChange(next <= 0 ? null : next);
  };

  return (
    <View style={styles.valueBlock}>
      <Text style={[styles.valueLabel, { color: colors.focus.muted }]}>
        {label}
      </Text>
      {editing ? (
        <TextInput
          value={draftText}
          onChangeText={setDraftText}
          onSubmitEditing={commit}
          onBlur={commit}
          keyboardType="number-pad"
          autoFocus
          selectTextOnFocus
          accessibilityLabel={`${label} input`}
          style={[styles.valueText, { color: colors.focus.signal }]}
          testID={`${testID}-input`}
        />
      ) : (
        <Pressable
          onPress={() => {
            setDraftText(value == null ? '' : String(value));
            setEditing(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${label}, currently ${display}`}
          style={styles.valueTap}
          testID={`${testID}-tap`}
        >
          <Text
            style={[
              styles.valueText,
              { color: value == null ? colors.focus.muted : colors.focus.text },
            ]}
          >
            {display}
          </Text>
        </Pressable>
      )}
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => bump(-1)}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label} by ${stepLabel}`}
          style={({ pressed }) => [
            styles.stepper,
            { backgroundColor: colors.focus.surface, borderColor: colors.focus.border },
            pressed ? { opacity: 0.6 } : null,
          ]}
          testID={`${testID}-dec`}
        >
          <Text style={[styles.stepperGlyph, { color: colors.focus.text }]}>−</Text>
        </Pressable>
        <Text style={[styles.stepperStep, { color: colors.focus.muted }]}>
          {stepLabel}
        </Text>
        <Pressable
          onPress={() => bump(1)}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label} by ${stepLabel}`}
          style={({ pressed }) => [
            styles.stepper,
            { backgroundColor: colors.focus.surface, borderColor: colors.focus.border },
            pressed ? { opacity: 0.6 } : null,
          ]}
          testID={`${testID}-inc`}
        >
          <Text style={[styles.stepperGlyph, { color: colors.focus.text }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ArmedSet({
  setNumber,
  weight,
  reps,
  repsHint = null,
  onLog,
  onChangeWeight,
  onChangeReps,
  testID,
}: ArmedSetProps) {
  const { colors } = useAppTheme();
  const ready = weight != null && reps != null;

  return (
    <View
      testID={testID}
      style={[styles.slab, { backgroundColor: colors.focus.surface }]}
      accessibilityLabel={`Armed set ${setNumber}: ${weight ?? 'no weight'} kilograms by ${reps ?? 'no reps'} reps`}
    >
      <View style={styles.headRow}>
        <Text style={[styles.headLabel, { color: colors.focus.muted }]}>
          {`NEXT SET · ${String(setNumber).padStart(2, '0')}`}
        </Text>
        {repsHint ? (
          <Text style={[styles.headHint, { color: colors.focus.muted }]}>
            {`TARGET ${repsHint}`}
          </Text>
        ) : null}
      </View>
      <View style={styles.valuesRow}>
        <ValueBlock
          label="WEIGHT · KG"
          value={weight}
          step={2.5}
          stepLabel="2.5"
          placeholder="—"
          onChange={onChangeWeight}
          testID={`${testID ?? 'armed-set'}-weight`}
        />
        <Text style={[styles.multiplier, { color: colors.focus.muted }]}>×</Text>
        <ValueBlock
          label="REPS"
          value={reps}
          step={1}
          stepLabel="1"
          placeholder="—"
          onChange={onChangeReps}
          testID={`${testID ?? 'armed-set'}-reps`}
        />
      </View>
      <Pressable
        onPress={onLog}
        accessibilityRole="button"
        accessibilityLabel={ready ? `Log set, ${weight} kilograms, ${reps} reps` : 'Log set'}
        style={({ pressed }) => [
          styles.logButton,
          { backgroundColor: colors.focus.signal },
          pressed ? { opacity: 0.85, transform: [{ scale: 0.99 }] } : null,
        ]}
        testID={`${testID ?? 'armed-set'}-log`}
      >
        <Text style={[styles.logLabel, { color: colors.focus.onSignal }]}>LOG SET</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slab: {
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headLabel: {
    ...theme.typography.mobileEyebrow,
  },
  headHint: {
    ...theme.typography.mobileEyebrow,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  valueBlock: {
    flex: 1,
  },
  valueLabel: {
    ...theme.typography.mobileEyebrow,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
  },
  valueTap: {
    minHeight: 56,
    justifyContent: 'center',
  },
  valueText: {
    ...theme.typography.mobileDisplay,
    fontSize: 48,
    lineHeight: 52,
  },
  multiplier: {
    ...theme.typography.mobileDisplay,
    fontSize: 28,
    lineHeight: 52,
    paddingBottom: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    justifyContent: 'center',
  },
  stepper: {
    width: 44,
    height: 44,
    borderRadius: theme.shapes.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlyph: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  stepperStep: {
    ...theme.typography.mobileTag,
    fontSize: 11,
    minWidth: 26,
    textAlign: 'center',
  },
  logButton: {
    height: 56,
    borderRadius: theme.shapes.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  logLabel: {
    ...theme.typography.mobileAction,
    letterSpacing: 1.2,
  },
});

export default ArmedSet;
