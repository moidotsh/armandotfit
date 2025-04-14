import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';
import { ThemeProvider } from '../components/ThemeProvider';
import { theme } from '../constants/theme';
import { Platform } from 'react-native';
import { LoadingScreen } from '@/components/LoadingScreen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Always use light theme
  const [loaded] = useFonts({
    // You can add custom fonts here if needed
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
    
    // Force light mode on web
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark-theme');
      document.documentElement.classList.add('light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [loaded]);

  if (!loaded) {
    return <LoadingScreen />; // ⬅️ Use our slick SVG loader here
  }

  // Get the light background color
  const backgroundColor = theme.colors.light.background;

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <ThemeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: {
              backgroundColor,
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen 
            name="workout-detail" 
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="split-selection" 
            options={{
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </ThemeProvider>
    </TamaguiProvider>
  );
}