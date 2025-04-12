import React from 'react';
import { router } from 'expo-router';
import { H2, XStack, YStack, Text, Button } from 'tamagui';
import { ChevronLeft } from '@tamagui/lucide-icons';

type WorkoutHeaderProps = {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  accentColor?: string;
};

export function WorkoutHeader({ 
  title, 
  subtitle, 
  showBackButton = true,
  accentColor = '$accent' 
}: WorkoutHeaderProps) {
  return (
    <XStack alignItems="center" space="$4" paddingBottom={20}>
      {showBackButton && (
        <Button
          icon={<ChevronLeft size="$1" />}
          size="$3"
          circular
          onPress={() => router.back()}
        />
      )}
      <YStack>
        {subtitle && (
          <Text color={accentColor} fontSize={16} fontWeight="700">
            {subtitle}
          </Text>
        )}
        <H2 color="$color">{title}</H2>
      </YStack>
    </XStack>
  );
}