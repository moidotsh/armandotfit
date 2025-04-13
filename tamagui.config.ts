import { createTamagui, TamaguiConfig } from 'tamagui';
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
    gray1: appTheme.colors.light.textMuted,
    gray2: appTheme.colors.light.textSecondary,
    gray3: appTheme.colors.light.border,
    gray4: appTheme.colors.light.backgroundAlt,
    gray5: appTheme.colors.light.cardAlt,
    gray6: appTheme.colors.light.background,
    gray7: appTheme.colors.light.card,
    gray8: appTheme.colors.light.textMuted,
    gray9: appTheme.colors.light.textSecondary,
    gray10: appTheme.colors.light.textMuted,
    gray11: appTheme.colors.light.textSecondary,
    gray12: appTheme.colors.light.text,
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
    gray1: appTheme.colors.dark.border,
    gray2: appTheme.colors.dark.textSecondary,
    gray3: appTheme.colors.dark.textMuted,
    gray4: appTheme.colors.dark.cardAlt,
    gray5: appTheme.colors.dark.card,
    gray6: appTheme.colors.dark.backgroundAlt,
    gray7: appTheme.colors.dark.background,
    gray8: appTheme.colors.dark.textMuted,
    gray9: appTheme.colors.dark.textSecondary,
    gray10: appTheme.colors.dark.textMuted,
    gray11: appTheme.colors.dark.textSecondary,
    gray12: appTheme.colors.dark.text,
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
  
  // Add these web-specific settings
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

export type AppConfig = typeof config;

export default config;