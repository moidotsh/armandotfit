// app/exercise-database.tsx
// Exercise library browse. Search + tap-through to detail. The catalog
// is local (data.ts — sole display source); filtering is client-side.

import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileHeader,
  MobileInput,
  MobileSurface,
  MobileSectionEyebrow,
  CopyForAiButton,
  SearchField,
  EmptyState,
} from '../components/MobilePremium';
import { ExerciseListItem } from '../components/composed';
import { useAppTheme, useToast } from '../context';
import { navigateToExerciseDetail, safeGoBack } from '../navigation';
import { useExercises, useAiPayload } from '../hooks';
import { useExerciseStore, useWorkoutStore } from '../stores';
import { SCREEN_BODY_STYLE } from '../constants';

export default function ExerciseDatabaseScreen() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);
  const addExerciseToDraft = useWorkoutStore((s) => s.addExerciseToDraft);
  const [customName, setCustomName] = useState('');
  const filter = useExerciseStore((s) => s.filter);
  const setFilter = useExerciseStore((s) => s.setFilter);
  const resetFilters = useExerciseStore((s) => s.resetFilters);

  const query = useExercises(filter);

  useEffect(() => {
    return () => {
      resetFilters();
    };
  }, [resetFilters]);

  const resultCount = query.data?.length ?? 0;
  const aiPayload = useAiPayload({
    visibleContent: [
      `- Search: "${filter.search ?? ''}"`,
      `- Results: ${resultCount}`,
    ].join('\n'),
  });

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="training" />
      <MobileHeader
        title="Exercises"
        eyebrow="Library"
        onBack={safeGoBack}
        navRightAction={<CopyForAiButton payload={aiPayload} testID="exercise-database-copy-for-ai" />}
      />
      <View style={styles.body}>
        <SearchField
          value={filter.search ?? ''}
          onChangeText={(text) => setFilter({ search: text.trim() || undefined })}
          placeholder="Search exercises…"
          accessibilityLabel="Search exercises"
          testID="exercise-search-field"
        />
        {isSessionActive ? (
          <>
            <View style={{ height: 12 }} />
            <MobileSurface padding={12}>
              <MobileInput
                label="Not in the library?"
                value={customName}
                onChangeText={setCustomName}
                placeholder="Type an exercise name…"
              />
              <Pressable
                onPress={() => {
                  const name = customName.trim();
                  if (name.length < 2) {
                    showToast('error', 'Give the exercise a name (2+ characters).');
                    return;
                  }
                  addExerciseToDraft({ exerciseName: name });
                  showToast('success', `Added ${name} to session`);
                  setCustomName('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Add custom exercise to session"
                style={styles.addCustomCta}
              >
                <Text style={[styles.addCustomText, { color: colors.brand }]}>
                  + Add “{customName.trim() || 'exercise'}” to session
                </Text>
              </Pressable>
            </MobileSurface>
          </>
        ) : null}
        <View style={{ height: 12 }} />
        <MobileSectionEyebrow>{resultCount} results</MobileSectionEyebrow>
        {resultCount === 0 ? (
          <EmptyState
            compact
            title="No exercises found"
            message={filter.search ? `Nothing matches “${filter.search}”.` : undefined}
            testID="exercise-database-empty"
          />
        ) : (
          <FlatList
            data={query.data}
            keyExtractor={(e) => e.slug}
            renderItem={({ item }) => (
              <ExerciseListItem exercise={item} onPress={navigateToExerciseDetail} />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: {
    ...SCREEN_BODY_STYLE,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  listContent: { paddingBottom: 24 },
  addCustomCta: { marginTop: 8, alignSelf: 'flex-start' },
  addCustomText: { fontSize: 14, fontWeight: '600' },
});
