// Updated app/index.tsx with navigation components and settings button

import React, { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, useWindowDimensions } from 'react-native';
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
import { BarChart2, TrendingUp, Clock, AlertCircle, Settings, Radio, Bell, Activity, Database } from '@tamagui/lucide-icons';
import { useAppTheme } from '../components/ThemeProvider';
import { SplitType } from '../constants/theme';
import { DaySelector } from '../components/DaySelector';
import { FeatureSection } from '../components/FeatureCard';
import { WorkoutNotifications, useWorkoutNotifications } from '../components/RealTime/WorkoutNotifications';
import { AnalyticsDashboard } from '../components/Analytics/AnalyticsDashboard';
import { useRealTime } from '../context/RealTimeContext';
import { navigateToWorkout, NavigationPath } from '../navigation';
import { router } from 'expo-router';

// App version displayed in the UI
const APP_VERSION = "v1.0.3";

export default function HomeScreen() {
  const { colors, fontSize, spacing, borderRadius, shadows, isDark, getShadow, isNarrow, screenWidth, getSpacing, getFontSize, getBorderRadius } = useAppTheme();
  const { width } = useWindowDimensions();
  const { unreadSharesCount, isConnected } = useRealTime();
  const { requestNotificationPermission } = useWorkoutNotifications();
  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

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

  // ADD THIS TEST SECTION to verify the enhanced theme is working:
  console.log('🎨 Enhanced Theme Test:', {
    'New Colors Available': Object.keys(colors).length > 5,
    'New Spacing Scale': spacing.xxxlarge === 64,
    'Helper Functions': typeof getShadow === 'function',
    'Responsive Helpers': typeof isNarrow === 'boolean'
  });

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
      navigateToWorkout(splitType, selectedDay, NavigationPath.HOME);
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
  const buttonHeight = 70;

  // Feature data for cards with enhanced descriptions and colors
  const features = [
    {
      icon: <BarChart2 size={isNarrow ? 25 : 30} color={colors.primary} />,
      title: "Analytics",
      subtitle: "Track your performance",
      onPress: () => navigateToSection('analytics')
    },
    {
      icon: <TrendingUp size={isNarrow ? 25 : 30} color={colors.success} />,
      title: "Progression",
      subtitle: "Monitor your improvements",
      badge: "New",
      onPress: () => navigateToSection('progress')
    },
    {
      icon: <Database size={isNarrow ? 25 : 30} color={colors.info} />,
      title: "Exercise Library",
      subtitle: "Browse 200+ exercises",
      onPress: () => router.push('/exercise-database')
    },
    {
      icon: <Clock size={isNarrow ? 25 : 30} color={colors.warning} />,
      title: "Workout History",
      subtitle: "Review past sessions",
      onPress: () => navigateToSection('history')
    }
  ];

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
        <XStack alignItems="flex-start" justifyContent="space-between" width="100%">
          <H1
            color={colors.text}
            fontSize={isNarrow ? 40 : 50}
          >
            Hi Arman!
          </H1>
          <XStack alignItems="center" space={spacing.small}>
            <YStack position="relative">
              <Button
                size="$3"
                circular
                backgroundColor="transparent"
                onPress={() => router.push('/live-feed')}
                pressStyle={{ opacity: 0.7 }}
                padding={spacing.small}
              >
                <Radio size={22} color={colors.text} />
              </Button>
              {unreadSharesCount > 0 && (
                <YStack
                  position="absolute"
                  top={-4}
                  right={-4}
                  backgroundColor={colors.primary}
                  minWidth={16}
                  height={16}
                  borderRadius={8}
                  alignItems="center"
                  justifyContent="center"
                  paddingHorizontal={4}
                >
                  <Text fontSize={8} color={colors.cardBackground} fontWeight="600">
                    {unreadSharesCount > 9 ? '9+' : unreadSharesCount}
                  </Text>
                </YStack>
              )}
            </YStack>
            <Button
              size="$3"
              circular
              backgroundColor="transparent"
              onPress={() => router.push('/progression')}
              pressStyle={{ opacity: 0.7 }}
              padding={spacing.small}
            >
              <Activity size={22} color={colors.text} />
            </Button>
            <Button
              size="$3"
              circular
              backgroundColor="transparent"
              onPress={() => router.push('/settings')}
              pressStyle={{ opacity: 0.7 }}
              padding={spacing.small}
            >
              <Settings size={22} color={colors.text} />
            </Button>
            <XStack alignItems="center" space={spacing.xsmall}>
              <YStack
                backgroundColor={isConnected ? colors.success : colors.textMuted}
                width={6}
                height={6}
                borderRadius={3}
              />
              <Text
                color={colors.textMuted}
                fontSize={fontSize.small}
              >
                {APP_VERSION}
              </Text>
            </XStack>
          </XStack>
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
            style={{
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              userSelect: 'none',
              outline: 'none'
            }}
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
              // FIXED: Remove conflicting focus/style properties
              outlineWidth={0}
              outlineStyle="none"
              style={{
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                userSelect: 'none',
              }}
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
              // FIXED: Remove conflicting focus/style properties
              outlineWidth={0}
              outlineStyle="none"
              style={{
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                userSelect: 'none',
              }}
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
        style={{
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          userSelect: 'none',
          outline: 'none'
        }}
      >
        Start Workout
      </Button>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard compact={true} />

      {/* Quick Actions Section */}
      <YStack marginTop={spacing.large} space={spacing.medium}>
        <XStack alignItems="center" space={spacing.small}>
          <Text 
            fontSize={fontSize.xlarge} 
            fontWeight="700" 
            color={colors.text}
          >
            Quick Actions
          </Text>
          <YStack 
            flex={1} 
            height={2} 
            backgroundColor={colors.borderLight} 
            borderRadius={1}
          />
        </XStack>
      </YStack>

      {/* Feature cards using the component */}
      <FeatureSection features={features} />

      {/* Real-time notifications */}
      <WorkoutNotifications />
    </YStack>
  );
}