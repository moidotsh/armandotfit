// components/UI/Card/CardContainer.tsx - Enhanced Card System for Arman.fit
import React, { ReactNode } from 'react';
import { Card, YStack, XStack, Text } from 'tamagui';
import { useAppTheme } from '../../ThemeProvider';

interface CardContainerProps {
  children: ReactNode;
  title?: string;
  headerContent?: ReactNode;
  elevate?: boolean;
  padding?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;
  paddingBottom?: number | string;
  paddingVertical?: number | string;
  paddingHorizontal?: number | string;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  spaced?: boolean;
  space?: number;
  backgroundColor?: string;
  onPress?: () => void;
}

/**
 * Enhanced card container with consistent styling and flexible options
 */
export function CardContainer({
  children,
  title,
  headerContent,
  elevate = false,
  padding,
  paddingBottom,
  borderBottomLeftRadius,
  borderBottomRightRadius,
  paddingHorizontal,
  paddingVertical,
  marginTop,
  marginBottom = 24,
  spaced = false,
  space,
  backgroundColor,
  onPress,
}: CardContainerProps) {
  const { colors, spacing, fontSize, borderRadius, getShadow } = useAppTheme();

  // Default padding based on theme spacing
  const defaultPadding = spacing.large;

  return (
    <Card
      backgroundColor={backgroundColor || colors.card}
      padding={padding !== undefined ? padding : defaultPadding}
      borderRadius={borderRadius.medium}
      marginTop={marginTop}
      marginBottom={marginBottom}
      borderBottomLeftRadius={borderBottomLeftRadius}
      borderBottomRightRadius={borderBottomRightRadius}
      paddingBottom={paddingBottom}
      paddingVertical={paddingVertical}
      paddingHorizontal={paddingHorizontal}
      elevate={elevate}
      onPress={onPress}
      overflow="hidden"
      style={elevate ? getShadow('medium') : undefined}
      {...(onPress && {
        pressStyle: { opacity: 0.9, scale: 0.98 },
        focusStyle: {},
        hoverStyle: { opacity: 0.95 }
      })}
    >
      {title && (
        <XStack
          justifyContent="space-between"
          alignItems="center"
          marginBottom={spacing.medium}
        >
          <Text
            color={colors.text}
            fontSize={fontSize.large}
            fontWeight="600"
          >
            {title}
          </Text>
          {headerContent}
        </XStack>
      )}

      <YStack
        space={spaced ? (space || spacing.medium) : undefined}
        paddingVertical={padding === undefined ? 0 : 4}
      >
        {children}
      </YStack>
    </Card>
  );
}

export default CardContainer;