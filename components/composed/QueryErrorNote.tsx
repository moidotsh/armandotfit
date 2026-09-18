// components/composed/QueryErrorNote.tsx
// The honest error state: when a read fails, say so inline and offer one
// retry. A failed query must never render as an empty history — "no
// sessions yet" is a fact about the logbook, not about the network.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MobileAlert } from '../MobilePremium';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';

export interface QueryErrorNoteProps {
  /** Provide to offer the retry affordance (refetch from the caller). */
  onRetry?: () => void;
  testID?: string;
}

export function QueryErrorNote({ onRetry, testID }: QueryErrorNoteProps) {
  const { colors } = useAppTheme();
  return (
    <View testID={testID}>
      <MobileAlert
        variant="error"
        title="Couldn't load"
        body="This didn't arrive — check your connection."
      />
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try loading again"
          hitSlop={8}
          style={({ pressed }) => [
            styles.retry,
            pressed ? { opacity: 0.6 } : null,
          ]}
        >
          <Text style={[styles.retryText, { color: colors.brandText }]}>
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  retry: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  retryText: { ...theme.typography.mobileAction },
});

export default QueryErrorNote;
