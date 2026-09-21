// app/exercise-database.tsx
// THE DIRECTORY (docs/architecture/interval-thesis.md §8): "Find a
// lift." The search field IS the statement (display
// scale, one hairline beneath — the page's spent rule); the ZONE
// chips ride under it as the instrument's second row; the catalog
// scans beneath in air-separated rows grouped by EQUIPMENT ZONE —
// the gym's geography: browsing the list walks the floor, free
// weights first, the mats last. The nameplate, the catalog-count
// shout, and the result-count whisper are gone — the results answer
// the query by existing. Unfiltered browse leads with a "Recently
// logged" section (distinct names, recency order). During a live
// session the custom adder sits one tap open (progressive
// disclosure).

import React, { useEffect, useMemo, useState } from 'react';
import { SectionList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MobileInput,
  EmptyState,
  FilterChip,
  FilterChipGroup,
} from '../components/MobilePremium';
import { BoardShell, ExerciseListItem, SearchStatement } from '../components/composed';
import { useAppTheme, useToast } from '../context';
import { navigateToExerciseDetail, safeGoBack } from '../navigation';
import { useExercises, useRecentSessionDetails, useTopSetsByName, useWeightUnit } from '../hooks';
import { SYSTEM_EXERCISES as FULL_CATALOG } from '../shared/exercises';
import { useExerciseStore, useWorkoutStore } from '../stores';
import { SYSTEM_EXERCISES, ZONES, type SystemExerciseData } from '../shared/exercises';
import { toDisplayWeight, roundDisplayWeight } from '../utils';
import { INTERVAL, BLOCK_GAP, ROW_GAP, PAGE_GUTTER, theme } from '../constants';
import type { MeterStep } from '../constants';

/** The zone line map: equipment modality → the meter ramp's step (the
 *  gym's geography colored on the zone ramp — interval-thesis §4.2;
 *  the zone ramp is data encoding, not identity). */
const ZONE_STEP: Record<string, MeterStep> = {
  barbell: 'step1',
  dumbbell: 'step2',
  cable: 'step3',
  machine: 'step4',
  bodyweight: 'step5',
};
const STEEL: MeterStep = 'step6';

/** Group the catalog by equipment zone, in walk order (shared ZONES). */
function groupedByZone(entries: SystemExerciseData[]) {
  return ZONES.map(({ modality, zone }) => ({
    key: zone,
    category: zone,
    data: entries.filter((e) => (e.modality ?? 'machine') === modality),
  })).filter((s) => s.data.length > 0);
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
  const [adderOpen, setAdderOpen] = useState(false);
  const filter = useExerciseStore((s) => s.filter);
  const setFilter = useExerciseStore((s) => s.setFilter);
  const resetFilters = useExerciseStore((s) => s.resetFilters);

  const query = useExercises(filter);
  const recentQuery = useRecentSessionDetails(10);
  // TAG SEARCH — the query also reaches HISTORY tags ("rope", "wide-
  // grip"): exercises logged under a matching tag join the results
  // even when their name/muscles don't match. Computed at read from
  // recent sessions; identity joins by NAME.
  const tagIndexQuery = useRecentSessionDetails(30);
  const tagIndex = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const session of tagIndexQuery.data ?? []) {
      for (const ex of session.exercises) {
        for (const tag of ex.tags ?? []) {
          const key = tag.toLowerCase();
          if (!m.has(key)) m.set(key, new Set());
          m.get(key)!.add(ex.exerciseName);
        }
      }
    }
    return m;
  }, [tagIndexQuery.data]);
  // YOUR NUMBERS — the library annotates itself: the last top-set
  // weight per name (the shared derivation), display units. Untouched
  // lifts stay clean (null figure).
  const topSets = useTopSetsByName();
  const unit = useWeightUnit();

  // The Recent section only leads the UNFILTERED browse — the moment the
  // user searches or filters, the list answers the query alone.
  const isUnfiltered = !filter.search && !filter.modality;
  const sections = useMemo(() => {
    const recent = isUnfiltered ? recentCatalogEntries(recentQuery.data) : [];
    const recentSection =
      recent.length > 0
        ? [{ category: 'Recently logged', data: recent, key: RECENT_SECTION_KEY }]
        : [];
    // The tag-matched union: names logged under the query-as-tag that
    // the name/muscle filter missed.
    let base = query.data ?? [];
    const q = (filter.search ?? '').trim().toLowerCase();
    if (q.length > 0 && tagIndex.has(q)) {
      const names = tagIndex.get(q)!;
      const present = new Set(base.map((e) => e.slug));
      const extra = FULL_CATALOG.filter((e) => names.has(e.name) && !present.has(e.slug));
      if (extra.length > 0) base = [...base, ...extra];
    }
    return [...recentSection, ...groupedByZone(base)];
  }, [isUnfiltered, recentQuery.data, query.data, tagIndex, filter.search]);

  useEffect(() => {
    return () => {
      resetFilters();
    };
  }, [resetFilters]);

  const resultCount = query.data?.length ?? 0;

  return (
    <BoardShell surface="training" onBack={safeGoBack} noScroll testID="library-body">
      <View style={styles.body}>
        {/* The instrument: the search statement + the zone chips. The
            RAW text rides the store — trimming in onChangeText ate every
            trailing space the instant it was typed (a controlled input
            round-trips), making multi-word searches untypeable.
            Matching trims at use (the `q` above). */}
        <View>
          <SearchStatement
            value={filter.search ?? ''}
            onChangeText={(text: string) => setFilter({ search: text || undefined })}
            placeholder="Find a lift"
            accessibilityLabel="Search exercises"
            testID="exercise-search-field"
          />
          <View style={styles.chips}>
            <FilterChipGroup>
              {ZONES.map((z) => (
                <FilterChip
                  key={z.modality}
                  label={z.chip}
                  selected={filter.modality === z.modality}
                  onPress={() =>
                    setFilter({ modality: filter.modality === z.modality ? undefined : z.modality })
                  }
                  accessibilityLabel={`Filter by ${z.zone}`}
                />
              ))}
            </FilterChipGroup>
          </View>
          {/* The custom adder — one tap open, only while a session
              runs (progressive disclosure; the browse is the page). */}
          {isSessionActive ? (
            adderOpen ? (
              <View style={styles.adder}>
                <MobileInput
                  label=""
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="Exercise name…"
                  autoFocus
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
                    setAdderOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add custom exercise to session"
                  style={styles.adderVerb}
                >
                  <Text style={[styles.adderVerbText, { color: colors.text }]}>
                    ADD TO SESSION
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setAdderOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Add a custom exercise"
                style={styles.adderToggle}
              >
                <Text style={[styles.adderToggleText, { color: colors.textMuted }]}>
                  + ADD A CUSTOM LIFT
                </Text>
              </Pressable>
            )
          ) : null}
        </View>

        {/* The catalog — the gym's floor plan. The read is local and
            synchronous (the TS catalog is the sole display source), so
            a zero count is always a TRUE miss — the empty state never
            impersonates a load. */}
        {resultCount === 0 ? (
          <EmptyState
            compact
            // THE EMPTY STATE SAYS IT ONCE (revision 2027-03, delta 5):
            // a present query gets one line that carries the miss and
            // echoes the query; no title restating it above.
            title={
              filter.search
                ? `Nothing matches “${filter.search}”.`
                : 'No exercises found'
            }
            testID="exercise-database-empty"
          />
        ) : (
          <SectionList
            // flex:1 — the list is the screen's remaining height. Without
            // it the section content contributes to the body column's
            // layout and RN-web's default flex-shrink collapses the chip
            // row above it to a sliver.
            style={[{ flex: 1 }, styles.listGap]}
            sections={sections}
            keyExtractor={(e) => e.slug}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={3}
            renderItem={({ item }) => (
              <ExerciseListItem
                exercise={item}
                onPress={navigateToExerciseDetail}
                figure={(() => {
                  const kg = topSets.map.get(item.name.toLowerCase())?.weight ?? null;
                  if (kg == null || kg <= 0) return null;
                  return String(roundDisplayWeight(toDisplayWeight(kg, unit)));
                })()}
              />
            )}
            renderSectionHeader={({ section }) => {
              // THE ZONE LINE — the head carries its zone's hue tick
              // (the meter ramp); the word stays printed ink.
              const modality = ZONES.find((z) => z.zone === section.key)?.modality;
              const step: MeterStep =
                section.key === RECENT_SECTION_KEY
                  ? STEEL
                  : ZONE_STEP[modality ?? 'machine'] ?? 'step6';
              return (
                <View
                  style={[styles.sectionHeader, { backgroundColor: colors.backgroundDeep }]}
                  testID={`library-zone-head-${section.key}`}
                >
                  <View style={styles.zoneLine}>
                    <View
                      style={[styles.zoneTick, { backgroundColor: colors.meter[step] }]}
                      testID={`library-zone-tick-${section.key}`}
                    />
                    <Text style={[styles.zoneWord, { color: colors.text }]}>
                      {section.key === RECENT_SECTION_KEY ? 'RECENTLY LOGGED' : section.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
              );
            }}
            stickySectionHeadersEnabled
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: 4,
  },
  chips: {
    marginTop: 16,
  },
  // The air law between the instrument block and the catalog.
  listGap: {
    marginTop: BLOCK_GAP,
  },
  listContent: { paddingBottom: 40 },
  sectionHeader: {
    // Page-colored sticky band. zIndex keeps the pinned header above
    // the rows painting over it (RN-web sticky paint order; same fix
    // as the program chapter heads).
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 10,
  },
  // THE ZONE LINE — the hue tick carries the zone; the word is
  // printed ink (furniture shouts, color maps geography).
  zoneLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoneTick: {
    width: 3,
    height: 14,
    borderRadius: 0,
  },
  zoneWord: {
    ...theme.typography.mobileEyebrow,
  },
  adder: {
    marginTop: ROW_GAP,
    gap: 8,
  },
  adderToggle: {
    minHeight: 44,
    justifyContent: 'center',
  },
  adderToggleText: {
    ...INTERVAL.whisper,
  },
  adderVerb: {
    minHeight: 44,
    justifyContent: 'center',
  },
  adderVerbText: {
    // THE VERB PRINTS CAPS, IN INK (revision 2027-03, delta 2) — the
    // one voice, and never the brand slot.
    ...INTERVAL.whisperLine,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
