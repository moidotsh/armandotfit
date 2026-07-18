// app.config.ts
// armandotfit is PWA-only (inherited from vellum). Static export produces a
// `dist/` folder that Vercel or any static host can serve; the runtime
// manifest-injection block in `app/_layout.tsx` restores the
// `<link rel="manifest">` tag that Expo Web's static-export pipeline strips
// from dist/index.html (load-bearing for PWA installability — see
// docs/architecture/pwa-installability.md).
import type { ExpoConfig, ConfigContext } from '@expo/config';

const config: ExpoConfig = {
  name: 'armandotfit',
  slug: 'armandotfit',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  scheme: 'armandotfit',
  web: {
    output: 'static',
    favicon: './assets/favicon.png',
    bundler: 'metro',
    buildMode: 'production',
    javascriptEnabled: true,
  },
  plugins: ['expo-router', '@react-native-community/datetimepicker', 'expo-secure-store'],
  extra: {
    router: {},
    eas: {
      projectId: '',
    },
  },
};

export default config;
