// __tests__/stores/workoutStore.test.ts
// workoutStore behavior on the five-table model: split hydration,
// suggested-tag prefill, tag toggling, set CRUD, and the save-time DTO
// (half-filled sets dropped — a logged set is a done set).

import { describe, expect, it, beforeEach } from 'vitest';
import { useWorkoutStore } from '../../stores/workoutStore';
import { getSlotsForDay } from '../../shared/exercises/splits';

describe('workoutStore', () => {
  beforeEach(() => {
    useWorkoutStore.getState().resetSession();
  });

  it('hydrates from split slots: names, suggested tags, Rx, set rows', () => {
    const store = useWorkoutStore.getState();
    store.startSession({ splitType: 'twoADay', day: 2, sessionMode: 'pm' });
    const draft = useWorkoutStore.getState().draft;
    expect(draft).not.toBeNull();

    const slots = getSlotsForDay('twoADay', 2, 'pm');
    useWorkoutStore.getState().hydrateFromSplit(slots);

    const exercises = useWorkoutStore.getState().draft!.exercises;
    expect(exercises.map((e) => e.exerciseName)).toEqual([
      'Lat Pulldown',
      'Machine Ab Crunch',
      'Dumbbell Curl',
      'Face Pull',
    ]);
    // Suggested tags pre-filled from the program slot.
    expect(exercises[0].tags).toEqual(['underhand', 'lat-bar']);
    expect(exercises[1].tags).toEqual(['eccentric']);
    // One empty set row per programmed set (sets max).
    expect(exercises[0].sets).toHaveLength(3);
    expect(exercises[0].targetRx).toBe('3 × 8–10');
  });

  it('toggles tags on a draft exercise', () => {
    useWorkoutStore.getState().startSession({ splitType: 'oneADay', day: 1 });
    const localId = useWorkoutStore.getState().addExerciseToDraft({
      exerciseName: 'Leg Press',
    });
    useWorkoutStore.getState().toggleDraftExerciseTag(localId, 'window-machine');
    expect(
      useWorkoutStore.getState().draft!.exercises[0].tags,
    ).toEqual(['window-machine']);
    useWorkoutStore.getState().toggleDraftExerciseTag(localId, 'window-machine');
    expect(useWorkoutStore.getState().draft!.exercises[0].tags).toEqual([]);
  });

  it('toLogSessionDTO drops half-filled sets and threads tags', () => {
    useWorkoutStore.getState().startSession({ splitType: 'oneADay', day: 1 });
    const localId = useWorkoutStore.getState().addExerciseToDraft({
      exerciseName: 'Leg Press',
    });
    useWorkoutStore.getState().addSetToDraft(localId, { reps: 8, weight: 180 });
    useWorkoutStore.getState().addSetToDraft(localId, { reps: 8, weight: null });
    useWorkoutStore.getState().toggleDraftExerciseTag(localId, 'per-leg');

    const dto = useWorkoutStore.getState().toLogSessionDTO();
    expect(dto).not.toBeNull();
    expect(dto!.splitDay).toBe(1);
    expect(dto!.exercises).toHaveLength(1);
    expect(dto!.exercises[0].tags).toEqual(['per-leg']);
    expect(dto!.exercises[0].sets).toEqual([{ reps: 8, weight: 180, note: null }]);
  });

  it('swapDraftExercise swaps identity in place — position, Rx, and set rows survive; tags reset', () => {
    useWorkoutStore.getState().startSession({ splitType: 'twoADay', day: 2, sessionMode: 'pm' });
    useWorkoutStore.getState().hydrateFromSplit(
      getSlotsForDay('twoADay', 2, 'pm'),
    );
    const target = useWorkoutStore.getState().draft!.exercises[0]; // Lat Pulldown
    useWorkoutStore.getState().addSetToDraft(target.localId, { reps: 8, weight: 100 });
    useWorkoutStore.getState().toggleDraftExerciseTag(target.localId, 'underhand');

    useWorkoutStore.getState().swapDraftExercise(target.localId, {
      exerciseName: 'Pull-up',
      exerciseSlug: 'pull-up-bar',
    });

    const swapped = useWorkoutStore.getState().draft!.exercises[0];
    expect(swapped.exerciseName).toBe('Pull-up');
    expect(swapped.position).toBe(1);
    expect(swapped.targetRx).toBe(target.targetRx);
    expect(swapped.sets).toHaveLength(target.sets.length + 1); // hydrated rows survive + the logged set
    expect(swapped.sets.some((set) => set.reps === 8 && set.weight === 100)).toBe(true);
    expect(swapped.tags).toEqual([]);
  });

  it('resetSession clears the draft', () => {
    useWorkoutStore.getState().startSession({ splitType: 'oneADay', day: 1 });
    useWorkoutStore.getState().resetSession();
    expect(useWorkoutStore.getState().draft).toBeNull();
    expect(useWorkoutStore.getState().isSessionActive).toBe(false);
  });
});
