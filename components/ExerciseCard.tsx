// components/ExerciseCard.tsx
import { useWindowDimensions } from 'react-native';
import { 
  Card, 
  XStack, 
  Text
} from 'tamagui';
import { Exercise } from '../data/workoutData';
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
