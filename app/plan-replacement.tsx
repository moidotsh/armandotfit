// app/plan-replacement.tsx
//
// Phase 3 slot replacement screen. Receives the user's saved plan id,
// the specific slot id, and the slot's template exercise id as query
// params. Loads replacement candidates (template exercise + all
// alternatives) with their eligibility flag computed against the
// user's equipment inventory. Tapping an eligible candidate fires
// the useReplacePlanSlot mutation; the optimistic cache update flips
// the slot's chosen_exercise_id + resolution='manual' immediately.
//
// Ineligible candidates render as disabled rows so the user can see
// the full alternatives graph and understand why their equipment
// rules a candidate out.

import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobileSectionEyebrow,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { useAppTheme, useToast } from '../context';
import { safeGoBack } from '../navigation';
import { SCREEN_BODY_STYLE } from '../constants';
import { exerciseRepository } from '../utils/supabase/repositories';
import { logger } from '../utils/logger';
import { useReplacementCandidates, useReplacePlanSlot } from '../hooks';
import type { AlternativeType, Exercise, ID } from '../shared/types';
import type { ReplacementCandidate } from '../services/planGenerationService';

interface CandidateRow {
  candidate: ReplacementCandidate;
  exercise: Exercise | null;
  tier: AlternativeType | 'template';
}

export default function PlanReplacementScreen() {
  const { planId, planSlotId, templateExerciseId } = useLocalSearchParams<{
    planId: string;
    planSlotId: string;
    templateExerciseId: string;
  }>();
  const { colors } = useAppTheme();
  const { showToast } = useToast();

  const candidatesQuery = useReplacementCandidates(templateExerciseId ?? null);
  const replaceMutation = useReplacePlanSlot();
  const [exercisesById, setExercisesById] = useState<Map<ID, Exercise>>(new Map());

  // Side-load exercise display names for the candidate set. The
  // candidates engine only knows exercise IDs; the UI needs the name
  // + slug for display. Loaded in parallel via findById (small N).
  useEffect(() => {
    if (!candidatesQuery.data) return;
    let cancelled = false;
    const ids = candidatesQuery.data.map((c) => c.exerciseId);
    Promise.all(
      ids.map((id) => exerciseRepository.findById(id)),
    )
      .then((results) => {
        if (cancelled) return;
        const map = new Map<ID, Exercise>();
        for (const r of results) {
          if (r.success && r.data) map.set(r.data.id, r.data);
        }
        setExercisesById(map);
      })
      .catch((e: unknown) => {
        // R1-exempt: cancellation guard above. Side-load failure is
        // non-fatal — the UI falls back to the intent note.
        logger.warn('queries', 'failed to side-load exercises:', (e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [candidatesQuery.data]);

  const rows: CandidateRow[] = (candidatesQuery.data ?? []).map((candidate) => {
    const exercise = exercisesById.get(candidate.exerciseId) ?? null;
    const tier: CandidateRow['tier'] = candidate.altEdge?.altType ?? 'template';
    return { candidate, exercise, tier };
  });

  const handlePick = (candidate: ReplacementCandidate) => {
    if (!candidate.eligible) return;
    if (!planId || !planSlotId) return;
    replaceMutation.mutate(
      {
        planId,
        planSlotId,
        chosenExerciseId: candidate.exerciseId,
        altEdgeId: candidate.altEdge?.edgeId ?? null,
        intentNote: candidate.altEdge?.intentNote ?? null,
      },
      {
        onSuccess: () => {
          showToast('success', 'Updated.');
          safeGoBack();
        },
      },
    );
  };

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="setup" />
      <MobileHeader title="Replace exercise" eyebrow="Your plan" onBack={safeGoBack} />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <MobileSectionEyebrow>Pick a replacement</MobileSectionEyebrow>
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>
          Only eligible candidates can be picked. Ineligible candidates show
          what your equipment rules out.
        </Text>

        {candidatesQuery.isLoading ? <LoadingSpinner /> : null}

        {rows.map((row, idx) => {
          const tierLabel = tierDisplay(row.tier);
          const disabled = !row.candidate.eligible;
          const title = row.exercise?.name ?? 'Unknown exercise';
          return (
            <Pressable
              key={`${row.candidate.exerciseId}-${idx}`}
              onPress={() => handlePick(row.candidate)}
              disabled={disabled || replaceMutation.isPending}
              style={({ pressed }) => [
                styles.rowPress,
                pressed && !disabled && { opacity: 0.7 },
              ]}
            >
              <MobileSurface
                padding={14}
                style={[
                  styles.rowCard,
                  disabled && { opacity: 0.55 },
                ]}
              >
                <View style={styles.rowHeader}>
                  <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text
                    style={[
                      styles.tierChip,
                      {
                        color: disabled ? colors.textSecondary : colors.brand,
                      },
                    ]}
                  >
                    {tierLabel}
                  </Text>
                </View>
                {row.candidate.altEdge?.intentNote ? (
                  <Text
                    style={[styles.intentNote, { color: colors.textSecondary }]}
                    numberOfLines={3}
                  >
                    {row.candidate.altEdge.intentNote}
                  </Text>
                ) : null}
                <Text style={[styles.statusLine, { color: colors.textSecondary }]}>
                  {disabled
                    ? 'Not eligible for your equipment'
                    : 'Eligible — tap to pick'}
                </Text>
              </MobileSurface>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function tierDisplay(tier: CandidateRow['tier']): string {
  if (tier === 'template') return 'Template';
  if (tier === 'direct') return 'Direct alt';
  if (tier === 'close') return 'Close alt';
  return 'Fallback alt';
}

// ──────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE, flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 80 },
  helpText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  rowPress: { marginBottom: 8 },
  rowCard: {},
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  tierChip: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  intentNote: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  statusLine: {
    fontSize: 11,
    marginTop: 6,
  },
});
