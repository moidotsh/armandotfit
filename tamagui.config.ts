import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes as tamaguiThemes, tokens } from '@tamagui/themes';
import { theme as appTheme } from './constants/theme';
// Make sure to install lucide-react-native
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons';

const headingFont = createInterFont();
const bodyFont = createInterFont();

// Merge default themes with our custom theme values
const themes = {
  ...tamaguiThemes,
  light: {
    ...tamaguiThemes.light,
    background: appTheme.colors.light.background,
    card: appTheme.colors.light.card,
    accent: appTheme.colors.accent,
  },
  dark: {
    ...tamaguiThemes.dark,
    background: appTheme.colors.dark.background,
    card: appTheme.colors.dark.card,
    accent: appTheme.colors.accent,
  },
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
});

export type AppConfig = typeof config;

// Make TypeScript happy
declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;