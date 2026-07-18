// app/workout-programs.tsx
// Templates / programs browser. Stub for v2 — the v2 surface will ship
// curated programs (Push-Pull-Legs, Upper/Lower, etc.) that the user
// can clone into their active programming. For now, surfaces an empty
// state so the route exists and is reachable.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
} from '../components/MobilePremium';
import { useAppTheme } from '../context';
import { safeGoBack } from '../navigation';

export default function WorkoutProgramsScreen() {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="setup" />
      <MobileHeader title="Programs" eyebrow="Coming soon" onBack={safeGoBack} />
      <View style={styles.body}>
        <MobileSurface padding={20}>
          <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
            Curated workout programs (Push-Pull-Legs, Upper/Lower, Full Body,
            powerlifting templates) land here in v2. For now, build ad-hoc
            sessions from the home screen.
          </Text>
        </MobileSurface>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 12 },
});
