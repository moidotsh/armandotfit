// components/FeatureCard.tsx
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Card, XStack, YStack, Text } from 'tamagui';
import { useAppTheme } from './ThemeProvider';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}

export const FeatureCard = ({ icon, title, onPress }: FeatureCardProps) => {
  const { colors, spacing, fontSize, borderRadius } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;

  return (
    <Card
      backgroundColor={colors.cardAlt}
      borderRadius={borderRadius.medium}
      padding={isNarrow ? spacing.medium : spacing.large}
      height={isNarrow ? 90 : 110}
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
      onPress={onPress}
      focusStyle={{}}
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        userSelect: 'none',
        outline: 'none'
      }}
    >
      <XStack alignItems="center" space={isNarrow ? "$3" : "$4"}>
        <YStack
          width={isNarrow ? 50 : 60}
          height={isNarrow ? 50 : 60}
          borderRadius={isNarrow ? 25 : 30}
          backgroundColor="transparent"
          alignItems="center"
          justifyContent="center"
        >
          {icon}
        </YStack>
        <Text 
          fontSize={isNarrow ? fontSize.large : fontSize.xlarge} 
          fontWeight="500" 
          color={colors.text}
        >
          {title}
        </Text>
      </XStack>
    </Card>
  );
};

export const FeatureSection = ({ features }: { features: Array<{ icon: React.ReactNode; title: string; onPress: () => void; }> }) => {
  const { spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  return (
    <YStack space={spacing.large} flex={1}>
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          onPress={feature.onPress}
        />
      ))}
    </YStack>
  );
};