// components/composed/StationStrip.tsx
//
// The station strip — the stage's position instrument (signal-thesis
// §5): one pip per exercise, numbered 01·02·03·04. Done = signal fill
// with ink numeral; current = raised surfaceAlt plate with the signal
// numeral + a 2px signal underline; upcoming = muted outline. The
// strip is how a mid-set glance answers "where am I" — and it is the
// station navigator (tap to jump; every pip is a 44px target).

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
      style={styles.scroller}
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
              styles.pip,
              {
                backgroundColor: isDone
                  ? colors.focus.signal
                  : isCurrent
                    ? colors.focus.surfaceAlt
                    : 'transparent',
                borderColor: isCurrent
                  ? colors.focus.signal
                  : colors.focus.border,
              },
              pressed ? { opacity: 0.7 } : null,
            ]}
            testID={`${testID ?? 'station-strip'}-pip-${label}`}
          >
            <Text
              style={[
                styles.pipLabel,
                {
                  color: isDone
                    ? colors.focus.onSignal
                    : isCurrent
                      ? colors.focus.text
                      : colors.focus.muted,
                },
              ]}
            >
              {label}
            </Text>
            {isCurrent ? (
              <View style={[styles.pipUnderline, { backgroundColor: colors.focus.signal }]} />
            ) : null}
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
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pip: {
    minWidth: 48,
    height: 44,
    borderRadius: theme.shapes.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pipLabel: {
    ...theme.typography.mobileLedger,
    fontWeight: '600',
  },
  pipUnderline: {
    position: 'absolute',
    bottom: 4,
    width: 14,
    height: 2,
    borderRadius: 1,
  },
});

export default StationStrip;
