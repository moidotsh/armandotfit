// components/composed/EditableSetRow.tsx
// Editable set row for the live-draft workout view. Same visual rhythm
// as the read-only SetRow (set# · content · status), but the content
// holds two compact numeric TextInputs + a completion toggle + a
// remove affordance. Reads colors exclusively from useAppTheme() — no
// hardcoded hex (S7).
//
// Numeric parsing: empty string → null (load-bearing — Number('') is 0,
// which would false-positive as "0 lbs"). NaN also falls back to null.
// The completion toggle has no validation gating by design — the user
// can mark a set complete with null weight/reps; the save-time DTO
// accepts nulls and so does the DB schema.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../../context';

export interface EditableSetRowProps {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  /** Shown as placeholder hint inside the reps input, e.g. "8-12". */
  repRange?: string | null;
  onChangeWeight: (weight: number | null) => void;
  onChangeReps: (reps: number | null) => void;
  onToggleComplete: () => void;
  onRemove: () => void;
}

function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function EditableSetRow({
  setNumber,
  weight,
  reps,
  completed,
  repRange,
  onChangeWeight,
  onChangeReps,
  onToggleComplete,
  onRemove,
}: EditableSetRowProps) {
  const { colors } = useAppTheme();
  // Local string state mirrors the incoming numeric values so the
  // input can hold "100|" while typing without round-tripping through
  // the store on every keystroke. The store is updated on every
  // change, but the local value is the source of truth for the
  // rendered text — keeps the cursor stable across re-renders.
  const [weightText, setWeightText] = useState(weight == null ? '' : String(weight));
  const [repsText, setRepsText] = useState(reps == null ? '' : String(reps));

  // If the upstream value changes (e.g. add-set appended, renumber),
  // keep the local text in sync unless the user is actively editing.
  // Simplest robust strategy: when the numeric value parsed from local
  // text drifts from the upstream prop, resync. This covers external
  // resets without clobbering "100|" mid-type (which parses to 100
  // either way).
  if (parseNumber(weightText) !== weight) {
    const next = weight == null ? '' : String(weight);
    if (next !== weightText) setWeightText(next);
  }
  if (parseNumber(repsText) !== reps) {
    const next = reps == null ? '' : String(reps);
    if (next !== repsText) setRepsText(next);
  }

  const inputBorderColor = colors.glass.emptyInputBorder;
  const inputBg = colors.glass.inputBackground;

  return (
    <View style={styles.row}>
      <Text style={[styles.setNumber, { color: colors.textSecondary }]}>
        {setNumber}
      </Text>

      <TextInput
        style={[
          styles.input,
          { borderColor: inputBorderColor, backgroundColor: inputBg, color: colors.text },
        ]}
        value={weightText}
        onChangeText={(t) => {
          setWeightText(t);
          onChangeWeight(parseNumber(t));
        }}
        placeholder="–"
        placeholderTextColor={colors.textColors.tertiary}
        keyboardType="numeric"
        returnKeyType="done"
        maxLength={6}
        accessibilityLabel={`Set ${setNumber} weight`}
      />

      <Text style={[styles.times, { color: colors.textSecondary }]}>×</Text>

      <TextInput
        style={[
          styles.input,
          styles.repsInput,
          { borderColor: inputBorderColor, backgroundColor: inputBg, color: colors.text },
        ]}
        value={repsText}
        onChangeText={(t) => {
          setRepsText(t);
          onChangeReps(parseNumber(t));
        }}
        placeholder={repRange ?? '–'}
        placeholderTextColor={colors.textColors.tertiary}
        keyboardType="numeric"
        returnKeyType="done"
        maxLength={6}
        accessibilityLabel={`Set ${setNumber} reps`}
      />

      <Pressable
        onPress={onToggleComplete}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={completed ? `Mark set ${setNumber} incomplete` : `Mark set ${setNumber} complete`}
      >
        <Text
          style={[
            styles.toggle,
            { color: completed ? colors.brand : colors.textSecondary },
          ]}
        >
          {completed ? '✓' : '○'}
        </Text>
      </Pressable>

      <Pressable
        onPress={onRemove}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Remove set ${setNumber}`}
      >
        <Text style={[styles.remove, { color: colors.textSecondary }]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  setNumber: { fontSize: 12, fontWeight: '600', minWidth: 18 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '500',
    minWidth: 64,
    textAlign: 'center',
  },
  repsInput: {
    minWidth: 56,
  },
  times: { fontSize: 13, fontWeight: '500' },
  toggle: { fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  remove: { fontSize: 14, fontWeight: '600', minWidth: 24, textAlign: 'center' },
});

export default EditableSetRow;
