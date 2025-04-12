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
  H2,
  useTheme
} from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { workoutData } from '../data/workoutData';

// Updated split type names
const SPLIT_TYPES = {
  oneADay: {
    id: 'oneADay',
    name: 'Full Body Split',
    description: 'Complete all muscle groups in one session'
  },
  twoADay: {
    id: 'twoADay',
    name: 'AM/PM Split',
    description: 'Two targeted sessions per day'
  }
};

export default function SplitSelectionScreen() {
  const theme = useTheme();
  const { type = 'oneADay' } = useLocalSearchParams<{ type?: 'oneADay' | 'twoADay' }>();
  
  const isDark = theme.name?.get() === 'dark';
  const splits = type === 'oneADay' ? workoutData.oneADay : workoutData.twoADay;
  const splitType = SPLIT_TYPES[type] || SPLIT_TYPES.oneADay;
  
  const navigateToWorkout = (day: number) => {
    router.push({
      pathname: '/workout-detail',
      params: { type, day }
    });
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={60} paddingHorizontal={20}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <XStack alignItems="center" space="$4" paddingBottom={10}>
        <Button
          icon={<ChevronLeft size="$1" />}
          size="$3"
          circular
          onPress={() => router.back()}
        />
        <YStack>
          <H2 color="$color">{splitType.name}</H2>
          <Text color="$gray10" fontSize={16}>{splitType.description}</Text>
        </YStack>
      </XStack>
      
      <Text paddingVertical={16} color="$color" fontSize={18}>
        Select which day you want to train:
      </Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack space="$4" paddingBottom={30}>
          {splits.map((split) => (
            <Card
              key={split.day}
              bordered
              backgroundColor={isDark ? '#222222' : '#FFFFFF'}
              scale={0.97}
              pressStyle={{ scale: 0.95, opacity: 0.9 }}
              onPress={() => navigateToWorkout(split.day)}
              paddingVertical={22}
              paddingHorizontal={20}
              elevate
            >
              <YStack>
                <Text fontSize={20} fontWeight="bold" color={isDark ? '#FFFFFF' : '#000000'}>Day {split.day}</Text>
                <Text fontSize={16} color={isDark ? '#AAAAAA' : '#666666'}>
                  {split.title}
                </Text>
              </YStack>
              <XStack justifyContent="flex-end" marginTop={10}>
                <Text color={isDark ? '#555555' : '#CCCCCC'} fontSize={28} fontWeight="300">
                  ›
                </Text>
              </XStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}