// components/composed/StationStrip.tsx
//
// The station rail — the stage's position measure (count-thesis §7):
// one square MARK per exercise, numbered 01·02·03·04, riding a
// hairline rule. Done = solid content fill with page-colored numeral;
// current = the strike fill (the orange mark — the station about to be
// counted) with ink/chalk numeral; upcoming = hairline outline, muted.
// The rail is how a mid-set glance answers "where am I" — and it is
// the station navigator (tap to jump; every mark is a 44px target).

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';

export interface StationDatum {
  key: string;
  /** 1-based position label (rendered zero-padded). */
  position: number;
  done: boolean;
}

export interface StationStripProps {
  stations: StationDatum[];
  currentIndex: number;
  onSelect: (index: number) => void;
  testID?: string;
}

export function StationStrip({
  stations,
  currentIndex,
  onSelect,
  testID,
}: StationStripProps) {
  const { colors } = useAppTheme();

  if (stations.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={[styles.scroller, { borderBottomColor: colors.mobilePremium.hairlineBorder }]}
      testID={testID}
      accessibilityLabel={`Station ${currentIndex + 1} of ${stations.length}`}
    >
      {stations.map((station, i) => {
        const isCurrent = i === currentIndex;
        const isDone = station.done;
        const label = String(station.position).padStart(2, '0');
        return (
          <Pressable
            key={station.key}
            onPress={() => onSelect(i)}
            accessibilityRole="button"
            accessibilityLabel={`Go to station ${label}${isDone ? ', complete' : ''}`}
            accessibilityState={{ selected: isCurrent }}
            style={({ pressed }) => [
              styles.mark,
              {
                backgroundColor: isDone
                  ? colors.text
                  : isCurrent
                    ? colors.brand
                    : 'transparent',
                borderColor: isCurrent
                  ? colors.brand
                  : colors.mobilePremium.hairlineBorderStrong,
              },
              pressed ? { opacity: 0.7 } : null,
            ]}
            testID={`${testID ?? 'station-strip'}-pip-${label}`}
          >
            <Text
              style={[
                styles.markLabel,
                {
                  color: isDone
                    ? colors.background
                    : isCurrent
                      ? colors.textOnBrand
                      : colors.textMuted,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mark: {
    minWidth: 48,
    height: 44,
    borderRadius: theme.shapes.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  markLabel: {
    ...theme.typography.mobileLedger,
    fontWeight: '600',
  },
});

export default StationStrip;
