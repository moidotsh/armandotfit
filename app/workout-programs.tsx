// app/workout-programs.tsx - Enhanced screen to display all workout programs

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, Dimensions } from 'react-native';
import { 
  YStack, 
  XStack,
  Text, 
  Card, 
  useTheme,
  Button,
  Accordion,
  Square,
  Progress,
  Separator
} from 'tamagui';
import { ChevronDown, ChevronRight, Dumbbell, Calendar, Clock, Target, Zap, User, TrendingUp, Star, Lock } from '@tamagui/lucide-icons';
import { useAppTheme } from '../components/ThemeProvider';
import { exercises, oneADaySplits, twoADaySplits } from '../data/workoutDataRefactored';
import { router } from 'expo-router';
import { AppHeader, NavigationPath } from '../navigation';

const { width: screenWidth } = Dimensions.get('window');

type WorkoutType = 'oneADay' | 'twoADay';
type ProgramType = 'fullbody' | 'fullbody-hf' | 'ppl' | 'bro' | 'upperlower' | 'upperlower-hf';

export default function WorkoutProgramsScreen() {
  const { colors, fontSize, spacing, borderRadius, shadows, isDark, getShadow, isNarrow, getSpacing, getFontSize, getBorderRadius } = useAppTheme();
  const theme = useTheme();
  const isDarkMode = theme.name?.get() === 'dark';
  const [selectedProgram, setSelectedProgram] = useState<ProgramType>('fullbody');

  const programInfo: Record<ProgramType, {
    name: string;
    description: string;
    type: WorkoutType;
    enabled: boolean;
    icon: React.ReactNode;
    color: string;
  }> = {
    'fullbody': {
      name: 'Full Body',
      description: 'Classic full body workouts 4 days per week. Perfect for beginners and balanced training.',
      type: 'oneADay',
      enabled: true,
      icon: <User size={16} />,
      color: colors.primary
    },
    'fullbody-hf': {
      name: 'FB High Freq',
      description: 'High frequency full body with AM/PM splits. Advanced protocol for maximum muscle stimulation.',
      type: 'twoADay',
      enabled: true,
      icon: <TrendingUp size={16} />,
      color: colors.warning
    },
    'ppl': {
      name: 'Push Pull Legs',
      description: 'Split training focusing on movement patterns. 3-day rotation with dedicated rest days.',
      type: 'oneADay',
      enabled: false,
      icon: <Target size={16} />,
      color: colors.info
    },
    'bro': {
      name: 'Bro Split',
      description: 'One muscle group per day. Classic bodybuilding split for targeted muscle growth.',
      type: 'oneADay',
      enabled: false,
      icon: <Dumbbell size={16} />,
      color: colors.textMuted
    },
    'upperlower': {
      name: 'Upper Lower',
      description: 'Split between upper and lower body. 4 days per week with balanced frequency.',
      type: 'oneADay',
      enabled: false,
      icon: <Calendar size={16} />,
      color: colors.textMuted
    },
    'upperlower-hf': {
      name: 'UL High Freq',
      description: 'High frequency upper/lower split with AM/PM sessions. Advanced protocol for experienced lifters.',
      type: 'twoADay',
      enabled: false,
      icon: <Zap size={16} />,
      color: colors.textMuted
    }
  };

  const navigateToWorkout = (type: WorkoutType, day: number) => {
    router.push(`/workout-detail?type=${type}&day=${day}`);
  };

  const renderExercise = (exerciseId: string, index: number) => {
    const exercise = exercises[exerciseId];
    if (!exercise) return null;

    // Map categories to two-character abbreviations
    const categoryMap: Record<string, string> = {
      'Chest': 'CH',
      'Arms': 'AR',
      'Shoulders': 'SH',
      'Back': 'BK',
      'UpperLeg': 'UL',
      'LowerLeg': 'LL',
      'Abs': 'AB'
    };

    const categoryColors: Record<string, string> = {
      'Chest': '#E53E3E',
      'Arms': '#805AD5',
      'Shoulders': '#3182CE',
      'Back': '#38A169',
      'UpperLeg': '#D69E2E',
      'LowerLeg': '#DD6B20',
      'Abs': '#ECC94B'
    };

    return (
      <XStack 
        key={exerciseId}
        alignItems="center"
        space={getSpacing('small')}
        paddingVertical={getSpacing('small')}
        paddingHorizontal={getSpacing('medium')}
        backgroundColor={isDarkMode ? '$gray2' : '$gray1'}
        borderRadius={getBorderRadius('small')}
        borderBottomWidth={1}
        borderBottomColor={isDarkMode ? '$gray3' : '$gray2'}
        marginBottom={getSpacing('xsmall')}
      >
        <Square 
          size={24} 
          borderRadius={6}
          backgroundColor={categoryColors[exercise.category] || colors.primary}
          alignItems="center"
          justifyContent="center"
        >
          <Text color="white" fontSize={12} fontWeight="bold">
            {categoryMap[exercise.category] || exercise.category.charAt(0)}
          </Text>
        </Square>
        <YStack flex={1}>
          <XStack alignItems="center" space={getSpacing('xsmall')}>
            <Text 
              fontSize={getFontSize('small')} 
              fontWeight="600" 
              color={isDarkMode ? '$color' : '$color'}
            >
              {exercise.name}
            </Text>
            <Square 
              size={16} 
              borderRadius={8}
              backgroundColor={categoryColors[exercise.category] || colors.primary}
              opacity={0.2}
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={10} color={categoryColors[exercise.category] || colors.primary} fontWeight="bold">
                {index + 1}
              </Text>
            </Square>
          </XStack>
          {exercise.extra && (
            <Text 
              fontSize={getFontSize('xs')} 
              color={isDarkMode ? '$color11' : '$color9'}
              marginTop={2}
            >
              {exercise.extra}
            </Text>
          )}
        </YStack>
        <YStack alignItems="flex-end" space={2}>
          <XStack alignItems="center" space={getSpacing('xsmall')}>
            <Square 
              size={20} 
              borderRadius={4}
              backgroundColor={colors.primary}
              opacity={0.1}
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize={11} color={colors.primary} fontWeight="bold">
                {exercise.sets}
              </Text>
            </Square>
            <Text 
              fontSize={getFontSize('xs')} 
              color={isDarkMode ? '$color11' : '$color9'}
              fontWeight="500"
            >
              {exercise.reps?.[0]}-{exercise.reps?.[1]}
            </Text>
          </XStack>
          <Progress 
            value={(exercise.reps?.[0] || 8) / 20 * 100} 
            width={40}
            height={3}
            backgroundColor={isDarkMode ? '$gray3' : '$gray2'}
          >
            <Progress.Indicator backgroundColor={colors.primary} />
          </Progress>
        </YStack>
      </XStack>
    );
  };

  const renderWorkoutDay = (type: WorkoutType, day: number, title: string, workoutData: any) => {
    // For two-a-day splits, we need to combine am/pm exercises
    const exercises = type === 'twoADay' 
      ? [...(workoutData.am || []), ...(workoutData.pm || [])]
      : workoutData;
      
    const program = programInfo[selectedProgram];
      
    return (
      <Card
        key={`${type}-${day}`}
        bordered={false}
        backgroundColor={isDarkMode ? '$gray2' : '$white'}
        padding={0}
        marginBottom={getSpacing('medium')}
        borderRadius={getBorderRadius('large')}
        overflow="hidden"
        {...getShadow('medium')}
      >
        {/* Header */}
        <XStack 
          alignItems="center" 
          justifyContent="space-between" 
          padding={getSpacing('medium')}
          backgroundColor={isDarkMode ? '$gray3' : '$gray1'}
        >
          <XStack alignItems="center" space={getSpacing('small')}>
            <Square 
              size={32} 
              borderRadius={8}
              backgroundColor={program.color}
              opacity={0.1}
              alignItems="center"
              justifyContent="center"
            >
              <Dumbbell size={16} color={program.color} />
            </Square>
            <YStack>
              <Text 
                fontSize={getFontSize('large')} 
                fontWeight="700" 
                color={isDarkMode ? '$color' : '$color'}
              >
                {title}
              </Text>
              <Text 
                fontSize={getFontSize('small')} 
                color={isDarkMode ? '$color11' : '$color9'}
              >
                {exercises.length} exercises • ~{exercises.length * 5} min
                {type === 'twoADay' && ' • AM/PM Split'}
              </Text>
            </YStack>
          </XStack>
          <Button
            size="$3"
            backgroundColor={program.color}
            color="white"
            fontWeight="600"
            onPress={() => navigateToWorkout(type, day)}
            pressStyle={{ scale: 0.95 }}
            borderRadius={getBorderRadius('medium')}
            paddingHorizontal={getSpacing('medium')}
          >
            Start
          </Button>
        </XStack>

        {/* Exercise List */}
        <Accordion 
          value={[`${type}-${day}`]} 
          type="multiple"
          collapsible
        >
          <Accordion.Item value={`${type}-${day}`}>
            <Accordion.Trigger 
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              padding={getSpacing('medium')}
              backgroundColor="transparent"
              pressStyle={{ backgroundColor: isDarkMode ? '$gray3' : '$gray1' }}
            >
              <XStack alignItems="center" space={getSpacing('xsmall')}>
                <Target size={16} color={isDarkMode ? '$color11' : '$color9'} />
                <Text fontSize={getFontSize('small')} fontWeight="600" color={isDarkMode ? '$color11' : '$color9'}>
                  View Exercises
                </Text>
              </XStack>
              <Accordion.TriggerDown>
                <ChevronDown size={16} color={isDarkMode ? '$color11' : '$color9'} />
              </Accordion.TriggerDown>
              <Accordion.TriggerUp>
                <ChevronRight size={16} color={isDarkMode ? '$color11' : '$color9'} />
              </Accordion.TriggerUp>
            </Accordion.Trigger>
            
            <Accordion.Content 
              backgroundColor={isDarkMode ? '$gray2' : '$white'}
              paddingHorizontal={getSpacing('medium')}
              paddingBottom={getSpacing('medium')}
            >
              {type === 'twoADay' ? (
                <YStack space={getSpacing('large')}>
                  {/* AM Session */}
                  <YStack>
                    <XStack alignItems="center" space={getSpacing('small')} marginBottom={getSpacing('small')}>
                      <Zap size={16} color={program.color} />
                      <Text 
                        fontSize={getFontSize('medium')} 
                        fontWeight="700" 
                        color={program.color}
                      >
                        AM Session
                      </Text>
                      <Square 
                        size={18} 
                        borderRadius={9}
                        backgroundColor={program.color}
                        opacity={0.2}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize={10} color={program.color} fontWeight="bold">
                          {workoutData.am?.length || 0}
                        </Text>
                      </Square>
                    </XStack>
                    <YStack space={getSpacing('xsmall')}>
                      {workoutData.am?.map(renderExercise)}
                    </YStack>
                  </YStack>
                  
                  {/* PM Session */}
                  <YStack>
                    <XStack alignItems="center" space={getSpacing('small')} marginBottom={getSpacing('small')}>
                      <Clock size={16} color={program.color} />
                      <Text 
                        fontSize={getFontSize('medium')} 
                        fontWeight="700" 
                        color={program.color}
                      >
                        PM Session
                      </Text>
                      <Square 
                        size={18} 
                        borderRadius={9}
                        backgroundColor={program.color}
                        opacity={0.2}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize={10} color={program.color} fontWeight="bold">
                          {workoutData.pm?.length || 0}
                        </Text>
                      </Square>
                    </XStack>
                    <YStack space={getSpacing('xsmall')}>
                      {workoutData.pm?.map(renderExercise)}
                    </YStack>
                  </YStack>
                </YStack>
              ) : (
                <YStack space={getSpacing('xsmall')}>
                  {exercises.map((exerciseId: string, index: number) => renderExercise(exerciseId, index))}
                </YStack>
              )}
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </Card>
    );
  };

  const currentProgram = programInfo[selectedProgram];
  const currentSplits = currentProgram.type === 'oneADay' ? oneADaySplits : twoADaySplits;

  return (
    <YStack flex={1} backgroundColor="$background">
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      <AppHeader 
        title="Workout Programs"
        currentPath={NavigationPath.HOME}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          padding: getSpacing('medium'),
          paddingBottom: getSpacing('xlarge') 
        }}
      >
        {/* Program Selector */}
        <Card 
          backgroundColor={isDarkMode ? '$gray2' : '$white'}
          padding={getSpacing('small')}
          borderRadius={getBorderRadius('large')}
          marginBottom={getSpacing('large')}
          {...getShadow('small')}
        >
          <YStack space={getSpacing('small')}>
            <Text 
              fontSize={getFontSize('large')} 
              fontWeight="700" 
              color={isDarkMode ? '$color' : '$color'}
              marginBottom={getSpacing('small')}
            >
              Choose Your Program
            </Text>
            
            <XStack flexWrap="wrap" space={getSpacing('small')}>
              {Object.entries(programInfo).map(([key, program]) => (
                <Button
                  key={key}
                  flexBasis={screenWidth > 380 ? '30%' : '45%'}
                  size="$3"
                  backgroundColor={
                    selectedProgram === key 
                      ? (isDarkMode ? '$gray3' : '$white') 
                      : 'transparent'
                  }
                  borderWidth={1}
                  borderColor={
                    selectedProgram === key 
                      ? program.enabled ? program.color : colors.borderLight
                      : colors.borderLight
                  }
                  color={
                    program.enabled 
                      ? (selectedProgram === key ? program.color : colors.textMuted)
                      : colors.textMuted
                  }
                  fontWeight={selectedProgram === key ? '700' : '500'}
                  borderRadius={getBorderRadius('medium')}
                  pressStyle={{ scale: 0.98, opacity: 0.8 }}
                  disabled={!program.enabled}
                  onPress={() => setSelectedProgram(key as ProgramType)}
                  opacity={program.enabled ? 1 : 0.5}
                >
                  <XStack alignItems="center" space={getSpacing('xsmall')}>
                    {!program.enabled && <Lock size={12} />}
                    {program.icon}
                    <Text fontSize={getFontSize('small')}>{program.name}</Text>
                  </XStack>
                </Button>
              ))}
            </XStack>
          </YStack>
        </Card>

        {/* Program Description */}
        <Card 
          backgroundColor={isDarkMode ? '$gray2' : '$white'}
          padding={getSpacing('medium')}
          borderRadius={getBorderRadius('large')}
          marginBottom={getSpacing('large')}
          {...getShadow('small')}
        >
          <XStack alignItems="flex-start" space={getSpacing('small')} marginBottom={getSpacing('small')}>
            <Square 
              size={24} 
              borderRadius={12}
              backgroundColor={currentProgram.color}
              opacity={0.1}
              alignItems="center"
              justifyContent="center"
            >
              <Text color={currentProgram.color}>{currentProgram.icon}</Text>
            </Square>
            <YStack flex={1}>
              <XStack alignItems="center" space={getSpacing('small')} marginBottom={getSpacing('xsmall')}>
                <Text 
                  fontSize={getFontSize('large')} 
                  fontWeight="700" 
                  color={currentProgram.color}
                >
                  {currentProgram.name}
                </Text>
                {!currentProgram.enabled && (
                  <Square 
                    size={16} 
                    borderRadius={8}
                    backgroundColor={colors.warning}
                    opacity={0.2}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Lock size={8} color={colors.warning} />
                  </Square>
                )}
              </XStack>
              <Text 
                fontSize={getFontSize('small')} 
                color={isDarkMode ? '$color11' : '$color9'}
                lineHeight={20}
              >
                {currentProgram.description}
              </Text>
            </YStack>
          </XStack>
        </Card>

        {/* Quick Stats */}
        <XStack space={getSpacing('medium')} justifyContent="space-between" marginBottom={getSpacing('large')}>
          <Card 
            flex={1} 
            maxWidth={screenWidth * 0.42}
            backgroundColor={isDarkMode ? '$gray2' : '$white'}
            padding={getSpacing('medium')}
            borderRadius={getBorderRadius('large')}
            alignItems="center"
            space={getSpacing('small')}
            {...getShadow('small')}
          >
            <Square 
              size={40} 
              borderRadius={20}
              backgroundColor={currentProgram.color}
              opacity={0.1}
              alignItems="center"
              justifyContent="center"
            >
              <Dumbbell size={20} color={currentProgram.color} />
            </Square>
            <Text fontSize={getFontSize('large')} fontWeight="700" color={currentProgram.color}>
              {currentSplits.length}
            </Text>
            <Text 
              fontSize={getFontSize('small')} 
              color={isDarkMode ? '$color11' : '$color9'}
              textAlign="center"
            >
              Workout Days
            </Text>
          </Card>

          <Card 
            flex={1} 
            maxWidth={screenWidth * 0.42}
            backgroundColor={isDarkMode ? '$gray2' : '$white'}
            padding={getSpacing('medium')}
            borderRadius={getBorderRadius('large')}
            alignItems="center"
            space={getSpacing('small')}
            {...getShadow('small')}
          >
            <Square 
              size={40} 
              borderRadius={20}
              backgroundColor={colors.success}
              opacity={0.1}
              alignItems="center"
              justifyContent="center"
            >
              <Target size={20} color={colors.success} />
            </Square>
            <Text fontSize={getFontSize('large')} fontWeight="700" color={colors.success}>
              {currentProgram.type === 'oneADay' ? '4' : '8'}
            </Text>
            <Text 
              fontSize={getFontSize('small')} 
              color={isDarkMode ? '$color11' : '$color9'}
              textAlign="center"
            >
              Sessions/Week
            </Text>
          </Card>
        </XStack>

        {/* Workout Days */}
        {currentProgram.enabled ? (
          <YStack space={getSpacing('medium')}>
            <Text 
              fontSize={getFontSize('large')} 
              fontWeight="700" 
              color={isDarkMode ? '$color' : '$color'}
              marginBottom={getSpacing('medium')}
            >
              Workout Schedule
            </Text>
            {currentSplits.map((split) => 
              renderWorkoutDay(currentProgram.type, split.day, split.title, currentProgram.type === 'oneADay' ? split.exercises : split)
            )}
          </YStack>
        ) : (
          <Card 
            backgroundColor={isDarkMode ? '$gray2' : '$white'}
            padding={getSpacing('large')}
            borderRadius={getBorderRadius('large')}
            alignItems="center"
            justifyContent="center"
            {...getShadow('small')}
          >
            <Lock size={32} color={colors.textMuted} marginBottom={getSpacing('small')} />
            <Text 
              fontSize={getFontSize('large')} 
              fontWeight="600" 
              color={colors.textMuted}
              textAlign="center"
            >
              Coming Soon
            </Text>
            <Text 
              fontSize={getFontSize('small')} 
              color={isDarkMode ? '$color11' : '$color9'}
              textAlign="center"
              marginTop={getSpacing('small')}
            >
              This program type will be available in a future update
            </Text>
          </Card>
        )}
      </ScrollView>
    </YStack>
  );
}
