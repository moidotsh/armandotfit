// Updated app/workout-detail.tsx - Enhanced workout logging system

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { 
  YStack, 
  ScrollView,
  Button,
  Text
} from 'tamagui';
import { WorkoutSessionManager } from '../components/Workout/WorkoutSessionManager';
import { WorkoutSession } from '../types/workout';
import { useWorkoutData } from '../context/WorkoutDataContext';
import { useAppTheme } from '../components/ThemeProvider';
import { format } from 'date-fns';
import { AppHeader, WorkoutDetailRouteParams, NavigationPath } from '../navigation';

export default function WorkoutDetailScreen() {
  const { colors, spacing, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const { saveWorkoutSession } = useWorkoutData();
  const isNarrow = width < 350;

  const { type = 'oneADay', day = '1', session } = useLocalSearchParams<WorkoutDetailRouteParams & { session?: string }>();
  const [showSessionManager, setShowSessionManager] = useState(false);

  const dayNumber = parseInt(day) || 1;
  const validType = (type === 'oneADay' || type === 'twoADay') ? type : 'oneADay';
  const sessionType = session as 'AM' | 'PM' | undefined;

  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');
  
  let workoutTitle = '';
  if (validType === 'twoADay') {
    workoutTitle = `Dual Day ${dayNumber}`;
    if (sessionType) {
      workoutTitle += ` - ${sessionType}`;
    }
  } else {
    workoutTitle = `Day ${dayNumber}`;
  }

  const handleSaveSession = async (workoutSession: WorkoutSession) => {
    try {
      // Convert new WorkoutSession to legacy format for compatibility
      const legacySession = {
        userId: workoutSession.userId,
        date: workoutSession.date,
        splitType: workoutSession.splitType,
        day: workoutSession.day,
        exercises: workoutSession.exercises.map(ex => ex.exerciseName), // Simplified for now
        duration: workoutSession.totalDuration,
        createdAt: workoutSession.createdAt
      };

      await saveWorkoutSession(legacySession);
      router.back(); // Return to home screen
    } catch (error) {
      console.error('Failed to save workout session:', error);
      // Could show error message to user
    }
  };

  const handleCancel = () => {
    setShowSessionManager(false);
    router.back();
  };

  const startWorkout = () => {
    setShowSessionManager(true);
  };

  if (showSessionManager) {
    return (
      <WorkoutSessionManager
        splitType={validType}
        day={dayNumber}
        sessionType={sessionType}
        onSaveSession={handleSaveSession}
        onCancel={handleCancel}
      />
    );
  }

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
        paddingBottom={isNarrow ? spacing.medium : spacing.large}
        space={spacing.large}
      >
        <AppHeader
          date={formattedDate}
          title={workoutTitle}
          currentPath={NavigationPath.WORKOUT_DETAIL}
        />

        {/* Workout Description */}
        <YStack space={spacing.medium}>
          <YStack space={spacing.small}>
            <Text fontSize={18} fontWeight="600" color={colors.text}>
              Ready to Start Your Workout?
            </Text>
            <Text fontSize={14} color={colors.textMuted}>
              Log your sets, reps, and equipment details with our enhanced tracking system.
            </Text>
          </YStack>

          {/* Features List */}
          <YStack space={spacing.small}>
            <Text fontSize={16} fontWeight="500" color={colors.text}>
              What's New:
            </Text>
            <YStack space={spacing.xsmall}>
              <Text fontSize={14} color={colors.textMuted}>
                • Detailed set and rep logging with target ranges
              </Text>
              <Text fontSize={14} color={colors.textMuted}>
                • Equipment tracking (grip, machine type, etc.)
              </Text>
              <Text fontSize={14} color={colors.textMuted}>
                • Exercise categorization and custom exercises
              </Text>
              <Text fontSize={14} color={colors.textMuted}>
                • Rest timers and workout progression tracking
              </Text>
            </YStack>
          </YStack>

          {/* Start Workout Button */}
          <Button
            size="$4"
            theme="blue"
            onPress={startWorkout}
            marginTop={spacing.large}
          >
            Start Enhanced Workout
          </Button>
        </YStack>
      </YStack>
    </ScrollView>
  );
}