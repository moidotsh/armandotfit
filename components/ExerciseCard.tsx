// Updated ExerciseCard component - NO CONSTRAINING BOX
import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { 
  Card, 
  XStack, 
  Text,
  YStack,
  Button
} from 'tamagui';
import { Sun, Moon } from '@tamagui/lucide-icons';
import { Exercise, OneADayWorkout, TwoADayWorkout } from '../data/workoutData';
import { AbsIcon, BicepCurlIcon, CalfRaiseIcon, ChestPressIcon, LateralRaiseIcon, LegPressIcon, RowIcon } from './ExerciseIcons';
import { useAppTheme } from './ThemeProvider';

export const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  // Use our centralized theme
  const { colors, borderRadius, fontSize, spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  // Get the appropriate icon
  const icon = getResponsiveExerciseIcon(
    exercise.name, 
    isNarrow ? 22 : 30
  );
  
  return (
    <Card
      marginBottom={spacing.small}
      backgroundColor={colors.card}
      paddingVertical={isNarrow ? spacing.medium : spacing.large}
      paddingHorizontal={isNarrow ? spacing.medium : spacing.large}
      borderRadius={borderRadius.medium}
      elevate
      bordered
      scale={0.97}
      pressStyle={{ scale: 0.95, opacity: 0.9 }}
      onPress={() => {
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

// Helper function to render workout exercises - COMPLETELY REMOVED BOX
export function getResponsiveExerciseComponent(
  workout: OneADayWorkout | TwoADayWorkout,
  isNarrow: boolean
) {
  const { colors, fontSize, spacing, borderRadius } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'am' | 'pm'>('am');
  
  return (
    <>
      {isOneADayWorkout(workout) ? (
        // One-A-Day workout rendering
        workout.exercises.map((exercise: Exercise, index: number) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
          />
        ))
      ) : isTwoADayWorkout(workout) ? (
        // Two-A-Day workout with tabs only - NO BOX
        <>
          {/* Just tabs - no container connection */}
          <XStack width="95%" marginBottom={spacing.medium}  alignSelf='center'>
            <Button
              chromeless
              style={{
                backgroundColor: activeTab === 'am' ? colors.buttonBackground : colors.backgroundAlt,
                borderTopLeftRadius: borderRadius.medium,
                borderBottomLeftRadius: borderRadius.medium,
                paddingVertical: spacing.small,
                flex: 1,
              }}
              onPress={() => setActiveTab('am')}
              focusStyle={{}}
            >
              <XStack alignItems="center" space={spacing.small} justifyContent="center">
                <Sun 
                  size={22} 
                  color={activeTab === 'am' ? 'white' : colors.textMuted} 
                />
                <Text 
                  color={activeTab === 'am' ? 'white' : colors.textMuted}
                  fontWeight="600"
                  fontSize={fontSize.medium}
                >
                  AM
                </Text>
              </XStack>
            </Button>
            
            <Button
              chromeless
              style={{
                backgroundColor: activeTab === 'pm' ? colors.buttonBackground : colors.backgroundAlt,
                borderTopRightRadius: borderRadius.medium,
                borderBottomRightRadius: borderRadius.medium,
                paddingVertical: spacing.small,
                flex: 1,
              }}
              onPress={() => setActiveTab('pm')}
              focusStyle={{}}
            >
              <XStack alignItems="center" space={spacing.small} justifyContent="center">
                <Moon 
                  size={22} 
                  color={activeTab === 'pm' ? 'white' : colors.textMuted} 
                />
                <Text 
                  color={activeTab === 'pm' ? 'white' : colors.textMuted}
                  fontWeight="600"
                  fontSize={fontSize.medium}
                >
                  PM
                </Text>
              </XStack>
            </Button>
          </XStack>
          
          {/* Render selected exercises with NO CONTAINER */}
          {activeTab === 'am' ? (
            workout.amExercises.map((exercise: Exercise, index: number) => (
              <ExerciseCard
                key={`am-${index}`}
                exercise={exercise}
              />
            ))
          ) : (
            workout.pmExercises.map((exercise: Exercise, index: number) => (
              <ExerciseCard
                key={`pm-${index}`}
                exercise={exercise}
              />
            ))
          )}
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