// components/composed/HamburgerButton.tsx
// MobileHomeHeader.menuButton trigger that opens the nav drawer. Swaps
// between Menu and X icons based on isOpen with a short crossfade so
// the icon transition reads as motion rather than a snap — the drawer
// slides in alongside the icon swap, so the two feel coordinated.
// Consumer-specific (lives in composed/, not MobilePremium/) because
// the drawer wiring is domain — the MobileNavDrawer primitive itself
// is shell-level, but the choice to put the trigger in the home
// header's menuButton slot is armandotfit's.

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Menu, X } from '@tamagui/lucide-icons-2';
import { isWeb } from '../../utils';
import { useAppTheme } from '../../context';

export interface HamburgerButtonProps {
  /** Tap handler — typically `() => setDrawerOpen((prev) => !prev)`. */
  onPress: () => void;
  /** Whether the drawer is currently open. Drives the icon crossfade. */
  isOpen?: boolean;
}

export function HamburgerButton({ onPress, isOpen = false }: HamburgerButtonProps) {
  const { colors } = useAppTheme();
  // Both icons render absolutely stacked; opacity crossfades. On web a
  // 200ms CSS transition keeps the swap smooth; on native the opacity
  // still toggles (just without the timed transition). The transition
  // prop is web-only and not in RN's ViewStyle types, so it goes through
  // a conditional spread rather than a typed key.
  const transitionProp = isWeb ? { transition: 'opacity 200ms ease' } : null;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={isOpen ? 'Close menu' : 'Open menu'}
      style={({ pressed }) => [styles.button, pressed ? { opacity: 0.6 } : null]}
    >
      <View style={styles.iconBox}>
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.iconLayer,
            { opacity: isOpen ? 0 : 1, ...transitionProp },
          ]}
        >
          <Menu size={22} color={colors.text} />
        </View>
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.iconLayer,
            { opacity: isOpen ? 1 : 0, ...transitionProp },
          ]}
        >
          <X size={22} color={colors.text} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HamburgerButton;
