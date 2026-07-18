// app/exercise-database.tsx
// Exercise library browse. Search + filter + tap-through to detail. The
// filter state lives in exerciseStore so it survives the browse → detail
// round-trip; this route just renders it.

import React, { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileHeader,
  MobileInput,
  MobileSectionEyebrow,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { ExerciseListItem } from '../components/composed';
import { useAppTheme } from '../context';
import { navigateToExerciseDetail, safeGoBack } from '../navigation';
import { useExercises } from '../hooks';
import { useExerciseStore } from '../stores';
import type { Exercise } from '../shared/types';

export default function ExerciseDatabaseScreen() {
  const { colors } = useAppTheme();
  const filter = useExerciseStore((s) => s.filter);
  const setFilter = useExerciseStore((s) => s.setFilter);
  const resetFilters = useExerciseStore((s) => s.resetFilters);

  // Search commits directly to filter on each keystroke — MobileInput has
  // no onSubmitEditing prop, so the typed-vs-committed split is dropped.
  // The query is debounced by React Query's staleTime / dedup.
  const query = useExercises(filter);

  // Reset filters on unmount so the next browse session starts fresh.
  useEffect(() => {
    return () => {
      resetFilters();
    };
  }, [resetFilters]);

  const renderItem = ({ item }: { item: Exercise }) => (
    <ExerciseListItem
      exercise={item}
      onPress={navigateToExerciseDetail}
    />
  );

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="training" />
      <MobileHeader title="Exercises" eyebrow="Library" onBack={safeGoBack} />
      <View style={styles.body}>
        <MobileInput
          label="Search"
          value={filter.search ?? ''}
          onChangeText={(text) => setFilter({ search: text.trim() || undefined })}
          placeholder="Search exercises…"
        />
        <View style={{ height: 12 }} />
        <MobileSectionEyebrow>
          {query.data?.length ?? 0} results
        </MobileSectionEyebrow>
        {query.isLoading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={query.data}
            keyExtractor={(e) => e.id}
            renderItem={renderItem}
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
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  listContent: { paddingBottom: 24 },
});
