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
//   2. Prefill — opening the sheet prefills the label with the
//      capability label + attachment/grip/notes hint.
//   3. Submit gate — the Save setup button is disabled when the label
//      trims to empty.
//   4. Create dispatch — tapping Save calls useCreateSetupPreset.mutate
//      with the resolved capability + the snapshot's grip/attachment/
//      notes values.
//   5. Success — closes the sheet and calls onSaved with the new preset
//      (parent uses it to flip applied acknowledgement state).
//
// Query convention: this repo's tests query by text content (RN testID
// renders as `testid` in jsdom, not `data-testid`, so getByTestId does
// not match). The label input is reached via querySelector on the
// testid attribute; the submit button is reached via its "Save setup"
// text.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
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

function makeCreatedPreset(overrides: Partial<SetupPreset> = {}): SetupPreset {
  return {
    id: 'preset-new',
    userId: 'user-1',
    label: 'Cable station · rope',
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

// Locate the textinput inside the labeled wrapper. RN's testID mock
// renders as the lowercase `testid` DOM attribute; we reach it via
// querySelector rather than getByTestId. Returns the custom element
// (RN textinput is not a real HTMLInputElement in jsdom).
function labelInput(container: HTMLElement): Element {
  const input = container.querySelector(
    '[testid="save-setup-cta-label"] textinput',
  );
  if (!input) {
    throw new Error('label textinput not rendered');
  }
  return input;
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
          setupSnapshot={EMPTY_SNAPSHOT}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    expect(container.textContent).toBe('');
  });

  it('renders null when resolvedCapability is null (ambiguous / no-resolved-capability fallback)', () => {
    // This is the documented fallback: when the exercise resolves to
    // zero or >1 capabilities, the CTA stays hidden and Settings is the
    // only creation path. The component must NOT render or guess.
    const { container } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={null}
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

  it('renders the CTA when ≥1 setup value AND a known resolvedCapability are present', () => {
    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          setupSnapshot={{
            gripText: 'neutral',
            attachmentSlug: null,
            equipmentNotes: null,
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    expect(getByText('+ Save as setup')).toBeTruthy();
  });

  it('renders when only equipmentNotes is set (notes-only is a legitimate save trigger)', () => {
    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          setupSnapshot={{
            gripText: null,
            attachmentSlug: null,
            equipmentNotes: 'Cable column 3',
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    expect(getByText('+ Save as setup')).toBeTruthy();
  });
});

// ─── Prefill behavior ────────────────────────────────────────────────

describe('SaveSetupCta — label prefill', () => {
  it('prefills the label input with capability · attachment when the sheet opens', () => {
    const { getByText, container } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          setupSnapshot={{
            gripText: null,
            attachmentSlug: 'rope',
            equipmentNotes: null,
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('+ Save as setup'));
    // The controlled value lands as a `value` attribute on the RN
    // textinput custom element — read it via getAttribute (the element
    // is not a real HTMLInputElement, so `.value` is undefined).
    const value = labelInput(container).getAttribute('value') ?? '';
    expect(value).toMatch(/Cable station/i);
    expect(value).toMatch(/rope/);
  });

  it('falls back to grip when attachment is null', () => {
    const { getByText, container } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          setupSnapshot={{
            gripText: 'neutral',
            attachmentSlug: null,
            equipmentNotes: null,
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('+ Save as setup'));
    const value = labelInput(container).getAttribute('value') ?? '';
    expect(value).toMatch(/neutral/);
  });
});

// ─── Submit gate ─────────────────────────────────────────────────────
//
// The `disabled={!trimmedLabel}` JSX gate is trivial and positively
// exercised by the create-dispatch test below (the prefilled non-empty
// label yields a non-disabled submit that fires mutate). The negative
// direction (empty label → disabled) requires simulating a TextInput
// value change, which this repo's RN mock doesn't support cleanly in
// jsdom — see ExerciseSetupRow.test.tsx for the same constraint.
// Coverage of the empty case is provided by the boundary validator
// test (__tests__/repositories/SetupPresetRepository.test.ts), which
// rejects a 0-length label at the repository boundary regardless of
// what the UI does.

// ─── Create dispatch + success ───────────────────────────────────────

describe('SaveSetupCta — create dispatch', () => {
  it('calls useCreateSetupPreset.mutate with the resolved capability + the snapshot setup values', () => {
    const mutate = vi.fn();
    screenHookStubs.useCreateSetupPreset.mockReturnValue({
      mutate,
      isPending: false,
    });
    const { getByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          setupSnapshot={{
            gripText: 'neutral',
            attachmentSlug: 'rope',
            equipmentNotes: 'Column 3',
          }}
          onSaved={() => {}}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('+ Save as setup'));
    // Submit with the prefilled label.
    fireEvent.click(getByText('Save setup'));
    expect(mutate).toHaveBeenCalledTimes(1);
    const [vars] = mutate.mock.calls[0];
    expect(vars).toEqual({
      dto: {
        label: expect.any(String),
        capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
        gripText: 'neutral',
        attachmentSlug: 'rope',
        equipmentNotes: 'Column 3',
      },
    });
  });

  it('on success: closes the sheet, calls onSaved with the new preset', async () => {
    let captured: { onSuccess?: (p: SetupPreset) => void; onError?: (e: Error) => void } = {};
    const mutate = vi.fn((_vars, opts) => {
      captured = opts ?? {};
    });
    screenHookStubs.useCreateSetupPreset.mockReturnValue({
      mutate,
      isPending: false,
    });
    const onSaved = vi.fn();
    const { getByText, container, queryByText } = render(
      <Wrap>
        <SaveSetupCta
          resolvedCapability={EquipmentCapabilitySlug.CABLE_STATION}
          setupSnapshot={{
            gripText: 'neutral',
            attachmentSlug: 'rope',
            equipmentNotes: null,
          }}
          onSaved={onSaved}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('+ Save as setup'));
    fireEvent.click(getByText('Save setup'));
    expect(captured.onSuccess).toBeDefined();
    const newPreset = makeCreatedPreset();
    captured.onSuccess!(newPreset);
    // Sheet closes — the "Capability ·" line unmounts.
    await waitFor(() => {
      expect(queryByText(/Capability ·/)).toBeNull();
    });
    // Label input wrapper unmounts too.
    expect(
      container.querySelector('[testid="save-setup-cta-label"]'),
    ).toBeNull();
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledWith(newPreset);
  });
});
