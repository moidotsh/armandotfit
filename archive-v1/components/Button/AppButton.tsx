// components/Button/AppButton.tsx - Enhanced Button System for Arman.fit
import React from 'react';
import { Button, Text, XStack, Spinner } from 'tamagui';
import { useAppTheme } from '../ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface AppButtonProps {
  /**
   * The label text to display on the button
   */
  label: string;
  
  /**
   * Button variant (style)
   */
  variant?: ButtonVariant;
  
  /**
   * Button size
   */
  size?: ButtonSize;
  
  /**
   * Function to call when button is pressed
   */
  onPress?: () => void;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the button is in a loading state
   */
  loading?: boolean;
  
  /**
   * Icon to display before the label
   */
  icon?: React.ReactNode;
  
  /**
   * Whether the button should take the full width of its container
   */
  fullWidth?: boolean;
  
  /**
   * Margin top value
   */
  marginTop?: number | string;
  
  /**
   * Margin bottom value
   */
  marginBottom?: number | string;
  
  /**
   * Additional style props to apply
   */
  style?: any;
}

/**
 * A consistent button component with variants for Arman.fit (Gym-optimized styling)
 */
export function AppButton({
  label,
  variant = 'primary',
  size = 'medium',
  onPress,
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  marginTop,
  marginBottom,
  style
}: AppButtonProps) {
  const { colors, spacing, fontSize, borderRadius, getShadow } = useAppTheme();
  
  // Get button styles based on variant (gym-optimized colors)
  const getButtonStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.cardAlt,
          color: colors.text
        };
      case 'subtle':
        return {
          backgroundColor: 'transparent',
          color: colors.text
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
          color: colors.textOnPrimary
        };
      default: // primary - use gym orange
        return {
          backgroundColor: disabled ? colors.buttonBackgroundDisabled : colors.buttonBackground,
          color: colors.buttonText
        };
    }
  };
  
  // Get button size (gym-friendly sizing)
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return {
          height: 44, // Larger than QEP for gym use
          paddingHorizontal: spacing.medium,
          fontSize: fontSize.small
        };
      case 'large':
        return {
          height: 64, // Larger for gym environment
          paddingHorizontal: spacing.xlarge,
          fontSize: fontSize.large
        };
      default: // medium
        return {
          height: 56, // Larger than QEP default
          paddingHorizontal: spacing.large,
          fontSize: fontSize.medium
        };
    }
  };
  
  const { backgroundColor, color } = getButtonStyles();
  const { height, paddingHorizontal, fontSize: textSize } = getButtonSize();
  
  return (
    <Button
      backgroundColor={backgroundColor}
      color={color}
      height={height}
      paddingHorizontal={paddingHorizontal}
      fontWeight="600"
      onPress={loading || disabled ? undefined : onPress}
      disabled={disabled || loading}
      opacity={disabled ? 0.7 : 1}
      width={fullWidth ? '100%' : 'auto'}
      pressStyle={{ opacity: 0.9, scale: 0.99 }}
      marginTop={marginTop}
      marginBottom={marginBottom}
      borderRadius={borderRadius.large}
      style={[getShadow(variant === 'primary' ? 'medium' : 'small'), style]}
      focusStyle={{}}
    >
      {loading ? (
        <XStack space={spacing.small} alignItems="center">
          <Spinner color={color} />
          <Text color={color} fontWeight="600" fontSize={textSize}>
            {label}
          </Text>
        </XStack>
      ) : (
        <XStack space={icon ? spacing.small : 0} alignItems="center">
          {icon}
          <Text color={color} fontWeight="600" fontSize={textSize}>
            {label}
          </Text>
        </XStack>
      )}
    </Button>
  );
}