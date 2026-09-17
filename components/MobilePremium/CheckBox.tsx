// components/MobilePremium/CheckBox.tsx
// The bare checkbox glyph: a rounded square that fills with the accent
// and animates its check in/out (scale + fade). Presentational — the
// surrounding row owns the press target and accessibility state, which
// lets rich rows (checkbox + content + trailing value) share the exact
// indicator `MobileCheckboxItem` renders.
//
// Premium signals:
//   • Animated check — fades + scales on toggle, snapping under
//     reduced-motion (Animated timing; set duration to 0 to disable).
//   • Considered geometry — 1.5px border, 6px radius, centered glyph.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Check } from '@tamagui/lucide-icons-2';
import { useAppTheme } from '../../context';

export interface CheckBoxProps {
  /** Current checked state. */
  checked: boolean;
  /** Accent color (default theme brand). */
  accentColor?: string;
  /** Indicator size (width = height). Default 22. */
  size?: number;
  /** Check glyph size. Defaults to `size - 8`. */
  checkSize?: number;
  /** Animation duration in ms. Set 0 to snap. Default 180. */
  duration?: number;
  /** Test ID. */
  testID?: string;
}

/**
 * The checkbox indicator on its own — compose it into any pressable row.
 * For a ready-made title + subtitle row, use `MobileCheckboxItem`.
 */
export function CheckBox({
  checked,
  accentColor,
  size = 22,
  checkSize,
  duration = 180,
  testID,
}: CheckBoxProps) {
  const { colors } = useAppTheme();
  const accent = accentColor ?? colors.brand;

  const scale = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const opacity = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    const target = checked ? 1 : 0;
    const anims = [scale, opacity].map((value) =>
      Animated.timing(value, { toValue: target, duration, useNativeDriver: true }),
    );
    anims.forEach((anim) => anim.start());
    return () => anims.forEach((anim) => anim.stop());
  }, [checked, duration, scale, opacity]);

  return (
    <View
      testID={testID}
      style={[
        styles.box,
        { width: size, height: size },
        {
          backgroundColor: checked ? accent : 'transparent',
          borderColor: checked ? accent : colors.border,
        },
      ]}
    >
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Check size={checkSize ?? size - 8} color={colors.textOnBrand} strokeWidth={3} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CheckBox;
