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

// components/Settings/SettingsGroup.tsx - Group of related settings items
interface SettingsGroupProps {
  /**
   * The settings items to display in the group
   */
  children: ReactNode;
  
  /**
   * Optional title for the group
   */
  title?: string;
  
  /**
   * Optional footer text for the group
   */
  footer?: string;
  
  /**
   * Margin top
   */
  marginTop?: number | string;
  
  /**
   * Margin bottom
   */
  marginBottom?: number | string;
}

/**
 * Group of related settings items with a card container
 */
export function SettingsGroup({
  children,
  title,
  footer,
  marginTop,
  marginBottom = 16
}: SettingsGroupProps) {
  const { colors, spacing, fontSize, borderRadius, getShadow } = useAppTheme();
  
  // Process children to add separators between them
  const childrenArray = React.Children.toArray(children);
  const childrenWithSeparators = childrenArray.flatMap((child, index) => {
    if (index === childrenArray.length - 1) {
      return [child];
    }
    return [
      child,
      <View key={`separator-${index}`} height={1} backgroundColor={colors.border} />
    ];
  });
  
  return (
    <YStack marginTop={marginTop} marginBottom={marginBottom} paddingHorizontal={16}>
      {title && (
        <Text
          color={colors.textSecondary}
          fontSize={fontSize.small}
          fontWeight="500"
          marginBottom={6} // Slightly more space
          marginLeft={spacing.small}
          style={{ textTransform: 'uppercase' }}
        >
          {title}
        </Text>
      )}
      
      <YStack
        backgroundColor={colors.card}
        borderRadius={borderRadius.medium}
        marginBottom={spacing.small}
        overflow="hidden"
        style={getShadow('medium')}
      >
        {childrenWithSeparators}
      </YStack>
      
      {footer && (
        <Text
          color={colors.textMuted}
          fontSize={fontSize.small}
          marginTop={spacing.small}
          marginLeft={spacing.small}
        >
          {footer}
        </Text>
      )}
    </YStack>
  );
}

export default SettingsGroup;