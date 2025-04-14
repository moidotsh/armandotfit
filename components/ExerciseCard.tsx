// components/ExerciseCard.tsx
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { 
  Card, 
  XStack, 
  YStack,
  Text
} from 'tamagui';
import { ChevronDown, ChevronRight } from '@tamagui/lucide-icons';
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



export const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  const { colors, borderRadius, fontSize, spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  const [pressed, setPressed] = useState(false);

  

  const icon = getExerciseIconFromCategory(
    exercise.category, 
    isNarrow ? 22 : 30
  );

  const categoryLabel = exercise.category.toUpperCase();

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
      onPress={() => setPressed(!pressed)}
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
          {pressed ? (
            <ChevronDown size={fontSize.xlarge} color={colors.arrow} />
          ) : (
            <ChevronRight size={fontSize.xlarge} color={colors.arrow} />
          )}
        </YStack>
      </XStack>
    </Card>
  );
};

export { WorkoutSessionTabs } from './WorkoutSessionTabs';

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