const ExerciseCard = ({ exercise, icon, textColor, arrowColor, cardColor }: { 
  exercise: Exercise; 
  icon: React.ReactNode;
  textColor: string;
  arrowColor: string;
  cardColor: string;
}) => {
  return (
    <Card
      marginBottom={12}
      backgroundColor={cardColor}
      paddingVertical={22}
      paddingHorizontal={20}
      borderRadius={15}
      elevate
      bordered
      scale={0.97}
      pressStyle={{ scale: 0.95, opacity: 0.9 }}
      onPress={() => {
        // For future implementation: exercise details, tracking, etc.
        console.log(`Tapped on exercise: ${exercise.name}`);
      }}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center">
          {icon}
          <Text
            marginLeft={16}
            color={textColor}
            fontSize={22}
            fontWeight="500"
          >
            {exercise.name}
          </Text>
        </XStack>
        <Text color={arrowColor} fontSize={28} fontWeight="300">
          ›
        </Text>
      </XStack>
    </Card>
  );
};

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  YStack, 
  XStack,
  Text, 
  Card, 
  ScrollView,
  Button,
  useTheme
} from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { workoutData, Exercise, OneADayWorkout, TwoADayWorkout } from '../data/workoutData';
import { 
  ChestPressIcon, 
  LegPressIcon, 
  RowIcon, 
  LateralRaiseIcon, 
  BicepCurlIcon, 
  CalfRaiseIcon,
  AbsIcon
} from '../components/ExerciseIcons';

// Add type guard functions
const isOneADayWorkout = (workout: OneADayWorkout | TwoADayWorkout): workout is OneADayWorkout => {
  return 'exercises' in workout;
};

const isTwoADayWorkout = (workout: OneADayWorkout | TwoADayWorkout): workout is TwoADayWorkout => {
  return 'amExercises' in workout && 'pmExercises' in workout;
};

// Get the appropriate icon based on exercise name
const getExerciseIcon = (name: string, color: string) => {
  if (name.includes('Press') && name.includes('Chest') || name.includes('Barbell Press')) {
    return <ChestPressIcon color={color} size={30} />;
  } else if (name.includes('Leg Press')) {
    return <LegPressIcon color={color} size={30} />;
  } else if (name.includes('Row')) {
    return <RowIcon color={color} size={30} />;
  } else if (name.includes('Lateral') || name.includes('Raises')) {
    return <LateralRaiseIcon color={color} size={30} />;
  } else if (name.includes('Curl')) {
    return <BicepCurlIcon color={color} size={30} />;
  } else if (name.includes('Calf') || name.includes('Tibia')) {
    return <CalfRaiseIcon color={color} size={30} />;
  } else if (name.includes('Ab') || name.includes('Chair')) {
    return <AbsIcon color={color} size={30} />;
  } else {
    // Default icon
    return <ChestPressIcon color={color} size={30} />;
  }
};

export default function WorkoutDetailScreen() {
  const theme = useTheme();
  const { type = 'oneADay', day = '1' } = useLocalSearchParams<{ 
    type?: 'oneADay' | 'twoADay',
    day?: string 
  }>();
  
  const dayNumber = parseInt(day) || 1;
  
  // Get the workout data based on type and day
  const workoutType = type === 'oneADay' ? workoutData.oneADay : workoutData.twoADay;
  const workout = workoutType.find(w => w.day === dayNumber) || workoutType[0];
  
  const isDark = theme.name?.get() == 'dark';
  const textColor = '#FFFFFF'; // White text for dark cards
  const subtitleColor = '#FF9500';
  const cardColor = '#222222'; // Dark cards 
  const arrowColor = '#555555'; // Dark arrow
  const iconBgColor = 'transparent'; // No background for icons

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={60}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <YStack paddingHorizontal={20} paddingBottom={20}>
        <Button 
          size="$3" 
          circular 
          icon={<ChevronLeft size="$1" />} 
          alignSelf="flex-start" 
          marginBottom={16}
          onPress={() => router.back()}        />
        <Text
          color={subtitleColor}
          fontSize={24}
          fontWeight="700"
          marginBottom={8}
        >
          TODAY'S
        </Text>
        <Text
          color={textColor}
          fontSize={40}
          fontWeight="700"
        >
          {workout.title}
        </Text>
      </YStack>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack paddingHorizontal={16} paddingBottom={30}>
          {isOneADayWorkout(workout) ? (
            workout.exercises.map((exercise: Exercise, index: number) => (
              <Card
                key={index}
                marginBottom={12}
                backgroundColor={cardColor}
                paddingVertical={22}
                paddingHorizontal={20}
                borderRadius={15}
                elevate
                bordered
                scale={0.97}
                pressStyle={{ scale: 0.95, opacity: 0.9 }}
              >
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center">
                    {getExerciseIcon(exercise.name, '#FFFFFF')}
                    <Text
                      marginLeft={16}
                      color={textColor}
                      fontSize={22}
                      fontWeight="500"
                    >
                      {exercise.name}
                    </Text>
                  </XStack>
                  <Text color={arrowColor} fontSize={28} fontWeight="300">
                    ›
                  </Text>
                </XStack>
              </Card>
            ))
          ) : isTwoADayWorkout(workout) ? (
            <>
              {/* AM Exercises */}
              <Text
                color={subtitleColor}
                fontSize={18}
                fontWeight="700"
                marginTop={16}
                marginBottom={12}
                paddingHorizontal={4}
              >
                🔵 MORNING WORKOUT
              </Text>
              {workout.amExercises.map((exercise: Exercise, index: number) => (
                <Card
                  key={`am-${index}`}
                  marginBottom={12}
                  backgroundColor={cardColor}
                  paddingVertical={22}
                  paddingHorizontal={20}
                  borderRadius={15}
                  elevate
                  bordered
                  scale={0.97}
                  pressStyle={{ scale: 0.95, opacity: 0.9 }}
                >
                  <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center">
                      {getExerciseIcon(exercise.name, '#FFFFFF')}
                      <Text
                        marginLeft={16}
                        color={textColor}
                        fontSize={22}
                        fontWeight="500"
                      >
                        {exercise.name}
                      </Text>
                    </XStack>
                    <Text color={arrowColor} fontSize={28} fontWeight="300">
                      ›
                    </Text>
                  </XStack>
                </Card>
              ))}
              
              {/* PM Exercises */}
              <Text
                color={subtitleColor}
                fontSize={18}
                fontWeight="700"
                marginTop={24}
                marginBottom={12}
                paddingHorizontal={4}
              >
                🟡 EVENING WORKOUT
              </Text>
              {workout.pmExercises.map((exercise: Exercise, index: number) => (
                <Card
                  key={`pm-${index}`}
                  marginBottom={12}
                  backgroundColor={cardColor}
                  paddingVertical={22}
                  paddingHorizontal={20}
                  borderRadius={15}
                  elevate
                  bordered
                >
                  <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center">
                      {getExerciseIcon(exercise.name, '#FFFFFF')}
                      <Text
                        marginLeft={16}
                        color={textColor}
                        fontSize={22}
                        fontWeight="500"
                      >
                        {exercise.name}
                      </Text>
                    </XStack>
                    <Text color={arrowColor} fontSize={28} fontWeight="300">
                      ›
                    </Text>
                  </XStack>
                </Card>
              ))}
            </>
          ) : null}
        </YStack>
      </ScrollView>
    </YStack>
  );
}