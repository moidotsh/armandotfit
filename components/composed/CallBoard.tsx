// components/composed/CallBoard.tsx
//
// THE CALL BOARD — the Floor's docked instrument and the app's fastest
// surface (docs/architecture/broadsheet-thesis.md §7). The armed set
// rides pre-armed at carry-forward weight as ONE box-score line —
// `100 KG × 10 REPS`, agate at counter scale — so the most common log
// in existence (same weight, same reps as the last set) costs ONE
// THUMB, ONE TAP on LOG SET. Corrections are ± steppers (44px) under
// each side; tapping a numeral opens a numeric keyboard for large
// jumps. An unset value renders as a ruled blank line — the blank line
// in the box score, never a glyph at call scale.
//
// The board follows the mode (paper or evening — the register
// difference is density and scale, not a second palette): a tint-step
// surface + top hairline, no shadow. It never scrolls away and is
// tappable at frame 1 (the lockup animation never gates input).
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

export interface CallBoardProps {
  /** The next set's ordinal (logged sets + 1) — display only. */
  setNumber: number;
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

/** One side of the call: the numeral (tap to edit) + its stepper row. */
function CallSide({
  label,
  value,
  step,
  stepLabel,
  onChange,
  align,
  testID,
}: {
  label: string;
  value: number | null;
  step: number;
  stepLabel: string;
  onChange: (next: number | null) => void;
  align: 'left' | 'right';
  testID: string;
}) {
  const { colors } = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');

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
    <View style={align === 'left' ? styles.sideLeft : styles.sideRight}>
      {editing ? (
        <TextInput
          value={draftText}
          onChangeText={setDraftText}
          onSubmitEditing={() => {
            onChange(parseNumber(draftText));
            setEditing(false);
          }}
          onBlur={() => {
            onChange(parseNumber(draftText));
            setEditing(false);
          }}
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
          accessibilityLabel={`Edit ${label}, currently ${value == null ? 'not set' : value}`}
          style={styles.counterTap}
          testID={`${testID}-tap`}
        >
          {value == null ? (
            // The blank line in the box score: a ruled field awaiting
            // its figure — NOT a glyph at call scale (a 56px em-dash
            // reads as a broken loading bar).
            <View style={styles.counterEmpty} testID={`${testID}-empty`}>
              <View
                style={[
                  styles.counterEmptyRule,
                  { backgroundColor: colors.mobilePremium.hairlineBorderStrong },
                ]}
              />
            </View>
          ) : (
            <Text style={[styles.counterText, { color: colors.text }]} selectable>
              {String(value)}
            </Text>
          )}
        </Pressable>
      )}
      <View style={styles.stepperRow}>
        {stepButton(-1, '−', 'dec')}
        <Text style={[styles.stepperStep, { color: colors.textMuted }]}>{stepLabel}</Text>
        {stepButton(1, '+', 'inc')}
      </View>
      <Text style={[styles.unitLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export function CallBoard({
  setNumber,
  weight,
  reps,
  repsHint = null,
  onLog,
  onChangeWeight,
  onChangeReps,
  testID,
}: CallBoardProps) {
  const { colors } = useAppTheme();
  const ready = weight != null && reps != null;
  const tid = testID ?? 'call-board';

  return (
    <View
      testID={testID}
      style={[styles.board, { backgroundColor: colors.card, borderTopColor: colors.mobilePremium.hairlineBorder }]}
      accessibilityLabel={`Call board, set ${setNumber}: ${weight ?? 'no weight'} kilograms by ${reps ?? 'no reps'} reps`}
    >
      {/* The kicker — the set ordinal carries the record red (the
          next position is the Floor's one red mark beside the verb). */}
      <View style={styles.kickerRow}>
        <Text style={[styles.kicker, { color: colors.textMuted }]}>
          SET{' '}
          <Text style={{ color: colors.brandText }}>
            {String(setNumber).padStart(2, '0')}
          </Text>
          {repsHint ? ` · TGT ${repsHint}` : ''}
        </Text>
      </View>

      {/* THE CALL — one box-score line, both numerals at counter
          scale with the × between. */}
      <View style={styles.callRow}>
        <CallSide
          label="KG"
          value={weight}
          step={2.5}
          stepLabel="2.5"
          onChange={onChangeWeight}
          align="left"
          testID={`${tid}-weight`}
        />
        <Text style={[styles.multiplier, { color: colors.textSecondary }]}>×</Text>
        <CallSide
          label="REPS"
          value={reps}
          step={1}
          stepLabel="1"
          onChange={onChangeReps}
          align="right"
          testID={`${tid}-reps`}
        />
      </View>

      <Pressable
        onPress={onLog}
        accessibilityRole="button"
        accessibilityLabel={ready ? `Log set, ${weight} kilograms, ${reps} reps` : 'Log set'}
        style={({ pressed }) => [
          styles.logButton,
          { backgroundColor: colors.buttonBackground },
          pressed ? { opacity: 0.85 } : null,
        ]}
        testID={`${tid}-log`}
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
    paddingTop: 8,
    paddingBottom: 10,
  },
  kickerRow: {
    minHeight: 20,
    justifyContent: 'center',
  },
  kicker: {
    ...theme.typography.mobileEyebrow,
    fontSize: 10,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 12,
    minHeight: 56,
    marginTop: 2,
  },
  sideLeft: {
    alignItems: 'flex-end',
    flex: 1,
  },
  sideRight: {
    alignItems: 'flex-start',
    flex: 1,
  },
  counterTap: {
    minHeight: 60,
    minWidth: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterEmpty: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  counterEmptyRule: {
    width: 88,
    height: 2,
  },
  counterText: {
    ...theme.typography.mobileCounter,
  },
  multiplier: {
    ...theme.typography.mobileFigure,
    fontSize: 22,
    lineHeight: 26,
    marginTop: 15,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
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
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 26,
  },
  stepperStep: {
    ...theme.typography.mobileEyebrow,
    fontSize: 10,
    minWidth: 24,
    textAlign: 'center',
  },
  unitLabel: {
    ...theme.typography.mobileEyebrow,
    fontSize: 10,
    marginTop: 4,
  },
  logButton: {
    height: 56,
    borderRadius: theme.shapes.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logLabel: {
    ...theme.typography.mobileAction,
    letterSpacing: 1.2,
  },
});

export default CallBoard;
