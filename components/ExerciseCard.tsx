// Updated ExerciseCard component - NO CONSTRAINING BOX with glitch-style icons
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
import { 
  AbsIconAlt, 
  ArmsIcon, 
  BackIcon, 
  ChestIcon, 
  LowerLegIcon, 
  ShouldersIcon, 
  UpperLegIcon 
} from './ExerciseIcons';
import { useAppTheme } from './ThemeProvider';

export const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  const { colors, borderRadius, fontSize, spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;

  const icon = getExerciseIconFromCategory(
    exercise.category, 
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
      pressStyle={{  opacity: 0.9 }}
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

export function getResponsiveExerciseComponent(
  workout: OneADayWorkout | TwoADayWorkout,
  isNarrow: boolean
) {
  const { colors, fontSize, spacing, borderRadius } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'am' | 'pm'>('am');

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
          <XStack width="95%" marginBottom={spacing.medium} alignSelf='center'>
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
      ) : null}
    </>
  );
}

export const getExerciseIconFromCategory = (category: string, size: number = 30) => {
  switch (category.toLowerCase()) {
    case 'chest': return <ChestIcon size={size} />;
    case 'arms': return <ArmsIcon size={size} />;
    case 'shoulders': return <ShouldersIcon size={size} />;
    case 'back':
    case 'back/shoulders': return <BackIcon size={size} />;
    case 'upperleg': return <UpperLegIcon size={size} />;
    case 'lowerleg': return <LowerLegIcon size={size} />;
    case 'abs': return <AbsIconAlt size={size} />;
    default: return <ChestIcon size={size} />;
  }
};

const isOneADayWorkout = (workout: OneADayWorkout | TwoADayWorkout): workout is OneADayWorkout => {
  return 'exercises' in workout;
};

const isTwoADayWorkout = (workout: OneADayWorkout | TwoADayWorkout): workout is TwoADayWorkout => {
  return 'amExercises' in workout && 'pmExercises' in workout;
};
