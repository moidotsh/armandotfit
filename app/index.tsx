// app_index.tsx - Updated for better responsiveness

import React, { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Animated, useWindowDimensions } from 'react-native';
import { 
  YStack, 
  XStack,
  Text, 
  Card, 
  H1,
  Button,
  useTheme
} from 'tamagui';
import { format } from 'date-fns';
import { BarChart2, TrendingUp, Clock, AlertCircle } from '@tamagui/lucide-icons';

// Define workout split types
export type SplitType = 'oneADay' | 'twoADay';

export default function HomeScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');
  const isDark = theme.name?.get() === 'dark';
  const isNarrow = width < 350; // Threshold for narrow screens
  
  // State for selected split type - null by default (no selection)
  const [splitType, setSplitType] = useState<SplitType | null>(null);
  
  // State for showing the alert message
  const [showAlert, setShowAlert] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Handle alert animation
  useEffect(() => {
    if (showAlert) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => setShowAlert(false));
    }
  }, [showAlert, fadeAnim]);
  
  const navigateToWorkout = () => {
    if (splitType) {
      router.push(`/workout-detail?type=${splitType}&day=1`);
    }
  };
  
  const handleStartWorkoutPress = () => {
    if (!splitType) {
      // Show inline alert
      setShowAlert(true);
    } else {
      navigateToWorkout();
    }
  };

  const navigateToSection = (section: string) => {
    console.log(`Navigate to ${section}`);
    // Future implementation
  };

  return (
    <YStack 
      flex={1} 
      backgroundColor="$background" 
      paddingTop={60} 
      paddingHorizontal={isNarrow ? 12 : 20}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Inline alert message */}
      {showAlert && (
        <Animated.View 
          style={{
            position: 'absolute',
            top: 100,
            left: isNarrow ? 12 : 20,
            right: isNarrow ? 12 : 20,
            backgroundColor: '#FF5733',
            padding: 15,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 10,
            opacity: fadeAnim,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5
          }}
        >
          <AlertCircle color="white" style={{ marginRight: 10 }} />
          <Text color="white" fontWeight="bold">
            Please select a workout type
          </Text>
        </Animated.View>
      )}
      
      <YStack space="$2" paddingBottom={10}>
        <H1 
          color="$color" 
          fontSize={isNarrow ? 40 : 50}
        >
          Hi Arman!
        </H1>
        <Text color="$gray10" fontSize={18}>{formattedDate}</Text>
      </YStack>
      
      {/* Responsive toggle switch for workout type */}
      <XStack 
        marginTop={30} 
        marginBottom={20} 
        alignItems="center"
        flexWrap={isNarrow ? "wrap" : "nowrap"}
      >
        <Text 
          color="$color" 
          fontSize={isNarrow ? 22 : 28} 
          fontWeight="600" 
          marginRight={isNarrow ? 10 : 20}
          marginBottom={isNarrow ? 10 : 0}
        >
          Full Body:
        </Text>
        
        {/* Custom toggle implementation - more compact for narrow screens */}
        <XStack 
          width={isNarrow ? "100%" : 300} 
          height={50} 
          position="relative"
        >
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
          {splitType && (
            <XStack
              position="absolute"
              width={isNarrow ? "50%" : 150}
              height={50}
              borderRadius={25}
              backgroundColor="#FFFFFF"
              left={splitType === 'oneADay' ? 0 : isNarrow ? "50%" : 150}
              top={0}
            />
          )}
          
          {/* Buttons (transparent, just for interaction) */}
          <Button
            position="absolute"
            left={0}
            top={0}
            width={isNarrow ? "50%" : 150}
            height={50}
            backgroundColor="transparent"
            color={splitType === 'oneADay' ? '#000000' : '#FFFFFF'}
            onPress={() => setSplitType('oneADay')}
            zIndex={1}
          >
            {isNarrow ? 'Single' : splitType === 'oneADay' ? 'Single Session' : 'Single'}
          </Button>
          
          <Button
            position="absolute"
            left={isNarrow ? "50%" : 150}
            top={0}
            width={isNarrow ? "50%" : 150}
            height={50}
            backgroundColor="transparent"
            color={splitType === 'twoADay' ? '#000000' : '#FFFFFF'}
            onPress={() => setSplitType('twoADay')}
            zIndex={1}
          >
            {isNarrow ? 'Dual' : splitType === 'twoADay' ? 'Dual Sessions' : 'Dual'}
          </Button>
        </XStack>
      </XStack>
      
      <Button
        size={isNarrow ? "$5" : "$6"}
        backgroundColor={splitType ? "#FF9500" : "rgba(255, 149, 0, 0.5)"}
        color="white"
        fontWeight="bold"
        fontSize={isNarrow ? 20 : 24}
        height={isNarrow ? 60 : 70}
        marginBottom={30}
        borderRadius={20}
        onPress={handleStartWorkoutPress}
        opacity={splitType ? 1 : 0.7}
      >
        Start Workout
      </Button>
      
      {/* Feature cards - more compact on narrow screens */}
      <YStack space={isNarrow ? "$3" : "$4"} flex={1}>
        <Card
          backgroundColor="#252525"
          borderRadius={15}
          padding={isNarrow ? 16 : 20}
          height={isNarrow ? 90 : 110}
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          onPress={() => navigateToSection('analytics')}
        >
          <XStack alignItems="center" space={isNarrow ? "$3" : "$4"}>
            <YStack
              width={isNarrow ? 50 : 60}
              height={isNarrow ? 50 : 60}
              borderRadius={isNarrow ? 25 : 30}
              backgroundColor="#333333"
              alignItems="center"
              justifyContent="center"
            >
              <BarChart2 size={isNarrow ? 25 : 30} color="white" />
            </YStack>
            <Text fontSize={isNarrow ? 24 : 30} fontWeight="500" color="#FFFFFF">
              Analytics
            </Text>
          </XStack>
        </Card>
        
        <Card
          backgroundColor="#252525"
          borderRadius={15}
          padding={isNarrow ? 16 : 20}
          height={isNarrow ? 90 : 110}
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          onPress={() => navigateToSection('progress')}
        >
          <XStack alignItems="center" space={isNarrow ? "$3" : "$4"}>
            <YStack
              width={isNarrow ? 50 : 60}
              height={isNarrow ? 50 : 60}
              borderRadius={isNarrow ? 25 : 30}
              backgroundColor="#333333"
              alignItems="center"
              justifyContent="center"
            >
              <TrendingUp size={isNarrow ? 25 : 30} color="white" />
            </YStack>
            <Text fontSize={isNarrow ? 24 : 30} fontWeight="500" color="#FFFFFF">
              Progress
            </Text>
          </XStack>
        </Card>
        
        <Card
          backgroundColor="#252525"
          borderRadius={15}
          padding={isNarrow ? 16 : 20}
          height={isNarrow ? 90 : 110}
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          onPress={() => navigateToSection('history')}
        >
          <XStack alignItems="center" space={isNarrow ? "$3" : "$4"}>
            <YStack
              width={isNarrow ? 50 : 60}
              height={isNarrow ? 50 : 60}
              borderRadius={isNarrow ? 25 : 30}
              backgroundColor="#333333"
              alignItems="center"
              justifyContent="center"
            >
              <Clock size={isNarrow ? 25 : 30} color="white" />
            </YStack>
            <Text fontSize={isNarrow ? 24 : 30} fontWeight="500" color="#FFFFFF">
              History
            </Text>
          </XStack>
        </Card>
      </YStack>
    </YStack>
  );
}