import React from 'react';
import { Card, XStack, YStack, Text } from 'tamagui';
import { Exercise } from '../data/workoutData';
import { CategoryIcon } from './CategoryIcon';

type ExerciseCardProps = {
  exercise: Exercise;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Card
      bordered
      marginBottom={12}
      paddingVertical={16}
      paddingHorizontal={16}
      borderRadius={12}
      scale={0.97}
      pressStyle={{ scale: 0.95 }}
    >
      <XStack alignItems="center" space="$3">
        <CategoryIcon category={exercise.category} />
        <YStack flex={1}>
          <Text fontSize={18} fontWeight="500">{exercise.name}</Text>
          <Text fontSize={14} opacity={0.7}>{exercise.category}</Text>
        </YStack>
      </XStack>
    </Card>
  );
}