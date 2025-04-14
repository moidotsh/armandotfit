// Updated app/workout-detail.tsx with refactored exercise data

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
import { exercises, oneADaySplits, twoADaySplits } from '../data/workoutDataRefactored';
import { WorkoutSessionTabs } from '../components/ExerciseCard';
import { useAppTheme } from '../components/ThemeProvider';
import { format } from 'date-fns';

export default function WorkoutDetailScreen() {
  const { colors, fontSize, spacing, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;

  const { type = 'oneADay', day = '1' } = useLocalSearchParams<{ 
    type?: 'oneADay' | 'twoADay',
    day?: string 
  }>();

  const dayNumber = parseInt(day) || 1;
  const workout = (type === 'oneADay' ? oneADaySplits : twoADaySplits).find(w => w.day === dayNumber);

  const today = new Date();
  const formattedDate = format(today, 'MMMM d, yyyy');
  const workoutTitle = type === 'twoADay' ? `Dual Day ${dayNumber}` : workout?.title || '';

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
          numberOfLines={2}
          marginBottom={spacing.large}
        >
          {workoutTitle}
        </Text>
      </YStack>

      <YStack paddingHorizontal={0} width="100%">
        {workout && (
          <WorkoutSessionTabs workout={workout} exerciseMap={exercises} />
        )}
      </YStack>
    </ScrollView>
  );
}