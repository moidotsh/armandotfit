import React from 'react';
import { Card, XStack, View, Text, useTheme } from 'tamagui';

type ExerciseProps = {
  name: string;
  icon: (color: string) => React.ReactNode;
  type: string;
};

export function Exercise({ name, icon, type }: ExerciseProps) {
  const theme = useTheme();
  const textColor = theme.color.get();
  
  return (
    <Card
      marginBottom={12}
      elevate
      bordered
      scale={0.97}
      pressStyle={{ scale: 0.95 }}
      paddingVertical={22}
      paddingHorizontal={20}
      borderRadius={15}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center">
          <View marginRight={16}>
            {icon(textColor)}
          </View>
          <Text color={textColor} fontSize={22} fontWeight="500">
            {name}
          </Text>
        </XStack>
        <Text color={theme.gray?.get()} fontSize={28} fontWeight="300">
          ›
        </Text>
      </XStack>
    </Card>
  );
}