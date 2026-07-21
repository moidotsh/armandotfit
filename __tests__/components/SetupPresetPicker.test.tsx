// __tests__/components/SetupPresetPicker.test.tsx
//
// Phase 6 SetupPresetPicker component tests. Locks:
//
//   1. Renders nothing when there are zero compatible presets.
//   2. Renders nothing when all presets fail the field-level rule
//      (capability match but grip / attachment not in exercise options).
//   3. Renders one chip per compatible preset, labeled with preset.label.
//   4. Tapping a chip dispatches onApply with the matched preset.
//   5. Capability gate — a preset whose capability is not in the
//      exercise's capability set does NOT render.
//   6. Grip field-level gate — a preset with a non-null gripText that
//      is not declared in exerciseGripOptions does NOT render.
//   7. Attachment field-level gate — same rule for attachmentSlug.
//   8. Notes-only preset (gripText + attachmentSlug both null) renders
//      for any capability-compatible exercise (Option A).

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

describe('SetupPresetPicker — render gating', () => {
  it('renders nothing when there are zero compatible presets', () => {
    const { container } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[makePreset({ capabilitySlug: EquipmentCapabilitySlug.DUMBBELLS })]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS}
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          onApply={() => {}}
        />
      </Wrap>,
    );
    expect(container.textContent).toBe('');
  });

  it('renders nothing when all presets fail the field-level rule', () => {
    // Capability matches but grip is not in the exercise's options.
    const { container } = render(
      <Wrap>
        <SetupPresetPicker
          presets={[makePreset({ gripText: 'supinated' })]}
          exerciseCapabilities={CABLE_CAPS}
          exerciseGripOptions={CABLE_GRIPS} // only 'neutral'
          exerciseAttachmentOptions={CABLE_ATTACHMENTS}
          onApply={() => {}}
        />
      </Wrap>,
    );
    expect(container.textContent).toBe('');
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

describe('SetupPresetPicker — Option A (notes-only allowed for any capability-compatible exercise)', () => {
  it('renders a notes-only preset (gripText + attachmentSlug both null) when the capability matches', () => {
    const { getByText } = render(
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
  });
});

describe('SetupPresetPicker — vocabulary preservation (no slug normalization)', () => {
  it('does NOT normalize rope ↔ cable-rope (catalog vocabulary is preserved as-is)', () => {
    // Preset uses 'rope' but the exercise catalog only declares 'cable-rope'.
    // The picker must treat these as distinct values and not render the preset.
    const { container } = render(
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
    expect(container.textContent).toBe('');
  });
});
