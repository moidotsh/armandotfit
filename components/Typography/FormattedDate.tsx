// components/Typography/FormattedDate.tsx - Consistent date display component
import React from 'react';
import { Text } from 'tamagui';
import { useAppTheme } from '../ThemeProvider';

interface FormattedDateProps {
  /**
   * The date string to display
   */
  date: string;
  
  /**
   * Custom font size
   */
  fontSize?: number;
  
  /**
   * Custom letter spacing
   */
  letterSpacing?: number;
  
  /**
   * Additional className for the text
   */
  className?: string;
  
  /**
   * Whether to use uppercase text
   */
  uppercase?: boolean;
  
  /**
   * Text color override
   */
  color?: string;
  
  /**
   * Font weight override
   */
  fontWeight?: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'unset';
}

/**
 * Displays a formatted date with consistent styling for Arman.fit
 */
export function FormattedDate({
  date,
  fontSize,
  letterSpacing = 1.1,
  className,
  uppercase = false,
  color,
  fontWeight = '300'
}: FormattedDateProps) {
  const { colors, fontSize: themeFont } = useAppTheme();
  
  return (
    <Text
      color={color || colors.text}
      fontSize={fontSize || themeFont.small}
      fontWeight={fontWeight}
      style={{
        letterSpacing,
        textTransform: uppercase ? 'uppercase' : 'none',
      }}
      className={className}
    >
      {date}
    </Text>
  );
}

export default FormattedDate;