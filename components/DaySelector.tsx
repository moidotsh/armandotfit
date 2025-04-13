import React from 'react';
import { useWindowDimensions } from 'react-native';
import { XStack, Button, Text } from 'tamagui';
import { useAppTheme } from './ThemeProvider';

interface DaySelectorProps {
  selectedDay: number | null;
  onDaySelect: (day: number) => void;
  days?: number[];
}

export function DaySelector({ 
  selectedDay, 
  onDaySelect, 
  days = [1, 2, 3, 4] 
}: DaySelectorProps) {
  const { colors, borderRadius, fontSize, spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  // Calculate button sizes based on available width
  const buttonSize = isNarrow ? 40 : 50;
  const buttonMargin = isNarrow ? 4 : 8;
  
  return (
    <XStack width="100%" justifyContent="space-between" alignItems="center">
      <Text 
        color={colors.text}
        fontSize={fontSize.medium}
        fontWeight="600"
        minWidth={65}
      >
        Day:
      </Text>
      
      <XStack flex={1} justifyContent="space-around" marginLeft={spacing.small}>
        {days.map(day => (
          <Button
            key={day}
            width={buttonSize}
            height={buttonSize}
            backgroundColor={selectedDay === day ? colors.textSecondary : colors.cardAlt}
            color={selectedDay === day ? 'white' : colors.text}
            borderRadius={borderRadius.medium}
            fontWeight="bold"
            fontSize={fontSize.medium}
            onPress={() => onDaySelect(day)}
            pressStyle={{ 
              scale: 0.95, 
              backgroundColor: selectedDay === day 
                ? colors.textMuted 
                : colors.card 
            }}
          >
            {day}
          </Button>
        ))}
      </XStack>
    </XStack>
  );
}