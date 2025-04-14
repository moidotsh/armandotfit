import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';
import { ThemeProvider } from '../components/ThemeProvider';
import { theme } from '../constants/theme';
import { Platform } from 'react-native';
import { LoadingScreen } from '@/components/LoadingScreen';

// Prevent splash screen from hiding prematurely
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({});
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      const timeout = setTimeout(() => {
        SplashScreen.hideAsync();
        setAppReady(true);
      }, 200); // Delay to avoid FOUC (flash of unstyled content)
      return () => clearTimeout(timeout);
    }
  }, [fontsLoaded]);

  // Force light mode for web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark-theme');
      document.documentElement.classList.add('light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  if (!appReady) {
    return <LoadingScreen />;
  }

  const backgroundColor = theme.colors.light.background;

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <ThemeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="workout-detail"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="split-selection"
            options={{ animation: 'slide_from_right' }}
          />
        </Stack>
      </ThemeProvider>
    </TamaguiProvider>
  );
}
