// app/progression.tsx - Exercise progression analytics screen
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { YStack } from 'tamagui';
import { PageContainer } from '../components/Layout/PageContainer';
import ScreenHeader from '@/components/Layout/ScreenHeader';
import { ProgressionDashboard } from '../components/Progression/ProgressionDashboard';
import { useAppTheme } from '../components/ThemeProvider';

export default function ProgressionScreen() {
  const { isDark } = useAppTheme();

  return (
    <PageContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScreenHeader
        title="Progression Analytics"
        showBackButton={true}
      />

      <YStack flex={1}>
        <ProgressionDashboard />
      </YStack>
    </PageContainer>
  );
}