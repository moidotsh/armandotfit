// Updated app/split-selection.tsx with shorter titles and using the new AppHeader

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { 
  YStack, 
  Text, 
  Card, 
  ScrollView,
  useTheme
} from 'tamagui';
import { exercises, oneADaySplits, twoADaySplits } from '../data/workoutDataRefactored';
import { AppHeader, SplitSelectionRouteParams, NavigationPath } from '../navigation';

// Updated split type names with shorter descriptions
const SPLIT_TYPES: Record<string, {
  id: string;
  name: string;
  description: string;
}> = {
  oneADay: {
    id: 'oneADay',
    name: 'Full Body Split',
    description: 'Complete all muscle groups in one session'
  },
  twoADay: {
    id: 'twoADay',
    name: 'Dual Session',
    description: 'AM/PM split workouts'
  }
};

export default function SplitSelectionScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  const { type = 'oneADay' } = useLocalSearchParams<SplitSelectionRouteParams>();
  
  const isDark = theme.name?.get() === 'dark';
  const splits = type === 'oneADay' ? oneADaySplits : twoADaySplits;
  const splitType = SPLIT_TYPES[type] || SPLIT_TYPES.oneADay;
  
  // Helper function to format workout day titles
  const formatDayTitle = (day: number, title: string, type: string) => {
    if (type === 'twoADay') {
      return `Dual Session Day ${day}`;
    }
    return title;
  };
  
  const navigateToWorkout = (day: number) => {
    router.push({
      pathname: '/workout-detail',
      params: { type, day }
    });
  };

  return (
    <YStack 
      flex={1} 
      backgroundColor="$background" 
      paddingTop={isNarrow ? 50 : 60} 
      paddingHorizontal={isNarrow ? 12 : 20}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <AppHeader 
        title={splitType.name}
        subtitle={splitType.description}
        currentPath={NavigationPath.SPLIT_SELECTION}
      />
      
      <Text 
        paddingVertical={isNarrow ? 12 : 16} 
        color="$color" 
        fontSize={isNarrow ? 16 : 18}
      >
        Select which day you want to train:
      </Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack space={isNarrow ? "$3" : "$4"} paddingBottom={30}>
          {splits.map((split) => (
            <Card
              key={split.day}
              bordered
              backgroundColor={isDark ? '#222222' : '#FFFFFF'}
              scale={0.97}
              pressStyle={{ scale: 0.95, opacity: 0.9 }}
              onPress={() => navigateToWorkout(split.day)}
              paddingVertical={isNarrow ? 18 : 22}
              paddingHorizontal={isNarrow ? 16 : 20}
              elevate
            >
              <YStack>
                <Text 
                  fontSize={isNarrow ? 18 : 20} 
                  fontWeight="bold" 
                  color={isDark ? '#FFFFFF' : '#000000'}
                >
                  Day {split.day}
                </Text>
                <Text 
                  fontSize={isNarrow ? 14 : 16} 
                  color={isDark ? '#AAAAAA' : '#666666'}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formatDayTitle(split.day, split.title, type)}
                </Text>
              </YStack>
              <Text 
                color={isDark ? '#555555' : '#CCCCCC'} 
                fontSize={28} 
                fontWeight="300"
                position="absolute"
                right={isNarrow ? 16 : 20}
                top="50%"
                style={{ transform: [{ translateY: -14 }] }}
              >
                ›
              </Text>
            </Card>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}