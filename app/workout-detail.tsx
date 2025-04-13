// Updated app/workout-detail.tsx using centralized theming

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { 
  YStack, 
  Button,
  Text,
  XStack,
  ScrollView
} from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { workoutData } from '../data/workoutData';
import { getResponsiveExerciseComponent } from '../components/ExerciseCard';
import { useAppTheme } from '../components/ThemeProvider';

export default function WorkoutDetailScreen() {
  // Use our centralized theming system
  const { colors, fontSize, spacing, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  const { type = 'oneADay', day = '1' } = useLocalSearchParams<{ 
    type?: 'oneADay' | 'twoADay',
    day?: string 
  }>();
  
  const dayNumber = parseInt(day) || 1;
  
  // Get the workout data based on type and day
  const workoutType = type === 'oneADay' ? workoutData.oneADay : workoutData.twoADay;
  const workout = workoutType.find(w => w.day === dayNumber) || workoutType[0];

  return (
    <YStack 
      flex={1} 
      backgroundColor={colors.background} 
      paddingTop={isNarrow ? spacing.xlarge : spacing.xxlarge}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <YStack 
        paddingHorizontal={isNarrow ? spacing.medium : spacing.large} 
        paddingBottom={isNarrow ? spacing.medium : spacing.large}
      >
        <Button 
          size="$3" 
          circular 
          icon={<ChevronLeft size="$1" />} 
          alignSelf="flex-start" 
          marginBottom={isNarrow ? spacing.medium : spacing.large}
          onPress={() => router.back()}
        />
        <Text
          color={colors.textSecondary}
          fontSize={isNarrow ? fontSize.large : fontSize.xlarge}
          fontWeight="700"
          marginBottom={isNarrow ? spacing.xs : spacing.small}
        >
          TODAY'S
        </Text>
        <Text
          color={colors.text}
          fontSize={isNarrow ? fontSize.xlarge : fontSize.xxlarge}
          fontWeight="700"
          numberOfLines={2} // Allow wrapping for long titles
        >
          {workout.title}
        </Text>
      </YStack>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: isNarrow ? spacing.medium : spacing.large, 
          paddingBottom: spacing.xlarge
        }}
      >
        <YStack>
          {getResponsiveExerciseComponent(workout, isNarrow)}
        </YStack>
      </ScrollView>
    </YStack>
  );
}