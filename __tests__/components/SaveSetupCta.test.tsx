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
//   2. Create dispatch — tapping the chip calls
//      useCreateSetupPreset.mutate with an auto-generated label that
//      captures every setup dimension (exercise · attachment · grip ·
//      notes, null segments skipped) plus the resolved capability and
//      the snapshot's grip/attachment/notes values. One tap, no sheet.
//   3. Auto-label structure — the dispatched label starts with the
//      exercise name (not the capability) and includes each non-null
//      setup dimension in the documented order.
//   4. Success — calls onSaved with the new preset (parent uses it to
//      flip applied acknowledgement state).
//
// Query convention: this repo's tests query by text content (RN testID
// renders as `testid` in jsdom, not `data-testid`, so getByTestId does
// not match). The chip is reached via its "+ Save setup" label text.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider, ToastProvider } from '../../context';
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
