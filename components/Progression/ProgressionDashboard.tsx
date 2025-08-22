// components/Progression/ProgressionDashboard.tsx - Exercise progression analytics dashboard
import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Card, ScrollView, Tabs } from 'tamagui';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Award,
  AlertTriangle,
  BarChart2,
  Zap,
  Minus
} from '@tamagui/lucide-icons';
import { 
  progressionService, 
  ExerciseProgression, 
  PerformanceInsight,
  TrainingLoad,
  StrengthStandards 
} from '../../services/progressionService';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../ThemeProvider';

interface ProgressionDashboardProps {
  exerciseName?: string; // If provided, shows single exercise view
}

export function ProgressionDashboard({ exerciseName }: ProgressionDashboardProps) {
  const { colors, spacing } = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  
  const [progressions, setProgressions] = useState<ExerciseProgression[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [trainingLoad, setTrainingLoad] = useState<TrainingLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseProgression | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadProgressionData();
    }
  }, [isAuthenticated, user?.id, exerciseName]);

  const loadProgressionData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      if (exerciseName) {
        // Single exercise view
        const progression = await progressionService.getExerciseProgression(user.id, exerciseName);
        if (progression) {
          setProgressions([progression]);
          setSelectedExercise(progression);
        }
      } else {
        // All exercises view
        const [allProgressions, performanceInsights, loadData] = await Promise.all([
          progressionService.getAllExerciseProgressions(user.id),
          progressionService.generatePerformanceInsights(user.id),
          progressionService.analyzeTrainingLoad(user.id, 30)
        ]);

        setProgressions(allProgressions);
        setInsights(performanceInsights);
        setTrainingLoad(loadData);
      }
    } catch (error) {
      console.error('Error loading progression data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp size={16} color={colors.success} />;
      case 'decreasing': return <TrendingDown size={16} color={colors.error} />;
      default: return <Minus size={16} color={colors.textMuted} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return colors.success;
      case 'decreasing': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength_gain': return <Award size={16} color={colors.success} />;
      case 'plateau': return <Activity size={16} color={colors.warning} />;
      case 'regression': return <TrendingDown size={16} color={colors.error} />;
      case 'consistency': return <Target size={16} color={colors.primary} />;
      default: return <AlertTriangle size={16} color={colors.textMuted} />;
    }
  };

  const formatWeight = (weight: number): string => {
    return `${weight}lbs`;
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (!isAuthenticated) {
    return (
      <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
        <YStack alignItems="center" space={spacing.small}>
          <BarChart2 size={32} color={colors.textMuted} />
          <Text fontSize={14} color={colors.textMuted} textAlign="center">
            Sign in to view your progression analytics
          </Text>
        </YStack>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
        <YStack alignItems="center" space={spacing.small}>
          <Activity size={32} color={colors.textMuted} />
          <Text fontSize={14} color={colors.textMuted}>
            Loading progression data...
          </Text>
        </YStack>
      </Card>
    );
  }

  if (exerciseName && selectedExercise) {
    // Single exercise detailed view
    return (
      <YStack space={spacing.medium}>
        <ExerciseProgressionDetail exercise={selectedExercise} />
      </YStack>
    );
  }

  // Overview dashboard
  return (
    <YStack space={spacing.medium}>
      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="horizontal">
        <Tabs.List backgroundColor={colors.cardBackground}>
          <Tabs.Tab flex={1} value="overview">Overview</Tabs.Tab>
          <Tabs.Tab flex={1} value="exercises">Exercises</Tabs.Tab>
          <Tabs.Tab flex={1} value="insights">Insights</Tabs.Tab>
          <Tabs.Tab flex={1} value="load">Training Load</Tabs.Tab>
        </Tabs.List>

        <Tabs.Content value="overview" flex={1}>
          <OverviewTab 
            progressions={progressions}
            insights={insights}
            colors={colors}
            spacing={spacing}
            getTrendIcon={getTrendIcon}
            formatWeight={formatWeight}
            formatPercentage={formatPercentage}
          />
        </Tabs.Content>

        <Tabs.Content value="exercises" flex={1}>
          <ExercisesTab 
            progressions={progressions}
            onSelectExercise={setSelectedExercise}
            colors={colors}
            spacing={spacing}
            getTrendIcon={getTrendIcon}
            formatWeight={formatWeight}
            formatPercentage={formatPercentage}
          />
        </Tabs.Content>

        <Tabs.Content value="insights" flex={1}>
          <InsightsTab 
            insights={insights}
            colors={colors}
            spacing={spacing}
            getInsightIcon={getInsightIcon}
          />
        </Tabs.Content>

        <Tabs.Content value="load" flex={1}>
          <TrainingLoadTab 
            trainingLoad={trainingLoad}
            colors={colors}
            spacing={spacing}
          />
        </Tabs.Content>
      </Tabs>
    </YStack>
  );
}

// Overview Tab Component
function OverviewTab({ progressions, insights, colors, spacing, getTrendIcon, formatWeight, formatPercentage }: any) {
  const topProgressions = progressions
    .filter(p => p.progression.weightProgression > 0)
    .sort((a, b) => b.progression.weightProgression - a.progression.weightProgression)
    .slice(0, 3);

  const criticalInsights = insights.filter(i => i.severity === 'critical' || i.severity === 'warning');

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack space={spacing.medium}>
        {/* Summary Stats */}
        <XStack space={spacing.small}>
          <Card flex={1} backgroundColor={colors.cardBackground} padding={spacing.medium}>
            <YStack alignItems="center" space={spacing.small}>
              <BarChart2 size={24} color={colors.primary} />
              <Text fontSize={12} color={colors.textMuted}>Tracked</Text>
              <Text fontSize={18} fontWeight="600" color={colors.text}>
                {progressions.length}
              </Text>
              <Text fontSize={10} color={colors.textMuted}>exercises</Text>
            </YStack>
          </Card>
          
          <Card flex={1} backgroundColor={colors.cardBackground} padding={spacing.medium}>
            <YStack alignItems="center" space={spacing.small}>
              <TrendingUp size={24} color={colors.success} />
              <Text fontSize={12} color={colors.textMuted}>Improving</Text>
              <Text fontSize={18} fontWeight="600" color={colors.text}>
                {progressions.filter(p => p.trends.overallTrend === 'increasing').length}
              </Text>
              <Text fontSize={10} color={colors.textMuted}>exercises</Text>
            </YStack>
          </Card>
          
          <Card flex={1} backgroundColor={colors.cardBackground} padding={spacing.medium}>
            <YStack alignItems="center" space={spacing.small}>
              <AlertTriangle size={24} color={colors.warning} />
              <Text fontSize={12} color={colors.textMuted}>Alerts</Text>
              <Text fontSize={18} fontWeight="600" color={colors.text}>
                {criticalInsights.length}
              </Text>
              <Text fontSize={10} color={colors.textMuted}>issues</Text>
            </YStack>
          </Card>
        </XStack>

        {/* Top Progressions */}
        {topProgressions.length > 0 && (
          <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
            <YStack space={spacing.medium}>
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                🏆 Top Progressions
              </Text>
              {topProgressions.map((progression, index) => (
                <XStack key={progression.exerciseName} alignItems="center" justifyContent="space-between">
                  <YStack flex={1}>
                    <Text fontSize={14} fontWeight="500" color={colors.text}>
                      {progression.exerciseName}
                    </Text>
                    <Text fontSize={12} color={colors.textMuted}>
                      {formatWeight(progression.progression.currentWeight)} • {progression.progression.totalSessions} sessions
                    </Text>
                  </YStack>
                  <XStack alignItems="center" space={spacing.xsmall}>
                    <TrendingUp size={14} color={colors.success} />
                    <Text fontSize={14} fontWeight="600" color={colors.success}>
                      {formatPercentage(progression.progression.weightProgression)}
                    </Text>
                  </XStack>
                </XStack>
              ))}
            </YStack>
          </Card>
        )}

        {/* Critical Insights */}
        {criticalInsights.length > 0 && (
          <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
            <YStack space={spacing.medium}>
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                ⚠️ Attention Needed
              </Text>
              {criticalInsights.slice(0, 3).map((insight, index) => (
                <XStack key={index} alignItems="flex-start" space={spacing.small}>
                  <YStack paddingTop={2}>
                    {getTrendIcon(insight.type)}
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize={14} fontWeight="500" color={colors.text}>
                      {insight.title}
                    </Text>
                    <Text fontSize={12} color={colors.textMuted}>
                      {insight.description}
                    </Text>
                  </YStack>
                </XStack>
              ))}
            </YStack>
          </Card>
        )}
      </YStack>
    </ScrollView>
  );
}

// Exercises Tab Component
function ExercisesTab({ progressions, onSelectExercise, colors, spacing, getTrendIcon, formatWeight, formatPercentage }: any) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack space={spacing.small}>
        {progressions.length === 0 ? (
          <Card backgroundColor={colors.cardAlt} padding={spacing.large}>
            <YStack alignItems="center" space={spacing.small}>
              <BarChart2 size={32} color={colors.textMuted} />
              <Text fontSize={16} color={colors.textMuted} textAlign="center">
                No exercise data yet
              </Text>
              <Text fontSize={14} color={colors.textMuted} textAlign="center">
                Complete some workouts to see your progression
              </Text>
            </YStack>
          </Card>
        ) : (
          progressions.map((progression: ExerciseProgression) => (
            <ExerciseProgressionCard
              key={`${progression.exerciseName}_${JSON.stringify(progression.equipment)}`}
              progression={progression}
              onPress={() => onSelectExercise(progression)}
              colors={colors}
              spacing={spacing}
              getTrendIcon={getTrendIcon}
              formatWeight={formatWeight}
              formatPercentage={formatPercentage}
            />
          ))
        )}
      </YStack>
    </ScrollView>
  );
}

// Exercise Progression Card Component
function ExerciseProgressionCard({ progression, onPress, colors, spacing, getTrendIcon, formatWeight, formatPercentage }: any) {
  return (
    <Button
      backgroundColor="transparent"
      borderWidth={0}
      padding={0}
      onPress={onPress}
      justifyContent="flex-start"
      pressStyle={{ opacity: 0.7 }}
    >
      <Card backgroundColor={colors.cardBackground} padding={spacing.medium} width="100%">
        <YStack space={spacing.small}>
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize={16} fontWeight="600" color={colors.text}>
              {progression.exerciseName}
            </Text>
            <XStack alignItems="center" space={spacing.xsmall}>
              {getTrendIcon(progression.trends.overallTrend)}
              <Text 
                fontSize={12} 
                fontWeight="500" 
                color={progression.progression.weightProgression >= 0 ? colors.success : colors.error}
              >
                {formatPercentage(progression.progression.weightProgression)}
              </Text>
            </XStack>
          </XStack>

          <Text fontSize={12} color={colors.textMuted}>
            {progression.equipment.category}
            {progression.equipment.subType && ` • ${progression.equipment.subType}`}
            {progression.equipment.grip && ` • ${progression.equipment.grip} grip`}
          </Text>

          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" space={spacing.large}>
              <YStack alignItems="center">
                <Text fontSize={10} color={colors.textMuted}>Current</Text>
                <Text fontSize={14} fontWeight="600" color={colors.text}>
                  {formatWeight(progression.progression.currentWeight)}
                </Text>
              </YStack>
              <YStack alignItems="center">
                <Text fontSize={10} color={colors.textMuted}>Max</Text>
                <Text fontSize={14} fontWeight="600" color={colors.text}>
                  {formatWeight(progression.progression.maxWeight)}
                </Text>
              </YStack>
              <YStack alignItems="center">
                <Text fontSize={10} color={colors.textMuted}>Sessions</Text>
                <Text fontSize={14} fontWeight="600" color={colors.text}>
                  {progression.progression.totalSessions}
                </Text>
              </YStack>
            </XStack>

            {/* Consistency Score */}
            <YStack alignItems="center">
              <Text fontSize={10} color={colors.textMuted}>Consistency</Text>
              <Text 
                fontSize={14} 
                fontWeight="600" 
                color={progression.trends.consistencyScore >= 70 ? colors.success : colors.warning}
              >
                {progression.trends.consistencyScore}%
              </Text>
            </YStack>
          </XStack>
        </YStack>
      </Card>
    </Button>
  );
}

// Insights Tab Component
function InsightsTab({ insights, colors, spacing, getInsightIcon }: any) {
  const groupedInsights = insights.reduce((groups: any, insight: PerformanceInsight) => {
    const key = insight.severity;
    if (!groups[key]) groups[key] = [];
    groups[key].push(insight);
    return groups;
  }, {});

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack space={spacing.medium}>
        {insights.length === 0 ? (
          <Card backgroundColor={colors.cardAlt} padding={spacing.large}>
            <YStack alignItems="center" space={spacing.small}>
              <Zap size={32} color={colors.textMuted} />
              <Text fontSize={16} color={colors.textMuted} textAlign="center">
                No insights yet
              </Text>
              <Text fontSize={14} color={colors.textMuted} textAlign="center">
                Keep training to get personalized insights
              </Text>
            </YStack>
          </Card>
        ) : (
          Object.entries(groupedInsights).map(([severity, severityInsights]: [string, any[]]) => (
            <Card key={severity} backgroundColor={colors.cardBackground} padding={spacing.medium}>
              <YStack space={spacing.medium}>
                <Text fontSize={16} fontWeight="600" color={colors.text}>
                  {severity === 'success' && '🎉 Achievements'}
                  {severity === 'warning' && '⚠️ Attention'}
                  {severity === 'critical' && '🚨 Critical'}
                  {severity === 'info' && 'ℹ️ Tips'}
                </Text>
                
                {severityInsights.map((insight, index) => (
                  <YStack key={index} space={spacing.small}>
                    <XStack alignItems="flex-start" space={spacing.small}>
                      <YStack paddingTop={2}>
                        {getInsightIcon(insight.type)}
                      </YStack>
                      <YStack flex={1} space={spacing.xsmall}>
                        <Text fontSize={14} fontWeight="500" color={colors.text}>
                          {insight.title}
                        </Text>
                        <Text fontSize={12} color={colors.textMuted}>
                          {insight.description}
                        </Text>
                        
                        {insight.recommendations && insight.recommendations.length > 0 && (
                          <YStack space={spacing.xsmall} marginTop={spacing.xsmall}>
                            <Text fontSize={12} fontWeight="500" color={colors.text}>
                              Recommendations:
                            </Text>
                            {insight.recommendations.map((rec: string, recIndex: number) => (
                              <Text key={recIndex} fontSize={11} color={colors.textMuted}>
                                • {rec}
                              </Text>
                            ))}
                          </YStack>
                        )}
                      </YStack>
                    </XStack>
                  </YStack>
                ))}
              </YStack>
            </Card>
          ))
        )}
      </YStack>
    </ScrollView>
  );
}

// Training Load Tab Component
function TrainingLoadTab({ trainingLoad, colors, spacing }: any) {
  const recentLoad = trainingLoad.slice(-7); // Last 7 days
  const avgLoad = trainingLoad.length > 0 
    ? trainingLoad.reduce((sum, load) => sum + load.totalVolume, 0) / trainingLoad.length 
    : 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack space={spacing.medium}>
        {/* Load Summary */}
        <XStack space={spacing.small}>
          <Card flex={1} backgroundColor={colors.cardBackground} padding={spacing.medium}>
            <YStack alignItems="center" space={spacing.small}>
              <Activity size={20} color={colors.primary} />
              <Text fontSize={12} color={colors.textMuted}>Avg Volume</Text>
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                {avgLoad.toLocaleString()}
              </Text>
            </YStack>
          </Card>
          
          <Card flex={1} backgroundColor={colors.cardBackground} padding={spacing.medium}>
            <YStack alignItems="center" space={spacing.small}>
              <Target size={20} color={colors.warning} />
              <Text fontSize={12} color={colors.textMuted}>Load Status</Text>
              <Text fontSize={16} fontWeight="600" color={colors.text}>
                {recentLoad.length > 0 ? recentLoad[recentLoad.length - 1].recommendation : 'N/A'}
              </Text>
            </YStack>
          </Card>
        </XStack>

        {/* Recent Training Load */}
        <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
          <YStack space={spacing.medium}>
            <Text fontSize={16} fontWeight="600" color={colors.text}>
              Recent Training Load
            </Text>
            
            {recentLoad.length === 0 ? (
              <Text fontSize={14} color={colors.textMuted}>
                No recent training data
              </Text>
            ) : (
              recentLoad.map((load, index) => (
                <XStack key={index} alignItems="center" justifyContent="space-between">
                  <YStack>
                    <Text fontSize={14} color={colors.text}>
                      {new Date(load.date).toLocaleDateString()}
                    </Text>
                    <Text fontSize={12} color={colors.textMuted}>
                      Volume: {load.totalVolume.toLocaleString()} • Intensity: {load.intensityScore.toFixed(0)}%
                    </Text>
                  </YStack>
                  
                  <YStack alignItems="center">
                    <Text 
                      fontSize={12} 
                      fontWeight="500" 
                      color={
                        load.recommendation === 'increase' ? colors.success :
                        load.recommendation === 'decrease' ? colors.warning :
                        load.recommendation === 'deload' ? colors.error :
                        colors.textMuted
                      }
                    >
                      {load.recommendation.toUpperCase()}
                    </Text>
                    <Text fontSize={10} color={colors.textMuted}>
                      Readiness: {load.readiness.toFixed(0)}%
                    </Text>
                  </YStack>
                </XStack>
              ))
            )}
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}

// Single Exercise Detail Component
function ExerciseProgressionDetail({ exercise }: { exercise: ExerciseProgression }) {
  const { colors, spacing } = useAppTheme();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack space={spacing.medium}>
        {/* Exercise Header */}
        <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
          <YStack space={spacing.small}>
            <Text fontSize={20} fontWeight="600" color={colors.text}>
              {exercise.exerciseName}
            </Text>
            <Text fontSize={14} color={colors.textMuted}>
              {exercise.equipment.category}
              {exercise.equipment.subType && ` • ${exercise.equipment.subType}`}
              {exercise.equipment.grip && ` • ${exercise.equipment.grip} grip`}
              {exercise.equipment.machineType && ` • ${exercise.equipment.machineType}`}
            </Text>
          </YStack>
        </Card>

        {/* Progression Stats */}
        <XStack space={spacing.small}>
          <Card flex={1} backgroundColor={colors.cardBackground} padding={spacing.medium}>
            <YStack alignItems="center" space={spacing.small}>
              <Text fontSize={12} color={colors.textMuted}>Current Weight</Text>
              <Text fontSize={18} fontWeight="600" color={colors.text}>
                {exercise.progression.currentWeight}lbs
              </Text>
            </YStack>
          </Card>
          
          <Card flex={1} backgroundColor={colors.cardBackground} padding={spacing.medium}>
            <YStack alignItems="center" space={spacing.small}>
              <Text fontSize={12} color={colors.textMuted}>Max Weight</Text>
              <Text fontSize={18} fontWeight="600" color={colors.text}>
                {exercise.progression.maxWeight}lbs
              </Text>
            </YStack>
          </Card>
          
          <Card flex={1} backgroundColor={colors.cardBackground} padding={spacing.medium}>
            <YStack alignItems="center" space={spacing.small}>
              <Text fontSize={12} color={colors.textMuted}>Progress</Text>
              <Text 
                fontSize={18} 
                fontWeight="600" 
                color={exercise.progression.weightProgression >= 0 ? colors.success : colors.error}
              >
                {exercise.progression.weightProgression > 0 ? '+' : ''}{exercise.progression.weightProgression.toFixed(1)}%
              </Text>
            </YStack>
          </Card>
        </XStack>

        {/* Recommendations */}
        {exercise.predictions.deloadRecommended && (
          <Card backgroundColor={colors.cardAlt} padding={spacing.medium}>
            <YStack space={spacing.small}>
              <XStack alignItems="center" space={spacing.small}>
                <AlertTriangle size={16} color={colors.warning} />
                <Text fontSize={14} fontWeight="500" color={colors.text}>
                  Deload Recommended
                </Text>
              </XStack>
              <Text fontSize={12} color={colors.textMuted}>
                Consider reducing weight by 10-15% and focusing on form
              </Text>
            </YStack>
          </Card>
        )}

        <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
          <YStack space={spacing.small}>
            <Text fontSize={16} fontWeight="500" color={colors.text}>
              Next Session Recommendation
            </Text>
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize={14} color={colors.textMuted}>
                Recommended Weight:
              </Text>
              <Text fontSize={14} fontWeight="600" color={colors.text}>
                {exercise.predictions.recommendedWeight}lbs
              </Text>
            </XStack>
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize={14} color={colors.textMuted}>
                Target Reps:
              </Text>
              <Text fontSize={14} fontWeight="600" color={colors.text}>
                {exercise.predictions.recommendedReps}
              </Text>
            </XStack>
          </YStack>
        </Card>

        {/* Session History */}
        <Card backgroundColor={colors.cardBackground} padding={spacing.medium}>
          <YStack space={spacing.medium}>
            <Text fontSize={16} fontWeight="600" color={colors.text}>
              Recent Sessions ({exercise.sessions.length})
            </Text>
            
            {exercise.sessions.slice(-5).reverse().map((session, index) => (
              <XStack key={index} alignItems="center" justifyContent="space-between">
                <YStack>
                  <Text fontSize={14} color={colors.text}>
                    {new Date(session.date).toLocaleDateString()}
                  </Text>
                  <Text fontSize={12} color={colors.textMuted}>
                    {session.sets.length} sets • {session.avgReps} avg reps
                  </Text>
                </YStack>
                
                <YStack alignItems="end">
                  <Text fontSize={14} fontWeight="600" color={colors.text}>
                    {session.maxWeight}lbs
                  </Text>
                  <Text fontSize={12} color={colors.textMuted}>
                    Vol: {session.totalVolume.toLocaleString()}
                  </Text>
                </YStack>
              </XStack>
            ))}
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}