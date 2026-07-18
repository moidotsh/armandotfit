// components/RealTime/LiveWorkoutSession.tsx - Live workout session display component
import React from 'react';
import { YStack, XStack, Text, Button, Card } from 'tamagui';
import { User, Play, Pause, Clock, Target } from '@tamagui/lucide-icons';
import { LiveWorkoutSession } from '../../services/realTimeWorkoutService';
import { useAppTheme } from '../ThemeProvider';

interface LiveWorkoutSessionProps {
  session: LiveWorkoutSession;
  isCurrentUser?: boolean;
  onJoinWatch?: () => void;
  onViewProfile?: () => void;
}

export function LiveWorkoutSessionComponent({ 
  session, 
  isCurrentUser = false,
  onJoinWatch,
  onViewProfile 
}: LiveWorkoutSessionProps) {
  const { colors, spacing } = useAppTheme();

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    if (session.totalExercises === 0) return 0;
    return Math.round((session.exerciseIndex / session.totalExercises) * 100);
  };

  return (
    <Card
      backgroundColor={colors.cardBackground}
      borderColor={isCurrentUser ? colors.primary : colors.border}
      borderWidth={isCurrentUser ? 2 : 1}
      padding={spacing.medium}
      marginBottom={spacing.small}
    >
      <YStack space={spacing.small}>
        {/* Header with user info */}
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" space={spacing.small}>
            <User size={20} color={colors.text} />
            <YStack>
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                {session.displayName}
                {isCurrentUser && (
                  <Text fontSize={14} color={colors.textMuted}> (You)</Text>
                )}
              </Text>
              <Text fontSize={12} color={colors.textMuted}>
                {session.splitType} • Day {session.day}
              </Text>
            </YStack>
          </XStack>
          
          <XStack alignItems="center" space={spacing.xsmall}>
            {session.isActive ? (
              <Play size={16} color={colors.success} />
            ) : (
              <Pause size={16} color={colors.textMuted} />
            )}
            <Text fontSize={12} color={session.isActive ? colors.success : colors.textMuted}>
              {session.isActive ? 'LIVE' : 'FINISHED'}
            </Text>
          </XStack>
        </XStack>

        {/* Current exercise and progress */}
        <YStack space={spacing.xsmall}>
          <XStack alignItems="center" space={spacing.xsmall}>
            <Target size={16} color={colors.primary} />
            <Text fontSize={14} fontWeight="500" color={colors.text}>
              {session.currentExercise}
            </Text>
          </XStack>
          
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize={12} color={colors.textMuted}>
              Exercise {session.exerciseIndex + 1} of {session.totalExercises}
            </Text>
            <Text fontSize={12} color={colors.textMuted}>
              {getProgressPercentage()}% complete
            </Text>
          </XStack>
          
          {/* Progress bar */}
          <YStack>
            <YStack
              height={4}
              backgroundColor={colors.cardAlt}
              borderRadius={2}
              overflow="hidden"
            >
              <YStack
                height="100%"
                backgroundColor={colors.primary}
                width={`${getProgressPercentage()}%`}
              />
            </YStack>
          </YStack>
        </YStack>

        {/* Duration and actions */}
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" space={spacing.xsmall}>
            <Clock size={16} color={colors.textMuted} />
            <Text fontSize={14} color={colors.textMuted}>
              {formatDuration(session.duration)}
            </Text>
          </XStack>
          
          {!isCurrentUser && session.isActive && (
            <Button
              size="$2"
              theme="blue"
              onPress={onJoinWatch}
            >
              Watch Live
            </Button>
          )}
          
          {!isCurrentUser && (
            <Button
              size="$2"
              variant="outlined"
              onPress={onViewProfile}
            >
              View Profile
            </Button>
          )}
        </XStack>

        {/* Exercise list preview */}
        {session.isActive && (
          <YStack space={spacing.xsmall}>
            <Text fontSize={12} fontWeight="500" color={colors.textMuted}>
              Today's Exercises:
            </Text>
            <XStack flexWrap="wrap" gap={spacing.xsmall}>
              {session.totalExercises > 0 && (
                <>
                  {/* Show current exercise highlighted */}
                  <YStack
                    backgroundColor={colors.primary}
                    paddingHorizontal={spacing.xsmall}
                    paddingVertical={2}
                    borderRadius={4}
                  >
                    <Text fontSize={10} color={colors.cardBackground}>
                      Current
                    </Text>
                  </YStack>
                  
                  {/* Show remaining count */}
                  <YStack
                    backgroundColor={colors.cardAlt}
                    paddingHorizontal={spacing.xsmall}
                    paddingVertical={2}
                    borderRadius={4}
                  >
                    <Text fontSize={10} color={colors.textMuted}>
                      +{session.totalExercises - session.exerciseIndex - 1} more
                    </Text>
                  </YStack>
                </>
              )}
            </XStack>
          </YStack>
        )}
      </YStack>
    </Card>
  );
}