import React from 'react';
import { Button, styled, Text, View } from 'tamagui';
import { useAppTheme } from './ThemeProvider';

// Props for the ThemedButton component
interface ThemedButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'disabled';
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

// Custom button component using the theme system
export function ThemedButton({ 
  label, 
  variant = 'primary', 
  onPress, 
  size = 'medium',
  fullWidth = false,
  icon
}: ThemedButtonProps) {
  // Use our custom theme hook
  const { colors, borderRadius, fontSize, isDark } = useAppTheme();
  
  // Determine size properties
  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { 
          height: 40, 
          paddingHorizontal: 16,
          fontSize: fontSize.small,
          borderRadius: borderRadius.small
        };
      case 'large':
        return { 
          height: 60, 
          paddingHorizontal: 24,
          fontSize: fontSize.large,
          borderRadius: borderRadius.large
        };
      default: // medium
        return { 
          height: 50, 
          paddingHorizontal: 20,
          fontSize: fontSize.medium,
          borderRadius: borderRadius.medium
        };
    }
  };
  
  // Determine variant properties
  const getVariantProps = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: isDark ? colors.cardAlt : colors.backgroundAlt,
          color: colors.text
        };
      case 'disabled':
        return {
          backgroundColor: colors.buttonBackgroundDisabled,
          color: isDark ? colors.textMuted : colors.text,
          opacity: 0.7
        };
      default: // primary
        return {
          backgroundColor: colors.buttonBackground,
          color: '#FFFFFF'
        };
    }
  };
  
  const { height, paddingHorizontal, fontSize: fontSizeValue, borderRadius: borderRadiusValue } = getSizeProps();
  const { backgroundColor, color } = getVariantProps();
  
  return (
    <Button
      height={height}
      paddingHorizontal={paddingHorizontal}
      backgroundColor={backgroundColor}
      color={color}
      borderRadius={borderRadiusValue}
      onPress={variant === 'disabled' ? undefined : onPress}
      opacity={variant === 'disabled' ? 0.7 : 1}
      width={fullWidth ? '100%' : 'auto'}
      pressStyle={{ opacity: 0.85, scale: 0.98 }}
      fontWeight="bold"
      fontSize={fontSizeValue}
    >
      {icon && (
        <View marginRight={8}>
          {icon}
        </View>
      )}
      <Text color={color} fontWeight="bold" fontSize={fontSizeValue}>{label}</Text>
    </Button>
  );
}

// Usage example:
// <ThemedButton 
//   label="Start Workout" 
//   variant="primary" 
//   size="large" 
//   fullWidth 
//   onPress={() => console.log('Button pressed')} 
//   icon={<PlayIcon />} 
// />