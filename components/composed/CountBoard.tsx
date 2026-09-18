// components/composed/CountBoard.tsx
//
// THE COUNT BOARD — the stage's docked instrument and the app's fastest
// surface (docs/architecture/count-thesis.md §7). The exercise's sets
// render as LARGE tallies (struck done / the orange next / ghost
// target slots); the next set rides pre-armed at carry-forward weight
// in mono counter digits — the most common log in existence (same
// weight, same reps as the last set) costs ONE THUMB, ONE TAP on LOG
// SET, and the tap strikes the mark. Corrections are ± steppers (44×56,
// the biggest targets in the app) beside numerals big enough to read
// at arm's length through glare; tapping a numeral opens a numeric
// keyboard for large jumps.
//
// The board follows the mode (chalk or iron — the register difference
// is density and scale, not a second color scheme): a tint-step
// surface + top hairline, no shadow. It never scrolls away and is
// tappable at frame 1 (the strike animation never gates input).
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
import { TallyStrip } from '../MobilePremium';
import { useReducedMotion } from '../premium/shared';

export interface CountBoardProps {
  /** The next set's ordinal (logged sets + 1) — display only. */
  setNumber: number;
  /** Logged sets for this exercise — the struck marks. */
  struck: number;
  /** Programmed set ceiling (Rx max) — the ghost slots. Null = no target. */
  targetSets?: number | null;
  weight: number | null;
  reps: number | null;
  /** Programmed rep-range hint ("8–10") — display only. */
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

/** One full-width counter row: − NUMERAL + — the biggest target in the app. */
function CounterRow({
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

  const stepButton = (dir: 1 | -1, glyph: string, id: string) => (
    <Pressable
      onPress={() => bump(dir)}
      accessibilityRole="button"
      accessibilityLabel={`${dir > 0 ? 'Increase' : 'Decrease'} ${label} by ${stepLabel}`}
      style={({ pressed }) => [
        styles.stepper,
        {
          backgroundColor: colors.backgroundAlt,
          borderColor: colors.mobilePremium.hairlineBorderStrong,
        },
        pressed ? { opacity: 0.6 } : null,
      ]}
      testID={`${testID}-${id}`}
    >
      <Text style={[styles.stepperGlyph, { color: colors.text }]}>{glyph}</Text>
    </Pressable>
  );

  return (
    <View style={styles.counterRow}>
      {stepButton(-1, '−', 'dec')}
      <View style={styles.counterValueSlot}>
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
            style={[styles.counterText, { color: colors.text, outlineWidth: 0 }]}
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
            style={styles.counterTap}
            testID={`${testID}-tap`}
          >
            {value == null ? (
              // Empty counter = a ruled field awaiting its figure (an
              // underline on paper), NOT a glyph at counter scale — a
              // 56px em-dash reads as a broken loading bar.
              <View style={styles.counterEmpty} testID={`${testID}-empty`}>
                <View
                  style={[
                    styles.counterEmptyRule,
                    { backgroundColor: colors.mobilePremium.hairlineBorderStrong },
                  ]}
                />
              </View>
            ) : (
              <Text style={[styles.counterText, { color: colors.text }]}>
                {display}
              </Text>
            )}
            <Text style={[styles.counterUnit, { color: colors.textMuted }]}>{label}</Text>
          </Pressable>
        )}
      </View>
      {stepButton(1, '+', 'inc')}
    </View>
  );
}

export function CountBoard({
  setNumber,
  struck,
  targetSets = null,
  weight,
  reps,
  repsHint = null,
  onLog,
  onChangeWeight,
  onChangeReps,
  testID,
}: CountBoardProps) {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const ready = weight != null && reps != null;
  const ghost = targetSets != null ? Math.max(0, targetSets - struck - 1) : 0;

  return (
    <View
      testID={testID}
      style={[styles.board, { backgroundColor: colors.card, borderTopColor: colors.mobilePremium.hairlineBorder }]}
      accessibilityLabel={`Count board, set ${setNumber}: ${weight ?? 'no weight'} kilograms by ${reps ?? 'no reps'} reps`}
    >
      {/* The measure — this exercise's sets as marks. The strike
          animates the newest mark in (scaleY, 120ms; static under
          reduced motion) and never gates the LOG tap. */}
      <View style={styles.measureRow}>
        <TallyStrip
          struck={struck}
          next
          ghost={ghost}
          size="lg"
          animateLastStrike={!reduced}
          testID={`${testID ?? 'count-board'}-tally`}
        />
        <View style={styles.measureSide}>
          <Text style={[styles.measureLabel, { color: colors.textMuted }]}>
            {`SET ${String(setNumber).padStart(2, '0')}`}
          </Text>
          {repsHint ? (
            <Text style={[styles.measureLabel, { color: colors.textMuted }]}>
              {`TGT ${repsHint}`}
            </Text>
          ) : null}
        </View>
      </View>

      <CounterRow
        label="KG"
        value={weight}
        step={2.5}
        stepLabel="2.5"
        placeholder="—"
        onChange={onChangeWeight}
        testID={`${testID ?? 'count-board'}-weight`}
      />
      <CounterRow
        label="REPS"
        value={reps}
        step={1}
        stepLabel="1"
        placeholder="—"
        onChange={onChangeReps}
        testID={`${testID ?? 'count-board'}-reps`}
      />

      <Pressable
        onPress={onLog}
        accessibilityRole="button"
        accessibilityLabel={ready ? `Log set, ${weight} kilograms, ${reps} reps` : 'Log set'}
        style={({ pressed }) => [
          styles.logButton,
          { backgroundColor: colors.buttonBackground },
          pressed ? { opacity: 0.85 } : null,
        ]}
        testID={`${testID ?? 'count-board'}-log`}
      >
        <Text style={[styles.logLabel, { color: colors.textOnBrand }]}>LOG SET</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 44,
  },
  measureSide: {
    alignItems: 'flex-end',
    gap: 2,
    paddingBottom: 2,
  },
  measureLabel: {
    ...theme.typography.mobileEyebrow,
    fontSize: 10,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  stepper: {
    width: 44,
    height: 56,
    borderRadius: theme.shapes.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlyph: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 26,
  },
  counterValueSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  counterTap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  counterEmpty: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  counterEmptyRule: {
    width: 72,
    height: 2,
  },
  counterText: {
    ...theme.typography.mobileCounter,
  },
  counterUnit: {
    ...theme.typography.mobileEyebrow,
    fontSize: 10,
    paddingBottom: 8,
  },
  logButton: {
    height: 56,
    borderRadius: theme.shapes.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  logLabel: {
    ...theme.typography.mobileAction,
    letterSpacing: 1.2,
  },
});

export default CountBoard;
