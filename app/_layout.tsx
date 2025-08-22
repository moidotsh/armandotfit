// app/_layout.tsx - Updated with Authentication and ConstrainedLayout
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';
import { ThemeProvider } from '../components/ThemeProvider';
import { AuthProvider } from '../context/AuthContext';
import { WorkoutDataProvider } from '../context/WorkoutDataContext';
import { RealTimeProvider } from '../context/RealTimeContext';
import { ConstrainedLayout } from '../components/ConstrainedLayout';
import { theme } from '../constants/theme';
import { Platform } from 'react-native';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AuthGuard } from '../components/AuthGuard';

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
        <AuthProvider>
          <WorkoutDataProvider>
            <RealTimeProvider>
              <ConstrainedLayout>
              <AuthGuard>
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
                <Stack.Screen 
                  name="exercise-detail" 
                  options={{
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen 
                  name="settings" 
                  options={{
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen 
                  name="live-feed" 
                  options={{
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen 
                  name="progression" 
                  options={{
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen 
                  name="exercise-database" 
                  options={{
                    animation: 'slide_from_right',
                  }}
                />
                {/* Auth screens - these should be accessible without authentication */}
                <Stack.Screen 
                  name="auth/login" 
                  options={{
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen 
                  name="auth/register" 
                  options={{
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen 
                  name="auth/forgot-password" 
                  options={{
                    animation: 'slide_from_right',
                  }}
                />
              </Stack>
              </AuthGuard>
            </ConstrainedLayout>
            </RealTimeProvider>
          </WorkoutDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </TamaguiProvider>
  );
}