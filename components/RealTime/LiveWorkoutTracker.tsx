// components/RealTime/LiveWorkoutTracker.tsx - Component to track live workout progress
import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Card, Progress } from 'tamagui';
import { Radio, Users, Clock, Target, Play, Pause, Square } from '@tamagui/lucide-icons';
import { useRealTime } from '../../context/RealTimeContext';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../ThemeProvider';

interface LiveWorkoutTrackerProps {
  splitType: 'oneADay' | 'twoADay';
  day: number;
  exercises: string[];
  onExerciseChange?: (exerciseIndex: number, exerciseName: string) => void;
  onComplete?: () => void;
}

export function LiveWorkoutTracker({
  splitType,
  day,
  exercises,
  onExerciseChange,
  onComplete
}: LiveWorkoutTrackerProps) {
  const { colors, spacing } = useAppTheme();
  const { isAuthenticated } = useAuth();
  const {
    currentUserSession,
    isLiveSessionActive,
    startLiveSession,
    updateCurrentExercise,
    completeLiveSession
  } = useRealTime();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLiveMode && sessionStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveMode, sessionStartTime]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartLiveSession = async () => {
    if (!isAuthenticated) return;

    try {
      const result = await startLiveSession({
        splitType,
        day,
        exercises
      });

      if (result.success) {
        setIsLiveMode(true);
        setSessionStartTime(new Date());
        setCurrentExerciseIndex(0);
      }
    } catch (error) {
      console.error('Failed to start live session:', error);
    }
  };

  const handleExerciseComplete = async () => {
    if (!isLiveMode || !currentUserSession) return;

    const nextIndex = currentExerciseIndex + 1;

    if (nextIndex < exercises.length) {
      // Move to next exercise
      setCurrentExerciseIndex(nextIndex);
      
      await updateCurrentExercise(nextIndex, exercises[nextIndex]);
      
      if (onExerciseChange) {
        onExerciseChange(nextIndex, exercises[nextIndex]);
      }
    } else {
      // Workout complete
      await handleCompleteWorkout();
    }
  };

  const handleCompleteWorkout = async () => {
    if (!currentUserSession) return;

    const finalSession = {
      id: currentUserSession.id,
      userId: currentUserSession.userId,
      date: new Date().toISOString(),
      splitType,
      day,
      exercises,
      duration: Math.floor(elapsedTime / 60), // Convert to minutes
      createdAt: currentUserSession.startedAt
    };

    await completeLiveSession(finalSession);
    setIsLiveMode(false);
    setSessionStartTime(null);
    setElapsedTime(0);

    if (onComplete) {
      onComplete();
    }
  };

  const getProgressPercentage = (): number => {
    if (exercises.length === 0) return 0;
    return Math.round((currentExerciseIndex / exercises.length) * 100);
  };

  if (!isAuthenticated) {
    return null; // Don't show for unauthenticated users
  }

  return (
    <Card
      backgroundColor={colors.cardBackground}
      borderColor={isLiveMode ? colors.primary : colors.border}
      borderWidth={isLiveMode ? 2 : 1}
      padding={spacing.medium}
      marginBottom={spacing.medium}
    >
      <YStack space={spacing.small}>
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" space={spacing.small}>
            <Radio size={20} color={isLiveMode ? colors.primary : colors.textMuted} />
            <Text fontSize={16} fontWeight="600" color={colors.text}>
              Live Workout
            </Text>
            {isLiveMode && (
              <YStack
                backgroundColor={colors.success}
                paddingHorizontal={spacing.xsmall}
                paddingVertical={2}
                borderRadius={4}
              >
                <Text fontSize={10} color={colors.cardBackground} fontWeight="600">
                  LIVE
                </Text>
              </YStack>
            )}
          </XStack>

          {isLiveMode && (
            <XStack alignItems="center" space={spacing.xsmall}>
              <Clock size={16} color={colors.textMuted} />
              <Text fontSize={14} color={colors.textMuted}>
                {formatTime(elapsedTime)}
              </Text>
            </XStack>
          )}
        </XStack>

        {/* Progress when live */}
        {isLiveMode && (
          <YStack space={spacing.small}>
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize={14} color={colors.text}>
                {exercises[currentExerciseIndex] || 'Starting workout...'}
              </Text>
              <Text fontSize={12} color={colors.textMuted}>
                {currentExerciseIndex + 1} of {exercises.length}
              </Text>
            </XStack>

            <Progress
              value={getProgressPercentage()}
              backgroundColor={colors.cardAlt}
            >
              <Progress.Indicator backgroundColor={colors.primary} />
            </Progress>

            <XStack space={spacing.small}>
              <Button
                flex={1}
                theme="blue"
                onPress={handleExerciseComplete}
                disabled={currentExerciseIndex >= exercises.length}
              >
                {currentExerciseIndex === exercises.length - 1 ? 'Complete Workout' : 'Next Exercise'}
              </Button>

              <Button
                variant="outlined"
                onPress={handleCompleteWorkout}
                icon={<Square size={16} />}
              >
                Stop
              </Button>
            </XStack>
          </YStack>
        )}

        {/* Start button when not live */}
        {!isLiveMode && !isLiveSessionActive && (
          <YStack space={spacing.small}>
            <Text fontSize={12} color={colors.textMuted}>
              Share your workout progress in real-time with friends
            </Text>
            
            <Button
              theme="blue"
              onPress={handleStartLiveSession}
              icon={<Radio size={16} />}
            >
              Start Live Session
            </Button>
          </YStack>
        )}

        {/* Current session info when another session is active */}
        {!isLiveMode && isLiveSessionActive && currentUserSession && (
          <YStack space={spacing.small}>
            <XStack alignItems="center" space={spacing.small}>
              <Pause size={16} color={colors.warning} />
              <Text fontSize={14} color={colors.text}>
                You have another live session active
              </Text>
            </XStack>
            
            <Text fontSize={12} color={colors.textMuted}>
              Complete your current live session before starting a new one
            </Text>
          </YStack>
        )}

        {/* Stats */}
        {exercises.length > 0 && (
          <XStack alignItems="center" justifyContent="space-between" marginTop={spacing.small}>
            <XStack alignItems="center" space={spacing.xsmall}>
              <Target size={14} color={colors.textMuted} />
              <Text fontSize={12} color={colors.textMuted}>
                {exercises.length} exercises
              </Text>
            </XStack>
            
            <XStack alignItems="center" space={spacing.xsmall}>
              <Users size={14} color={colors.textMuted} />
              <Text fontSize={12} color={colors.textMuted}>
                Share with friends
              </Text>
            </XStack>
          </XStack>
        )}
      </YStack>
    </Card>
  );
}