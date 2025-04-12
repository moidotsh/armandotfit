// File location: ./tamagui.config.ts
import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens } from '@tamagui/themes';

const headingFont = createInterFont();
const bodyFont = createInterFont();

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