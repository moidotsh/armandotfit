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
  const { colors, borderRadius, fontSize, spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;

  // Calculate button sizes based on available width
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
            <YStack key={day} alignItems="center" style={{
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              userSelect: 'none',
              outline: 'none'
            }}>
              <Button
                width={buttonSize}
                height={buttonSize}
                // Always use orange (buttonBackground) for selection
                backgroundColor={isSelected ? colors.buttonBackground : 'transparent'}
                borderColor={isSelected ? colors.buttonBackground : colors.border}
                borderWidth={1.5}
                color={isSelected ? 'white' : colors.text}
                borderRadius={buttonSize / 2} // Make it fully circular
                fontWeight="bold"
                fontSize={fontSize.medium}
                onPress={() => onDaySelect(day)}
                pressStyle={{
                  scale: 0.92,
                  opacity: 0.9
                }}
                // Prevent focus styling on mobile web
                focusStyle={{}}
                // Prevent mobile highlight
                userSelect="none"
                // Add shadow for selected button
                shadowColor={isSelected ? colors.buttonBackground : 'transparent'}
                shadowOffset={{ width: 0, height: isSelected ? 3 : 0 }}
                shadowOpacity={isSelected ? 0.3 : 0}
                shadowRadius={isSelected ? 4 : 0}
                // Make sure the outline doesn't show on focus
                outlineWidth={0}
                outlineColor="transparent"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  userSelect: 'none',
                  outline: 'none'
                }}
              >
                <Text color={isSelected ? 'white' : colors.text}
                >{day}</Text>
              </Button>

              {/* Small indicator dot under selected button */}
              {isSelected && (
                <YStack
                  width={4}
                  height={4}
                  backgroundColor={colors.buttonBackground}
                  borderRadius={2}
                  marginTop={4}
                />
              )}
            </YStack>
          );
        })}
      </XStack>
    </XStack>
  );
}