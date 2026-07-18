// components/Typography/SectionTitle.tsx - Consistent section title component
import React from 'react';
import { Text } from 'tamagui';
import { useAppTheme } from '../ThemeProvider';

interface SectionTitleProps {
  /**
   * The title text to display
   */
  children: React.ReactNode;
  
  /**
   * Whether to use uppercase text
   */
  uppercase?: boolean;
  
  /**
   * Font size multiplier (relative to the theme's medium font size)
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Margin bottom spacing
   */
  marginBottom?: number | string;
  
  /**
   * Text color
   */
  color?: string;
  
  /**
   * Letter spacing
   */
  letterSpacing?: number;
}

/**
 * A consistent section title component for Arman.fit
 */
export function SectionTitle({
  children,
  uppercase = true,
  size = 'medium',
  marginBottom,
  color,
  letterSpacing = 1
}: SectionTitleProps) {
  const { colors, spacing, fontSize } = useAppTheme();
  
  // Determine font size based on size prop
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return fontSize.small;
      case 'large':
        return fontSize.large;
      default: // medium
        return fontSize.medium;
    }
  };
  
  return (
    <Text
      color={color || colors.textSecondary}
      fontSize={getFontSize()}
      fontWeight="500"
      marginBottom={marginBottom || spacing.small}
      style={{
        letterSpacing,
        textTransform: uppercase ? 'uppercase' : 'none',
      }}
    >
      {children}
    </Text>
  );
}

export default SectionTitle;