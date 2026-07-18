// components/RealTime/SharedWorkoutCard.tsx - Shared workout display component
import React from 'react';
import { YStack, XStack, Text, Button, Card } from 'tamagui';
import { User, Calendar, Clock, Target, MessageCircle, CheckCircle } from '@tamagui/lucide-icons';
import { WorkoutShare } from '../../services/realTimeWorkoutService';
import { useAppTheme } from '../ThemeProvider';

interface SharedWorkoutCardProps {
  share: WorkoutShare;
  onView?: () => void;
  onMarkAsRead?: () => void;
  onReply?: () => void;
}

export function SharedWorkoutCard({ 
  share, 
  onView,
  onMarkAsRead,
  onReply 
}: SharedWorkoutCardProps) {
  const { colors, spacing } = useAppTheme();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const isUnread = !share.readAt;

  return (
    <Card
      backgroundColor={colors.cardBackground}
      borderColor={isUnread ? colors.primary : colors.border}
      borderWidth={isUnread ? 2 : 1}
      padding={spacing.medium}
      marginBottom={spacing.small}
      opacity={isUnread ? 1 : 0.8}
    >
      <YStack space={spacing.small}>
        {/* Header with sender info and read status */}
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" space={spacing.small}>
            <User size={20} color={colors.text} />
            <YStack>
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                {share.sharedByName}
              </Text>
              <Text fontSize={12} color={colors.textMuted}>
                Shared a workout • {formatDate(share.createdAt)}
              </Text>
            </YStack>
          </XStack>
          
          {isUnread ? (
            <YStack
              backgroundColor={colors.primary}
              width={12}
              height={12}
              borderRadius={6}
            />
          ) : (
            <CheckCircle size={16} color={colors.success} />
          )}
        </XStack>

        {/* Message if provided */}
        {share.message && (
          <XStack alignItems="flex-start" space={spacing.small}>
            <MessageCircle size={16} color={colors.textMuted} />
            <YStack flex={1}>
              <Text fontSize={14} color={colors.text} fontStyle="italic">
                "{share.message}"
              </Text>
            </YStack>
          </XStack>
        )}

        {/* Workout details */}
        <YStack space={spacing.xsmall}>
          <XStack alignItems="center" space={spacing.small}>
            <Calendar size={16} color={colors.primary} />
            <Text fontSize={14} fontWeight="500" color={colors.text}>
              {share.workoutData.splitType} • Day {share.workoutData.day}
            </Text>
          </XStack>
          
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" space={spacing.xsmall}>
              <Target size={14} color={colors.textMuted} />
              <Text fontSize={12} color={colors.textMuted}>
                {share.workoutData.exercises.length} exercises
              </Text>
            </XStack>
            
            <XStack alignItems="center" space={spacing.xsmall}>
              <Clock size={14} color={colors.textMuted} />
              <Text fontSize={12} color={colors.textMuted}>
                {formatDuration(share.workoutData.duration)}
              </Text>
            </XStack>
          </XStack>
          
          {/* Exercise preview */}
          <XStack flexWrap="wrap" gap={spacing.xsmall} marginTop={spacing.xsmall}>
            {share.workoutData.exercises.slice(0, 3).map((exercise, index) => (
              <YStack
                key={index}
                backgroundColor={colors.cardAlt}
                paddingHorizontal={spacing.small}
                paddingVertical={spacing.xsmall}
                borderRadius={4}
              >
                <Text fontSize={10} color={colors.textMuted}>
                  {exercise}
                </Text>
              </YStack>
            ))}
            
            {share.workoutData.exercises.length > 3 && (
              <YStack
                backgroundColor={colors.cardAlt}
                paddingHorizontal={spacing.small}
                paddingVertical={spacing.xsmall}
                borderRadius={4}
              >
                <Text fontSize={10} color={colors.textMuted}>
                  +{share.workoutData.exercises.length - 3} more
                </Text>
              </YStack>
            )}
          </XStack>
        </YStack>

        {/* Actions */}
        <XStack space={spacing.small} marginTop={spacing.small}>
          <Button
            flex={1}
            theme="blue"
            onPress={onView}
            size="$3"
          >
            View Workout
          </Button>
          
          {isUnread && (
            <Button
              variant="outlined"
              onPress={onMarkAsRead}
              size="$3"
            >
              Mark as Read
            </Button>
          )}
          
          <Button
            variant="outlined"
            onPress={onReply}
            size="$3"
          >
            Reply
          </Button>
        </XStack>
      </YStack>
    </Card>
  );
}