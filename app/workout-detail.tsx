// Updated app_workout-detail.tsx

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { 
  YStack, 
  XStack,
  Text, 
  ScrollView,
  Button,
  useTheme
} from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { workoutData, Exercise, OneADayWorkout, TwoADayWorkout } from '../data/workoutData';
import { 
  ChestPressIcon, 
  LegPressIcon, 
  RowIcon, 
  LateralRaiseIcon, 
  BicepCurlIcon, 
  CalfRaiseIcon,
  AbsIcon
} from '../components/ExerciseIcons';
import { ExerciseCard, getResponsiveExerciseIcon, getResponsiveExerciseComponent } from '../components/ExerciseCard';

// Add type guard functions
const isOneADayWorkout = (workout: OneADayWorkout | TwoADayWorkout): workout is OneADayWorkout => {
  return 'exercises' in workout;
};

const isTwoADayWorkout = (workout: OneADayWorkout | TwoADayWorkout): workout is TwoADayWorkout => {
  return 'amExercises' in workout && 'pmExercises' in workout;
};

export default function WorkoutDetailScreen() {
  const theme = useTheme();
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
  
  const isDark = theme.name?.get() == 'dark';
  const textColor = '#FFFFFF'; // White text for dark cards
  const subtitleColor = '#FF9500';
  const cardColor = '#222222'; // Dark cards 
  const arrowColor = '#555555'; // Dark arrow
  
  // Function to get the appropriate icon based on exercise name
  const getExerciseIcon = (name: string, color: string, size: number = 30) => {
    return getResponsiveExerciseIcon(name, color, size);
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={isNarrow ? 50 : 60}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <YStack paddingHorizontal={isNarrow ? 12 : 20} paddingBottom={isNarrow ? 12 : 20}>
        <Button 
          size="$3" 
          circular 
          icon={<ChevronLeft size="$1" />} 
          alignSelf="flex-start" 
          marginBottom={isNarrow ? 12 : 16}
          onPress={() => router.back()}
        />
        <Text
          color={subtitleColor}
          fontSize={isNarrow ? 20 : 24}
          fontWeight="700"
          marginBottom={isNarrow ? 4 : 8}
        >
          TODAY'S
        </Text>
        <Text
          color={textColor}
          fontSize={isNarrow ? 30 : 40}
          fontWeight="700"
          numberOfLines={2} // Allow wrapping for long titles
        >
          {workout.title}
        </Text>
      </YStack>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: isNarrow ? 12 : 16, 
          paddingBottom: 30 
        }}
      >
        <YStack>
          {getResponsiveExerciseComponent(
            workout, 
            getExerciseIcon, 
            textColor, 
            arrowColor, 
            cardColor, 
            isNarrow
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}