// components/composed/InkRail.tsx
// The substitution rail — a horizontal snap-scrolling strip of type
// cards under each exercise. Always visible, one tap to swap, no
// modes, no expansion, no sheets. The current exercise is the inked
// card; alternatives are ranked by the substitution service ("the lat
// pulldown is taken → cable row, machine row, pull-up…"). The rail is
// the ink dialect's answer to the substitution problem: printed cards
// on a strip, the active one inked, the rest in lighter type.

import React, { useRef, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useAppTheme } from '../../context';
import { rankAlternatives } from '../../services';
import { SYSTEM_EXERCISES_BY_SLUG } from '../../shared/exercises';

export interface InkRailProps {
  /** The slug currently in the slot ('' for custom — rail renders empty). */
  currentSlug: string;
  /** Swap handler — receives the tapped alternative's identity. */
  onSwap: (next: { exerciseName: string; exerciseSlug: string }) => void;
  /** When a standing override is active: restore the programmed exercise. */
  programmed?: { slug: string; name: string } | null;
  onRestore?: () => void;
  /** In-session cards use tighter rhythm. */
  compact?: boolean;
  testID?: string;
}

const MODALITY_LABEL: Record<string, string> = {
  floor: 'bodyweight',
  dumbbell: 'DB',
  barbell: 'BB',
  machine: 'machine',
  cable: 'cable',
};

export function InkRail({
  currentSlug,
  onSwap,
  programmed,
  onRestore,
  compact,
  testID,
}: InkRailProps) {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);

  const cards = useMemo(() => {
    const current = currentSlug
      ? SYSTEM_EXERCISES_BY_SLUG[currentSlug]
      : undefined;
    if (!current) return [];

    const alts = rankAlternatives(current, 6);
    const items: Array<{
      slug: string;
      name: string;
      modality?: string;
      isCurrent: boolean;
      isProgrammed?: boolean;
    }> = [
      {
        slug: current.slug,
        name: current.name,
        modality: current.modality,
        isCurrent: true,
      },
    ];

    // The programmed exercise appears as a restore card when overridden.
    if (programmed && programmed.slug !== current.slug) {
      items.push({
        slug: programmed.slug,
        name: programmed.name,
        modality: SYSTEM_EXERCISES_BY_SLUG[programmed.slug]?.modality,
        isCurrent: false,
        isProgrammed: true,
      });
    }

    for (const alt of alts) {
      if (programmed && alt.exercise.slug === programmed.slug) continue;
      items.push({
        slug: alt.exercise.slug,
        name: alt.exercise.name,
        modality: alt.exercise.modality,
        isCurrent: false,
      });
    }
    return items;
  }, [currentSlug, programmed]);

  if (cards.length <= 1) return null;

  return (
    <View testID={testID}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.strip}
      >
        {cards.map((card) => (
          <Pressable
            key={card.slug}
            onPress={() => {
              if (card.isCurrent) return;
              if (card.isProgrammed && onRestore) {
                onRestore();
              } else {
                onSwap({
                  exerciseName: card.name,
                  exerciseSlug: card.slug,
                });
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={
              card.isCurrent
                ? card.name
                : card.isProgrammed
                  ? `Restore ${card.name}`
                  : `Swap to ${card.name}`
            }
            style={({ pressed }) => [
              styles.card,
              compact ? styles.cardCompact : null,
              {
                borderColor: card.isCurrent
                  ? colors.brand
                  : colors.border,
                backgroundColor: card.isCurrent
                  ? `${colors.brand}14`
                  : 'transparent',
              },
              pressed ? { opacity: 0.7 } : null,
            ]}
          >
            <Text
              numberOfLines={compact ? 1 : 2}
              style={[
                styles.cardName,
                compact ? styles.cardNameCompact : null,
                { color: card.isCurrent ? colors.brand : colors.text },
              ]}
            >
              {card.name}
            </Text>
            <Text
              style={[
                styles.cardModality,
                { color: colors.textSecondary },
              ]}
            >
              {card.isProgrammed
                ? '↺ programmed'
                : MODALITY_LABEL[card.modality ?? ''] ?? card.modality}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 120;
const CARD_GAP = 8;

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingRight: 16,
  },
  card: {
    width: CARD_WIDTH,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 2,
  },
  cardCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cardName: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
  },
  cardNameCompact: {
    fontSize: 11,
    lineHeight: 13,
  },
  cardModality: {
    fontSize: 9.5,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
