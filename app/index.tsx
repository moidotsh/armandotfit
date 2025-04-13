// Final app/index.tsx with fixed button height and version display

import React, { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Animated, useWindowDimensions, Platform } from 'react-native';
import { 
  YStack, 
  XStack,
  Text, 
  Card, 
  H1,
  Button,
  Separator
} from 'tamagui';
import { format } from 'date-fns';
import { BarChart2, TrendingUp, Clock, AlertCircle } from '@tamagui/lucide-icons';
import { useAppTheme } from '../components/ThemeProvider';
import { SplitType } from '../constants/theme';
import { DaySelector } from '../components/DaySelector';

// App version displayed in the UI
const APP_VERSION = "v1.0.2";

export default function HomeScreen() {
  const { colors, fontSize, spacing, borderRadius, shadows, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');
  const isNarrow = width < 350; // Threshold for narrow screens
  
  // State for selected split type - null by default (no selection)
  const [splitType, setSplitType] = useState<SplitType | null>(null);
  
  // State for selected day - null by default (no selection)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // State for showing the alert message
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // FIXED: Calculate proper pill colors based on theme
  const getToggleStyles = () => {
    return {
      backgroundColor: isDark ? "#333333" : "#DDDDDD", // Darker in dark mode, lighter in light mode
      pillColor: isDark ? "#FFFFFF" : "#FFFFFF", // Always white pill
      selectedTextColor: "#000000", // Always black text on white pill
      unselectedTextColor: isDark ? "#FFFFFF" : "#333333" // White on dark, dark on light
    };
  };

  const toggleStyles = getToggleStyles();
  
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
    if (splitType && selectedDay) {
      router.push(`/workout-detail?type=${splitType}&day=${selectedDay}`);
    }
  };
  
  const handleStartWorkoutPress = () => {
    if (!splitType && !selectedDay) {
      setAlertMessage('Please select a workout type and day');
      setShowAlert(true);
    } else if (!splitType) {
      setAlertMessage('Please select a workout type');
      setShowAlert(true);
    } else if (!selectedDay) {
      setAlertMessage('Please select a workout day');
      setShowAlert(true);
    } else {
      navigateToWorkout();
    }
  };

  const handleSplitTypeChange = (type: SplitType) => {
    setSplitType(type);
    // Keep the selected day if it's valid (1-4)
    setSelectedDay(prevDay => (prevDay && prevDay >= 1 && prevDay <= 4) ? prevDay : null);
  };

  const navigateToSection = (section: string) => {
    console.log(`Navigate to ${section}`);
    // Future implementation
  };

  // Check if we're ready to start the workout
  const isStartEnabled = splitType !== null && selectedDay !== null;

  // Button height stays consistent
  const buttonHeight = isNarrow ? 60 : 70;

  return (
    <YStack 
      flex={1} 
      backgroundColor={colors.background} 
      paddingTop={60} 
      paddingHorizontal={isNarrow ? spacing.medium : spacing.large}
      overflow="scroll" // Enable scrolling
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Inline alert message */}
      {showAlert && (
        <Animated.View 
          style={{
            position: 'absolute',
            top: 100,
            left: isNarrow ? spacing.medium : spacing.large,
            right: isNarrow ? spacing.medium : spacing.large,
            backgroundColor: colors.alert,
            padding: spacing.medium,
            borderRadius: borderRadius.medium,
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 10,
            opacity: fadeAnim,
            ...shadows.medium
          }}
        >
          <AlertCircle color="white" style={{ marginRight: 10 }} />
          <Text color="white" fontWeight="bold">
            {alertMessage}
          </Text>
        </Animated.View>
      )}
      
      <YStack space="$2" paddingBottom={spacing.small}>
        <XStack alignItems="center" justifyContent="space-between">
          <H1 
            color={colors.text} 
            fontSize={isNarrow ? 40 : 50}
          >
            Hi Arman!
          </H1>
          <Text 
            color={colors.textMuted} 
            fontSize={fontSize.small}
          >
            {APP_VERSION}
          </Text>
        </XStack>
        <Text color={colors.textMuted} fontSize={fontSize.medium}>{formattedDate}</Text>
      </YStack>
      
      {/* Workout Configuration Card */}
      <Card
        marginTop={spacing.xlarge}
        marginBottom={spacing.large}
        backgroundColor={colors.cardAlt}
        padding={spacing.medium}
        borderRadius={borderRadius.medium}
      >
        {/* Split Type Selection */}
        <YStack width="100%" space={spacing.medium}>
          <Text 
            color={colors.text} 
            fontSize={fontSize.large}
            fontWeight="600"
          >
            Full Body:
          </Text>
          
          {/* Split Type Toggle */}
          <XStack 
            height={50} 
            position="relative"
            maxWidth="100%"
            overflow="hidden"
            // Prevent focus styling on mobile web
            focusable={false}
            userSelect="none"
            // Add these webkit properties to disable focus appearance
          >
            {/* Dark background container */}
            <XStack
              position="absolute"
              left={0}
              right={0}
              top={0}
              bottom={0}
              backgroundColor={toggleStyles.backgroundColor}
              borderRadius={borderRadius.pill}
            />
            
            {/* White pill for selected option */}
            {splitType && (
              <XStack
                position="absolute"
                width="50%"
                height={50}
                borderRadius={borderRadius.pill}
                backgroundColor={toggleStyles.pillColor}
                left={splitType === 'oneADay' ? 0 : "50%"}
                top={0}
              />
            )}
            
            {/* Toggle Buttons */}
            <Button
              position="absolute"
              left={0}
              top={0}
              width="50%"
              height={50}
              backgroundColor="transparent"
              color={splitType === 'oneADay' ? toggleStyles.selectedTextColor : toggleStyles.unselectedTextColor}
              onPress={() => handleSplitTypeChange('oneADay')}
              zIndex={1}
              // Prevent focus styling on mobile web
              focusStyle={{}}
            >
              Single
            </Button>
            
            <Button
              position="absolute"
              left="50%"
              top={0}
              width="50%"
              height={50}
              backgroundColor="transparent"
              color={splitType === 'twoADay' ? toggleStyles.selectedTextColor : toggleStyles.unselectedTextColor}
              onPress={() => handleSplitTypeChange('twoADay')}
              zIndex={1}
              // Prevent focus styling on mobile web
              focusStyle={{}}
            >
              Dual
            </Button>
          </XStack>
          
          <Separator marginVertical={spacing.medium} />
          
          {/* Day Selection - Now with consistent orange highlighting */}
          <DaySelector
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
          />
        </YStack>
      </Card>
      
      {/* Start Workout Button - Fixed height regardless of state */}
      <Button
        size="$8"  // Use a consistent larger size 
        backgroundColor={isStartEnabled ? colors.buttonBackground : colors.buttonBackgroundDisabled}
        color="white"
        fontWeight="bold"
        fontSize={isNarrow ? fontSize.large : fontSize.xlarge}
        height={buttonHeight} // Explicitly set height to be consistent
        marginVertical={spacing.large} // Fixed margin
        borderRadius={borderRadius.large}
        onPress={handleStartWorkoutPress}
        opacity={isStartEnabled ? 1 : 0.7}
        disabled={!isStartEnabled}
        pressStyle={{ scale: 0.98, opacity: 0.9 }} // Add press animation
        // Prevent focus styling on mobile web
        focusStyle={{}}
      >
        Start Workout
      </Button>
      
      {/* Feature cards */}
      <YStack space={isNarrow ? "$3" : "$4"} flex={1}>
        <Card
          backgroundColor={colors.cardAlt}
          borderRadius={borderRadius.medium}
          padding={isNarrow ? spacing.medium : spacing.large}
          height={isNarrow ? 90 : 110}
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          onPress={() => navigateToSection('analytics')}
          // Prevent focus styling on mobile web
          focusStyle={{}}
        >
          <XStack alignItems="center" space={isNarrow ? "$3" : "$4"}>
            <YStack
              width={isNarrow ? 50 : 60}
              height={isNarrow ? 50 : 60}
              borderRadius={isNarrow ? 25 : 30}
              backgroundColor="transparent" // Remove background
              alignItems="center"
              justifyContent="center"
            >
              <BarChart2 size={isNarrow ? 25 : 30} color={colors.text} />
            </YStack>
            <Text fontSize={isNarrow ? fontSize.large : fontSize.xlarge} fontWeight="500" color={colors.text}>
              Analytics
            </Text>
          </XStack>
        </Card>
        
        <Card
          backgroundColor={colors.cardAlt}
          borderRadius={borderRadius.medium}
          padding={isNarrow ? spacing.medium : spacing.large}
          height={isNarrow ? 90 : 110}
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          onPress={() => navigateToSection('progress')}
          // Prevent focus styling on mobile web
          focusStyle={{}}
        >
          <XStack alignItems="center" space={isNarrow ? "$3" : "$4"}>
            <YStack
              width={isNarrow ? 50 : 60}
              height={isNarrow ? 50 : 60}
              borderRadius={isNarrow ? 25 : 30}
              backgroundColor="transparent" // Remove background
              alignItems="center"
              justifyContent="center"
            >
              <TrendingUp size={isNarrow ? 25 : 30} color={colors.text} />
            </YStack>
            <Text fontSize={isNarrow ? fontSize.large : fontSize.xlarge} fontWeight="500" color={colors.text}>
              Progress
            </Text>
          </XStack>
        </Card>
        
        <Card
          backgroundColor={colors.cardAlt}
          borderRadius={borderRadius.medium}
          padding={isNarrow ? spacing.medium : spacing.large}
          height={isNarrow ? 90 : 110}
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          onPress={() => navigateToSection('history')}
          // Prevent focus styling on mobile web
          focusStyle={{}}
        >
          <XStack alignItems="center" space={isNarrow ? "$3" : "$4"}>
            <YStack
              width={isNarrow ? 50 : 60}
              height={isNarrow ? 50 : 60}
              borderRadius={isNarrow ? 25 : 30}
              backgroundColor="transparent" // Remove background
              alignItems="center"
              justifyContent="center"
            >
              <Clock size={isNarrow ? 25 : 30} color={colors.text} />
            </YStack>
            <Text fontSize={isNarrow ? fontSize.large : fontSize.xlarge} fontWeight="500" color={colors.text}>
              History
            </Text>
          </XStack>
        </Card>
      </YStack>
    </YStack>
  );
}