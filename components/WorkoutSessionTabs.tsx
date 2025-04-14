// components/WorkoutSessionTabs.tsx

import React, { useState } from 'react';
import { XStack, Text, Button } from 'tamagui';
import { Sun, Moon } from '@tamagui/lucide-icons';
import { Exercise } from '@/data/workoutDataRefactored';
import { ExerciseCard } from './ExerciseCard';
import { useAppTheme } from './ThemeProvider';

interface OneADaySplit {
  day: number;
  title: string;
  exercises: string[];
}

interface TwoADaySplit {
  day: number;
  title: string;
  am: string[];
  pm: string[];
}

interface WorkoutSessionTabsProps {
  workout: OneADaySplit | TwoADaySplit;
  exerciseMap: Record<string, Exercise>;
}

export const WorkoutSessionTabs = ({ workout, exerciseMap }: WorkoutSessionTabsProps) => {
  const { colors, fontSize, spacing, borderRadius } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'am' | 'pm'>('am');

  const renderExercises = (slugs: string[]) => {
    return slugs.map((slug, index) => {
      const exercise = exerciseMap[slug];
      if (!exercise) {
        console.warn(`Unknown exercise slug: ${slug}`);
        return null;
      }
      return <ExerciseCard key={index} exercise={exercise} exerciseMap={exerciseMap} />;
    });
  };

  if ('exercises' in workout) {
    return <>{renderExercises(workout.exercises)}</>;
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
            <Sun size={22} color={activeTab === 'am' ? 'white' : colors.textMuted} />
            <Text color={activeTab === 'am' ? 'white' : colors.textMuted} fontWeight="600" fontSize={fontSize.medium}>
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
            <Moon size={22} color={activeTab === 'pm' ? 'white' : colors.textMuted} />
            <Text color={activeTab === 'pm' ? 'white' : colors.textMuted} fontWeight="600" fontSize={fontSize.medium}>
              PM
            </Text>
          </XStack>
        </Button>
      </XStack>

      {renderExercises(activeTab === 'am' ? workout.am : workout.pm)}
    </>
  );
};