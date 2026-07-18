// components/RealTime/WorkoutNotifications.tsx - Real-time workout notifications
import React, { useState, useEffect } from 'react';
import { Animated, Platform } from 'react-native';
import { YStack, XStack, Text, Button, Card } from 'tamagui';
import { Bell, X, User, Radio, Share2, Trophy } from '@tamagui/lucide-icons';
import { useRealTime } from '../../context/RealTimeContext';
import { useAppTheme } from '../ThemeProvider';
import { WorkoutShare, LiveWorkoutSession } from '../../services/realTimeWorkoutService';

interface NotificationItem {
  id: string;
  type: 'workout_shared' | 'live_started' | 'live_completed' | 'milestone';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
  read: boolean;
}

export function WorkoutNotifications() {
  const { colors, spacing } = useAppTheme();
  const {
    sharedWorkouts,
    liveSessions,
    markShareAsRead
  } = useRealTime();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Convert real-time data to notifications
  useEffect(() => {
    const newNotifications: NotificationItem[] = [];

    // Add shared workout notifications
    sharedWorkouts
      .filter(share => !share.readAt)
      .forEach(share => {
        newNotifications.push({
          id: `share_${share.id}`,
          type: 'workout_shared',
          title: 'New Workout Shared',
          message: `${share.sharedByName} shared a ${share.workoutData.splitType} workout with you`,
          timestamp: share.createdAt,
          data: share,
          read: false
        });
      });

    // Add live session notifications
    liveSessions
      .filter(session => session.isActive)
      .forEach(session => {
        newNotifications.push({
          id: `live_${session.id}`,
          type: 'live_started',
          title: 'Friend Started Live Workout',
          message: `${session.displayName} is working out live - ${session.currentExercise}`,
          timestamp: session.startedAt,
          data: session,
          read: false
        });
      });

    // Sort by timestamp (newest first)
    newNotifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setNotifications(newNotifications);

    // Show notification popup if there are new notifications
    if (newNotifications.length > 0 && !showNotifications) {
      showNotificationPopup();
    }
  }, [sharedWorkouts, liveSessions]);

  const showNotificationPopup = () => {
    setShowNotifications(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideNotificationPopup();
    }, 5000);
  };

  const hideNotificationPopup = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNotifications(false);
    });
  };

  const handleNotificationTap = async (notification: NotificationItem) => {
    if (notification.type === 'workout_shared' && notification.data) {
      await markShareAsRead(notification.data.id);
      // Navigate to shared workout detail
      console.log('Navigate to shared workout:', notification.data.id);
    } else if (notification.type === 'live_started' && notification.data) {
      // Navigate to live workout viewer
      console.log('Navigate to live workout:', notification.data.id);
    }

    hideNotificationPopup();
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'workout_shared':
        return <Share2 size={16} color={colors.primary} />;
      case 'live_started':
        return <Radio size={16} color={colors.success} />;
      case 'live_completed':
        return <Trophy size={16} color={colors.warning} />;
      default:
        return <Bell size={16} color={colors.textMuted} />;
    }
  };

  if (!showNotifications || notifications.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 60,
        left: spacing.medium,
        right: spacing.medium,
        zIndex: 1000,
        opacity: fadeAnim,
      }}
    >
      <Card
        backgroundColor={colors.cardBackground}
        borderColor={colors.border}
        borderWidth={1}
        padding={spacing.medium}
        shadowColor={colors.shadow}
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.1}
        shadowRadius={8}
        elevation={8}
      >
        <YStack space={spacing.small}>
          {/* Header */}
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" space={spacing.small}>
              <Bell size={20} color={colors.primary} />
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                Notifications
              </Text>
              {notifications.length > 0 && (
                <YStack
                  backgroundColor={colors.primary}
                  minWidth={20}
                  height={20}
                  borderRadius={10}
                  alignItems="center"
                  justifyContent="center"
                  paddingHorizontal={spacing.xsmall}
                >
                  <Text fontSize={10} color={colors.cardBackground} fontWeight="600">
                    {notifications.length}
                  </Text>
                </YStack>
              )}
            </XStack>

            <Button
              size="$2"
              circular
              backgroundColor="transparent"
              onPress={hideNotificationPopup}
              pressStyle={{ opacity: 0.7 }}
            >
              <X size={16} color={colors.textMuted} />
            </Button>
          </XStack>

          {/* Notification List */}
          <YStack space={spacing.small} maxHeight={300}>
            {notifications.slice(0, 3).map((notification) => (
              <Button
                key={notification.id}
                backgroundColor="transparent"
                borderWidth={0}
                padding={0}
                onPress={() => handleNotificationTap(notification)}
                justifyContent="flex-start"
                pressStyle={{ opacity: 0.7 }}
              >
                <XStack
                  alignItems="flex-start"
                  space={spacing.small}
                  padding={spacing.small}
                  backgroundColor={colors.cardAlt}
                  borderRadius={8}
                  width="100%"
                >
                  <YStack paddingTop={2}>
                    {getNotificationIcon(notification.type)}
                  </YStack>
                  
                  <YStack flex={1} space={spacing.xsmall}>
                    <Text fontSize={14} fontWeight="600" color={colors.text}>
                      {notification.title}
                    </Text>
                    <Text fontSize={12} color={colors.textMuted} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text fontSize={10} color={colors.textMuted}>
                      {formatTimeAgo(notification.timestamp)}
                    </Text>
                  </YStack>
                </XStack>
              </Button>
            ))}

            {notifications.length > 3 && (
              <XStack alignItems="center" justifyContent="center" paddingTop={spacing.small}>
                <Text fontSize={12} color={colors.textMuted}>
                  +{notifications.length - 3} more notifications
                </Text>
              </XStack>
            )}
          </YStack>

          {/* Actions */}
          <XStack space={spacing.small} marginTop={spacing.small}>
            <Button
              flex={1}
              size="$2"
              variant="outlined"
              onPress={() => {
                // Navigate to notifications screen
                console.log('Navigate to all notifications');
                hideNotificationPopup();
              }}
            >
              View All
            </Button>
            
            <Button
              flex={1}
              size="$2"
              theme="blue"
              onPress={hideNotificationPopup}
            >
              Got it
            </Button>
          </XStack>
        </YStack>
      </Card>
    </Animated.View>
  );
}

// Hook for showing toast notifications
export function useWorkoutNotifications() {
  const { sharedWorkouts, liveSessions } = useRealTime();
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  useEffect(() => {
    const unreadShares = sharedWorkouts.filter(share => !share.readAt).length;
    const activeLiveSessions = liveSessions.filter(session => session.isActive).length;
    const totalNotifications = unreadShares + activeLiveSessions;

    if (totalNotifications > lastNotificationCount && lastNotificationCount > 0) {
      // New notification received
      showToastNotification();
    }

    setLastNotificationCount(totalNotifications);
  }, [sharedWorkouts, liveSessions, lastNotificationCount]);

  const showToastNotification = () => {
    // Simple toast notification for new updates
    if (Platform.OS === 'web') {
      // For web, could use browser notifications API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Armandotfit', {
          body: 'You have new workout updates!',
          icon: '/icon.png'
        });
      }
    }
  };

  return {
    requestNotificationPermission: async () => {
      if (Platform.OS === 'web' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }
    }
  };
}