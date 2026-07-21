// __tests__/components/SetupPresetPicker.test.tsx
//
// Phase 6 SetupPresetPicker component tests. Locks:
//
//   1. Always renders — surfaces the "Saved equipment setups" eyebrow
//      and the helper text even when zero compatible presets exist.
//      This is the load-bearing UX correction: the picker is a
//      discoverable shortcut, not a gate, and the empty state tells
//      the user where to go next.
//   2. Zero-compatible empty state copy renders when no preset passes
//      the field-level rule (capability match + per-field catalog
//      governance).
//   3. Renders one chip per compatible preset, labeled with preset.label.
//   4. Tapping a chip dispatches onApply with the matched preset.
//   5. Capability gate — a preset whose capability is not in the
//      exercise's capability set does NOT render as a chip.
//   6. Grip field-level gate — a preset with a non-null gripText that
//      is not declared in exerciseGripOptions does NOT render as a chip.
//   7. Attachment field-level gate — same rule for attachmentSlug.
//   8. Notes-only preset (gripText + attachmentSlug both null) renders
//      for any capability-compatible exercise (Option A).
//   9. Applied acknowledgement row renders when appliedPresetId matches
//      a compatible preset; tapping Clear dispatches onClear.
//  10. Vocabulary preservation — rope vs cable-rope are distinct slugs
//      (no normalization).

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../context';
import { SetupPresetPicker } from '../../components/composed/SetupPresetPicker';
import { EquipmentCapabilitySlug } from '../../constants/equipmentCapabilities';
import type { SetupPreset } from '../../shared/types';

function Wrap({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

function makePreset(overrides: Partial<SetupPreset> = {}): SetupPreset {
  return {
    id: 'preset-1',
    userId: 'user-1',
    label: 'Cable column 3 — rope, low',
    capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
    gripText: null,
    attachmentSlug: null,
    equipmentNotes: null,
    isRetired: false,
    retiredAt: null,
    createdAt: '2026-07-26T00:00:00Z',
    updatedAt: '2026-07-26T00:00:00Z',
    ...overrides,
  };
}

const CABLE_CAPS = [EquipmentCapabilitySlug.CABLE_STATION];
const CABLE_GRIPS = ['neutral'];
const CABLE_ATTACHMENTS = ['rope', 'straight-bar'];

describe('SetupPresetPicker — always-render + helper text', () => {
  it('renders the "Saved equipment setups" eyebrow + helper text even when the preset list is empty', () => {
    const { getByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          onApply={() => {}}
        />
      </Wrap>,
    );
    // Eyebrow text — CSS textTransform: 'uppercase' isn't applied at
    // the DOM text level in jsdom, so we match the original-case string.
    expect(getByText('Saved equipment setups')).toBeTruthy();
    expect(
      getByText(
        /Apply your saved grip, attachment, and notes\. Only compatible setups appear\./,
      ),
    ).toBeTruthy();
  });

  it('renders the zero-compatible empty state copy when no preset passes the field-level rule', () => {
    // Capability mismatch — preset is for dumbbells, exercise is cable.
    const { getByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[
            makePreset({ capabilitySlug: EquipmentCapabilitySlug.DUMBBELLS }),
          ]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          onApply={() => {}}
        />
      </Wrap>,
    );
    expect(
      getByText(/No saved setup fits this exercise yet/),
    ).toBeTruthy();
  });

  it('renders the zero-compatible empty state copy when capability matches but grip is not declared', () => {
    // Capability matches but the preset's grip is not in the catalog
    // options for this exercise — the field-level rule filters it out.
    const { getByText, queryByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[makePreset({ label: 'Bad grip', gripText: 'supinated' })]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS} // only 'neutral'
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          onApply={() => {}}
        />
      </Wrap>,
    );
    expect(
      getByText(/No saved setup fits this exercise yet/),
    ).toBeTruthy();
    expect(queryByText('Bad grip')).toBeNull();
  });
});

describe('SetupPresetPicker — chip rendering', () => {
  it('renders one chip per compatible preset', () => {
    const presets = [
      makePreset({ id: 'p1', label: 'Rope low' }),
      makePreset({ id: 'p2', label: 'Straight bar high' }),
    ];
    const { getByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={presets}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          onApply={() => {}}
        />
      </Wrap>,
    );
    expect(getByText('Rope low')).toBeTruthy();
    expect(getByText('Straight bar high')).toBeTruthy();
  });

  it('filters out only the incompatible presets; compatible ones still render', () => {
    const presets = [
      makePreset({ id: 'p1', label: 'Rope low', attachmentSlug: 'rope' }), // compatible
      makePreset({ id: 'p2', label: 'V-bar', attachmentSlug: 'v-bar' }), // NOT in options
    ];
    const { getByText, queryByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={presets}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS} // rope + straight-bar only
          onApply={() => {}}
        />
      </Wrap>,
    );
    expect(getByText('Rope low')).toBeTruthy();
    expect(queryByText('V-bar')).toBeNull();
  });
});

describe('SetupPresetPicker — onApply dispatcher', () => {
  it('calls onApply with the matched preset when its chip is tapped', () => {
    const onApply = vi.fn();
    const preset = makePreset({ id: 'p1', label: 'Rope low', attachmentSlug: 'rope' });
    const { getByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[preset]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          onApply={onApply}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('Rope low'));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(preset);
  });
});

describe('SetupPresetPicker — applied acknowledgement + Clear', () => {
  it('renders the "Applied · <label>" row when appliedPresetId matches a compatible preset', () => {
    const preset = makePreset({ id: 'p1', label: 'Rope low', attachmentSlug: 'rope' });
    const { getByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[preset]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          appliedPresetId={preset.id}
          onApply={() => {}}
          onClear={() => {}}
        />
      </Wrap>,
    );
    expect(getByText('Applied · Rope low')).toBeTruthy();
    expect(getByText('Clear')).toBeTruthy();
  });

  it('does NOT render the Applied row when appliedPresetId is unset', () => {
    const preset = makePreset({ id: 'p1', label: 'Rope low', attachmentSlug: 'rope' });
    const { queryByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[preset]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          onApply={() => {}}
        />
      </Wrap>,
    );
    expect(queryByText(/Applied ·/)).toBeNull();
  });

  it('dispatches onClear when the Clear affordance is tapped', () => {
    const onClear = vi.fn();
    const preset = makePreset({ id: 'p1', label: 'Rope low', attachmentSlug: 'rope' });
    const { getByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[preset]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          appliedPresetId={preset.id}
          onApply={() => {}}
          onClear={onClear}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('Clear'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not render the Clear affordance when onClear is not provided', () => {
    // Parent opts out of the clear UX by omitting the handler.
    const preset = makePreset({ id: 'p1', label: 'Rope low', attachmentSlug: 'rope' });
    const { queryByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[preset]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          appliedPresetId={preset.id}
          onApply={() => {}}
        />
      </Wrap>,
    );
    expect(queryByText('Clear')).toBeNull();
  });
});

describe('SetupPresetPicker — Manage link', () => {
  it('renders the "Manage setups" link in the empty state when onManage is provided', () => {
    const onManage = vi.fn();
    const { getByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          onApply={() => {}}
          onManage={onManage}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('Manage setups'));
    expect(onManage).toHaveBeenCalledTimes(1);
  });

  it('does NOT render the "Manage setups" link when onManage is omitted', () => {
    const { queryByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          onApply={() => {}}
        />
      </Wrap>,
    );
    expect(queryByText('Manage setups')).toBeNull();
  });
});

describe('SetupPresetPicker — Option A (notes-only allowed for any capability-compatible exercise)', () => {
  it('renders a notes-only preset (gripText + attachmentSlug both null) when the capability matches', () => {
    const { getByText, queryByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[makePreset({ id: 'p1', label: 'Notes only', equipmentNotes: 'Station 3' })]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={[]} // empty — field-level rule vacuously passes
          exerciseAttachmentOptions={[]} // same
          onApply={() => {}}
        />
      </Wrap>,
    );
    expect(getByText('Notes only')).toBeTruthy();
    // Empty state copy does NOT render — at least one compatible preset exists.
    expect(queryByText(/No saved setup fits this exercise yet/)).toBeNull();
  });
});

describe('SetupPresetPicker — vocabulary preservation (no slug normalization)', () => {
  it('does NOT normalize rope ↔ cable-rope (catalog vocabulary is preserved as-is)', () => {
    // Preset uses 'rope' but the exercise catalog only declares 'cable-rope'.
    // The picker must treat these as distinct values and not render the preset
    // as a chip — but the empty state DOES render because zero compatible.
    const { getByText, queryByText } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[makePreset({ id: 'p1', label: 'Rope', attachmentSlug: 'rope' })]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={['cable-rope']} // distinct slug
          onApply={() => {}}
        />
      </Wrap>,
    );
    expect(queryByText('Rope')).toBeNull();
    expect(
      getByText(/No saved setup fits this exercise yet/),
    ).toBeTruthy();
  });
});
