// app/live-feed.tsx - Live workout feed screen with real-time updates
import React, { useState, useEffect } from 'react';
import { Platform, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Button, ScrollView, Tabs } from 'tamagui';
import { Users, Radio, Share2, Bell } from '@tamagui/lucide-icons';
import { PageContainer } from '../components/Layout/PageContainer';
import ScreenHeader from '@/components/Layout/ScreenHeader';
import { LiveWorkoutSessionComponent } from '../components/RealTime/LiveWorkoutSession';
import { SharedWorkoutCard } from '../components/RealTime/SharedWorkoutCard';
import { useRealTime } from '../context/RealTimeContext';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../components/ThemeProvider';
import { router } from 'expo-router';

export default function LiveFeedScreen() {
  const { colors, spacing } = useAppTheme();
  const { isAuthenticated, profile } = useAuth();
  const {
    liveSessions,
    currentUserSession,
    sharedWorkouts,
    unreadSharesCount,
    isConnected,
    loading,
    markShareAsRead,
    refreshSharedWorkouts,
    subscribeToLiveSessions
  } = useRealTime();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('live');

  // Demo friend IDs for live sessions (in real app, this would come from friends list)
  const friendIds = ['friend1', 'friend2', 'friend3'];

  useEffect(() => {
    if (isAuthenticated) {
      // Subscribe to live sessions from friends
      subscribeToLiveSessions(friendIds);
    }
  }, [isAuthenticated, subscribeToLiveSessions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSharedWorkouts();
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewSharedWorkout = (shareId: string) => {
    // Navigate to workout detail screen
    router.push(`/workout-detail/${shareId}`);
  };

  const handleMarkAsRead = async (shareId: string) => {
    await markShareAsRead(shareId);
  };

  const handleJoinLiveWorkout = (sessionId: string) => {
    // Navigate to live workout viewer
    router.push(`/live-workout/${sessionId}`);
  };

  const handleStartLiveSession = () => {
    // Navigate to workout with live mode enabled
    router.push('/workout?live=true');
  };

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <ScreenHeader title="Live Feed" showBackButton={true} />
        <YStack flex={1} alignItems="center" justifyContent="center" padding={spacing.large}>
          <Users size={48} color={colors.textMuted} />
          <Text fontSize={18} fontWeight="600" color={colors.text} textAlign="center" marginTop={spacing.medium}>
            Join the Community
          </Text>
          <Text fontSize={14} color={colors.textMuted} textAlign="center" marginTop={spacing.small}>
            Sign in to see live workouts and share your progress with friends.
          </Text>
          <Button
            theme="blue"
            onPress={() => router.push('/auth/sign-in')}
            marginTop={spacing.large}
          >
            Sign In
          </Button>
        </YStack>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ScreenHeader 
        title="Live Feed" 
        showBackButton={true}
        rightElement={
          <XStack alignItems="center" space={spacing.small}>
            {unreadSharesCount > 0 && (
              <XStack alignItems="center" space={spacing.xsmall}>
                <Bell size={16} color={colors.primary} />
                <Text fontSize={12} color={colors.primary} fontWeight="600">
                  {unreadSharesCount}
                </Text>
              </XStack>
            )}
            
            <YStack
              backgroundColor={isConnected ? colors.success : colors.textMuted}
              width={8}
              height={8}
              borderRadius={4}
            />
          </XStack>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="horizontal">
        <Tabs.List backgroundColor={colors.cardBackground} marginHorizontal={spacing.medium}>
          <Tabs.Tab flex={1} value="live">
            <XStack alignItems="center" space={spacing.xsmall}>
              <Radio size={16} />
              <Text>Live Sessions</Text>
            </XStack>
          </Tabs.Tab>
          <Tabs.Tab flex={1} value="shared">
            <XStack alignItems="center" space={spacing.xsmall}>
              <Share2 size={16} />
              <Text>Shared Workouts</Text>
              {unreadSharesCount > 0 && (
                <YStack
                  backgroundColor={colors.primary}
                  minWidth={16}
                  height={16}
                  borderRadius={8}
                  alignItems="center"
                  justifyContent="center"
                  paddingHorizontal={spacing.xsmall}
                >
                  <Text fontSize={10} color={colors.cardBackground} fontWeight="600">
                    {unreadSharesCount}
                  </Text>
                </YStack>
              )}
            </XStack>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Content value="live" flex={1}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              Platform.OS !== 'web' ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              ) : undefined
            }
          >
            <YStack padding={spacing.medium} space={spacing.medium}>
              {/* Start Live Session Button */}
              {!currentUserSession && (
                <Button
                  theme="blue"
                  onPress={handleStartLiveSession}
                  icon={<Radio size={20} />}
                >
                  Start Live Workout
                </Button>
              )}

              {/* Current User Session */}
              {currentUserSession && (
                <YStack>
                  <Text fontSize={16} fontWeight="600" color={colors.text} marginBottom={spacing.small}>
                    Your Live Session
                  </Text>
                  <LiveWorkoutSessionComponent
                    session={currentUserSession}
                    isCurrentUser={true}
                  />
                </YStack>
              )}

              {/* Friends' Live Sessions */}
              {liveSessions.length > 0 && (
                <YStack>
                  <Text fontSize={16} fontWeight="600" color={colors.text} marginBottom={spacing.small}>
                    Friends Working Out
                  </Text>
                  {liveSessions.map((session) => (
                    <LiveWorkoutSessionComponent
                      key={session.id}
                      session={session}
                      onJoinWatch={() => handleJoinLiveWorkout(session.id)}
                      onViewProfile={() => console.log('View profile:', session.userId)}
                    />
                  ))}
                </YStack>
              )}

              {/* Empty State */}
              {liveSessions.length === 0 && !currentUserSession && (
                <YStack alignItems="center" justifyContent="center" padding={spacing.xlarge}>
                  <Radio size={48} color={colors.textMuted} />
                  <Text fontSize={16} fontWeight="600" color={colors.text} textAlign="center" marginTop={spacing.medium}>
                    No Live Sessions
                  </Text>
                  <Text fontSize={14} color={colors.textMuted} textAlign="center" marginTop={spacing.small}>
                    Start a live workout or wait for friends to begin their sessions.
                  </Text>
                </YStack>
              )}
            </YStack>
          </ScrollView>
        </Tabs.Content>

        <Tabs.Content value="shared" flex={1}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              Platform.OS !== 'web' ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              ) : undefined
            }
          >
            <YStack padding={spacing.medium} space={spacing.medium}>
              {sharedWorkouts.length > 0 ? (
                sharedWorkouts.map((share) => (
                  <SharedWorkoutCard
                    key={share.id}
                    share={share}
                    onView={() => handleViewSharedWorkout(share.id)}
                    onMarkAsRead={() => handleMarkAsRead(share.id)}
                    onReply={() => console.log('Reply to share:', share.id)}
                  />
                ))
              ) : (
                <YStack alignItems="center" justifyContent="center" padding={spacing.xlarge}>
                  <Share2 size={48} color={colors.textMuted} />
                  <Text fontSize={16} fontWeight="600" color={colors.text} textAlign="center" marginTop={spacing.medium}>
                    No Shared Workouts
                  </Text>
                  <Text fontSize={14} color={colors.textMuted} textAlign="center" marginTop={spacing.small}>
                    When friends share their workouts with you, they'll appear here.
                  </Text>
                </YStack>
              )}
            </YStack>
          </ScrollView>
        </Tabs.Content>
      </Tabs>
    </PageContainer>
  );
}