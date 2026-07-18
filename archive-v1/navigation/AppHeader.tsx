// navigation/AppHeader.tsx
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { 
  XStack, 
  YStack,
  Text, 
  Button
} from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { useAppTheme } from '../components/ThemeProvider';
import { NavigationPath, goBack } from './NavigationHelper';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  date?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  currentPath: NavigationPath;
}

export function AppHeader({ 
  title, 
  subtitle, 
  date, 
  showBackButton = true,
  onBackPress,
  currentPath
}: AppHeaderProps) {
  const { colors, fontSize, spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  const params = useLocalSearchParams<{ from?: string }>();
  
  const handleBackPress = () => {
    console.log('Back button pressed', { currentPath, fromParam: params.from });
    if (onBackPress) {
      console.log('Using custom onBackPress');
      onBackPress();
    } else {
      console.log('Using goBack navigation');
      // Use hierarchy-aware back navigation
      goBack(currentPath, params.from);
    }
  };

  return (
    <XStack alignItems="center" space={spacing.small} marginBottom={spacing.medium}>
      {showBackButton && (
        <Button 
          size="$4" 
          circular 
          backgroundColor={colors.cardBackground}
          icon={<ChevronLeft size="$1" color={colors.text} />} 
          onPress={handleBackPress}
          focusStyle={{}}
          pressStyle={{ opacity: 0.7 }}
          style={{
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            userSelect: 'none',
            outline: 'none',
            ...{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
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
            color={colors.text} // Review 
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