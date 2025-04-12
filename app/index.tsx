import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { 
  YStack, 
  XStack,
  Text, 
  Card, 
  H1,
  Button,
  useTheme,
  Separator
} from 'tamagui';
import { format } from 'date-fns';
import { BarChart2, TrendingUp, Clock } from '@tamagui/lucide-icons';

// Define workout split types
export type SplitType = 'oneADay' | 'twoADay';

export default function HomeScreen() {
  const theme = useTheme();
  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');
  const isDark = theme.name?.get() === 'dark';
  
  // State for selected split type
  const [splitType, setSplitType] = useState<SplitType>('oneADay');
  
  const navigateToWorkout = () => {
    router.push(`/workout-detail?type=${splitType}&day=1`);
  };

  const navigateToSection = (section: string) => {
    console.log(`Navigate to ${section}`);
    // Future implementation
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={60} paddingHorizontal={20}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <YStack space="$2" paddingBottom={10}>
        <H1 color="$color" fontSize={50}>Hi Arman!</H1>
        <Text color="$gray10" fontSize={20}>{formattedDate}</Text>
      </YStack>
      
      <Button
        size="$6"
        backgroundColor="#FF9500"
        color="white"
        fontWeight="bold"
        fontSize={24}
        height={70}
        marginVertical={30}
        borderRadius={20}
        onPress={navigateToWorkout}
      >
        Start Workout
      </Button>
      
      <XStack marginBottom={30} alignItems="center">
        <Text color="$color" fontSize={28} fontWeight="600" marginRight={20}>
          Full Body:
        </Text>
        
        {/* Custom toggle implementation */}
        <XStack width={300} height={50} position="relative">
          {/* Dark background container */}
          <XStack
            position="absolute"
            left={0}
            right={0}
            top={0}
            bottom={0}
            backgroundColor="#333333"
            borderRadius={25}
          />
          
          {/* White pill for selected option - positioned based on selection */}
          <XStack
            position="absolute"
            width={150}
            height={50}
            borderRadius={25}
            backgroundColor="#FFFFFF"
            left={splitType === 'oneADay' ? 0 : 150}
            top={0}
            {...(splitType === 'oneADay' 
              ? {enterStyle: {x: 0}} 
              : {enterStyle: {x: 150}}
            )}
          />
          
          {/* Buttons (transparent, just for interaction) */}
          <Button
            position="absolute"
            left={0}
            top={0}
            width={150}
            height={50}
            backgroundColor="transparent"
            color={splitType === 'oneADay' ? '#000000' : '#FFFFFF'}
            onPress={() => setSplitType('oneADay')}
            zIndex={1}
          >
            Single
          </Button>
          
          <Button
            position="absolute"
            left={150}
            top={0}
            width={150}
            height={50}
            backgroundColor="transparent"
            color={splitType === 'twoADay' ? '#000000' : '#FFFFFF'}
            onPress={() => setSplitType('twoADay')}
            zIndex={1}
          >
            Dual Session
          </Button>
        </XStack>
      </XStack>
      
      {/* Feature cards */}
      <YStack space="$4" flex={1}>
        <Card
          backgroundColor="#252525"
          borderRadius={15}
          padding={20}
          height={110}
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          onPress={() => navigateToSection('analytics')}
        >
          <XStack alignItems="center" space="$4">
            <YStack
              width={60}
              height={60}
              borderRadius={30}
              backgroundColor="#333333"
              alignItems="center"
              justifyContent="center"
            >
              <BarChart2 size={30} color="white" />
            </YStack>
            <Text fontSize={30} fontWeight="500" color="#FFFFFF">
              Analytics
            </Text>
          </XStack>
        </Card>
        
        <Card
          backgroundColor="#252525"
          borderRadius={15}
          padding={20}
          height={110}
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          onPress={() => navigateToSection('progress')}
        >
          <XStack alignItems="center" space="$4">
            <YStack
              width={60}
              height={60}
              borderRadius={30}
              backgroundColor="#333333"
              alignItems="center"
              justifyContent="center"
            >
              <TrendingUp size={30} color="white" />
            </YStack>
            <Text fontSize={30} fontWeight="500" color="#FFFFFF">
              Progress Tracker
            </Text>
          </XStack>
        </Card>
        
        <Card
          backgroundColor="#252525"
          borderRadius={15}
          padding={20}
          height={110}
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          onPress={() => navigateToSection('history')}
        >
          <XStack alignItems="center" space="$4">
            <YStack
              width={60}
              height={60}
              borderRadius={30}
              backgroundColor="#333333"
              alignItems="center"
              justifyContent="center"
            >
              <Clock size={30} color="white" />
            </YStack>
            <Text fontSize={30} fontWeight="500" color="#FFFFFF">
              History
            </Text>
          </XStack>
        </Card>
      </YStack>
    </YStack>
  );
}