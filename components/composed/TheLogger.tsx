// components/composed/TheLogger.tsx
//
// THE LOGGER — the Floor's docked instrument and the app's fastest
// surface (docs/architecture/board-thesis.md §7, the flagship). The
// armed set rides pre-armed at carry-forward weight and reads as the
// gym's own figures: the WEIGHT DRAWS as a plate stack (you see two
// reds and a green — you do not read "100"), the REPS speak as Spline
// digits at counter scale, and the exact weight digit rides under the
// stack for the audit glance. The most common log in existence (same
// weight, same reps as the last set) costs ONE THUMB, ONE TAP on LOG
// SET. Corrections are ± steppers (44px) under each side; tapping a
// figure opens a numeric keyboard for large jumps.
//
// The board is flat everywhere EXCEPT here: the logger carries the
// system's one shadow (mobilePremium.instrumentShadow) — the app's
// single physical object, sitting ON the board. It never scrolls
// away and is tappable at frame 1.
//
// M2 — THE SLIDE: a stepper change re-mounts the stack through a
// 90ms fade+slide (keyed on the slab count) — post-interactive,
// never gating the LOG tap. Inputs parse to number|null (empty
// string → null — Number('') is 0, which would false-positive as
// "0 kg").

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppTheme } from '../../context';
import { theme, decomposeLoad } from '../../constants';
import { FadeIn } from '../premium/shared';
import { PlateStack } from './PlateStack';

export interface TheLoggerProps {
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

/** One stepper button — 44×44 measured. */
function StepButton({
  dir,
  label,
  onPress,
  testID,
}: {
  dir: 1 | -1;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.stepper,
        {
          backgroundColor: colors.backgroundAlt,
          borderColor: colors.mobilePremium.hairlineBorderStrong,
        },
        pressed ? { opacity: 0.6 } : null,
      ]}
      testID={testID}
    >
      <Text style={[styles.stepperGlyph, { color: colors.text }]}>
        {dir > 0 ? '+' : '−'}
      </Text>
    </Pressable>
  );
}

/** The weight side: the drawn stack, the audit digit, the steppers. */
function WeightSide({
  weight,
  step,
  stepLabel,
  onChange,
  testID,
}: {
  weight: number | null;
  step: number;
  stepLabel: string;
  onChange: (next: number | null) => void;
  testID: string;
}) {
  const { colors } = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');

  const bump = (dir: 1 | -1) => {
    const base = weight ?? 0;
    const next = Math.round((base + dir * step) * 100) / 100;
    onChange(next <= 0 ? null : next);
  };

  const digit = weight == null ? '—' : String(weight);

  return (
    <View style={styles.weightSide}>
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
          accessibilityLabel="Weight input"
          style={[styles.weightInput, { color: colors.text, outlineWidth: 0 }]}
          testID={`${testID}-input`}
        />
      ) : (
        <Pressable
          onPress={() => {
            setDraftText(weight == null ? '' : String(weight));
            setEditing(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Edit weight, currently ${weight == null ? 'not set' : `${weight} kilograms`}`}
          style={styles.stackTap}
          testID={`${testID}-tap`}
        >
          {/* M2 — the slide: keyed on the slab count so a stepper
              change re-mounts the stack with a 90ms settle. */}
          <FadeIn key={decomposeLoad(weight ?? 0).length} duration={90} y={6}>
            <PlateStack kg={weight} scale="counter" testID={`${testID}-stack`} />
          </FadeIn>
          <Text style={[styles.weightDigit, { color: colors.textMuted }]}>
            {digit}
          </Text>
        </Pressable>
      )}
      <View style={styles.stepperRow}>
        <StepButton
          dir={-1}
          label={`Decrease weight by ${stepLabel}`}
          onPress={() => bump(-1)}
          testID={`${testID}-dec`}
        />
        <Text style={[styles.stepperStep, { color: colors.textMuted }]}>{stepLabel}</Text>
        <StepButton
          dir={1}
          label={`Increase weight by ${stepLabel}`}
          onPress={() => bump(1)}
          testID={`${testID}-inc`}
        />
      </View>
    </View>
  );
}

/** The reps side: the Spline digits at counter scale + steppers. */
function RepsSide({
  reps,
  step,
  stepLabel,
  onChange,
  testID,
}: {
  reps: number | null;
  step: number;
  stepLabel: string;
  onChange: (next: number | null) => void;
  testID: string;
}) {
  const { colors } = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');

  const bump = (dir: 1 | -1) => {
    const base = reps ?? 0;
    const next = base + dir * step;
    onChange(next <= 0 ? null : next);
  };

  return (
    <View style={styles.repsSide}>
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
          accessibilityLabel="Reps input"
          style={[styles.repsInput, { color: colors.text, outlineWidth: 0 }]}
          testID={`${testID}-input`}
        />
      ) : (
        <Pressable
          onPress={() => {
            setDraftText(reps == null ? '' : String(reps));
            setEditing(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Edit reps, currently ${reps == null ? 'not set' : reps}`}
          style={styles.repsTap}
          testID={`${testID}-tap`}
        >
          <Text style={[styles.repsDigits, { color: colors.text }]} selectable>
            {reps == null ? '—' : String(reps)}
          </Text>
        </Pressable>
      )}
      <View style={styles.stepperRow}>
        <StepButton
          dir={-1}
          label={`Decrease reps by ${stepLabel}`}
          onPress={() => bump(-1)}
          testID={`${testID}-dec`}
        />
        <Text style={[styles.stepperStep, { color: colors.textMuted }]}>{stepLabel}</Text>
        <StepButton
          dir={1}
          label={`Increase reps by ${stepLabel}`}
          onPress={() => bump(1)}
          testID={`${testID}-inc`}
        />
      </View>
    </View>
  );
}

export function TheLogger({
  setNumber,
  weight,
  reps,
  repsHint = null,
  onLog,
  onChangeWeight,
  onChangeReps,
  testID,
}: TheLoggerProps) {
  const { colors } = useAppTheme();
  const ready = weight != null && reps != null;
  const tid = testID ?? 'the-logger';

  return (
    <View
      testID={testID}
      style={[
        styles.board,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.mobilePremium.hairlineBorder,
          boxShadow: colors.mobilePremium.instrumentShadow,
        },
      ]}
      accessibilityLabel={`Logger, set ${setNumber}: ${weight ?? 'no weight'} kilograms by ${reps ?? 'no reps'} reps`}
    >
      {/* The kicker — the set ordinal carries the record orange (the
          next position is the Floor's one orange mark beside the
          verb's pulse). */}
      <Text style={[styles.kicker, { color: colors.textMuted }]}>
        SET{' '}
        <Text style={{ color: colors.brandText }}>
          {String(setNumber).padStart(2, '0')}
        </Text>
        {repsHint ? ` · TGT ${repsHint}` : ''}
      </Text>

      {/* THE INSTRUMENT — the drawn stack meets the reps digits at
          the ×. */}
      <View style={styles.callRow}>
        <WeightSide
          weight={weight}
          step={2.5}
          stepLabel="2.5"
          onChange={onChangeWeight}
          testID={`${tid}-weight`}
        />
        <Text style={[styles.multiplier, { color: colors.textMuted }]}>×</Text>
        <RepsSide
          reps={reps}
          step={1}
          stepLabel="1"
          onChange={onChangeReps}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  kicker: {
    ...theme.typography.mobileEyebrow,
    textAlign: 'center',
    minHeight: 20,
  },
  // THE INSTRUMENT reads as one line: the stack and the digits meet
  // at the ×, each side's steppers beneath its figure.
  callRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  weightSide: {
    alignItems: 'center',
    flex: 1,
  },
  repsSide: {
    alignItems: 'center',
    flex: 1,
  },
  stackTap: {
    minHeight: 60,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  weightDigit: {
    ...theme.typography.mobileFigure,
    marginTop: 4,
  },
  weightInput: {
    ...theme.typography.mobileCounter,
    minWidth: 96,
    minHeight: 60,
    textAlign: 'center',
  },
  repsTap: {
    minHeight: 60,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repsDigits: {
    ...theme.typography.mobileCounter,
  },
  repsInput: {
    ...theme.typography.mobileCounter,
    minWidth: 72,
    minHeight: 60,
    textAlign: 'center',
  },
  multiplier: {
    ...theme.typography.mobileFigure,
    marginTop: 22,
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
    ...theme.typography.mobileFigure,
    fontWeight: '600',
    fontSize: 18,
  },
  stepperStep: {
    ...theme.typography.mobileEyebrow,
    minWidth: 28,
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

export default TheLogger;
