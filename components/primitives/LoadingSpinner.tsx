// components/primitives/LoadingSpinner.tsx
// Small inline loading spinner wrapping ActivityIndicator. Audit C4
// requires every ActivityIndicator usage to live inside one of the
// three loading primitives (LoadingSpinner, LoadingOverlay, AppLoading)
// — this is the inline-site primitive (inside buttons, list items,
// compact wait states).

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../context';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export function LoadingSpinner({ size = 'small', color }: LoadingSpinnerProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      {/* c4-exempt: this primitive IS the ActivityIndicator wrapper.
          The wait reads ink — loading is furniture, and furniture never
          wears the red (interval-thesis §2). */}
      <ActivityIndicator size={size} color={color ?? colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingSpinner;
