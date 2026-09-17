// components/composed/AlternativesExpansion.tsx
// The inline substitution surface — the anti-sheet. Expands beneath an
// exercise row as ledger type-lines grouped by modality (FLOOR / DB /
// BB / MACHINE / CABLE), with the PROGRAMMED line at top when a
// standing override is active. Tap a line and it stamps into the row.
// No modal, no "Swap" labels — the row itself is the control.

import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import {
  SYSTEM_EXERCISES,
  SYSTEM_EXERCISES_BY_SLUG,
} from '../../shared/exercises';
import { useFadeSlide } from '../../hooks';

const MODALITY_ORDER = ['floor', 'dumbbell', 'barbell', 'machine', 'cable'] as const;

export interface AlternativesSelection {
  exerciseName: string;
  exerciseSlug: string;
}

export interface AlternativesExpansionProps {
  /** The slug currently in the slot ('' for custom exercises). */
  currentSlug: string;
  /** When a standing override is active: the PROGRAMMED line restores it. */
  programmed?: { slug: string; name: string } | null;
  onRestore?: () => void;
  onSelect: (next: AlternativesSelection) => void;
  /** Tighter rhythm for in-session cards. */
  compact?: boolean;
  testID?: string;
}

export function AlternativesExpansion({
  currentSlug,
  programmed,
  onRestore,
  onSelect,
  compact,
  testID,
}: AlternativesExpansionProps) {
  const { colors } = useAppTheme();
  const motion = useFadeSlide({ initialTranslate: 8, duration: 180 });

  const current = currentSlug ? SYSTEM_EXERCISES_BY_SLUG[currentSlug] : undefined;
  const alternatives = current?.family
    ? SYSTEM_EXERCISES.filter(
        (e) => e.family === current.family && e.slug !== current.slug,
      )
    : [];
  const groups = MODALITY_ORDER.map((modality) => ({
    modality,
    entries: alternatives.filter((e) => e.modality === modality),
  })).filter((g) => g.entries.length > 0);

  const labelStyle = [styles.label, { color: colors.brand }];
  const nameStyle = (muted?: boolean) => [
    styles.name,
    compact ? styles.nameCompact : null,
    { color: muted ? colors.textSecondary : colors.text },
  ];

  return (
    <Animated.View style={[styles.wrap, motion.style]} testID={testID}>
      {programmed && onRestore ? (
        <View style={styles.group}>
          <Text style={labelStyle}>PROGRAMMED</Text>
          <Pressable
            onPress={onRestore}
            accessibilityRole="button"
            accessibilityLabel={`Restore ${programmed.name}`}
            style={({ pressed }) => [
              styles.line,
              pressed ? { opacity: 0.6 } : null,
            ]}
          >
            <Text style={nameStyle(true)}>{programmed.name}</Text>
            <Text style={[styles.restore, { color: colors.textSecondary }]}>
              restore
            </Text>
          </Pressable>
        </View>
      ) : null}
      {groups.length === 0 && !programmed ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          No same-family alternative in the library — this one is yours.
        </Text>
      ) : null}
      {groups.map(({ modality, entries }) => (
        <View key={modality} style={styles.group}>
          <Text style={labelStyle}>{modality.toUpperCase()}</Text>
          {entries.map((alt) => (
            <Pressable
              key={alt.slug}
              onPress={() => onSelect({ exerciseName: alt.name, exerciseSlug: alt.slug })}
              accessibilityRole="button"
              accessibilityLabel={`Use ${alt.name}`}
              style={({ pressed }) => [
                styles.line,
                pressed ? { opacity: 0.6 } : null,
              ]}
            >
              <Text numberOfLines={1} style={nameStyle()}>
                {alt.name}
              </Text>
              <Text style={[styles.hint, { color: colors.textColors.tertiary }]}>
                {alt.defaultReps[0]}–{alt.defaultReps[1]}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
    paddingBottom: 8,
    gap: 2,
  },
  group: { gap: 0 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    gap: 12,
  },
  name: { fontSize: 14, flex: 1 },
  nameCompact: { fontSize: 13.5 },
  hint: { fontSize: 11, fontVariant: ['tabular-nums'] },
  restore: { fontSize: 11, fontWeight: '600' },
  empty: { fontSize: 12.5, lineHeight: 17, paddingVertical: 8 },
});
