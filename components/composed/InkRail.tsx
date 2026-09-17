// components/composed/InkRail.tsx
// The substitution scroller — the exercise name IS the picker. A
// full-width horizontal snap-scroll of bare text: swipe and names
// crossfade, release and the centered name becomes the exercise. No
// cards, no borders, no backgrounds — the ink dialect's quietest
// surface. Adjacent names barely peek at the edges; the scroll itself
// says "there's more."

import React, { useMemo, useRef, useCallback, useState } from 'react';
import {
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
  currentSlug: string;
  onSwap: (next: { exerciseName: string; exerciseSlug: string }) => void;
  programmed?: { slug: string; name: string } | null;
  onRestore?: () => void;
  testID?: string;
}

interface RailItem {
  slug: string;
  name: string;
  modality?: string;
  isCurrent: boolean;
  isProgrammed?: boolean;
}

export function InkRail({
  currentSlug,
  onSwap,
  programmed,
  onRestore,
  testID,
}: InkRailProps) {
  const { colors } = useAppTheme();
  const [itemWidth, setItemWidth] = useState(0);
  const committedIndex = useRef(0);

  const items = useMemo((): RailItem[] => {
    const current = currentSlug
      ? SYSTEM_EXERCISES_BY_SLUG[currentSlug]
      : undefined;
    if (!current) return [];

    const alts = rankAlternatives(current, 6);
    const list: RailItem[] = [
      { slug: current.slug, name: current.name, modality: current.modality, isCurrent: true },
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
      });
    }
    return list;
  }, [currentSlug, programmed]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (itemWidth === 0 || items.length <= 1) return;
      const idx = Math.round(e.nativeEvent.contentOffset.x / itemWidth);
      if (idx === committedIndex.current) return;
      if (idx < 0 || idx >= items.length) return;
      committedIndex.current = idx;

      const item = items[idx];
      if (item.isCurrent) return;
      if (item.isProgrammed && onRestore) {
        onRestore();
      } else {
        onSwap({ exerciseName: item.name, exerciseSlug: item.slug });
      }
    },
    [items, onSwap, onRestore],
  );

  if (items.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      onMomentumScrollEnd={onScrollEnd}
      onLayout={(e) => {
        setItemWidth(e.nativeEvent.layout.width);
      }}
      contentContainerStyle={styles.strip}
      testID={testID}
    >
      {items.map((item) => (
        <View
          key={item.slug}
          style={[styles.item, { width: itemWidth > 0 ? itemWidth : '100%' }]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.name,
              {
                color: item.isCurrent
                  ? colors.text
                  : colors.textSecondary,
              },
              item.isCurrent ? styles.nameActive : styles.nameMuted,
            ]}
          >
            {item.isProgrammed ? `↺ ${item.name}` : item.name}
          </Text>
          <Text
            style={[styles.modality, { color: colors.textColors.tertiary }]}
          >
            {item.isProgrammed ? 'programmed' : item.modality ?? ''}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingRight: 32,
  },
  name: {
    fontSize: 13,
    lineHeight: 17,
  },
  nameActive: {
    fontWeight: '700',
  },
  nameMuted: {
    fontWeight: '500',
  },
  modality: {
    fontSize: 9,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 1,
  },
});
