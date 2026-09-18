// components/MobilePremium/FilterChipGroup.tsx
// Layout container for FilterChip children. One row is the default: chips
// share a single row that scrolls horizontally when it overflows — a chip
// row that wraps onto a second line breaks the vertical rhythm of
// everything stacked beneath it. `oneRow={false}` restores flex-wrap for
// genuinely wrapping clusters.
//
// Still purely presentational: no sticky placement, no search slot, no
// filters state, and no a11y role of its own — the semantic grouping
// (e.g. `role="radiogroup"` for a single-select cluster) is owned by the
// consumer's surrounding wrapper if needed.

import React from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export interface FilterChipGroupProps {
  /** Typically a row of FilterChip, but accepts any children. */
  children: React.ReactNode;
  /** Default true: chips share one scrollable row. false: chips flex-wrap. */
  oneRow?: boolean;
  /** Gap between children. Default 8. */
  gap?: number;
  testID?: string;
  /** Outer style. In oneRow mode it styles the scroll container. */
  style?: StyleProp<ViewStyle>;
}

export function FilterChipGroup({
  children,
  oneRow = true,
  gap = 8,
  testID,
  style,
}: FilterChipGroupProps) {
  if (oneRow) {
    return (
      <ScrollView
        testID={testID}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.scroll, style]}
        contentContainerStyle={[styles.row, { gap, minWidth: '100%' }]}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <View
      testID={testID}
      style={[styles.row, { flexWrap: 'wrap', gap }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  // RN-web gives ScrollView a default `flex: 1 1 auto`. Inside a screen's
  // flex column that is wrong on both axes: when a sibling list's content
  // overflows, flex-shrink collapses the chip row to a sliver (chips
  // paint half-hidden); when the list is sized flex:1, flex-grow makes
  // THIS row balloon and pushes the rest of the body to the bottom. The
  // row must take exactly its content height: grow 0, shrink 0.
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
});

export default FilterChipGroup;
