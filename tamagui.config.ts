import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { tokens } from '@tamagui/themes';
import { theme as appTheme } from './constants/theme';

// Create font configurations
const headingFont = createInterFont();
const bodyFont = createInterFont();

// Create simplified configuration with light theme
const config = createTamagui({
  defaultFont: 'body',
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  
  // Only include the light theme
  themes: {
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
      
      // Standard gray palette for compatibility
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
  },
  
  tokens,
  shorthands,
  
  // Web configuration
  defaultTheme: 'light',
  shouldAddPrefersColorThemes: false, // Disable auto dark/light detection
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
});

// Simple export that avoids TypeScript errors
export type AppConfig = any;

export default config;