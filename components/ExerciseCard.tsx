// Updated ExerciseCard component for better responsiveness
// This replaces the existing implementation in app_workout-detail.tsx

import React from 'react';
import { useWindowDimensions } from 'react-native';
import { 
  Card, 
  XStack, 
  Text,
  useTheme
} from 'tamagui';
import { Exercise, OneADayWorkout, TwoADayWorkout } from '../data/workoutData';
import { AbsIcon, BicepCurlIcon, CalfRaiseIcon, ChestPressIcon, LateralRaiseIcon, LegPressIcon, RowIcon } from './ExerciseIcons';

export const ExerciseCard = ({ exercise, icon, textColor, arrowColor, cardColor }: { 
  exercise: Exercise; 
  icon: React.ReactNode;
  textColor: string;
  arrowColor: string;
  cardColor: string;
}) => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  return (
    <Card
      marginBottom={10}
      backgroundColor={cardColor}
      paddingVertical={isNarrow ? 16 : 22}
      paddingHorizontal={isNarrow ? 14 : 20}
      borderRadius={15}
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
            marginLeft={isNarrow ? 12 : 16}
            color={textColor}
            fontSize={isNarrow ? 17 : 22}
            fontWeight="500"
            numberOfLines={1}
            ellipsizeMode="tail"
            flex={1}
          >
            {exercise.name}
          </Text>
        </XStack>
        <Text color={arrowColor} fontSize={28} fontWeight="300">
          ›
        </Text>
      </XStack>
    </Card>
  );
};

// Updated WorkoutDetailScreen with responsive adjustments
export function getResponsiveExerciseComponent(
  workout: OneADayWorkout | TwoADayWorkout,
  getExerciseIcon: (name: string, color: string, size?: number) => React.ReactNode,
  textColor: string,
  arrowColor: string,
  cardColor: string,
  isNarrow: boolean
) {
  return (
    <>
      {isOneADayWorkout(workout) ? (
        workout.exercises.map((exercise: Exercise, index: number) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
            icon={getExerciseIcon(exercise.name, '#FFFFFF', isNarrow ? 22 : 30)}
            textColor={textColor}
            arrowColor={arrowColor}
            cardColor={cardColor}
          />
        ))
      ) : isTwoADayWorkout(workout) ? (
        <>
          {/* AM Exercises */}
          <Text
            color="#FF9500"
            fontSize={isNarrow ? 16 : 18}
            fontWeight="700"
            marginTop={isNarrow ? 12 : 16}
            marginBottom={isNarrow ? 8 : 12}
            paddingHorizontal={4}
          >
            🔵 MORNING WORKOUT
          </Text>
          {workout.amExercises.map((exercise: Exercise, index: number) => (
            <ExerciseCard
              key={`am-${index}`}
              exercise={exercise}
              icon={getExerciseIcon(exercise.name, '#FFFFFF', isNarrow ? 22 : 30)}
              textColor={textColor}
              arrowColor={arrowColor}
              cardColor={cardColor}
            />
          ))}
          
          {/* PM Exercises */}
          <Text
            color="#FF9500"
            fontSize={isNarrow ? 16 : 18}
            fontWeight="700"
            marginTop={isNarrow ? 16 : 24}
            marginBottom={isNarrow ? 8 : 12}
            paddingHorizontal={4}
          >
            🟡 EVENING WORKOUT
          </Text>
          {workout.pmExercises.map((exercise: Exercise, index: number) => (
            <ExerciseCard
              key={`pm-${index}`}
              exercise={exercise}
              icon={getExerciseIcon(exercise.name, '#FFFFFF', isNarrow ? 22 : 30)}
              textColor={textColor}
              arrowColor={arrowColor}
              cardColor={cardColor}
            />
          ))}
        </>
      ) : null}
    </>
  );
}

// Updated getExerciseIcon function to support responsive sizing
export const getResponsiveExerciseIcon = (name: string, color: string, size: number = 30) => {
  if (name.includes('Press') && name.includes('Chest') || name.includes('Barbell Press')) {
    return <ChestPressIcon color={color} size={size} />;
  } else if (name.includes('Leg Press')) {
    return <LegPressIcon color={color} size={size} />;
  } else if (name.includes('Row')) {
    return <RowIcon color={color} size={size} />;
  } else if (name.includes('Lateral') || name.includes('Raises')) {
    return <LateralRaiseIcon color={color} size={size} />;
  } else if (name.includes('Curl')) {
    return <BicepCurlIcon color={color} size={size} />;
  } else if (name.includes('Calf') || name.includes('Tibia')) {
    return <CalfRaiseIcon color={color} size={size} />;
  } else if (name.includes('Ab') || name.includes('Chair')) {
    return <AbsIcon color={color} size={size} />;
  } else {
    // Default icon
    return <ChestPressIcon color={color} size={size} />;
  }
};

// Type guard functions (unchanged)
const isOneADayWorkout = (workout: OneADayWorkout | TwoADayWorkout): workout is OneADayWorkout => {
  return 'exercises' in workout;
};

const isTwoADayWorkout = (workout: OneADayWorkout | TwoADayWorkout): workout is TwoADayWorkout => {
  return 'amExercises' in workout && 'pmExercises' in workout;
};