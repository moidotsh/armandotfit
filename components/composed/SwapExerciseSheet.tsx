// components/composed/SwapExerciseSheet.tsx
// Session-time exercise substitution. Offers the swapped-out exercise's
// movement-family alternatives from the local catalog — display-time
// grouping only, no alternatives graph, no eligibility engine, and the
// swap is ephemeral (this session's draft; the program never changes).
// Custom/disliked equipment cases fall back to Remove + Add, which the
// empty state points at.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MobileSheet } from '../MobilePremium';
import { useAppTheme } from '../../context';
import {
  SYSTEM_EXERCISES,
  SYSTEM_EXERCISES_BY_SLUG,
  formatExerciseAttributes,
} from '../../shared/exercises';

export interface SwapExerciseSheetProps {
  /** The slug being swapped out ('' for custom exercises). */
  exerciseSlug: string | '';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwap: (next: { exerciseName: string; exerciseSlug: string }) => void;
  testID?: string;
}

export function SwapExerciseSheet({
  exerciseSlug,
  open,
  onOpenChange,
  onSwap,
  testID,
}: SwapExerciseSheetProps) {
  const { colors } = useAppTheme();
  const current = exerciseSlug ? SYSTEM_EXERCISES_BY_SLUG[exerciseSlug] : undefined;
  const alternatives = current?.family
    ? SYSTEM_EXERCISES.filter(
        (e) => e.family === current.family && e.slug !== current.slug,
      )
    : [];

  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Swap ${current?.name ?? 'exercise'}`}
      testID={testID}
    >
      <View style={styles.body}>
        {alternatives.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No direct alternative in the same movement family. Remove it and add
            any exercise from the library instead — or type a custom one.
          </Text>
        ) : (
          alternatives.map((alt) => {
            const attrs = formatExerciseAttributes(alt);
            return (
              <Pressable
                key={alt.slug}
                onPress={() => {
                  onSwap({ exerciseName: alt.name, exerciseSlug: alt.slug });
                  onOpenChange(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Swap in ${alt.name}`}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: colors.border },
                  pressed ? { opacity: 0.6 } : null,
                ]}
              >
                <View style={styles.rowMain}>
                  <Text style={[styles.name, { color: colors.text }]}>{alt.name}</Text>
                  {attrs.equipmentLabel ? (
                    <Text style={[styles.attrs, { color: colors.textSecondary }]}>
                      {attrs.equipmentLabel}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.cta, { color: colors.brand }]}>Swap</Text>
              </Pressable>
            );
          })
        )}
      </View>
    </MobileSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: 12 },
  empty: { fontSize: 13, lineHeight: 18, paddingVertical: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  rowMain: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '600' },
  attrs: { fontSize: 12 },
  cta: { fontSize: 13, fontWeight: '600' },
});

export default SwapExerciseSheet;
