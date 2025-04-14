// Updated app/workout-detail.tsx with shorter titles for dual sessions

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { 
  YStack, 
  Button,
  Text,
  XStack,
  ScrollView
} from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { workoutData } from '../data/workoutData';
import { WorkoutSessionTabs } from '../components/ExerciseCard';
import { useAppTheme } from '../components/ThemeProvider';
import { format } from 'date-fns';

export default function WorkoutDetailScreen() {
  // Use our centralized theming system
  const { colors, fontSize, spacing, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  const { type = 'oneADay', day = '1' } = useLocalSearchParams<{ 
    type?: 'oneADay' | 'twoADay',
    day?: string 
  }>();
  
  const dayNumber = parseInt(day) || 1;
  
  // Get the workout data based on type and day
  const workoutType = type === 'oneADay' ? workoutData.oneADay : workoutData.twoADay;
  const workout = workoutType.find(w => w.day === dayNumber) || workoutType[0];
  
  // Format today's date
  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');
  
  // Get the title - for dual sessions, use a shorter form
  const workoutTitle = type === 'twoADay' 
    ? `Dual Day ${dayNumber}` 
    : workout.title;

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ 
        paddingTop: isNarrow ? spacing.xlarge : spacing.xxlarge,
        paddingBottom: spacing.xlarge
      }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <YStack 
        paddingHorizontal={isNarrow ? spacing.medium : spacing.large} 
        paddingBottom={isNarrow ? spacing.medium : spacing.large}
      >
        <XStack alignItems="center" space={spacing.small} marginBottom={spacing.medium}>
          <Button 
            size="$3" 
            circular 
            icon={<ChevronLeft size="$1" />} 
            onPress={() => router.back()}
            focusStyle={{}}
            style={{
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              userSelect: 'none',
              outline: 'none'
            }}
          />
          <Text
            color={colors.textSecondary}
            fontSize={isNarrow ? fontSize.medium : fontSize.large}
            fontWeight="500"
          >
            {formattedDate}
          </Text>
        </XStack>
        
        <Text
          color={colors.text}
          fontSize={isNarrow ? fontSize.xlarge : fontSize.xxlarge}
          fontWeight="700"
          numberOfLines={2} // Allow wrapping for long titles
          marginBottom={spacing.large}
        >
          {workoutTitle}
        </Text>
      </YStack>
      
      {/* Remove horizontal padding for full width content */}
      <YStack 
        paddingHorizontal={0}
        width="100%"
      >
<WorkoutSessionTabs workout={workout} /></YStack>
    </ScrollView>
  );
}