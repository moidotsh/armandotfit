// components/DaySelector.tsx - Fixed style conflicts
import React from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { XStack, Button, Text, YStack } from 'tamagui';
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
  const { 
    colors, 
    spacing, 
    fontSize, 
    borderRadius,
    getShadow,
    isNarrow 
  } = useAppTheme();

  const buttonSize = isNarrow ? 45 : 55;

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
        {days.map(day => {
          const isSelected = selectedDay === day;

          return (
            <YStack 
              key={day} 
              alignItems="center" 
              style={{
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                userSelect: 'none',
              }}
            >
              <Button
                width={buttonSize}
                height={buttonSize}
                backgroundColor={isSelected ? colors.buttonBackground : 'transparent'}
                borderColor={isSelected ? colors.buttonBackground : colors.border}
                borderWidth={1.5}
                color={isSelected ? colors.buttonText : colors.text}
                borderRadius={borderRadius.circle}
                fontWeight="bold"
                fontSize={fontSize.medium}
                onPress={() => onDaySelect(day)}
                pressStyle={{
                  scale: 0.92,
                  opacity: 0.9
                }}
                // FIXED: Use only individual outline properties, not shorthand
                outlineWidth={0}
                outlineStyle="none"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  userSelect: 'none',
                  ...(isSelected ? getShadow('medium') : getShadow('small'))
                }}
              >
                <Text color={isSelected ? colors.buttonText : colors.text}>
                  {day}
                </Text>
              </Button>

              {isSelected && (
                <YStack
                  width={4}
                  height={4}
                  backgroundColor={colors.buttonBackground}
                  borderRadius={borderRadius.circle}
                  marginTop={4}
                  style={getShadow('small')}
                />
              )}
            </YStack>
          );
        })}
      </XStack>
    </XStack>
  );
}