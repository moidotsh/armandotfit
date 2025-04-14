// navigation/AppHeader.tsx
import React from 'react';
import { router } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { 
  XStack, 
  YStack,
  Text, 
  Button
} from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { useAppTheme } from '../components/ThemeProvider';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  date?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export function AppHeader({ 
  title, 
  subtitle, 
  date, 
  showBackButton = true,
  onBackPress 
}: AppHeaderProps) {
  const { colors, fontSize, spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <XStack alignItems="center" space={spacing.small} marginBottom={spacing.medium}>
      {showBackButton && (
        <Button 
          size="$3" 
          circular 
          icon={<ChevronLeft size="$1" />} 
          onPress={handleBackPress}
          focusStyle={{}}
          style={{
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            userSelect: 'none',
            outline: 'none'
          }}
        />
      )}
      <YStack>
        {date && (
          <Text
            color={colors.textSecondary}
            fontSize={isNarrow ? fontSize.medium : fontSize.large}
            fontWeight="500"
          >
            {date}
          </Text>
        )}
        {subtitle && (
          <Text 
            color={colors.text}  // check this later
            fontSize={isNarrow ? 14 : 16}
          >
            {subtitle}
          </Text>
        )}
        {title && (
          <Text
            color={colors.text}
            fontSize={isNarrow ? fontSize.xlarge : fontSize.xxlarge}
            fontWeight="700"
            numberOfLines={2}
          >
            {title}
          </Text>
        )}
      </YStack>
    </XStack>
  );
}