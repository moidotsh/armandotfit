// components/ConstrainedViewSetting.tsx
import React from 'react';
import { Platform } from 'react-native';
import { XStack, Text, Switch, YStack } from 'tamagui';
import { Smartphone } from '@tamagui/lucide-icons';
import { useAppTheme } from './ThemeProvider';

interface ConstrainedViewSettingProps {
  /**
   * Optional custom label text
   */
  label?: string;
  
  /**
   * Optional custom description text
   */
  description?: string;
}

/**
 * Setting component for toggling constrained view (desktop phone-width layout)
 * Only shows on web platforms since it doesn't make sense on mobile
 */
export function ConstrainedViewSetting({
  label = "Phone-Width Layout",
  description = "Constrain the app to phone dimensions on desktop"
}: ConstrainedViewSettingProps) {
  const { colors, spacing, fontSize, constrainedView, toggleConstrainedView } = useAppTheme();
  const isWeb = Platform.OS === 'web';
  
  // Don't render on non-web platforms
  if (!isWeb) {
    return null;
  }
  
  return (
    <XStack 
      alignItems="center" 
      justifyContent="space-between" 
      paddingVertical={spacing.medium}
      paddingHorizontal={spacing.medium}
    >
      <XStack alignItems="center" space={spacing.medium} flex={1}>
        <Smartphone size={24} color={colors.text} />
        
        <YStack flex={1}>
          <Text 
            color={colors.text}
            fontSize={fontSize.medium}
            fontWeight="500"
          >
            {label}
          </Text>
          
          {description && (
            <Text 
              color={colors.textMuted} 
              fontSize={fontSize.small}
              marginTop={2}
            >
              {description}
            </Text>
          )}
        </YStack>
      </XStack>
      
      <Switch
        checked={constrainedView}
        onCheckedChange={toggleConstrainedView}
        backgroundColor={constrainedView ? colors.buttonBackground : colors.cardAlt}
      />
    </XStack>
  );
}

export default ConstrainedViewSetting;