// components/composed/NextStation.tsx
//
// THE QUIET PAGE's way-forward row (Floor). "What's next" is one of
// the three glance questions — the row must be APPARENT without
// becoming a second verb. The recipe, all on-law: the NEXT label
// carries the record-mark read (the next position is the living
// position — the record law's mark, same brandText as the set
// ordinal), the station's name rides the row scale in full ink, a
// chevron points the way, and the row is isolated by air above so
// nothing competes beside it. Full-width ≥52px target. No new size,
// no new ink, no fill — the LOG verb stays the only red plate.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from '@tamagui/lucide-icons-2';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';

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
      style={({ pressed }) => [styles.row, pressed ? { opacity: 0.6 } : null]}
      testID={testID}
    >
      <Text style={[styles.nextLabel, { color: colors.brandText }]}>NEXT</Text>
      <Text style={[styles.nextName, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>
      <ChevronRight size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Isolated by air above — the ledger ends, then the way forward.
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  nextLabel: {
    ...theme.typography.mobileEyebrow,
  },
  nextName: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
});

export default NextStation;
