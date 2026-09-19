// components/composed/NextStation.tsx
//
// The way-forward row (Floor, gauge-thesis §8). "What's next" is one
// of the three glance questions — and the ACTUAL path of the
// session, so it carries the station's one demarcated block: an
// enamel panel row with the NEXT flip tile, the station's name in
// full ink, and a chevron pointing the way. It is deliberately the
// loudest thing after the statement and the verb — the flow should
// read ledger → NEXT → (footnote adder), never the reverse.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from '@tamagui/lucide-icons-2';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';
import { FlipTile } from './FlipTile';

export interface NextStationProps {
  /** The next station's exercise name. */
  name: string;
  onPress: () => void;
  testID?: string;
}

export function NextStation({ name, onPress, testID }: NextStationProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Next station: ${name}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        pressed ? { opacity: 0.7 } : null,
      ]}
      testID={testID}
    >
      <FlipTile word="NEXT" tone="ink" testID={testID ? `${testID}-tile` : undefined} />
      <Text style={[styles.nextName, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>
      <ChevronRight size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // THE WAY FORWARD — the demarcated block: an enamel panel row,
  // isolated by air above so nothing competes beside it. Full-width
  // ≥56px target; the only filled row on the station (besides the
  // verb) because it IS the session's direction.
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    borderWidth: 1,
    borderRadius: theme.shapes.surface,
    paddingHorizontal: 12,
  },
  nextName: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
});

export default NextStation;
