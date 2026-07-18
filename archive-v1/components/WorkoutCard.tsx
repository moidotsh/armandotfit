import React from 'react';
import { Card, Text, YStack, XStack, Separator } from 'tamagui';

type WorkoutCardProps = {
  title: string;
  exercises: string[];
};

export function WorkoutCard({ title, exercises }: WorkoutCardProps) {
  return (
    <Card
      bordered
      elevate
      size="$4"
      scale={0.9}
      hoverStyle={{ scale: 0.925 }}
      pressStyle={{ scale: 0.875 }}
    >
      <Card.Header padded>
        <Text fontSize={18} fontWeight="bold">{title}</Text>
      </Card.Header>
      
      <Separator />
      
      <YStack space="$2" padding="$3">
        {exercises.map((exercise, index) => {
          if (exercise.includes('AM:') || exercise.includes('PM:')) {
            return (
              <XStack key={index} marginTop={index > 0 ? '$3' : 0}>
                <Text fontSize={16} fontWeight="bold">{exercise}</Text>
              </XStack>
            );
          }
          return (
            <Text key={index} paddingLeft={exercise.includes('AM:') || exercise.includes('PM:') ? 0 : '$2'}>
              {exercise}
            </Text>
          );
        })}
      </YStack>
    </Card>
  );
}