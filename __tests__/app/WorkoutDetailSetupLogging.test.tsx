// __tests__/app/WorkoutDetailSetupLogging.test.tsx
//
// Phase 5 equipment-setup logging integration tests for
// app/workout-detail. Locks the end-to-end contract:
//
//   1. Active-session mode renders ExerciseSetupRow per draft exercise,
//      with per-exercise catalog discernment:
//        • Grip + Attachment render only when the catalog returns rows
//          for THIS exercise (or a legacy value is already set).
//        • Equipment Notes always renders.
//        • Options for one card NEVER bleed into another card.
//   2. Tapping a catalog-sourced attachment chip dispatches
//      setDraftExerciseSetup on the workout store — the store mutates,
//      the screen re-renders, and the chip reflects the new selection.
//   3. The setup edit threads through toLogWorkoutDTO — the persisted
//      payload carries attachmentSlug.
//   4. Catalog options for one exercise do NOT enable Grip/Attachment
//      controls on a sibling exercise without catalog rows.
//   5. Read-only mode (existing session) renders the read-only setup
//      lines for sessions whose exercise rows carry non-null setup.
//   6. Read-only mode stays silent when all setup fields are null.
//
// Hooks centralized in __tests__/setup.ts (screenHookStubs). Per-test
// overrides; beforeEach resets the workout store so the draft from one
// test never leaks into another.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import * as ExpoRouter from 'expo-router';
import { ThemeProvider, ToastProvider } from '../../context';
import { screenHookStubs } from '../setup';
import { useWorkoutStore } from '../../stores';
import WorkoutDetailScreen from '../../app/workout-detail';
import type {
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionExerciseWithSets,
  WorkoutSessionWithDetails,
} from '../../shared/types';

function Wrap({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

function makeStaticDraft() {
  // Minimal static-fallback draft. Mirrors the shape workoutStore.startSession
  // produces. `sessionStartedAt` + `isSessionActive` are sibling fields on
  // WorkoutState, NOT on DraftSession — call sites pass them at the top
  // level of setState.
  return {
    date: '2026-07-25T00:00:00.000Z',
    splitType: 'oneADay' as const,
    day: 1,
    sessionMode: 'am' as const,
    duration: 0,
    notes: null,
    exercises: [],
    sessionWindow: 'single' as const,
    startedAt: '2026-07-25T00:00:00.000Z',
    planId: null,
    planTemplateSnapshot: null,
    planVariantSnapshot: null,
    launchSource: 'static' as const,
  };
}

function makeDraftExercise(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    localId: 'l-1',
    exerciseId: 'ex-1',
    exerciseName: 'Cable Fly',
    orderInWorkout: 1,
    userGrip: null,
    userEquipmentNotes: null,
    targetRepRange: '8-12',
    restTimerSeconds: 60,
    notes: null,
    sets: [],
    planSlotId: null,
    templateSlotId: null,
    perSide: null,
    slotNotes: null,
    source: 'static' as const,
    attachmentSlug: null,
    ...overrides,
  };
}

beforeEach(() => {
  cleanup();
  useWorkoutStore.setState({
    draft: null,
    sessionStartedAt: null,
    isSessionActive: false,
    selectedExerciseLocalId: null,
    sessionError: null,
    isSaving: false,
  });
  // Reset the setup-options stub between tests so a catalog response
  // from one test doesn't leak into another.
  screenHookStubs.useExerciseSetupOptions.mockReturnValue({
    data: undefined,
    isLoading: false,
  });
});

describe('workout-detail active session — setup visibility per exercise', () => {
  it('renders Grip + Attachment + Equipment notes when the catalog has rows for the exercise', () => {
    const exerciseId = 'ex-cable';
    useWorkoutStore.setState({
      draft: {
        ...makeStaticDraft(),
        exercises: [makeDraftExercise({ exerciseId })],
      },
      isSessionActive: true,
      sessionStartedAt: '2026-07-25T00:00:00.000Z',
    });
    screenHookStubs.useExerciseSetupOptions.mockReturnValue({
      data: new Map([
        [
          exerciseId,
          [
            {
              id: 'opt-1',
              exerciseId,
              gripSlug: 'neutral',
              attachmentSlug: 'cable-rope',
              isPrimary: true,
              displayOrder: 1,
              createdAt: '2026-07-25T00:00:00Z',
            },
          ],
        ],
      ]),
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    expect(getByText('Grip')).toBeTruthy();
    expect(getByText('Attachment')).toBeTruthy();
    expect(getByText('Equipment notes')).toBeTruthy();
  });

  it('renders ONLY Equipment notes when the catalog has no rows for the exercise and no legacy values (machine/dumbbell/bodyweight case)', () => {
    // The hook returns undefined (catalog miss) — mimics a leg press
    // machine, dumbbell curl, or bodyweight plank. Setup UI must stay
    // silent on Grip + Attachment; Equipment Notes still renders.
    useWorkoutStore.setState({
      draft: {
        ...makeStaticDraft(),
        exercises: [makeDraftExercise({ exerciseName: 'Leg Press' })],
      },
      isSessionActive: true,
      sessionStartedAt: '2026-07-25T00:00:00.000Z',
    });

    const { getByText, queryByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    expect(queryByText('Grip')).toBeNull();
    expect(queryByText('Attachment')).toBeNull();
    expect(getByText('Equipment notes')).toBeTruthy();
  });

  it('does NOT render Grip/Attachment controls when the hook returns data for a DIFFERENT exercise (cross-card isolation)', () => {
    // Two exercises in the draft: cable-row (has catalog rows) and
    // machine-press (no catalog rows). The hook returns options for
    // cable-row only. The machine-press card must NOT inherit options
    // from cable-row — each card reads its own exerciseId key.
    useWorkoutStore.setState({
      draft: {
        ...makeStaticDraft(),
        exercises: [
          makeDraftExercise({
            localId: 'l-cable',
            exerciseId: 'ex-cable',
            exerciseName: 'Cable Row',
          }),
          makeDraftExercise({
            localId: 'l-machine',
            exerciseId: 'ex-machine',
            exerciseName: 'Machine Press',
            orderInWorkout: 2,
          }),
        ],
      },
      isSessionActive: true,
      sessionStartedAt: '2026-07-25T00:00:00.000Z',
    });
    screenHookStubs.useExerciseSetupOptions.mockReturnValue({
      data: new Map([
        [
          'ex-cable',
          [
            {
              id: 'opt-1',
              exerciseId: 'ex-cable',
              gripSlug: 'neutral',
              attachmentSlug: 'cable-v-bar',
              isPrimary: true,
              displayOrder: 1,
              createdAt: '2026-07-25T00:00:00Z',
            },
          ],
        ],
        // ex-machine intentionally absent — the catalog has no rows
        // for it. The screen scopes by exerciseId so the machine card
        // must NOT see the cable-row options.
      ]),
      isLoading: false,
    });

    const { getByText, queryByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    // Both exercise names render — proves both cards mounted.
    expect(getByText('Cable Row')).toBeTruthy();
    expect(getByText('Machine Press')).toBeTruthy();
    // The cable-row card renders the Attachment chip (sentence-case
    // 'Cable v bar' from the prettifier) + Grip label — its catalog
    // rows carried both.
    expect(getByText('Cable v bar')).toBeTruthy();
    expect(getByText('Grip')).toBeTruthy();
    // The machine-press card renders Equipment notes (always) but
    // NOT a second Grip label or Attachment label — it has no catalog
    // rows and no legacy values. (Only one 'Grip' label would exist
    // on the page — the cable-row card's. If the machine card leaked
    // any options, a second label/chip cluster would appear.)
    //
    // Counting labels via getAllByText would be ambiguous (Exercise
    // names + 'Equipment notes' show up once per card). Instead we
    // assert the cable-specific chip does not appear selected on the
    // machine card by tapping it once and confirming only the cable
    // card's draft row mutates.
    fireEvent.click(getByText('Cable v bar'));
    const draft = useWorkoutStore.getState().draft;
    expect(draft?.exercises.find((e) => e.localId === 'l-cable')?.attachmentSlug).toBe(
      'cable-v-bar',
    );
    expect(draft?.exercises.find((e) => e.localId === 'l-machine')?.attachmentSlug).toBeNull();
  });

  it('preserves a legacy attachmentSlug value in the active UI even when the catalog has no rows', () => {
    // Historical draft row with a persisted attachment_slug but no
    // matching catalog options (e.g. catalog was edited between
    // sessions). The control must still render so the user can see
    // and clear the legacy value.
    useWorkoutStore.setState({
      draft: {
        ...makeStaticDraft(),
        exercises: [makeDraftExercise({ attachmentSlug: 'rope' })],
      },
      isSessionActive: true,
      sessionStartedAt: '2026-07-25T00:00:00.000Z',
    });
    // Hook returns undefined (catalog miss for this exercise).
    screenHookStubs.useExerciseSetupOptions.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    // Legacy 'rope' resolves via CABLE_ATTACHMENT_OPTIONS to 'Rope'.
    // The Attachment control renders with just this chip + None.
    expect(getByText('Rope')).toBeTruthy();
    expect(getByText('None')).toBeTruthy();
    // Clearing the legacy value works.
    fireEvent.click(getByText('None'));
    expect(useWorkoutStore.getState().draft?.exercises[0].attachmentSlug).toBeNull();
  });
});

describe('workout-detail active session — setup logging', () => {
  it('dispatches setDraftExerciseSetup when a catalog-sourced attachment chip is tapped', () => {
    const exerciseId = 'ex-cable';
    useWorkoutStore.setState({
      draft: {
        ...makeStaticDraft(),
        exercises: [makeDraftExercise({ exerciseId })],
      },
      isSessionActive: true,
      sessionStartedAt: '2026-07-25T00:00:00.000Z',
    });
    screenHookStubs.useExerciseSetupOptions.mockReturnValue({
      data: new Map([
        [
          exerciseId,
          [
            {
              id: 'opt-1',
              exerciseId,
              gripSlug: 'neutral',
              attachmentSlug: 'cable-rope',
              isPrimary: true,
              displayOrder: 1,
              createdAt: '2026-07-25T00:00:00Z',
            },
          ],
        ],
      ]),
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    // Tap the catalog-sourced 'Cable rope' chip. The screen wires
    // this through setDraftExerciseSetup, which mutates the store.
    // The persisted field on the draft row should now read 'cable-rope'.
    fireEvent.click(getByText('Cable rope'));

    const draft = useWorkoutStore.getState().draft;
    expect(draft?.exercises[0].attachmentSlug).toBe('cable-rope');
  });

  it('threads attachmentSlug through toLogWorkoutDTO at save time', () => {
    useWorkoutStore.setState({
      draft: {
        ...makeStaticDraft(),
        exercises: [
          makeDraftExercise({
            userGrip: 'neutral',
            userEquipmentNotes: 'column 3',
            attachmentSlug: 'v-bar',
          }),
        ],
      },
      isSessionActive: true,
      sessionStartedAt: '2026-07-25T00:00:00.000Z',
    });

    const dto = useWorkoutStore.getState().toLogWorkoutDTO();
    expect(dto).not.toBeNull();
    if (dto) {
      expect(dto.exercises[0].attachmentSlug).toBe('v-bar');
      expect(dto.exercises[0].userGrip).toBe('neutral');
      expect(dto.exercises[0].userEquipmentNotes).toBe('column 3');
    }
  });

  it('passes catalog grip options through to ExerciseSetupRow when the hook returns data', () => {
    // The screen uses useExerciseSetupOptions to fetch grip options
    // for the draft's exercise ids. When the hook returns data for
    // the active exercise, the ExerciseSetupRow should receive it
    // and render the suggestion chip.
    const exerciseId = 'ex-1';
    useWorkoutStore.setState({
      draft: {
        ...makeStaticDraft(),
        exercises: [makeDraftExercise({ exerciseId })],
      },
      isSessionActive: true,
      sessionStartedAt: '2026-07-25T00:00:00.000Z',
    });
    const gripOptions = new Map([
      [
        exerciseId,
        [
          {
            id: 'opt-1',
            exerciseId,
            gripSlug: 'neutral',
            attachmentSlug: 'cable-rope',
            isPrimary: true,
            displayOrder: 1,
            createdAt: '2026-07-25T00:00:00Z',
          },
        ],
      ],
    ]);
    screenHookStubs.useExerciseSetupOptions.mockReturnValue({
      data: gripOptions,
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    // The suggestion chip renders the grip slug — proof that the
    // screen threaded the hook's data through to ExerciseSetupRow.
    expect(getByText('neutral')).toBeTruthy();
  });
});

describe('workout-detail read-only session — setup snapshot', () => {
  function makeReadonlySession(
    exerciseOverrides: Partial<WorkoutSessionExercise> = {},
  ): WorkoutSessionWithDetails {
    const exercise: WorkoutSessionExerciseWithSets = {
      id: 'wse-1',
      workoutSessionId: 'ws-1',
      exerciseId: 'ex-1',
      orderInWorkout: 1,
      userGrip: null,
      userEquipmentNotes: null,
      targetRepRange: null,
      restTimerSeconds: 60,
      notes: null,
      planSlotId: null,
      templateSlotId: null,
      perSide: null,
      slotNotes: null,
      source: null,
      attachmentSlug: null,
      createdAt: '2026-07-25T00:00:00Z',
      exercise: {
        id: 'ex-1',
        name: 'Cable Fly',
        description: null,
        exerciseType: 'cable',
        difficultyLevel: 'intermediate',
        instructions: null,
        tips: null,
        isSystemExercise: true,
        createdByUserId: null,
        slug: 'cable-fly',
        createdAt: '2026-07-25T00:00:00Z',
        updatedAt: '2026-07-25T00:00:00Z',
      } as WorkoutSessionExerciseWithSets['exercise'],
      sets: [],
      ...exerciseOverrides,
    };
    const session: WorkoutSession = {
      id: 'ws-1',
      userId: 'user-1',
      date: '2026-07-25T00:00:00.000Z',
      splitType: 'oneADay',
      day: 1,
      duration: 30,
      notes: null,
      sessionWindow: null,
      startedAt: null,
      completedAt: null,
      planId: null,
      planTemplateSnapshot: null,
      planVariantSnapshot: null,
      createdAt: '2026-07-25T00:00:00Z',
      updatedAt: '2026-07-25T00:00:00Z',
    };
    return { ...session, exercises: [exercise] };
  }

  // The read-only branch of the screen fires only when useLocalSearchParams
  // returns an `id`. The default stub from setup.ts returns `{}`; override
  // per-test so the screen takes the read-only path.
  function setReadonlyId(id: string) {
    vi.mocked(ExpoRouter.useLocalSearchParams).mockReturnValue({ id });
  }

  it('stays silent when all setup + prescription fields are null on the historical row', () => {
    setReadonlyId('ws-1');
    screenHookStubs.useWorkoutDetail.mockReturnValue({
      data: makeReadonlySession(),
      isLoading: false,
    });

    const { container, getByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    // Exercise name renders (always). MobileSectionEyebrow uppercases
    // the name via textTransform, so the DOM text node reads "CABLE FLY".
    // Setup + prescription lines should NOT render because every one of
    // grip/attachment/notes/perSide/slotNotes is null.
    expect(getByText('CABLE FLY')).toBeTruthy();
    // The container text should not contain any of the setup labels.
    // Read-only mode renders no labels when all five fields are null.
    expect(container.textContent ?? '').not.toMatch(/\bGrip\b/);
    expect(container.textContent ?? '').not.toMatch(/\bAttachment\b/);
    expect(container.textContent ?? '').not.toMatch(/\bNotes\b/);
    expect(container.textContent ?? '').not.toMatch(/Per side/i);
    expect(container.textContent ?? '').not.toMatch(/Slot notes/i);
  });

  it('renders the per-side line when the historical row carries a unilateral prescription', () => {
    setReadonlyId('ws-1');
    screenHookStubs.useWorkoutDetail.mockReturnValue({
      data: makeReadonlySession({ perSide: true }),
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    expect(getByText('Per side')).toBeTruthy();
    expect(getByText('unilateral')).toBeTruthy();
  });

  it('renders the slot-notes line when the historical row carries slot-notes prescription text', () => {
    setReadonlyId('ws-1');
    screenHookStubs.useWorkoutDetail.mockReturnValue({
      data: makeReadonlySession({ slotNotes: 'Use the low pulley.' }),
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    expect(getByText('Use the low pulley.')).toBeTruthy();
  });

  it('renders the attachment label when the historical row carries a slug', () => {
    setReadonlyId('ws-1');
    screenHookStubs.useWorkoutDetail.mockReturnValue({
      data: makeReadonlySession({ attachmentSlug: 'straight-bar' }),
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    // Slug 'straight-bar' resolves to display label 'Straight bar'.
    expect(getByText('Straight bar')).toBeTruthy();
  });

  it('renders a prettified label when the historical row carries a catalog-vocabulary slug outside the TS union', () => {
    setReadonlyId('ws-1');
    screenHookStubs.useWorkoutDetail.mockReturnValue({
      data: makeReadonlySession({ attachmentSlug: 'cable-rope' }),
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    // 'cable-rope' is the catalog seed vocabulary (not in the TS
    // union). The prettifier produces 'Cable rope'.
    expect(getByText('Cable rope')).toBeTruthy();
  });
});
