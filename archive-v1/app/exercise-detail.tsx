// app/exercise-detail.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { 
  YStack, 
  Card,
  Text,
  XStack,
  ScrollView
} from 'tamagui';
import { exercises } from '../data/workoutDataRefactored';
import { useAppTheme } from '../components/ThemeProvider';
import { format } from 'date-fns';
import { AppHeader, NavigationPath } from '../navigation';
import { getExerciseIconFromCategory } from '../components/ExerciseCard';

export default function ExerciseDetailScreen() {
  const { colors, fontSize, spacing, borderRadius, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;

  // Get exercise ID from URL params
  const params = useLocalSearchParams<{ id: string, from: string }>();
  const { id = '' } = params;
  
  console.log('Exercise detail page params:', params);
  console.log('Exercise ID:', id);
  
  // Find the exercise data
  const exercise = exercises[id];
  console.log('Found exercise:', exercise ? 'Yes' : 'No');
  
  // If exercise not found, show a placeholder
  if (!exercise) {
    return (
      <YStack 
        flex={1} 
        backgroundColor={colors.background}
        paddingTop={isNarrow ? spacing.xlarge : spacing.xxlarge}
        paddingHorizontal={isNarrow ? spacing.medium : spacing.large}
        alignItems="center"
        justifyContent="center"
      >
        <Text color={colors.text} fontSize={fontSize.large}>
          Exercise not found
        </Text>
      </YStack>
    );
  }
  
  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');
  
  // Get the appropriate icon for this exercise category
  const icon = getExerciseIconFromCategory(exercise.category, isNarrow ? 35 : 45);

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ 
        paddingTop: isNarrow ? spacing.xlarge : spacing.xxlarge,
        paddingBottom: spacing.xlarge
      }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <YStack 
        paddingHorizontal={isNarrow ? spacing.medium : spacing.large} 
        paddingBottom={isNarrow ? spacing.large : spacing.xlarge}
      >
        <AppHeader
          date={formattedDate}
          title={exercise.category}
          currentPath={NavigationPath.EXERCISE_DETAIL}
        />
        
        <Card
          backgroundColor={colors.card}
          padding={spacing.large}
          borderRadius={borderRadius.medium}
          marginTop={spacing.medium}
          elevate
        >
          <YStack space={spacing.medium}>
            <XStack alignItems="center" space={spacing.medium}>
              {icon}
              <YStack>
                <Text
                  color={colors.text}
                  fontSize={isNarrow ? fontSize.xlarge : 32}
                  fontWeight="700"
                >
                  {exercise.name}
                </Text>
                {exercise.extra && (
                  <Text
                    color={colors.textMuted}
                    fontSize={fontSize.medium}
                    fontStyle="italic"
                  >
                    {exercise.extra}
                  </Text>
                )}
              </YStack>
            </XStack>
            
            {/* Sets and Reps */}
            {exercise.sets && exercise.reps && (
              <YStack 
                backgroundColor={colors.cardAlt} 
                padding={spacing.medium}
                borderRadius={borderRadius.medium}
                marginTop={spacing.small}
              >
                <XStack justifyContent="space-between" marginBottom={spacing.small}>
                  <Text color={colors.textMuted} fontSize={fontSize.medium} fontWeight="500">
                    Sets
                  </Text>
                  <Text color={colors.text} fontSize={fontSize.medium} fontWeight="700">
                    {exercise.sets}
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color={colors.textMuted} fontSize={fontSize.medium} fontWeight="500">
                    Reps
                  </Text>
                  <Text color={colors.text} fontSize={fontSize.medium} fontWeight="700">
                    {exercise.reps[0]}–{exercise.reps[1]}
                  </Text>
                </XStack>
              </YStack>
            )}
            
            {/* Placeholder for future content */}
            <YStack marginTop={spacing.large} space={spacing.medium}>
              <Text color={colors.text} fontSize={fontSize.medium} fontWeight="600">
                Tips
              </Text>
              <Text color={colors.textMuted} fontSize={fontSize.medium}>
                • Focus on proper form throughout the movement
              </Text>
              <Text color={colors.textMuted} fontSize={fontSize.medium}>
                • Control the eccentric (lowering) phase
              </Text>
              <Text color={colors.textMuted} fontSize={fontSize.medium}>
                • Maintain consistent tempo for optimal results
              </Text>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}