// app/exercise-database.tsx
// Exercise library browse. Search + modality chips + tap-through to
// detail. The catalog is local (data.ts — sole display source);
// filtering is client-side. Unfiltered browse leads with a "Recently
// logged" section (distinct names from the last sessions, recency
// order) — the shortest path back to what the user actually lifts.
// Sections group by display category with sticky headers so scrolling
// a long list keeps its place.

import React, { useEffect, useMemo, useState } from 'react';
import { SectionList, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { useExercises, useRecentSessionDetails, useAiPayload } from '../hooks';
import { useExerciseStore, useWorkoutStore } from '../stores';
import { SYSTEM_EXERCISES, type SystemExerciseData } from '../shared/exercises';
import { SCREEN_BODY_STYLE, theme } from '../constants';

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
    .map(([category, entries]) => ({ category, data: entries, key: category }));
}

const RECENT_SECTION_KEY = '__recent';

/** Distinct recently-logged catalog entries, recency order (a logged
 *  exercise joins identity by NAME — custom names don't resolve). */
function recentCatalogEntries(
  sessions: Array<{ exercises: Array<{ exerciseName: string }> }> | undefined,
  cap = 5,
): SystemExerciseData[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const session of sessions ?? []) {
    for (const e of session.exercises) {
      if (seen.has(e.exerciseName)) continue;
      seen.add(e.exerciseName);
      names.push(e.exerciseName);
      if (names.length >= cap) break;
    }
    if (names.length >= cap) break;
  }
  return names
    .map((n) => SYSTEM_EXERCISES.find((x) => x.name === n))
    .filter((x): x is SystemExerciseData => Boolean(x));
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
  const recentQuery = useRecentSessionDetails(10);

  // The Recent section only leads the UNFILTERED browse — the moment the
  // user searches or filters, the list answers the query alone.
  const isUnfiltered = !filter.search && !filter.modality;
  const sections = useMemo(() => {
    const recent = isUnfiltered ? recentCatalogEntries(recentQuery.data) : [];
    const recentSection =
      recent.length > 0
        ? [{ category: 'Recently logged', data: recent, key: RECENT_SECTION_KEY }]
        : [];
    return [...recentSection, ...groupedByCategory(query.data ?? [])];
  }, [isUnfiltered, recentQuery.data, query.data]);

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
        {/* The count is feedback for a query; the full catalog needs no tally. */}
        {!isUnfiltered ? (
          <MobileSectionEyebrow>{resultCount} results</MobileSectionEyebrow>
        ) : null}
        {resultCount === 0 ? (
          <EmptyState
            compact
            title="No exercises found"
            message={filter.search ? `Nothing matches “${filter.search}”.` : undefined}
            testID="exercise-database-empty"
          />
        ) : (
          <SectionList
            // flex:1 — the list is the screen's remaining height. Without
            // it the section content contributes to the body column's
            // layout and RN-web's default flex-shrink collapses the chip
            // row above it to a sliver.
            style={{ flex: 1 }}
            sections={sections}
            keyExtractor={(e) => e.slug}
            renderItem={({ item, index, section }) => (
              <ExerciseListItem
                exercise={item}
                onPress={navigateToExerciseDetail}
                isLast={index === section.data.length - 1}
              />
            )}
            renderSectionHeader={({ section }) => (
              <View
                style={[styles.sectionHeader, { backgroundColor: colors.backgroundDeep }]}
              >
                <MobileSectionEyebrow rule>
                  {section.key === RECENT_SECTION_KEY
                    ? 'Recently logged'
                    : `${section.category} · ${section.data.length}`}
                </MobileSectionEyebrow>
              </View>
            )}
            stickySectionHeadersEnabled
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
  listContent: { paddingBottom: 32 },
  sectionHeader: {
    paddingTop: 12,
    paddingBottom: 6,
  },
  addCustomCta: { marginTop: 8, alignSelf: 'flex-start' },
  addCustomText: { ...theme.typography.mobileItemTitle },
});
