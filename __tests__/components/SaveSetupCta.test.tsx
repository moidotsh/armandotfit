// __tests__/components/SaveSetupCta.test.tsx
//
// Phase 6 SaveSetupCta component tests. Locks the in-workout primary
// preset-creation path:
//
//   1. Visibility gate — renders ONLY when the draft has at least one
//      non-null setup value AND resolvedCapability is a known capability.
//      When the exercise cannot resolve to exactly one capability, the
//      CTA stays hidden and Settings remains the only creation path
//      (documented fallback).
//   2. Create dispatch (no-match path) — when no active preset matches
//      the snapshot's capability+attachment+grip, tapping the chip
//      calls useCreateSetupPreset.mutate with an auto-generated label
//      that captures every setup dimension (exercise · attachment ·
//      grip · notes, null segments skipped) plus the resolved
//      capability and the snapshot's grip/attachment/notes values.
//      One tap, no sheet.
//   3. Auto-label structure — the dispatched label starts with the
//      exercise name (not the capability) and includes each non-null
//      setup dimension in the documented order.
//   4. Success — calls onSaved with the new preset (parent uses it to
//      flip applied acknowledgement state).
//   5. Fork-or-update (match path) — when exactly one active preset
//      matches capability+attachment+grip, the chip tap opens an
//      inline two-row expansion instead of mutating immediately.
//      Tapping "Update <label>" dispatches useUpdateSetupPreset;
//      tapping "Save as new" dispatches useCreateSetupPreset.
//   6. Toast action wiring — create-new success (no-match AND
//      Save-as-new paths) attaches a "Rename" action to the success
//      toast; update success attaches no action.
//
// Query convention: this repo's tests query by text content (RN testID
// renders as `testid` in jsdom, not `data-testid`, so getByTestId does
// not match). The chip is reached via its "+ Save setup" label text.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider, ToastProvider, useToast } from '../../context';
import { screenHookStubs } from '../setup';
import { SaveSetupCta } from '../../components/composed/SaveSetupCta';
import { EquipmentCapabilitySlug } from '../../constants/equipmentCapabilities';
import type { SetupPreset } from '../../shared/types';

function Wrap({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

// ToastInspector — sibling test component that subscribes to the toast
// state via useToast(). Used by the toast-action tests to assert what
// `showToast` was called with after a SaveSetupCta interaction.
function ToastInspector({ onToasts }: { onToasts: (toasts: ReturnType<typeof useToast>['toasts']) => void }) {
  const { toasts } = useToast();
  // Always push the latest snapshot; tests select by index/type.
  onToasts(toasts);
  return null;
}

const EMPTY_SNAPSHOT = {
  gripText: null,
  attachmentSlug: null,
  equipmentNotes: null,
};

const EXERCISE_NAME = 'Cable Bicep Curl';

function makeCreatedPreset(overrides: Partial<SetupPreset> = {}): SetupPreset {
  return {
    id: 'preset-new',
    userId: 'user-1',
    label: 'Cable Bicep Curl · rope',
    capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
    gripText: 'neutral',
    attachmentSlug: 'rope',
    equipmentNotes: null,
    isRetired: false,
    retiredAt: null,
    createdAt: '2026-07-26T00:00:00Z',
    updatedAt: '2026-07-26T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  cleanup();
  screenHookStubs.useCreateSetupPreset.mockReturnValue({
    mutate: () => {},
    isPending: false,
  });
  screenHookStubs.useUpdateSetupPreset.mockReturnValue({
    mutate: () => {},
    isPending: false,
  });
  screenHookStubs.useActiveSetupPresets.mockReturnValue({
    data: [],
    isLoading: false,
  });
});

// ─── Visibility gate ─────────────────────────────────────────────────

describe('SaveSetupCta — visibility gate', () => {
  it('renders null when the snapshot has no setup values (all null)', () => {
    const { container } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={EMPTY_SNAPSHOT}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    expect(container.textContent).toBe('');
  });

  it('renders null when resolvedCapability is null (ambiguous / no-resolved-capability fallback)', () => {
    // Documented fallback: when the exercise resolves to zero or >1
    // capabilities, the CTA stays hidden and Settings is the only
    // creation path. The component must NOT render or guess.
    const { container } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={null}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={{
            gripText: 'neutral',
            attachmentSlug: 'rope',
            equipmentNotes: null,
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    expect(container.textContent).toBe('');
  });

  it('renders null when resolvedCapability is not a known capability slug', () => {
    // Defensive: parent passes a slug the client vocabulary doesn't
    // recognize. The CTA refuses to render rather than guess a label.
    const { container } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={'time-machine' as unknown as string}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={{
            gripText: 'neutral',
            attachmentSlug: null,
            equipmentNotes: null,
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    expect(container.textContent).toBe('');
  });

  it('renders the chip when ≥1 setup value AND a known resolvedCapability are present', () => {
    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={{
            gripText: 'neutral',
            attachmentSlug: null,
            equipmentNotes: null,
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    expect(getByText('+ Save setup')).toBeTruthy();
  });

  it('renders when only equipmentNotes is set (notes-only is a legitimate save trigger)', () => {
    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={{
            gripText: null,
            attachmentSlug: null,
            equipmentNotes: 'Cable column 3',
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    expect(getByText('+ Save setup')).toBeTruthy();
  });
});

// ─── Create dispatch (one tap, auto-label) ───────────────────────────

describe('SaveSetupCta — create dispatch', () => {
  it('calls useCreateSetupPreset.mutate with the auto-label, capability, and snapshot values on a single tap', () => {
    const mutate = vi.fn();
    screenHookStubs.useCreateSetupPreset.mockReturnValue({
      mutate,
      isPending: false,
    });
    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={{
            gripText: 'Reverse grip',
            attachmentSlug: 'EZ-Bar',
            equipmentNotes: 'Window',
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    // One tap on the chip — no sheet, no second tap.
    fireEvent.click(getByText('+ Save setup'));
    expect(mutate).toHaveBeenCalledTimes(1);
    const [vars] = mutate.mock.calls[0];
    expect(vars).toEqual({
      dto: {
        label: expect.any(String),
        capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
        gripText: 'Reverse grip',
        attachmentSlug: 'EZ-Bar',
        equipmentNotes: 'Window',
      },
    });
  });

  it('auto-label captures exercise name first, then attachment, grip, and notes in that order', () => {
    const mutate = vi.fn();
    screenHookStubs.useCreateSetupPreset.mockReturnValue({
      mutate,
      isPending: false,
    });
    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName="Cable Bicep Curl"
          setupSnapshot={{
            gripText: 'Reverse grip',
            attachmentSlug: 'EZ-Bar',
            equipmentNotes: 'Window',
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('+ Save setup'));
    const [vars] = mutate.mock.calls[0];
    const label: string = vars.dto.label;
    // Exercise name anchors the label (not capability).
    expect(label.startsWith('Cable Bicep Curl')).toBe(true);
    // Capability is dropped from the label entirely.
    expect(label).not.toMatch(/Cable station/i);
    // Each non-null dimension is present, in the documented order:
    // exercise → attachment → grip → notes.
    const exIdx = label.indexOf('Cable Bicep Curl');
    const attachIdx = label.indexOf('EZ-Bar');
    const gripIdx = label.indexOf('Reverse grip');
    const notesIdx = label.indexOf('Window');
    expect(exIdx).toBeLessThan(attachIdx);
    expect(attachIdx).toBeLessThan(gripIdx);
    expect(gripIdx).toBeLessThan(notesIdx);
    // Middle-dot separator.
    expect(label).toContain(' · ');
  });

  it('auto-label skips null segments (attachment omitted)', () => {
    const mutate = vi.fn();
    screenHookStubs.useCreateSetupPreset.mockReturnValue({
      mutate,
      isPending: false,
    });
    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName="Cable Bicep Curl"
          setupSnapshot={{
            gripText: 'Reverse grip',
            attachmentSlug: null,
            equipmentNotes: null,
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('+ Save setup'));
    const [vars] = mutate.mock.calls[0];
    // Exercise + grip only, no trailing separators.
    expect(vars.dto.label).toBe('Cable Bicep Curl · Reverse grip');
  });

  it('does not dispatch mutate when the visibility gate is closed (tap is unreachable)', () => {
    // Sanity: when the component renders null, there is no chip to tap.
    // The contract is that mutate is only callable when visible.
    const mutate = vi.fn();
    screenHookStubs.useCreateSetupPreset.mockReturnValue({
      mutate,
      isPending: false,
    });
    const { container } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={null}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={{
            gripText: 'neutral',
            attachmentSlug: 'rope',
            equipmentNotes: null,
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    expect(container.textContent).toBe('');
    expect(mutate).not.toHaveBeenCalled();
  });
});

// ─── Success ─────────────────────────────────────────────────────────

describe('SaveSetupCta — success', () => {
  it('on success: calls onSaved with the new preset', () => {
    let captured: { onSuccess?: (p: SetupPreset) => void; onError?: (e: Error) => void } = {};
    const mutate = vi.fn((_vars, opts) => {
      captured = opts ?? {};
    });
    screenHookStubs.useCreateSetupPreset.mockReturnValue({
      mutate,
      isPending: false,
    });
    const onSaved = vi.fn();
    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={{
            gripText: 'neutral',
            attachmentSlug: 'rope',
            equipmentNotes: null,
          }}
          onSaved={onSaved}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('+ Save setup'));
    expect(captured.onSuccess).toBeDefined();
    const newPreset = makeCreatedPreset();
    captured.onSuccess!(newPreset);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledWith(newPreset);
  });
});

// ─── Fork-or-update detection ───────────────────────────────────────
//
// Match key: capability + attachment + grip. Notes are excluded.
// Match semantics: exactly-one match → expansion; zero or >1 →
// falls through to create-new (existing one-tap behavior).

const SNAP_WITH_ROPE_NEUTRAL = {
  gripText: 'neutral',
  attachmentSlug: 'rope',
  equipmentNotes: null,
};

function makeMatchingPreset(overrides: Partial<SetupPreset> = {}): SetupPreset {
  return makeCreatedPreset({
    id: 'preset-existing',
    label: 'Cable Bicep Curl · rope · neutral',
    ...overrides,
  });
}

describe('SaveSetupCta — fork-or-update match path', () => {
  it('chip tap with exactly-one match opens the expansion and does NOT mutate immediately', () => {
    const createMutate = vi.fn();
    screenHookStubs.useCreateSetupPreset.mockReturnValue({
      mutate: createMutate,
      isPending: false,
    });
    const matchingPreset = makeMatchingPreset();
    screenHookStubs.useActiveSetupPresets.mockReturnValue({
      data: [matchingPreset],
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={SNAP_WITH_ROPE_NEUTRAL}
          onSaved={() => {}}
        />
      </Wrap>,
    );

    fireEvent.click(getByText('+ Save setup'));

    // No mutate fired on the chip tap itself — the user has to pick
    // Update or Save-as-new first.
    expect(createMutate).not.toHaveBeenCalled();
    // Both rows render.
    expect(getByText('Save as new')).toBeTruthy();
    expect(
      getByText(`Update ${matchingPreset.label}`),
    ).toBeTruthy();
  });

  it('tap "Update <label>" dispatches useUpdateSetupPreset with presetId + dto (label not in dto)', () => {
    const updateMutate = vi.fn();
    screenHookStubs.useUpdateSetupPreset.mockReturnValue({
      mutate: updateMutate,
      isPending: false,
    });
    const matchingPreset = makeMatchingPreset();
    screenHookStubs.useActiveSetupPresets.mockReturnValue({
      data: [matchingPreset],
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={SNAP_WITH_ROPE_NEUTRAL}
          onSaved={() => {}}
        />
      </Wrap>,
    );

    fireEvent.click(getByText('+ Save setup'));
    fireEvent.click(getByText(`Update ${matchingPreset.label}`));

    expect(updateMutate).toHaveBeenCalledTimes(1);
    const [vars] = updateMutate.mock.calls[0];
    expect(vars).toEqual({
      presetId: matchingPreset.id,
      dto: {
        // Label is NOT in the update DTO — the user did not edit it.
        gripText: SNAP_WITH_ROPE_NEUTRAL.gripText,
        attachmentSlug: SNAP_WITH_ROPE_NEUTRAL.attachmentSlug,
        equipmentNotes: SNAP_WITH_ROPE_NEUTRAL.equipmentNotes,
      },
    });
  });

  it('tap "Save as new" dispatches useCreateSetupPreset with auto-label', () => {
    const createMutate = vi.fn();
    screenHookStubs.useCreateSetupPreset.mockReturnValue({
      mutate: createMutate,
      isPending: false,
    });
    const matchingPreset = makeMatchingPreset();
    screenHookStubs.useActiveSetupPresets.mockReturnValue({
      data: [matchingPreset],
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={SNAP_WITH_ROPE_NEUTRAL}
          onSaved={() => {}}
        />
      </Wrap>,
    );

    fireEvent.click(getByText('+ Save setup'));
    fireEvent.click(getByText('Save as new'));

    expect(createMutate).toHaveBeenCalledTimes(1);
    const [vars] = createMutate.mock.calls[0];
    expect(vars.dto.capabilitySlug).toBe(EquipmentCapabilitySlug.CABLE_STATION);
    expect(vars.dto.label).toEqual(expect.any(String));
    expect(vars.dto.label.startsWith(EXERCISE_NAME)).toBe(true);
  });

  it('two matches (degenerate) fall through to create-new — no expansion', () => {
    // Two presets identical on the match key is degenerate; rather
    // than guess which to update, the chip falls through to the
    // create-new path. The user can resolve the ambiguity in Settings.
    const createMutate = vi.fn();
    screenHookStubs.useCreateSetupPreset.mockReturnValue({
      mutate: createMutate,
      isPending: false,
    });
    const a = makeMatchingPreset({ id: 'preset-a' });
    const b = makeMatchingPreset({ id: 'preset-b' });
    screenHookStubs.useActiveSetupPresets.mockReturnValue({
      data: [a, b],
      isLoading: false,
    });

    const { queryByText, getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={SNAP_WITH_ROPE_NEUTRAL}
          onSaved={() => {}}
        />
      </Wrap>,
    );

    fireEvent.click(getByText('+ Save setup'));
    expect(createMutate).toHaveBeenCalledTimes(1);
    // Expansion did not open.
    expect(queryByText('Save as new')).toBeNull();
  });

  it('notes-only-different preset still counts as a match (notes excluded from match key)', () => {
    // Documents the deliberate simplification: a user with two
    // presets identical on capability+attachment+grip but different
    // on notes will trigger fork-or-update when saving either.
    const matchingPreset = makeMatchingPreset({
      equipmentNotes: 'column 3', // differs from snapshot
    });
    screenHookStubs.useActiveSetupPresets.mockReturnValue({
      data: [matchingPreset],
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          // Snapshot notes are null; existing preset notes are 'column 3'.
          setupSnapshot={SNAP_WITH_ROPE_NEUTRAL}
          onSaved={() => {}}
        />
      </Wrap>,
    );

    fireEvent.click(getByText('+ Save setup'));
    expect(
      getByText(`Update ${matchingPreset.label}`),
    ).toBeTruthy();
  });
});

// ─── Toast action wiring ────────────────────────────────────────────
//
// Create-new success (no-match AND Save-as-new) attaches a "Rename"
// action to the success toast. Update success attaches NO action —
// the label is already known-good, no rename nudge.

describe('SaveSetupCta — toast action wiring', () => {
  it('create-new success (no-match path) shows a success toast with a Rename action', async () => {
    let captured: { onSuccess?: (p: SetupPreset) => void } = {};
    screenHookStubs.useCreateSetupPreset.mockReturnValue({
      mutate: (_vars: unknown, opts?: unknown) => {
        captured = (opts as { onSuccess?: (p: SetupPreset) => void }) ?? {};
      },
      isPending: false,
    });
    screenHookStubs.useActiveSetupPresets.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const toastSnapshots: Array<ReturnType<typeof useToast>['toasts']> = [];
    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={SNAP_WITH_ROPE_NEUTRAL}
          onSaved={() => {}}
        />
        <ToastInspector
          onToasts={(t) => {
            // Capture-only — never re-render the parent from here.
            toastSnapshots.push([...t]);
          }}
        />
      </Wrap>,
    );

    fireEvent.click(getByText('+ Save setup'));
    await act(async () => {
      captured.onSuccess!(makeCreatedPreset());
    });

    const last = toastSnapshots[toastSnapshots.length - 1];
    expect(last).toBeDefined();
    expect(last.some((t) => t.type === 'success' && t.message === 'Setup saved')).toBe(true);
    const saved = last.find((t) => t.message === 'Setup saved');
    expect(saved?.action).toEqual({
      label: 'Rename',
      onPress: expect.any(Function),
    });
  });

  it('update success shows a success toast WITHOUT an action (label is known-good)', async () => {
    let captured: { onSuccess?: (p: SetupPreset) => void } = {};
    screenHookStubs.useUpdateSetupPreset.mockReturnValue({
      mutate: (_vars: unknown, opts?: unknown) => {
        captured = (opts as { onSuccess?: (p: SetupPreset) => void }) ?? {};
      },
      isPending: false,
    });
    const matchingPreset = makeMatchingPreset();
    screenHookStubs.useActiveSetupPresets.mockReturnValue({
      data: [matchingPreset],
      isLoading: false,
    });

    const toastSnapshots: Array<ReturnType<typeof useToast>['toasts']> = [];
    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          exerciseName={EXERCISE_NAME}
          setupSnapshot={SNAP_WITH_ROPE_NEUTRAL}
          onSaved={() => {}}
        />
        <ToastInspector
          onToasts={(t) => {
            toastSnapshots.push([...t]);
          }}
        />
      </Wrap>,
    );

    fireEvent.click(getByText('+ Save setup'));
    fireEvent.click(getByText(`Update ${matchingPreset.label}`));
    await act(async () => {
      captured.onSuccess!(matchingPreset);
    });

    const last = toastSnapshots[toastSnapshots.length - 1];
    expect(last).toBeDefined();
    const updated = last?.find((t) => t.message === 'Setup updated');
    expect(updated).toBeDefined();
    expect(updated?.type).toBe('success');
    expect(updated?.action).toBeUndefined();
  });
});
