// components/composed/NextStation.tsx
//
// The way-forward row (Floor, scoreboard-thesis §8). "What's next"
// is one of the three glance questions — and the ACTUAL path of the
// session, so it carries its own hairline-ruled row: the NEXT
// furniture word, the station's name in full ink, and a chevron
// pointing the way. It is deliberately the loudest thing after the
// statement and the verb — the flow should read ledger → NEXT →
// (footnote adder), never the reverse.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from '@tamagui/lucide-icons-2';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';

export interface NextStationProps {
  /** The next station's exercise name. */
  name: string;
  onPress: () => void;
  /**
   * REST SETTLED — the way forward brightens while the rest clock
   * reads 0 (state change, not motion: the still law holds).
   */
  bright?: boolean;
  testID?: string;
}

export function NextStation({ name, onPress, bright = false, testID }: NextStationProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Next station: ${name}`}
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: colors.mobilePremium.hairlineBorder },
        pressed ? { opacity: 0.7 } : null,
      ]}
      testID={testID}
    >
      <Text style={[styles.nextWord, { color: colors.textMuted }]}>NEXT</Text>
      <Text
        style={[styles.nextName, { color: colors.text }, bright ? styles.nextNameBright : null]}
        numberOfLines={1}
      >
        {name}
      </Text>
      <ChevronRight size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // THE WAY FORWARD — a hairline-ruled row, isolated by air above so
  // nothing competes beside it. Full-width ≥56px target; it IS the
  // session's direction.
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    borderTopWidth: 1,
    paddingHorizontal: 2,
  },
  nextWord: {
    ...theme.typography.mobileEyebrow,
  },
  nextName: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  // The settled-rest read: full weight — the next set is yours.
  nextNameBright: {
    fontWeight: '700',
  },
});

export default NextStation;
