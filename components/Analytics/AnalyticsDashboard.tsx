// components/Analytics/AnalyticsDashboard.tsx - Analytics dashboard with charts and insights
import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Card, Button, Progress } from 'tamagui';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Calendar,
  Award,
  Activity,
  Zap
} from '@tamagui/lucide-icons';
import { analyticsService, WorkoutAnalytics, WeeklyProgress, ProgressTrend } from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../ThemeProvider';

interface AnalyticsDashboardProps {
  compact?: boolean; // If true, shows a compact version for home screen
}

export function AnalyticsDashboard({ compact = false }: AnalyticsDashboardProps) {
  const { colors, spacing, shadows } = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  
  const [analytics, setAnalytics] = useState<WorkoutAnalytics | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [trends, setTrends] = useState<ProgressTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadAnalytics();
    }
  }, [isAuthenticated, user?.id, selectedPeriod]);

  const loadAnalytics = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const [analyticsData, progressData, trendsData] = await Promise.all([
        analyticsService.getUserAnalytics(user.id),
        analyticsService.getWeeklyProgress(user.id, compact ? 4 : 8),
        analyticsService.getProgressTrends(user.id, selectedPeriod)
      ]);

      setAnalytics(analyticsData);
      setWeeklyProgress(progressData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp size={16} color={colors.success} />;
      case 'decreasing':
        return <TrendingDown size={16} color={colors.error} />;
      default:
        return <Activity size={16} color={colors.textMuted} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return colors.success;
      case 'decreasing':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  if (!isAuthenticated) {
    return (
      <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
        <YStack alignItems="center" space={spacing.small}>
          <BarChart2 size={32} color={colors.textMuted} />
          <Text fontSize={14} color={colors.textMuted} textAlign="center">
            Sign in to view your workout analytics
          </Text>
        </YStack>
      </Card>
    );
  }

  if (loading || !analytics) {
    return (
      <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
        <YStack alignItems="center" space={spacing.small}>
          <Activity size={32} color={colors.textMuted} />
          <Text fontSize={14} color={colors.textMuted}>
            Loading analytics...
          </Text>
        </YStack>
      </Card>
    );
  }

  if (compact) {
    const isGoalAchieved = analytics.weeklyGoalProgress.percentage >= 100;
    
    return (
      <YStack space={spacing.large}>
        {/* Weekly Goal Progress with enhanced design */}
        <Card 
          backgroundColor={colors.cardBackground} 
          padding={spacing.large} 
          {...shadows.small}
        >
          <YStack space={spacing.medium}>
            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" space={spacing.medium}>
                <YStack
                  width={40}
                  height={40}
                  borderRadius={20}
                  backgroundColor={isGoalAchieved ? colors.success : colors.primarySubtle}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Target 
                    size={20} 
                    color={isGoalAchieved ? colors.white : colors.primary} 
                  />
                </YStack>
                <YStack>
                  <Text fontSize={18} fontWeight="700" color={colors.text}>
                    Weekly Goal
                  </Text>
                  <Text fontSize={14} color={colors.textMuted}>
                    {analytics.weeklyGoalProgress.completed} of {analytics.weeklyGoalProgress.target} workouts
                  </Text>
                </YStack>
              </XStack>
              <YStack alignItems="flex-end">
                <Text fontSize={24} fontWeight="700" color={isGoalAchieved ? colors.success : colors.primary}>
                  {analytics.weeklyGoalProgress.percentage}%
                </Text>
                {isGoalAchieved && (
                  <XStack alignItems="center" space={spacing.xsmall}>
                    <Zap size={14} color={colors.success} />
                    <Text fontSize={12} color={colors.success} fontWeight="600">
                      Complete!
                    </Text>
                  </XStack>
                )}
              </YStack>
            </XStack>
            
            <Progress
              value={analytics.weeklyGoalProgress.percentage}
              backgroundColor={colors.cardAlt}
              height={8}
              borderRadius={4}
            >
              <Progress.Indicator 
                backgroundColor={isGoalAchieved ? colors.success : colors.primary} 
                animation="bouncy"
              />
            </Progress>
          </YStack>
        </Card>

        {/* Quick Stats with enhanced cards */}
        <XStack space={spacing.medium}>
          <Card 
            flex={1} 
            backgroundColor={colors.cardBackground} 
            padding={spacing.medium}
            {...shadows.small}
          >
            <YStack alignItems="center" space={spacing.small}>
              <YStack
                width={36}
                height={36}
                borderRadius={18}
                backgroundColor={colors.warning + '20'}
                alignItems="center"
                justifyContent="center"
              >
                <Award size={18} color={colors.warning} />
              </YStack>
              <Text fontSize={12} color={colors.textMuted} fontWeight="500">Current Streak</Text>
              <Text fontSize={20} fontWeight="700" color={colors.text}>
                {analytics.currentStreak}
              </Text>
            </YStack>
          </Card>
          
          <Card 
            flex={1} 
            backgroundColor={colors.cardBackground} 
            padding={spacing.medium}
            {...shadows.small}
          >
            <YStack alignItems="center" space={spacing.small}>
              <YStack
                width={36}
                height={36}
                borderRadius={18}
                backgroundColor={colors.info + '20'}
                alignItems="center"
                justifyContent="center"
              >
                <Clock size={18} color={colors.info} />
              </YStack>
              <Text fontSize={12} color={colors.textMuted} fontWeight="500">Avg Time</Text>
              <Text fontSize={20} fontWeight="700" color={colors.text}>
                {analytics.averageWorkoutDuration}m
              </Text>
            </YStack>
          </Card>
          
          <Card 
            flex={1} 
            backgroundColor={colors.cardBackground} 
            padding={spacing.medium}
            {...shadows.small}
          >
            <YStack alignItems="center" space={spacing.small}>
              <YStack
                width={36}
                height={36}
                borderRadius={18}
                backgroundColor={colors.primary + '20'}
                alignItems="center"
                justifyContent="center"
              >
                <BarChart2 size={18} color={colors.primary} />
              </YStack>
              <Text fontSize={12} color={colors.textMuted} fontWeight="500">Total</Text>
              <Text fontSize={20} fontWeight="700" color={colors.text}>
                {analytics.totalWorkouts}
              </Text>
            </YStack>
          </Card>
        </XStack>
      </YStack>
    );
  }

  return (
    <YStack space={spacing.medium}>
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" space={spacing.small}>
          <BarChart2 size={24} color={colors.primary} />
          <Text fontSize={20} fontWeight="600" color={colors.text}>
            Analytics
          </Text>
        </XStack>
        
        {trends && (
          <XStack alignItems="center" space={spacing.xsmall}>
            {getTrendIcon(trends.trend)}
            <Text fontSize={12} color={getTrendColor(trends.trend)}>
              {trends.changePercentage > 0 ? '+' : ''}{trends.changePercentage}%
            </Text>
          </XStack>
        )}
      </XStack>

      {/* Main Stats Grid */}
      <XStack space={spacing.small}>
        <Card flex={1} backgroundColor={colors.cardBackground} padding={spacing.medium}>
          <YStack alignItems="center" space={spacing.small}>
            <BarChart2 size={24} color={colors.primary} />
            <Text fontSize={12} color={colors.textMuted}>Total Workouts</Text>
            <Text fontSize={20} fontWeight="600" color={colors.text}>
              {analytics.totalWorkouts}
            </Text>
          </YStack>
        </Card>
        
        <Card flex={1} backgroundColor={colors.cardBackground} padding={spacing.medium}>
          <YStack alignItems="center" space={spacing.small}>
            <Clock size={24} color={colors.textMuted} />
            <Text fontSize={12} color={colors.textMuted}>Total Time</Text>
            <Text fontSize={20} fontWeight="600" color={colors.text}>
              {formatDuration(analytics.totalDuration)}
            </Text>
          </YStack>
        </Card>
        
        <Card flex={1} backgroundColor={colors.cardBackground} padding={spacing.medium}>
          <YStack alignItems="center" space={spacing.small}>
            <Award size={24} color={colors.warning} />
            <Text fontSize={12} color={colors.textMuted}>Best Streak</Text>
            <Text fontSize={20} fontWeight="600" color={colors.text}>
              {analytics.bestStreak}
            </Text>
          </YStack>
        </Card>
      </XStack>

      {/* Weekly Goal Progress */}
      <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
        <YStack space={spacing.medium}>
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" space={spacing.small}>
              <Target size={20} color={colors.primary} />
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                Weekly Goal Progress
              </Text>
            </XStack>
            <Text fontSize={14} color={colors.textMuted}>
              {analytics.weeklyGoalProgress.completed}/{analytics.weeklyGoalProgress.target} workouts
            </Text>
          </XStack>
          
          <Progress
            value={analytics.weeklyGoalProgress.percentage}
            backgroundColor={colors.cardAlt}
          >
            <Progress.Indicator backgroundColor={colors.primary} />
          </Progress>
          
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize={12} color={colors.textMuted}>
              {analytics.weeklyGoalProgress.percentage}% complete
            </Text>
            {analytics.weeklyGoalProgress.percentage >= 100 && (
              <XStack alignItems="center" space={spacing.xsmall}>
                <Zap size={14} color={colors.success} />
                <Text fontSize={12} color={colors.success} fontWeight="600">
                  Goal achieved!
                </Text>
              </XStack>
            )}
          </XStack>
        </YStack>
      </Card>

      {/* Insights */}
      <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
        <YStack space={spacing.medium}>
          <Text fontSize={16} fontWeight="600" color={colors.text}>
            Insights
          </Text>
          
          <YStack space={spacing.small}>
            <XStack alignItems="center" space={spacing.small}>
              <Calendar size={16} color={colors.textMuted} />
              <Text fontSize={14} color={colors.text}>
                Most active on {analytics.mostActiveDay}s
              </Text>
            </XStack>
            
            <XStack alignItems="center" space={spacing.small}>
              <Clock size={16} color={colors.textMuted} />
              <Text fontSize={14} color={colors.text}>
                Prefers {analytics.mostActiveTimeOfDay} workouts
              </Text>
            </XStack>
            
            <XStack alignItems="center" space={spacing.small}>
              <Activity size={16} color={colors.textMuted} />
              <Text fontSize={14} color={colors.text}>
                Average {analytics.averageWorkoutDuration} minutes per workout
              </Text>
            </XStack>
          </YStack>
          
          {analytics.favoriteExercises.length > 0 && (
            <YStack space={spacing.small}>
              <Text fontSize={14} fontWeight="500" color={colors.text}>
                Favorite Exercises:
              </Text>
              <XStack flexWrap="wrap" gap={spacing.xsmall}>
                {analytics.favoriteExercises.slice(0, 3).map((exercise, index) => (
                  <YStack
                    key={index}
                    backgroundColor={colors.cardAlt}
                    paddingHorizontal={spacing.small}
                    paddingVertical={spacing.xsmall}
                    borderRadius={4}
                  >
                    <Text fontSize={12} color={colors.textMuted}>
                      {exercise}
                    </Text>
                  </YStack>
                ))}
              </XStack>
            </YStack>
          )}
        </YStack>
      </Card>

      {/* Period Selection for Trends */}
      <XStack space={spacing.small}>
        {(['week', 'month', 'quarter'] as const).map((period) => (
          <Button
            key={period}
            flex={1}
            size="$2"
            theme={selectedPeriod === period ? 'blue' : undefined}
            variant={selectedPeriod === period ? undefined : 'outlined'}
            onPress={() => setSelectedPeriod(period)}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Button>
        ))}
      </XStack>
    </YStack>
  );
}