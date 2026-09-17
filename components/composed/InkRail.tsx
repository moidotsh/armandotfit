// components/composed/InkRail.tsx
// The substitution picker — invisible until needed. The exercise row
// stays perfectly clean; one tiny ⇄ glyph sits after the name. Tap it
// and a no-chrome sheet slides up with ranked alternatives as bare
// text rows. Tap a name, done. That's the whole interaction.

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MobileSheet } from '../MobilePremium';
import { useAppTheme } from '../../context';
import { rankAlternatives } from '../../services';
import { SYSTEM_EXERCISES_BY_SLUG } from '../../shared/exercises';

export interface InkRailProps {
  currentSlug: string;
  onSwap: (next: { exerciseName: string; exerciseSlug: string }) => void;
  programmed?: { slug: string; name: string } | null;
  onRestore?: () => void;
  /** Controlled open state — the parent owns the single sheet. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testID?: string;
}

/** The tiny ⇄ glyph rendered after the exercise name. */
export function SwapGlyph({ onPress, label }: { onPress: () => void; label: string }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Change ${label}`}
      hitSlop={8}
    >
      <Text style={[styles.glyph, { color: colors.textSecondary }]}>⇄</Text>
    </Pressable>
  );
}

export function InkRail({
  currentSlug,
  onSwap,
  programmed,
  onRestore,
  open,
  onOpenChange,
  testID,
}: InkRailProps) {
  const { colors } = useAppTheme();

  const items = useMemo(() => {
    const current = currentSlug
      ? SYSTEM_EXERCISES_BY_SLUG[currentSlug]
      : undefined;
    if (!current) return [];

    const alts = rankAlternatives(current, 6);
    const list = [
      { slug: current.slug, name: current.name, modality: current.modality, isCurrent: true, isProgrammed: false },
    ];
    if (programmed && programmed.slug !== current.slug) {
      list.push({
        slug: programmed.slug,
        name: programmed.name,
        modality: SYSTEM_EXERCISES_BY_SLUG[programmed.slug]?.modality,
        isCurrent: false,
        isProgrammed: true,
      });
    }
    for (const alt of alts) {
      if (programmed && alt.exercise.slug === programmed.slug) continue;
      list.push({
        slug: alt.exercise.slug,
        name: alt.exercise.name,
        modality: alt.exercise.modality,
        isCurrent: false,
        isProgrammed: false,
      });
    }
    return list;
  }, [currentSlug, programmed]);

  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      showHandle={false}
      showCloseButton={false}
      testID={testID}
    >
      <View style={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.slug}
            onPress={() => {
              onOpenChange(false);
              if (item.isCurrent) return;
              if (item.isProgrammed && onRestore) {
                onRestore();
              } else {
                onSwap({ exerciseName: item.name, exerciseSlug: item.slug });
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={
              item.isCurrent
                ? item.name
                : item.isProgrammed
                  ? `Restore ${item.name}`
                  : `Swap to ${item.name}`
            }
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: colors.border },
              pressed ? { opacity: 0.6 } : null,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.name,
                {
                  color: item.isCurrent
                    ? colors.brand
                    : item.isProgrammed
                      ? colors.textSecondary
                      : colors.text,
                },
              ]}
            >
              {item.isProgrammed ? `↺ ${item.name}` : item.name}
            </Text>
            {item.isCurrent ? (
              <Text style={[styles.meta, { color: colors.brand }]}>current</Text>
            ) : (
              <Text style={[styles.meta, { color: colors.textColors.tertiary }]}>
                {item.isProgrammed ? 'restore' : item.modality ?? ''}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </MobileSheet>
  );
}

const styles = StyleSheet.create({
  glyph: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  meta: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
