// Important updates for tamagui.config.ts

import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { tokens } from '@tamagui/themes';
import { theme as appTheme } from './constants/theme';

// Create font configurations
const headingFont = createInterFont();
const bodyFont = createInterFont();

// Define custom theme based on our centralized theme constants
const themes = {
  // Light theme
  light: {
    background: appTheme.colors.light.background,
    backgroundHover: appTheme.colors.light.backgroundAlt,
    backgroundPress: appTheme.colors.light.backgroundAlt,
    backgroundFocus: appTheme.colors.light.backgroundAlt,
    color: appTheme.colors.light.text,
    colorHover: appTheme.colors.light.text,
    colorPress: appTheme.colors.light.text,
    colorFocus: appTheme.colors.light.text,
    borderColor: appTheme.colors.light.border,
    borderColorHover: appTheme.colors.light.border,
    borderColorPress: appTheme.colors.light.border,
    borderColorFocus: appTheme.colors.light.border,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowColorHover: 'rgba(0,0,0,0.2)',
    shadowColorPress: 'rgba(0,0,0,0.3)',
    shadowColorFocus: 'rgba(0,0,0,0.3)',
    
    // App-specific theme colors
    card: appTheme.colors.light.card,
    cardAlt: appTheme.colors.light.cardAlt,
    accent: appTheme.colors.accent,
    accentLight: appTheme.colors.accentLight,
    accentDark: appTheme.colors.accentDark,
    textMuted: appTheme.colors.light.textMuted,
    textSecondary: appTheme.colors.light.textSecondary,
    buttonBackground: appTheme.colors.light.buttonBackground,
    buttonBackgroundDisabled: appTheme.colors.light.buttonBackgroundDisabled,
    iconBackground: appTheme.colors.light.iconBackground,
    toggleBackground: appTheme.colors.light.toggleBackground,
    pill: appTheme.colors.light.pill,
    // Gray scale colors for compatibility
    gray1: '#FFFFFF',
    gray2: '#F5F5F5',
    gray3: '#EEEEEE',
    gray4: '#E0E0E0',
    gray5: '#CCCCCC',
    gray6: '#AAAAAA',
    gray7: '#9E9E9E',
    gray8: '#777777',
    gray9: '#555555',
    gray10: '#333333',
    gray11: '#222222',
    gray12: '#121212',
  },
  
  // Dark theme
  dark: {
    background: appTheme.colors.dark.background,
    backgroundHover: appTheme.colors.dark.backgroundAlt,
    backgroundPress: appTheme.colors.dark.backgroundAlt,
    backgroundFocus: appTheme.colors.dark.backgroundAlt,
    color: appTheme.colors.dark.text,
    colorHover: appTheme.colors.dark.text,
    colorPress: appTheme.colors.dark.text,
    colorFocus: appTheme.colors.dark.text,
    borderColor: appTheme.colors.dark.border,
    borderColorHover: appTheme.colors.dark.border,
    borderColorPress: appTheme.colors.dark.border,
    borderColorFocus: appTheme.colors.dark.border,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowColorHover: 'rgba(0,0,0,0.4)',
    shadowColorPress: 'rgba(0,0,0,0.5)',
    shadowColorFocus: 'rgba(0,0,0,0.5)',
    
    // App-specific theme colors
    card: appTheme.colors.dark.card,
    cardAlt: appTheme.colors.dark.cardAlt,
    accent: appTheme.colors.accent,
    accentLight: appTheme.colors.accentLight,
    accentDark: appTheme.colors.accentDark,
    textMuted: appTheme.colors.dark.textMuted,
    textSecondary: appTheme.colors.dark.textSecondary,
    buttonBackground: appTheme.colors.dark.buttonBackground,
    buttonBackgroundDisabled: appTheme.colors.dark.buttonBackgroundDisabled,
    iconBackground: appTheme.colors.dark.iconBackground,
    toggleBackground: appTheme.colors.dark.toggleBackground,
    pill: appTheme.colors.dark.pill,
    // Gray scale colors for compatibility
    gray1: '#121212',
    gray2: '#222222',
    gray3: '#333333',
    gray4: '#555555',
    gray5: '#777777',
    gray6: '#9E9E9E',
    gray7: '#AAAAAA',
    gray8: '#CCCCCC',
    gray9: '#E0E0E0',
    gray10: '#EEEEEE',
    gray11: '#F5F5F5',
    gray12: '#FFFFFF',
  }
};

const config = createTamagui({
  defaultFont: 'body',
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes,
  tokens,
  shorthands,
  
  // Critical for web
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  
  // Media queries for responsive design
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
  
  // Additional settings for better web performance
  defaultProps: {
    Stack: {
      fullscreen: true,
    },
  },
});

// Simple export with any type to avoid circular references
export type AppConfig = any;

// No module augmentation to avoid TypeScript errors
// The config will still work correctly at runtime

export default config;