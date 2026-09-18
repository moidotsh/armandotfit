// components/composed/EditableSetRow.tsx
// Editable set row for the live-draft view. Two compact numeric inputs
// (weight × reps) + a remove affordance. No completion toggle — a set is
// logged when it's done; the row existing in the draft means it happened.
//
// Numeric parsing: empty string → null (load-bearing — Number('') is 0,
// which would false-positive as "0 lbs"). NaN also falls back to null.
// Sets with null reps or weight are dropped at save time.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../../context';

export interface EditableSetRowProps {
  position: number;
  weight: number | null;
  reps: number | null;
  /** Programmed rep-range hint, e.g. "8-10" — placeholder only. */
  repsHint?: string | null;
  onChangeWeight: (weight: number | null) => void;
  onChangeReps: (reps: number | null) => void;
  onRemove: () => void;
}

function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function EditableSetRow({
  position,
  weight,
  reps,
  repsHint,
  onChangeWeight,
  onChangeReps,
  onRemove,
}: EditableSetRowProps) {
  const { colors } = useAppTheme();
  // A filled set is a done set — the index takes the ink mark.
  const filled = weight !== null && reps !== null;
  // Local string state mirrors the incoming numeric values so the
  // input can hold "100|" while typing without round-tripping through
  // the store on every keystroke.
  const [weightText, setWeightText] = useState(weight == null ? '' : String(weight));
  const [repsText, setRepsText] = useState(reps == null ? '' : String(reps));

  // Resync when the upstream numeric value drifts from the local text
  // (external resets, renumbering) without clobbering mid-type states.
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
      <Text
        style={[
          styles.setPosition,
          { color: filled ? colors.brand : colors.textSecondary },
        ]}
      >
        {filled ? '✓' : position}
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
        accessibilityLabel={`Set ${position} weight`}
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
        placeholder={repsHint ?? '–'}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        returnKeyType="done"
        maxLength={6}
        accessibilityLabel={`Set ${position} reps`}
      />

      <Pressable
        onPress={onRemove}
        hitSlop={{ top: 14, bottom: 14, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={`Remove set ${position}`}
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
  setPosition: { fontSize: 12, fontWeight: '600', minWidth: 18, fontVariant: ['tabular-nums'] },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '500',
    minWidth: 64,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  repsInput: {
    minWidth: 56,
  },
  times: { fontSize: 13, fontWeight: '500' },
  remove: { fontSize: 14, fontWeight: '600', minWidth: 24, textAlign: 'center' },
});

export default EditableSetRow;
