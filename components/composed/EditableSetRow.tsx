// components/composed/EditableSetRow.tsx
// Editable set row for the live-draft view — the row a lifter hits
// mid-set, so it's sized for gloves and glare: 48px inputs, mono 17/600
// figures, the position index carrying the done mark (a filled set is a
// done set — no completion toggle; the row existing in the draft means
// it happened).
//
// Numeric parsing: empty string → null (load-bearing — Number('') is 0,
// which would false-positive as "0 lbs"). NaN also falls back to null.
// Sets with null reps or weight are dropped at save time.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';

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

// Control rhythm (the kit-chrome precedent): mono figures at 17/600 so
// the numbers read at arm's length without reading as content titles.
const INPUT_TEXT: TextStyle = {
  fontSize: 17,
  fontWeight: '600',
  lineHeight: 22,
  fontFamily: theme.fonts.mono,
  fontVariant: ['tabular-nums'],
};

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

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.setPosition,
          { color: filled ? colors.brand : colors.textColors.tertiary },
        ]}
      >
        {filled ? '✓' : String(position)}
      </Text>

      <TextInput
        style={[
          styles.input,
          { borderColor: filled ? colors.brandSoft : colors.glass.emptyInputBorder, backgroundColor: colors.glass.inputBackground, color: colors.text },
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

      <Text style={[styles.times, { color: colors.textMuted }]}>×</Text>

      <TextInput
        style={[
          styles.input,
          styles.repsInput,
          { borderColor: filled ? colors.brandSoft : colors.glass.emptyInputBorder, backgroundColor: colors.glass.inputBackground, color: colors.text },
        ]}
        value={repsText}
        onChangeText={(t) => {
          setRepsText(t);
          onChangeReps(parseNumber(t));
        }}
        placeholder={repsHint ?? '–'}
        placeholderTextColor={colors.textColors.tertiary}
        keyboardType="numeric"
        returnKeyType="done"
        maxLength={6}
        accessibilityLabel={`Set ${position} reps`}
      />

      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove set ${position}`}
        style={styles.removeBox}
      >
        <Text style={[styles.remove, { color: colors.textMuted }]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  setPosition: {
    ...theme.typography.mobileLedger,
    minWidth: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: theme.shapes.control,
    minHeight: 48,
    paddingVertical: 8,
    paddingHorizontal: 10,
    ...INPUT_TEXT,
    minWidth: 84,
    textAlign: 'center',
  },
  repsInput: {
    minWidth: 72,
  },
  times: {
    ...theme.typography.mobileLedger,
  },
  removeBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remove: {
    ...theme.typography.mobileItemTitle,
    fontWeight: '400',
  },
});

export default EditableSetRow;
