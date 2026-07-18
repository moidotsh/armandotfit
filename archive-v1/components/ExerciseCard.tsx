// components/ExerciseCard.tsx
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { 
  Card, 
  XStack, 
  YStack,
  Text
} from 'tamagui';
import { ChevronRight } from '@tamagui/lucide-icons';
import { Exercise } from '@/data/workoutDataRefactored';
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

// Find the exercise ID (slug) by its properties
const findExerciseId = (exercise: Exercise, exerciseMap: Record<string, Exercise>): string => {
  console.log('Looking for exercise:', exercise.name, exercise.category);
  
  for (const [id, ex] of Object.entries(exerciseMap)) {
    if (ex.name === exercise.name && ex.category === exercise.category) {
      console.log('Found matching exercise ID:', id);
      return id;
    }
  }
  
  console.log('No matching exercise ID found');
  return '';
};

export const ExerciseCard = ({ 
  exercise,
  exerciseMap
}: { 
  exercise: Exercise;
  exerciseMap: Record<string, Exercise>;
}) => {
  const { colors, borderRadius, fontSize, spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  const [pressed, setPressed] = useState(false);

  const icon = getExerciseIconFromCategory(
    exercise.category, 
    isNarrow ? 22 : 30
  );

  const categoryLabel = exercise.category.toUpperCase();
  const exerciseId = findExerciseId(exercise, exerciseMap);

  const handlePress = () => {
    if (exerciseId) {
      console.log('Found exercise ID:', exerciseId);
      console.log('Navigating to:', `/exercise-detail?id=${exerciseId}&from=workout-detail`);
      
      // Most direct approach possible
      router.push(`/exercise-detail?id=${exerciseId}&from=workout-detail`);
    } else {
      console.log('No exercise ID found');
      setPressed(!pressed);
    }
  };

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
      pressStyle={{ opacity: 0.9 }}
      onPress={handlePress}
    >
      <XStack alignItems="flex-start" justifyContent="space-between">
        <XStack alignItems="center" flex={1}>
          {icon}
          <YStack marginLeft={isNarrow ? spacing.medium : spacing.large} flex={1}>
            <Text
              fontSize={fontSize.small}
              color={colors.textMuted}
              fontWeight="600"
              marginBottom={2}
            >
              {categoryLabel}:
            </Text>
            <Text
              color={colors.text}
              fontSize={isNarrow ? fontSize.medium : fontSize.large}
              fontWeight="500"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {exercise.name}
            </Text>
            {exercise.extra && (
              <Text
                color={colors.textMuted}
                fontSize={fontSize.small}
                fontStyle="italic"
              >
                {exercise.extra}
              </Text>
            )}
          </YStack>
        </XStack>

        <YStack alignItems="flex-end">
          {(exercise.sets && exercise.reps) && (
            <Text
              color={colors.textMuted}
              fontSize={fontSize.small}
              marginBottom={2}
            >
              {exercise.sets} × {exercise.reps[0]}–{exercise.reps[1]}
            </Text>
          )}
          <ChevronRight size={fontSize.xlarge} color={colors.arrow} />
        </YStack>
      </XStack>
    </Card>
  );
};


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