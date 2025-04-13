// Updated ExerciseCard component using centralized theming
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { 
  Card, 
  XStack, 
  Text,
  YStack
} from 'tamagui';
import { Exercise, OneADayWorkout, TwoADayWorkout } from '../data/workoutData';
import { AbsIcon, BicepCurlIcon, CalfRaiseIcon, ChestPressIcon, LateralRaiseIcon, LegPressIcon, RowIcon } from './ExerciseIcons';
import { useAppTheme } from './ThemeProvider';

export const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  // Use our centralized theme
  const { colors, borderRadius, fontSize, spacing, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  // Get the appropriate icon
  const icon = getResponsiveExerciseIcon(
    exercise.name, 
    isNarrow ? 22 : 30
  );
  
  return (
    <Card
      marginBottom={spacing.medium}
      backgroundColor={colors.card}
      paddingVertical={isNarrow ? spacing.medium : spacing.large}
      paddingHorizontal={isNarrow ? spacing.medium : spacing.large}
      borderRadius={borderRadius.medium}
      elevate
      bordered
      scale={0.97}
      pressStyle={{ scale: 0.95, opacity: 0.9 }}
      onPress={() => {
        // For future implementation: exercise details, tracking, etc.
        console.log(`Tapped on exercise: ${exercise.name}`);
      }}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" flex={1}>
          {icon}
          <Text
            marginLeft={isNarrow ? spacing.medium : spacing.large}
            color={colors.text}
            fontSize={isNarrow ? fontSize.medium : fontSize.large}
            fontWeight="500"
            numberOfLines={1}
            ellipsizeMode="tail"
            flex={1}
          >
            {exercise.name}
          </Text>
        </XStack>
        <Text color={colors.arrow} fontSize={fontSize.xlarge} fontWeight="300">
          ›
        </Text>
      </XStack>
    </Card>
  );
};

// Helper function to render workout exercises
export function getResponsiveExerciseComponent(
  workout: OneADayWorkout | TwoADayWorkout,
  isNarrow: boolean
) {
  const { colors, fontSize, spacing } = useAppTheme();
  
  return (
    <>
      {isOneADayWorkout(workout) ? (
        workout.exercises.map((exercise: Exercise, index: number) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
          />
        ))
      ) : isTwoADayWorkout(workout) ? (
        <>
          {/* AM Exercises */}
          <YStack
            backgroundColor={colors.backgroundAlt}
            padding={spacing.medium}
            marginBottom={spacing.medium}
            borderRadius={isNarrow ? 8 : 12}
          >
            <Text
              color={colors.textSecondary}
              fontSize={isNarrow ? fontSize.small : fontSize.medium}
              fontWeight="700"
              marginBottom={spacing.small}
            >
              🔵 MORNING WORKOUT
            </Text>
            
            {workout.amExercises.map((exercise: Exercise, index: number) => (
              <ExerciseCard
                key={`am-${index}`}
                exercise={exercise}
              />
            ))}
          </YStack>
          
          {/* PM Exercises */}
          <YStack
            backgroundColor={colors.backgroundAlt}
            padding={spacing.medium}
            borderRadius={isNarrow ? 8 : 12}
          >
            <Text
              color={colors.textSecondary}
              fontSize={isNarrow ? fontSize.small : fontSize.medium}
              fontWeight="700"
              marginBottom={spacing.small}
            >
              🟡 EVENING WORKOUT
            </Text>
            
            {workout.pmExercises.map((exercise: Exercise, index: number) => (
              <ExerciseCard
                key={`pm-${index}`}
                exercise={exercise}
              />
            ))}
          </YStack>
        </>
      ) : null}
    </>
  );
}

// Updated getExerciseIcon function to use themed colors
export const getResponsiveExerciseIcon = (name: string, size: number = 30) => {
  if (name.includes('Press') && (name.includes('Chest') || name.includes('Barbell Press'))) {
    return <ChestPressIcon size={size} />;
  } else if (name.includes('Leg Press')) {
    return <LegPressIcon size={size} />;
  } else if (name.includes('Row')) {
    return <RowIcon size={size} />;
  } else if (name.includes('Lateral') || name.includes('Raises')) {
    return <LateralRaiseIcon size={size} />;
  } else if (name.includes('Curl')) {
    return <BicepCurlIcon size={size} />;
  } else if (name.includes('Calf') || name.includes('Tibia')) {
    return <CalfRaiseIcon size={size} />;
  } else if (name.includes('Ab') || name.includes('Chair')) {
    return <AbsIcon size={size} />;
  } else {
    // Default icon
    return <ChestPressIcon size={size} />;
  }
};

// Type guard functions 
const isOneADayWorkout = (workout: OneADayWorkout | TwoADayWorkout): workout is OneADayWorkout => {
  return 'exercises' in workout;
};

const isTwoADayWorkout = (workout: OneADayWorkout | TwoADayWorkout): workout is TwoADayWorkout => {
  return 'amExercises' in workout && 'pmExercises' in workout;
};