import React from 'react';
import { View } from 'react-native';
import { Circle, Text, useTheme } from 'tamagui';

type CategoryIconProps = {
  category: string;
  size?: number;
};

export function getCategoryEmoji(category: string): string {
  const categoryMap: Record<string, string> = {
    'Chest': '💪',
    'Arms': '💪',
    'Shoulders': '🏋️',
    'Back': '🏋️',
    'UpperLeg': '🦵',
    'LowerLeg': '🦵',
    'Abs': '⭐',
    'Back/Shoulders': '🏋️',
    'UpperLeg (Accessory)': '🦵'
  };

  return categoryMap[category] || '🏋️';
}

export function getCategoryColor(category: string): string {
  const categoryColorMap: Record<string, string> = {
    'Chest': '#FF5252',
    'Arms': '#7C4DFF',
    'Shoulders': '#448AFF',
    'Back': '#009688',
    'UpperLeg': '#FF9800',
    'LowerLeg': '#FFB74D',
    'Abs': '#FFD54F',
    'Back/Shoulders': '#4DB6AC',
    'UpperLeg (Accessory)': '#FFA726'
  };

  return categoryColorMap[category] || '#9E9E9E';
}

export function CategoryIcon({ category, size = 40 }: CategoryIconProps) {
  const theme = useTheme();
  const isDark = theme.name;
  const color = getCategoryColor(category);
  const emoji = getCategoryEmoji(category);

  return (
    <Circle
      size={size}
      backgroundColor={color}
      opacity={isDark ? 0.8 : 0.7}
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize={size * 0.5}>{emoji}</Text>
    </Circle>
  );
}