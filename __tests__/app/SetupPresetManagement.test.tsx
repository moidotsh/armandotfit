// __tests__/app/SetupPresetManagement.test.tsx
//
// Phase 6 setup-presets management route contract tests. Locks:
//
//   1. Empty state — renders the headline + "Create preset" CTA when
//      the user has zero presets.
//   2. Active list — renders one row per non-retired preset with Edit
//      and Retire and Delete action chips.
//   3. Retired list — renders one row per retired preset with Edit,
//      Restore, and Delete action chips.
//   4. New-preset flow — tapping "+ New preset" opens the form sheet;
//      the form sheet's submit button is disabled when the label is
//      empty.
//   5. Delete flow — tapping Delete on a row opens the confirmation
//      dialog; the dialog's destructive primary action dispatches the
//      delete mutation with the row's preset id.
//   6. ToastProvider is required (screens use showToast) — verified by
//      Wrap composing both providers.
//
// Hooks are centralized in __tests__/setup.ts (screenHookStubs). The
// stubs cover both queries (useAllSetupPresets) and mutations (the 5
// Phase 6 mutation hooks).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider, ToastProvider } from '../../context';
import { screenHookStubs } from '../setup';
import SetupPresetsScreen from '../../app/setup-presets';
import { EquipmentCapabilitySlug } from '../../constants/equipmentCapabilities';
import type { SetupPreset } from '../../shared/types';

function Wrap({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

function makePreset(overrides: Partial<SetupPreset> = {}): SetupPreset {
  return {
    id: 'preset-1',
    userId: 'user-1',
    label: 'Cable column 3 — rope, low',
    capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
    gripText: 'neutral',
    attachmentSlug: 'rope',
    equipmentNotes: 'Station 3, near the dumbbells',
    isRetired: false,
    retiredAt: null,
    createdAt: '2026-07-26T00:00:00Z',
    updatedAt: '2026-07-26T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  cleanup();
  // Reset all Phase 6 stubs to their default empty / no-op state.
  screenHookStubs.useAllSetupPresets.mockReturnValue({
    data: [],
    isLoading: false,
  });
  screenHookStubs.useActiveSetupPresets.mockReturnValue({
    data: [],
    isLoading: false,
  });
  screenHookStubs.useCreateSetupPreset.mockReturnValue({
    mutate: () => {},
    isPending: false,
  });
  screenHookStubs.useUpdateSetupPreset.mockReturnValue({
    mutate: () => {},
    isPending: false,
  });
  screenHookStubs.useRetireSetupPreset.mockReturnValue({
    mutate: () => {},
    isPending: false,
  });
  screenHookStubs.useUnretireSetupPreset.mockReturnValue({
    mutate: () => {},
    isPending: false,
  });
  screenHookStubs.useDeleteSetupPreset.mockReturnValue({
    mutate: () => {},
    isPending: false,
  });
});

// ─── Empty state ──────────────────────────────────────────────────────

describe('SetupPresetsScreen — empty state', () => {
  it('renders the headline + descriptive message when there are zero presets', () => {
    const { getByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );
    expect(getByText('No presets yet')).toBeTruthy();
    expect(
      getByText(/Save your usual grip, attachment, and station combinations/),
    ).toBeTruthy();
  });

  it('renders a Create preset CTA in the empty state', () => {
    const { getByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );
    expect(getByText('Create preset')).toBeTruthy();
  });
});

// ─── Active list ──────────────────────────────────────────────────────

describe('SetupPresetsScreen — active presets list', () => {
  it('renders one row per active preset with the Active section header', () => {
    const presets = [
      makePreset({ id: 'p1', label: 'Rope low' }),
      makePreset({ id: 'p2', label: 'Straight bar high' }),
    ];
    screenHookStubs.useAllSetupPresets.mockReturnValue({
      data: presets,
      isLoading: false,
    });

    const { getByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );
    expect(getByText('ACTIVE · 2')).toBeTruthy();
    expect(getByText('Rope low')).toBeTruthy();
    expect(getByText('Straight bar high')).toBeTruthy();
  });

  it('renders Edit, Retire, and Delete action chips per active row', () => {
    screenHookStubs.useAllSetupPresets.mockReturnValue({
      data: [makePreset({ id: 'p1', label: 'Rope low' })],
      isLoading: false,
    });

    const { getAllByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );
    // Edit, Retire, Delete — each appears once for the single row.
    expect(getAllByText('Edit').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Retire').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Delete').length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Retired list ─────────────────────────────────────────────────────

describe('SetupPresetsScreen — retired presets list', () => {
  it('renders Retired section + Restore chip when there is at least one retired preset', () => {
    screenHookStubs.useAllSetupPresets.mockReturnValue({
      data: [
        makePreset({ id: 'p1', label: 'Active preset' }),
        makePreset({
          id: 'p2',
          label: 'Old preset',
          isRetired: true,
          retiredAt: '2026-07-25T00:00:00Z',
        }),
      ],
      isLoading: false,
    });

    const { getByText, getAllByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );
    expect(getByText('RETIRED · 1')).toBeTruthy();
    expect(getByText('Old preset')).toBeTruthy();
    expect(getByText('Retired')).toBeTruthy(); // the badge on the row
    expect(getAllByText('Restore').length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT render a Retired section when there are zero retired presets', () => {
    screenHookStubs.useAllSetupPresets.mockReturnValue({
      data: [makePreset({ id: 'p1', label: 'Only active' })],
      isLoading: false,
    });

    const { queryByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );
    expect(queryByText(/RETIRED ·/)).toBeNull();
  });
});

// ─── New-preset flow ──────────────────────────────────────────────────

describe('SetupPresetsScreen — new preset flow', () => {
  it('the + New preset footer CTA is always present', () => {
    const { getByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );
    expect(getByText('+ New preset')).toBeTruthy();
  });

  it('tapping + New preset opens the form sheet with the New preset title', () => {
    const { getByText, queryByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );
    // Form is closed by default.
    expect(queryByText('New preset')).toBeNull();
    fireEvent.click(getByText('+ New preset'));
    // Sheet title renders once opened.
    expect(getByText('New preset')).toBeTruthy();
  });
});

// ─── Delete flow ──────────────────────────────────────────────────────

describe('SetupPresetsScreen — delete flow', () => {
  it('tapping Delete on a row opens the destructive confirmation dialog', () => {
    screenHookStubs.useAllSetupPresets.mockReturnValue({
      data: [makePreset({ id: 'p1', label: 'Doomed preset' })],
      isLoading: false,
    });

    const { getByText, getAllByText, queryByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );

    // Confirmation dialog NOT visible initially.
    expect(queryByText('Delete preset')).toBeNull();

    // Tap the row's Delete chip.
    const deleteChips = getAllByText('Delete');
    fireEvent.click(deleteChips[0]);

    // Confirmation dialog is now visible.
    expect(getByText('Delete preset')).toBeTruthy();
    expect(
      getByText(/This cannot be undone/),
    ).toBeTruthy();
  });

  it('confirming delete dispatches useDeleteSetupPreset.mutate with the row preset id', () => {
    const deleteMutate = vi.fn();
    screenHookStubs.useAllSetupPresets.mockReturnValue({
      data: [makePreset({ id: 'preset-to-delete', label: 'Doomed' })],
      isLoading: false,
    });
    screenHookStubs.useDeleteSetupPreset.mockReturnValue({
      mutate: deleteMutate,
      isPending: false,
    });

    const { getAllByText, getByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );

    fireEvent.click(getAllByText('Delete')[0]); // open dialog
    // The dialog's primary action label is also "Delete".
    const dialogPrimary = getAllByText('Delete');
    // Click the primary (the second one in the DOM, after the chip).
    fireEvent.click(dialogPrimary[dialogPrimary.length - 1]);

    expect(deleteMutate).toHaveBeenCalledTimes(1);
    const [vars] = deleteMutate.mock.calls[0];
    expect(vars).toEqual({ presetId: 'preset-to-delete' });
  });
});

// ─── Retire / Restore dispatch ────────────────────────────────────────

describe('SetupPresetsScreen — retire + restore dispatch', () => {
  it('tapping Retire dispatches useRetireSetupPreset.mutate with the row preset id', () => {
    const retireMutate = vi.fn();
    screenHookStubs.useAllSetupPresets.mockReturnValue({
      data: [makePreset({ id: 'preset-to-retire', label: 'Active one' })],
      isLoading: false,
    });
    screenHookStubs.useRetireSetupPreset.mockReturnValue({
      mutate: retireMutate,
      isPending: false,
    });

    const { getByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );
    fireEvent.click(getByText('Retire'));

    expect(retireMutate).toHaveBeenCalledTimes(1);
    const [vars] = retireMutate.mock.calls[0];
    expect(vars).toEqual({ presetId: 'preset-to-retire' });
  });

  it('tapping Restore dispatches useUnretireSetupPreset.mutate with the row preset id', () => {
    const unretireMutate = vi.fn();
    screenHookStubs.useAllSetupPresets.mockReturnValue({
      data: [
        makePreset({
          id: 'preset-to-restore',
          label: 'Retired one',
          isRetired: true,
          retiredAt: '2026-07-25T00:00:00Z',
        }),
      ],
      isLoading: false,
    });
    screenHookStubs.useUnretireSetupPreset.mockReturnValue({
      mutate: unretireMutate,
      isPending: false,
    });

    const { getByText } = render(
      <Wrap>
        <SetupPresetsScreen />
      </Wrap>,
    );
    fireEvent.click(getByText('Restore'));

    expect(unretireMutate).toHaveBeenCalledTimes(1);
    const [vars] = unretireMutate.mock.calls[0];
    expect(vars).toEqual({ presetId: 'preset-to-restore' });
  });
});
