// Updated app/workout-detail.tsx using AppHeader and NavigationHelper

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { 
  YStack, 
  ScrollView
} from 'tamagui';
import { exercises, oneADaySplits, twoADaySplits } from '../data/workoutDataRefactored';
import { WorkoutSessionTabs } from '../components/ExerciseCard';
import { useAppTheme } from '../components/ThemeProvider';
import { format } from 'date-fns';
import { AppHeader, WorkoutDetailRouteParams } from '../navigation';

export default function WorkoutDetailScreen() {
  const { colors, spacing, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;

  const { type = 'oneADay', day = '1' } = useLocalSearchParams<WorkoutDetailRouteParams>();

  const dayNumber = parseInt(day) || 1;
  // Ensure type is either 'oneADay' or 'twoADay'
  const validType = (type === 'oneADay' || type === 'twoADay') ? type : 'oneADay';
  const workout = (validType === 'oneADay' ? oneADaySplits : twoADaySplits).find(w => w.day === dayNumber);

  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');
  const workoutTitle = validType === 'twoADay' ? `Dual Day ${dayNumber}` : workout?.title || '';

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ 
        paddingTop: isNarrow ? spacing.xlarge : spacing.xxlarge,
        paddingBottom: spacing.xlarge
      }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <YStack 
        paddingHorizontal={isNarrow ? spacing.medium : spacing.large} 
        paddingBottom={isNarrow ? spacing.medium : spacing.large}
      >
        <AppHeader
          date={formattedDate}
          title={workoutTitle}
        />
      </YStack>

      <YStack paddingHorizontal={0} width="100%">
        {workout && (
          <WorkoutSessionTabs workout={workout} exerciseMap={exercises} />
        )}
      </YStack>
    </ScrollView>
  );
}