// components/composed/SectionWhisper.tsx
//
// THE SECTION LANDMARK (the atelier pass, the cadence): the Desk's
// long pages were air-only walls of rows — beautiful, but with no
// rhythm a scroll can feel. One hairline above each section whisper
// spends the element budget the thesis already allows (≤3 hairlines +
// one 2px rule per screen) as a paragraph mark: the rule is the
// landmark, the whisper is the label, the air below is unified at 8.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { INTERVAL } from '../../constants';

export interface SectionWhisperProps {
  /** The section's furniture-caps label (≤3 words). */
  children: string;
  /** Draw the landmark hairline above (default true). */
  rule?: boolean;
  testID?: string;
}

export function SectionWhisper({ children, rule = true, testID }: SectionWhisperProps) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[styles.hold, rule ? { borderTopColor: colors.mobilePremium.hairlineBorder } : null, rule ? styles.rule : null]}
      testID={testID}
    >
      <Text style={[INTERVAL.whisper, { color: colors.textMuted }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hold: {
    marginBottom: 8,
  },
  rule: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
});

export default SectionWhisper;
