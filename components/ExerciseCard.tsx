// Updated ExerciseCard component using centralized theming
import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { 
  Card, 
  XStack, 
  Text,
  YStack
} from 'tamagui';
import { Sun, Moon } from '@tamagui/lucide-icons';
import { Exercise, OneADayWorkout, TwoADayWorkout } from '../data/workoutData';
import { AbsIcon, BicepCurlIcon, CalfRaiseIcon, ChestPressIcon, LateralRaiseIcon, LegPressIcon, RowIcon } from './ExerciseIcons';
import { useAppTheme } from './ThemeProvider';

export const ExerciseCard = ({ exercise, isLastItem = false }: { exercise: Exercise, isLastItem?: boolean }) => {
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
      marginBottom={0} // No bottom margin
      backgroundColor={colors.card}
      paddingVertical={isNarrow ? spacing.medium : spacing.large}
      paddingHorizontal={isNarrow ? spacing.medium : spacing.large}
      borderRadius={0} // No border radius for tabbed view cards
      borderBottomLeftRadius={isLastItem ? borderRadius.medium : 0} // Only round bottom corners of last item
      borderBottomRightRadius={isLastItem ? borderRadius.medium : 0}
      borderBottomWidth={!isLastItem ? 1 : 0} // Add separator between items
      borderBottomColor={colors.border}
      elevation={0} // No elevation for cleaner look
      bordered={false}
      scale={1} // No scale effect
      pressStyle={{ opacity: 0.9 }} // Simpler press effect
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

// Session Tab Component for AM/PM workouts
interface SessionTabProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
}

const SessionTab = ({ label, icon, isActive, onPress }: SessionTabProps) => {
  const { colors, spacing, fontSize, borderRadius } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  // Create a styles object we can pass to the YStack
  const tabStyles = {
    flex: 1,
    backgroundColor: isActive ? colors.background : colors.backgroundAlt,
    borderTopLeftRadius: borderRadius.medium,
    borderTopRightRadius: borderRadius.medium,
    borderWidth: 1,
    borderBottomWidth: isActive ? 0 : 1,
    borderColor: colors.border,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    marginBottom: isActive ? -1 : 0,
    zIndex: isActive ? 2 : 1,
    alignItems: "center" as const, // Type assertion for proper alignment type
    justifyContent: "center" as const,
    shadowColor: isActive ? colors.text : 'transparent',
    shadowOffset: { width: 0, height: isActive ? -2 : 0 },
    shadowOpacity: isActive ? 0.1 : 0,
    shadowRadius: isActive ? 3 : 0,
    elevation: isActive ? 3 : 0,
  };
  
  return (
    <YStack {...tabStyles}  onPress={onPress}>
      <XStack alignItems="center" space={spacing.small}>
        {icon}
        <Text 
          color={isActive ? colors.text : colors.textMuted}
          fontWeight={isActive ? '600' : '500'}
          fontSize={isNarrow ? fontSize.small : fontSize.medium}
        >
          {label}
        </Text>
      </XStack>
    </YStack>
  );
};

// Helper function to render workout exercises
export function getResponsiveExerciseComponent(
  workout: OneADayWorkout | TwoADayWorkout,
  isNarrow: boolean
) {
  const { colors, fontSize, spacing, borderRadius } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'am' | 'pm'>('am');
  
  return (
    <>
      {isOneADayWorkout(workout) ? (
        // One-A-Day workout rendering stays the same
        workout.exercises.map((exercise: Exercise, index: number) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
          />
        ))
      ) : isTwoADayWorkout(workout) ? (
        // Two-A-Day workout with tabbed interface
        <>
          {/* Tabs for AM/PM workouts */}
          <XStack width="100%" alignItems="flex-end" marginBottom={0}>
            <SessionTab 
              label={isNarrow ? "AM SESSION" : "MORNING SESSION"}
              icon={<Sun 
                size={isNarrow ? 18 : 22} 
                color={activeTab === 'am' ? colors.textSecondary : colors.textMuted} 
              />}
              isActive={activeTab === 'am'}
              onPress={() => setActiveTab('am')}
            />
            
            <SessionTab 
              label={isNarrow ? "PM SESSION" : "EVENING SESSION"}
              icon={<Moon 
                size={isNarrow ? 18 : 22} 
                color={activeTab === 'pm' ? colors.textSecondary : colors.textMuted} 
              />}
              isActive={activeTab === 'pm'}
              onPress={() => setActiveTab('pm')}
            />
          </XStack>
          
          {/* Content container */}
          <YStack 
            backgroundColor={colors.background}
            borderWidth={1}
            borderColor={colors.border}
            borderTopWidth={0}
            borderBottomLeftRadius={borderRadius.medium}
            borderBottomRightRadius={borderRadius.medium}
            padding={spacing.medium}
            minHeight={300} // Ensure consistent height between tabs
          >
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