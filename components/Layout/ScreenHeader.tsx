// components/Layout/ScreenHeader.tsx - Consistent header for all screens
import React from 'react';
import { XStack, YStack, Text, Button } from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { useAppTheme } from '../ThemeProvider';

interface ScreenHeaderProps {
  /**
   * Main title text
   */
  title: string;
  
  /**
   * Optional subtitle text
   */
  subtitle?: string;
  
  /**
   * Optional right-aligned content
   */
  rightContent?: React.ReactNode;
  
  /**
   * Whether to show the back button
   */
  showBackButton?: boolean;
  
  /**
   * Custom handler for back button press
   */
  onBackPress?: () => void;
  
  /**
   * Bottom margin for the header
   */
  marginBottom?: number | string;
  
  /**
   * Horizontal padding for the header
   */
  paddingHorizontal?: number | string;
}

/**
 * A consistent header component for all screens with enhanced styling
 */
export function ScreenHeader({
  title,
  subtitle,
  rightContent,
  showBackButton = true,
  onBackPress,
  marginBottom,
  paddingHorizontal
}: ScreenHeaderProps) {
  const { colors, spacing, fontSize, isNarrow } = useAppTheme();
  
  // Handler for back button press
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };
  
  return (
    <XStack 
      width="100%" 
      justifyContent="space-between"
      alignItems="center" 
      marginTop={spacing.large}
      marginBottom={marginBottom || spacing.large}
      paddingHorizontal={paddingHorizontal}
    >
      <XStack alignItems="center" space={spacing.small} flex={1}>
        {showBackButton && (
          <Button
            size="$3"
            circular
            backgroundColor="transparent"
            onPress={handleBackPress}
            paddingLeft={0}
            focusStyle={{}}
            style={{
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              userSelect: 'none',
              outline: 'none'
            }}
          >
            <ChevronLeft size={20} color={colors.text} />
          </Button>
        )}
        
        <YStack flex={1}>
          <Text
            color={colors.text}
            fontSize={isNarrow ? fontSize.xlarge : fontSize.xxlarge}
            fontWeight="700"
            numberOfLines={1}
          >
            {title}
          </Text>
          
          {subtitle && (
            <Text
              color={colors.textMuted}
              fontSize={fontSize.small}
              marginTop={2}
            >
              {subtitle}
            </Text>
          )}
        </YStack>
      </XStack>
      
      {rightContent && (
        <XStack>{rightContent}</XStack>
      )}
    </XStack>
  );
}

export default ScreenHeader;