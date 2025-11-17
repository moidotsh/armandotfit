// components/FeatureCard.tsx
import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Card, XStack, YStack, Text } from 'tamagui';
import { useAppTheme } from './ThemeProvider';
import { ChevronRight } from '@tamagui/lucide-icons';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  subtitle?: string;
  badge?: string | number;
}

export const FeatureCard = ({ 
  icon, 
  title, 
  onPress, 
  subtitle, 
  badge 
}: FeatureCardProps) => {
  const { colors, spacing, fontSize, borderRadius, shadows } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  const [isPressed, setIsPressed] = useState(false);

  // Get icon background color based on the icon's color or theme
  const getIconBackgroundColor = (iconColor?: string) => {
    if (iconColor) {
      // Make a lighter version of the icon color
      return iconColor + '15'; // Add transparency
    }
    return colors.cardAlt;
  };

  return (
    <Card
      backgroundColor={colors.cardBackground}
      borderRadius={borderRadius.large}
      padding={isNarrow ? spacing.medium : spacing.large}
      height={isNarrow ? 90 : 100}
      pressStyle={{ 
        scale: isPressed ? 0.98 : 1, 
        opacity: isPressed ? 0.95 : 1 
      }}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPressChange={setIsPressed}
      {...shadows.small}
      focusStyle={{}}
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        outline: 'none',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <XStack alignItems="center" space={isNarrow ? spacing.medium : spacing.large} flex={1}>
        <YStack
          width={isNarrow ? 48 : 56}
          height={isNarrow ? 48 : 56}
          borderRadius={isNarrow ? 24 : 28}
          backgroundColor={getIconBackgroundColor()}
          alignItems="center"
          justifyContent="center"
          position="relative"
        >
          {icon}
          {badge && (
            <YStack
              position="absolute"
              top={-2}
              right={-2}
              backgroundColor={colors.primary}
              minWidth={20}
              height={20}
              borderRadius={10}
              alignItems="center"
              justifyContent="center"
              paddingHorizontal={4}
            >
              <Text fontSize={10} color={colors.white} fontWeight="600">
                {typeof badge === 'number' && badge > 9 ? '9+' : badge}
              </Text>
            </YStack>
          )}
        </YStack>
        
        <YStack flex={1} space={spacing.xsmall}>
          <Text 
            fontSize={isNarrow ? fontSize.large : fontSize.xlarge} 
            fontWeight="600" 
            color={colors.text}
          >
            {title}
          </Text>
          {subtitle && (
            <Text 
              fontSize={fontSize.small} 
              color={colors.textMuted}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </YStack>
        
        <ChevronRight 
          size={20} 
          color={colors.textMuted} 
          style={{ 
            opacity: isPressed ? 0.8 : 0.5,
            transition: 'opacity 0.2s ease-in-out'
          }}
        />
      </XStack>
    </Card>
  );
};

export const FeatureSection = ({ features }: { features: Array<{ 
  icon: React.ReactNode; 
  title: string; 
  subtitle?: string;
  badge?: string | number;
  onPress: () => void; 
}> }) => {
  const { spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  return (
    <YStack space={spacing.medium} flex={1}>
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          subtitle={feature.subtitle}
          badge={feature.badge}
          onPress={feature.onPress}
        />
      ))}
    </YStack>
  );
};