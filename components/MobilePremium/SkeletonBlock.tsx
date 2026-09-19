// components/MobilePremium/SkeletonBlock.tsx
// The placeholder primitive for loading skeletons. Reads `colors.cardAlt`
// (one step off the ground — reads as a placeholder, not as content).
// THE STILL SYSTEM override (docs/architecture/interval-thesis.md §6):
// the block is STATIC and square — no shimmer pulse,
// no rounded corners. Loading is a state, not an animation; the shell's
// shimmering variant stays in arqavellum (this copy diverges
// deliberately, like theme values).
//
// Pair with consumer-composed skeletons (e.g. a `DashboardSkeleton` or
// `ListSkeleton` composed primitive) for screen-level loading states.
// The primitive stays domain-agnostic — every consumer gets the same
// block, and composes per-screen shapes locally.

import React, { memo } from 'react';
import {
  View,
  type DimensionValue,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../context';

export interface SkeletonBlockProps {
  /** Width. Default '100%'. Pass a number for px or a string for '%'. */
  width?: DimensionValue;
  /** Height in px. Default 16. */
  height?: number;
  /** Corner radius. Default 0 (the square cut); kept as a prop for
   *  consumer-composed circular shapes (avatar discs). */
  borderRadius?: number;
  /** Optional top margin — convenience for stacked layouts. */
  marginTop?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function SkeletonBlockInner({
  width = '100%',
  height = 16,
  borderRadius = 0,
  marginTop,
  style,
  testID,
}: SkeletonBlockProps) {
  const { colors } = useAppTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.cardAlt,
          marginTop,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    // Layout-neutral — caller composes via props + style. Width/height
    // come from props so the block can be sized to its eventual content.
  },
});

/**
 * Loading skeleton block — static, square, one step off the ground.
 */
export const SkeletonBlock = memo(SkeletonBlockInner);

export default SkeletonBlock;
