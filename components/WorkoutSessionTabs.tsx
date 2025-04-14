// components/WorkoutSessionTabs.tsx
import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { XStack, YStack, View, Text, Separator, Button } from 'tamagui';
import { Sun, Moon } from '@tamagui/lucide-icons';
import { useAppTheme } from './ThemeProvider';

interface WorkoutSessionTabsProps {
  activeTab: 'am' | 'pm';
  onTabChange: (tab: 'am' | 'pm') => void;
}

export function WorkoutSessionTabs({ activeTab, onTabChange }: WorkoutSessionTabsProps) {
  const { colors, spacing, fontSize, borderRadius } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  // Tab styling without the onPress handler
  const getTabStyle = (tab: 'am' | 'pm') => {
    const isActive = activeTab === tab;
    
    return {
      backgroundColor: isActive ? colors.background : colors.backgroundAlt,
      borderTopLeftRadius: borderRadius.medium,
      borderTopRightRadius: borderRadius.medium,
      borderWidth: 1,
      borderBottomWidth: isActive ? 0 : 1,
      borderColor: colors.border,
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      marginBottom: isActive ? -1 : 0, // Pull active tab down slightly to overlap border
      zIndex: isActive ? 2 : 1,
      flex: 1,
      // Shadow for active tab
      shadowColor: isActive ? colors.text : 'transparent',
      shadowOffset: { width: 0, height: isActive ? -2 : 0 },
      shadowOpacity: isActive ? 0.1 : 0,
      shadowRadius: isActive ? 3 : 0,
      elevation: isActive ? 3 : 0
    };
  };
  
  return (
    <XStack width="100%" alignItems="flex-end" marginBottom={0}>
      <Button
        chromeless
        style={getTabStyle('am')}
        onPress={() => onTabChange('am')}
        focusStyle={{}}
      >
        <XStack alignItems="center" space={spacing.small} justifyContent="center">
          <Sun 
            size={isNarrow ? 18 : 22} 
            color={activeTab === 'am' ? colors.textSecondary : colors.textMuted} 
          />
          <Text 
            color={activeTab === 'am' ? colors.text : colors.textMuted}
            fontWeight={activeTab === 'am' ? '600' : '500'}
            fontSize={isNarrow ? fontSize.small : fontSize.medium}
          >
            {isNarrow ? "AM WORKOUT" : "MORNING WORKOUT"}
          </Text>
        </XStack>
      </Button>
      
      <Button
        chromeless
        style={getTabStyle('pm')}
        onPress={() => onTabChange('pm')}
        focusStyle={{}}
      >
        <XStack alignItems="center" space={spacing.small} justifyContent="center">
          <Moon 
            size={isNarrow ? 18 : 22} 
            color={activeTab === 'pm' ? colors.textSecondary : colors.textMuted} 
          />
          <Text 
            color={activeTab === 'pm' ? colors.text : colors.textMuted}
            fontWeight={activeTab === 'pm' ? '600' : '500'}
            fontSize={isNarrow ? fontSize.small : fontSize.medium}
          >
            {isNarrow ? "PM WORKOUT" : "EVENING WORKOUT"}
          </Text>
        </XStack>
      </Button>
    </XStack>
  );
}

export function WorkoutSessionContent({ 
  activeTab, 
  amExercises, 
  pmExercises, 
  renderExercise 
}: { 
  activeTab: 'am' | 'pm';
  amExercises: any[];
  pmExercises: any[];
  renderExercise: (exercise: any, index: number) => React.ReactNode;
}) {
  const { colors, spacing, borderRadius } = useAppTheme();
  
  return (
    <YStack 
      backgroundColor={colors.background}
      borderWidth={1}
      borderColor={colors.border}
      borderTopWidth={0}
      borderBottomLeftRadius={borderRadius.medium}
      borderBottomRightRadius={borderRadius.medium}
      padding={spacing.medium}
      minHeight={300} // Ensure consistent height between tabs
    >
      {activeTab === 'am' ? (
        amExercises.map((exercise, index) => renderExercise(exercise, index))
      ) : (
        pmExercises.map((exercise, index) => renderExercise(exercise, index))
      )}
    </YStack>
  );
}