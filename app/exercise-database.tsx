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
  FilterChip,
  FilterChipGroup,
} from '../components/MobilePremium';
import { ExerciseListItem } from '../components/composed';
import { useAppTheme, useToast } from '../context';
import { navigateToExerciseDetail, safeGoBack } from '../navigation';
import { useExercises, useAiPayload } from '../hooks';
import { useExerciseStore, useWorkoutStore } from '../stores';
import type { SystemExerciseData } from '../shared/exercises';
import { SCREEN_BODY_STYLE } from '../constants';

/** Group the catalog by display category, in display order. */
const CATEGORY_ORDER = ['Chest', 'Back', 'Shoulders', 'Arms', 'Upper Leg', 'Lower Leg', 'Abs'];
function groupedByCategory(entries: SystemExerciseData[]) {
  const groups = new Map<string, SystemExerciseData[]>();
  for (const e of entries) {
    const list = groups.get(e.category) ?? [];
    list.push(e);
    groups.set(e.category, list);
  }
  return [...groups.entries()]
    .sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]),
    )
    .map(([category, list]) => ({ category, entries: list }));
}

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
        <View style={{ height: 10 }} />
        <FilterChipGroup>
          {['floor', 'dumbbell', 'barbell', 'machine', 'cable'].map((m) => (
            <FilterChip
              key={m}
              label={m === 'floor' ? 'Bodyweight' : m === 'dumbbell' ? 'DB' : m === 'barbell' ? 'BB' : m[0].toUpperCase() + m.slice(1)}
              selected={filter.modality === m}
              onPress={() =>
                setFilter({ modality: filter.modality === m ? undefined : m })
              }
              accessibilityLabel={`Filter by ${m}`}
            />
          ))}
        </FilterChipGroup>

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
            data={groupedByCategory(query.data ?? [])}
            keyExtractor={(item) => item.category}
            renderItem={({ item }) => (
              <View>
                <View style={{ height: 4 }} />
                <MobileSectionEyebrow>
                  {item.category} · {item.entries.length}
                </MobileSectionEyebrow>
                <View style={{ height: 8 }} />
                {item.entries.map((e) => (
                  <View key={e.slug} style={{ marginBottom: 8 }}>
                    <ExerciseListItem exercise={e} onPress={navigateToExerciseDetail} />
                  </View>
                ))}
              </View>
            )}
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
