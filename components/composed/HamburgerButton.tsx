// components/composed/HamburgerButton.tsx
// MobileHeader.leftAction trigger that opens the nav drawer. Swaps
// between Menu and X icons based on isOpen. Consumer-specific (lives
// in composed/, not MobilePremium/) because the drawer wiring is
// domain — the MobileNavDrawer primitive itself is shell-level, but
// the choice to put the trigger in the home header's leftAction slot
// is armandotfit's.

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Menu, X } from '@tamagui/lucide-icons-2';
import { useAppTheme } from '../../context';

export interface HamburgerButtonProps {
  /** Tap handler — typically `() => setDrawerOpen(true)`. */
  onPress: () => void;
  /** Whether the drawer is currently open. Toggles the icon. */
  isOpen?: boolean;
}

export function HamburgerButton({ onPress, isOpen = false }: HamburgerButtonProps) {
  const { colors } = useAppTheme();
  const Icon = isOpen ? X : Menu;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={isOpen ? 'Close menu' : 'Open menu'}
      style={({ pressed }) => [styles.button, pressed ? { opacity: 0.6 } : null]}
    >
      <View style={styles.iconBox}>
        <Icon size={22} color={colors.text} />
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
});

export default HamburgerButton;
