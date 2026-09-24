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

  it('hydrates from split slots: names, suggested tags, Rx (armed-set model)', () => {
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
    // The armed-set model (signal-thesis §7): draft rows exist ONLY
    // once logged — the stage's armed slab commits rows; it never
    // pre-creates them. The programmed count rides targetRx.
    expect(exercises[0].sets).toHaveLength(0);
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

  it('respects the tag axes on add — a qualifier sibling leaves when its rival arrives', () => {
    useWorkoutStore.getState().startSession({ splitType: 'oneADay', day: 1 });
    const localId = useWorkoutStore.getState().addExerciseToDraft({
      exerciseName: 'Lat Pulldown',
    });
    useWorkoutStore.getState().toggleDraftExerciseTag(localId, 'underhand');
    useWorkoutStore.getState().toggleDraftExerciseTag(localId, 'single-pulley');
    // Different axes co-exist: grip + pulleys.
    expect(useWorkoutStore.getState().draft!.exercises[0].tags).toEqual([
      'underhand',
      'single-pulley',
    ]);
    // Same axis: dual-pulley replaces single-pulley; underhand stays.
    useWorkoutStore.getState().toggleDraftExerciseTag(localId, 'dual-pulley');
    expect(useWorkoutStore.getState().draft!.exercises[0].tags).toEqual([
      'underhand',
      'dual-pulley',
    ]);
    // Grip flips too — overhand replaces underhand.
    useWorkoutStore.getState().toggleDraftExerciseTag(localId, 'overhand');
    expect(useWorkoutStore.getState().draft!.exercises[0].tags).toEqual([
      'dual-pulley',
      'overhand',
    ]);
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

  it('continuation blocks: adHoc opens empty, a null day saves ad-hoc', () => {
    // CONTINUE THE DAY on an ad-hoc receipt — the day continues as a
    // NEW block with fresh stations (never split-hydrated) and no
    // day-of-split asserted.
    useWorkoutStore.getState().startSession({
      splitType: 'twoADay',
      day: null,
      sessionMode: 'pm',
      adHoc: true,
    });
    const draft = useWorkoutStore.getState().draft!;
    expect(draft.adHoc).toBe(true);
    expect(draft.exercises).toHaveLength(0);

    const localId = useWorkoutStore.getState().addExerciseToDraft({
      exerciseName: 'Cable Wood Chop',
    });
    useWorkoutStore.getState().addSetToDraft(localId, { reps: 15, weight: 20 });

    const dto = useWorkoutStore.getState().toLogSessionDTO();
    expect(dto).not.toBeNull();
    expect(dto!.splitDay).toBeNull();
    expect(dto!.exercises[0].exerciseName).toBe('Cable Wood Chop');
  });

  it('continueSession seeds the continued session’s stations with fresh rows', () => {
    // The receipt's CONTINUE verb: the new block carries the settled
    // session's exercises (names + tags + the recovered Rx) and cardio
    // stations, with ZERO set rows — the old block's history stays on
    // its receipt.
    useWorkoutStore.getState().continueSession({
      splitType: 'twoADay',
      day: 3,
      sessionMode: 'am',
      exercises: [
        { exerciseName: 'Incline Barbell Press', exerciseSlug: 'incline-barbell-press', tags: ['pause'], targetRx: '3 × 8–10' },
        { exerciseName: 'Custom Move', exerciseSlug: '', tags: [], targetRx: null },
      ],
      cardio: ['treadmill'],
    });

    const draft = useWorkoutStore.getState().draft!;
    expect(draft.adHoc).toBe(true);
    expect(draft.day).toBe(3);
    expect(draft.exercises.map((e) => e.exerciseName)).toEqual([
      'Incline Barbell Press',
      'Custom Move',
    ]);
    expect(draft.exercises[0].tags).toEqual(['pause']);
    expect(draft.exercises[0].targetRx).toBe('3 × 8–10');
    expect(draft.exercises.every((e) => e.sets.length === 0)).toBe(true);
    expect(draft.cardio.map((c) => c.station)).toEqual(['treadmill']);
    expect(draft.cardio[0].rows).toHaveLength(0);
    expect(useWorkoutStore.getState().isSessionActive).toBe(true);
  });

  it('cardio stations: commit carries values, laps derive meters, DTO flattens', () => {
    useWorkoutStore.getState().startSession({ splitType: 'twoADay', day: 2, sessionMode: 'am' });

    // A treadmill sitting: arm time + speed + incline + outcomes, commit.
    const treadmill = useWorkoutStore.getState().addCardioToDraft('treadmill');
    useWorkoutStore.getState().updateCardioArmed(treadmill, {
      durationSec: 1800,
      speedKmh: 9.5,
      level: 2,
      distanceM: 4800,
      kcal: 320,
    });
    useWorkoutStore.getState().commitCardioRow(treadmill);

    // The walk loop: laps derive the distance (one loop is 100 m).
    const loop = useWorkoutStore.getState().addCardioToDraft('walk-loop');
    useWorkoutStore.getState().updateCardioArmed(loop, { durationSec: 1500, laps: 12 });
    useWorkoutStore.getState().commitCardioRow(loop);

    const draft = useWorkoutStore.getState().draft!;
    expect(draft.cardio).toHaveLength(2);
    expect(draft.cardio[0].rows[0].distanceM).toBe(4800);
    expect(draft.cardio[1].rows[0].distanceM).toBe(1200);

    // Committed time without duration set: no row, no crash.
    const bike = useWorkoutStore.getState().addCardioToDraft('bike');
    useWorkoutStore.getState().updateCardioArmed(bike, { level: 8 });
    useWorkoutStore.getState().commitCardioRow(bike);
    expect(useWorkoutStore.getState().draft!.cardio[2].rows).toHaveLength(0);

    // A mis-log gets its undo.
    useWorkoutStore.getState().removeCardioRow(loop, draft.cardio[1].rows[0].localId);
    expect(useWorkoutStore.getState().draft!.cardio[1].rows).toHaveLength(0);

    const dto = useWorkoutStore.getState().toLogSessionDTO();
    expect(dto!.cardio).toHaveLength(1);
    expect(dto!.cardio![0]).toEqual({
      station: 'treadmill',
      durationSec: 1800,
      level: 2,
      speedKmh: 9.5,
      distanceM: 4800,
      kcal: 320,
      note: null,
    });
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
    expect(swapped.sets).toHaveLength(1); // the logged row survives the identity swap
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
