// components/primitives/LoadingOverlay.tsx
// Full-screen loading overlay with optional message, subMessage, and
// progress bar. Audit C4 requires every ActivityIndicator usage to
// live inside one of the three loading primitives — this is the
// modal/blocking-load primitive (during multi-step operations,
// navigation transitions, etc.).

import React from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
  /** Optional progress value between 0 and 100. */
  progress?: number;
  accentColor?: string;
}

export function LoadingOverlay({
  visible,
  message,
  subMessage,
  progress,
  accentColor,
}: LoadingOverlayProps) {
  const { colors } = useAppTheme();
  const accent = accentColor ?? colors.brand;

  if (!visible) return null;

  return (
    <View style={styles.scrim}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        {/* c4-exempt: this primitive IS the ActivityIndicator wrapper. */}
        <ActivityIndicator size="large" color={accent} />
        {message ? (
          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        ) : null}
        {subMessage ? (
          <Text style={[styles.subMessage, { color: colors.textMuted }]}>
            {subMessage}
          </Text>
        ) : null}
        {progress !== undefined ? (
          <View style={[styles.progressTrack, { backgroundColor: colors.cardAlt }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: accent,
                  width: `${Math.min(Math.max(progress, 0), 100)}%`,
                },
              ]}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    // Translucent dark scrim — the standard modal/blocking overlay
    // identity. Same value in light and dark mode (a dimmed overlay
    // works the same way against either surface).
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 16,
    minWidth: 300,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  message: {
    ...theme.typography.mobileAction,
    textAlign: 'center',
    marginTop: 16,
  },
  subMessage: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default LoadingOverlay;
