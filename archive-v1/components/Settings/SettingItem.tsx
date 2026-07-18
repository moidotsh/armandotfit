// components/Settings/SettingItem.tsx - Enhanced setting item component
import React, { ReactNode } from 'react';
import { YStack, XStack, Text, View } from 'tamagui';
import { useAppTheme } from '../ThemeProvider';

interface SettingItemProps {
  /**
   * Icon to display (typically a Lucide icon)
   */
  icon: ReactNode;
  
  /**
   * Title of the setting
   */
  title: string;
  
  /**
   * Optional description text
   */
  description?: string;
  
  /**
   * Element to display on the right side (switch, button, etc.)
   */
  rightElement?: ReactNode;
  
  /**
   * Handler for when the setting is pressed
   */
  onPress?: () => void;
  
  /**
   * Whether the setting is destructive (will display in red)
   */
  destructive?: boolean;
}

/**
 * Standard setting item component for use in settings screens
 */
export function SettingItem({
  icon,
  title,
  description = '',
  rightElement = null,
  onPress,
  destructive = false
}: SettingItemProps) {
  const { colors, spacing, fontSize } = useAppTheme();
  
  return (
    <YStack
      padding={spacing.medium}
      paddingVertical={18} // Larger padding for gym use
      pressStyle={onPress ? { opacity: 0.7 } : undefined}
      onPress={onPress}
      cursor={onPress ? 'pointer' : 'default'}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" space={spacing.medium}>
          {React.isValidElement(icon) && 
            React.cloneElement(icon as React.ReactElement<{ size?: number; color?: string }>, { 
              size: 26, // Slightly larger for gym visibility
              color: destructive ? colors.error : colors.text
            })
          }
          
          <YStack>
            <Text 
              color={destructive ? colors.error : colors.text}
              fontSize={fontSize.medium}
              fontWeight="500"
            >
              {title}
            </Text>
            
            {description ? (
              <Text 
                color={colors.textMuted} 
                fontSize={fontSize.small}
                marginTop={2}
              >
                {description}
              </Text>
            ) : null}
          </YStack>
        </XStack>
        
        <View paddingLeft={spacing.medium}>
          {rightElement}
        </View>
      </XStack>
    </YStack>
  );
}

export default SettingItem;