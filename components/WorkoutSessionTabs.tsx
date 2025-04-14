// components/WorkoutSessionTabs.tsx

import React, { useState } from 'react';
import { XStack, Text, Button } from 'tamagui';
import { Sun, Moon } from '@tamagui/lucide-icons';
import { OneADayWorkout, TwoADayWorkout, Exercise } from '../data/workoutData';
import { ExerciseCard } from './ExerciseCard';
import { useAppTheme } from './ThemeProvider';

interface WorkoutSessionTabsProps {
  workout: OneADayWorkout | TwoADayWorkout;
}

export const WorkoutSessionTabs = ({ workout }: WorkoutSessionTabsProps) => {
  const { colors, fontSize, spacing, borderRadius } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'am' | 'pm'>('am');

  if ('exercises' in workout) {
    return (
      <>
        {workout.exercises.map((exercise: Exercise, index: number) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <XStack width="100%" marginBottom={spacing.medium} alignSelf='center' scale={0.97}>
        <Button
          chromeless
          style={{
            backgroundColor: activeTab === 'am' ? colors.buttonBackground : colors.backgroundAlt,
            borderTopLeftRadius: borderRadius.medium,
            borderBottomLeftRadius: borderRadius.medium,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
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
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
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
  );
};