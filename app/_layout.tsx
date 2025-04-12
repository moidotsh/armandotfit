import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { TamaguiProvider } from 'tamagui';
import { useColorScheme } from 'react-native';
import config from '../tamagui.config';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    // You can add custom fonts here if needed
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#121212' : '#F5F5F5',
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
    </TamaguiProvider>
  );
}