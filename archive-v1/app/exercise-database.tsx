import React from 'react';
import { YStack } from 'tamagui';
import { useAppTheme } from '../components/ThemeProvider';
import { ExerciseDatabaseBrowser } from '../components/Exercise/ExerciseDatabaseBrowser';

export default function ExerciseDatabaseScreen() {
  const { colors, spacing } = useAppTheme();

  return (
    <YStack
      flex={1}
      backgroundColor={colors.background}
      paddingTop={60}
      paddingHorizontal={spacing.large}
    >
      <ExerciseDatabaseBrowser
        allowSelection={false}
        showCreateButton={true}
      />
    </YStack>
  );
}