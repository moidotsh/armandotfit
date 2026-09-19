// hooks/useFloorSession.ts
//
// The live session's composite state (S16): draft lifecycle + stats +
// prefills, one hook so the Floor is composition instead of
// orchestration. Everything here is computed at read or held in the
// workout store — nothing is persisted by this hook.
//
//   • Hydration — the draft seeds from the program slots once per
//     session (local + synchronous; the program is TypeScript data).
//     Idempotent via ref + the empty-draft check, so a user who
//     discards all exercises and re-adds manually won't get re-seeded.
//   • Last-tags prefill — the caller's most recent tags per exercise
//     replace the program's suggested prefill exactly once per
//     session (guarded by ref).
//   • Stats — elapsed (useNowTick owns the paired interval), filled
//     sets, tonnage.
//   • Top sets — the shared useTopSetsByName derivation (the armed
//     prefill: you walk in matched to what your best loaded last
//     time).

import { useEffect, useRef } from 'react';
import { useWorkoutStore, useProgramOverrideStore } from '../stores';
import { useLastUsedTags, useTopSetsByName } from './queries';
import { useNowTick } from './useNowTick';
import { resolveSlots } from '../services';
import { sumVolume, formatElapsed } from '../services';

export function useFloorSession() {
  const draft = useWorkoutStore((s) => s.draft);
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);
  const isSaving = useWorkoutStore((s) => s.isSaving);
  const sessionError = useWorkoutStore((s) => s.sessionError);
  const hydrateFromSplit = useWorkoutStore((s) => s.hydrateFromSplit);
  const setDraftExerciseTags = useWorkoutStore((s) => s.setDraftExerciseTags);
  const programOverrides = useProgramOverrideStore((s) => s.overrides);

  // Hydrate the draft from the program slots once per session.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!draft) {
      hydratedRef.current = false;
      return;
    }
    if (hydratedRef.current) return;
    if (draft.exercises.length > 0) return;
    hydratedRef.current = true;
    const slots = resolveSlots(
      draft.splitType,
      draft.day,
      draft.sessionMode,
      programOverrides,
    );
    if (slots.length > 0) {
      hydrateFromSplit(slots);
    }
  }, [draft, hydrateFromSplit, programOverrides]);

  // "What did I use last time" — the caller's most recent tags per
  // exercise replace the program's suggested prefill exactly once per
  // session. Program tags remain one tap away in the chip suggestions.
  const draftNames = draft && draft.exercises.length > 0
    ? draft.exercises.map((e) => e.exerciseName)
    : null;
  const lastTagsQuery = useLastUsedTags(draftNames);
  const lastTagsRef = useRef(false);
  useEffect(() => {
    if (!draft || lastTagsRef.current) return;
    const byName = lastTagsQuery.data;
    if (!byName || byName.size === 0) return;
    lastTagsRef.current = true;
    for (const ex of draft.exercises) {
      const last = byName.get(ex.exerciseName.toLowerCase());
      if (last && last.length > 0) {
        setDraftExerciseTags(ex.localId, last);
      }
    }
  }, [draft, lastTagsQuery.data, setDraftExerciseTags]);

  // Live stats.
  const nowTick = useNowTick();
  const sessionSets = draft
    ? draft.exercises.reduce((n, e) => n + e.sets.length, 0)
    : 0;
  const sessionKg = draft
    ? draft.exercises.reduce((n, e) => n + sumVolume(e.sets), 0)
    : 0;
  const elapsed = draft?.date ? formatElapsed(draft.date, nowTick) : '00:00';

  // The armed prefill — per exercise name, the TOP set of the most
  // recent session that has it (the shared derivation).
  const topSets = useTopSetsByName().map;

  return {
    draft,
    isSessionActive,
    isSaving,
    sessionError,
    sessionSets,
    sessionKg,
    elapsed,
    topSets,
  };
}
