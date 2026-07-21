// components/composed/SaveSetupCta.tsx
//
// Phase 6 in-workout preset-creation affordance. Renders inside the
// active-workout exercise card next to the setup inputs, making the
// workout the primary preset-creation path. Settings remains the
// secondary management library (full CRUD + capability-specific
// presets not creatable from a workout).
//
// Visibility gate (load-bearing):
//   Renders ONLY when BOTH are true:
//     1. The draft exercise has at least one non-null setup value
//        (grip / attachment / notes) — there has to be something to save.
//     2. The exercise resolves to EXACTLY ONE equipment capability —
//        the in-workout flow infers the capability from context and
//        never asks the user to pick an abstract one. When the count
//        is zero or >1, this CTA stays hidden and the user falls back
//        to the Settings management flow (documented + tested).
//
// What this component does:
//   • Renders a compact "Save as setup" Pressable.
//   • On tap, opens a MobileSheet with a single MobileInput (label),
//     prefilled with a sensible default built from the capability +
//     attachment/grip so the user can confirm quickly.
//   • Calls useCreateSetupPreset.mutate with the resolved capability
//     + the draft's current grip / attachment / notes values. The
//     mutation optimistically patches both preset-list caches, so the
//     sibling SetupPresetPicker sees the new preset immediately.
//   • On success, calls onSaved(preset) so the parent can flip its
//     applied-preset acknowledgement state.
//
// What this component does NOT do:
//   • It does not own draft setup state — the parent passes the
//     current values in via `setupSnapshot`.
//   • It does not choose the capability — the parent passes the
//     already-resolved capability in via `resolvedCapability`. The
//     component refuses to render if that value is null.
//   • It does not bypass field-level compatibility — the saved preset
//     is built from the same draft values the store + picker already
//     see, so the same isPresetCompatibleWithExercise rule governs
//     whether the new preset appears in the picker.
//   • It does not write any preset id to the draft or to history.

import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MobileInput,
  MobilePrimaryButton,
  MobileSheet,
} from '../MobilePremium';
import { useAppTheme, useToast } from '../../context';
import { useCreateSetupPreset } from '../../hooks';
import { logger } from '../../utils/logger';
import { EQUIPMENT_CAPABILITIES } from '../../constants/equipmentCapabilities';
import type { SetupPreset } from '../../shared/types';

export interface SaveSetupCtaProps {
  /**
   * The single capability resolved for this exercise, or null when
   * zero or more than one capability is in play. When null, the CTA
   * stays hidden and the user falls back to the Settings flow.
   */
  resolvedCapability: string | null;
  /** Current draft setup values for the active exercise. */
  setupSnapshot: {
    gripText: string | null;
    attachmentSlug: string | null;
    equipmentNotes: string | null;
  };
  /**
   * Dispatched after a successful create. Parent uses it to flip its
   * applied-preset acknowledgement state so the new preset shows as
   * Applied in the sibling picker.
   */
  onSaved: (preset: SetupPreset) => void;
  /** Optional test hook. */
  testID?: string;
}

const LABEL_MAX = 60;

function buildDefaultLabel(
  capabilityLabel: string,
  setup: SaveSetupCtaProps['setupSnapshot'],
): string {
  // Prefer attachment > grip > notes as the distinguishing hint, since
  // attachment is the most concrete equipment-station signal.
  const hint =
    setup.attachmentSlug ??
    setup.gripText ??
    (setup.equipmentNotes ? setup.equipmentNotes.split(/\s+/).slice(0, 3).join(' ') : null);
  const base = hint ? `${capabilityLabel} · ${hint}` : capabilityLabel;
  return base.length > LABEL_MAX ? base.slice(0, LABEL_MAX - 1) + '…' : base;
}

export function SaveSetupCta({
  resolvedCapability,
  setupSnapshot,
  onSaved,
  testID,
}: SaveSetupCtaProps) {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const createMut = useCreateSetupPreset();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [label, setLabel] = useState('');

  const hasSetupValue =
    setupSnapshot.gripText !== null ||
    setupSnapshot.attachmentSlug !== null ||
    setupSnapshot.equipmentNotes !== null;

  const capabilityInfo = resolvedCapability
    ? EQUIPMENT_CAPABILITIES[resolvedCapability as keyof typeof EQUIPMENT_CAPABILITIES]
    : undefined;
  const capabilityLabel = capabilityInfo?.label ?? resolvedCapability ?? '';
  const visible = hasSetupValue && resolvedCapability !== null && capabilityInfo !== undefined;

  // Prefill the label input whenever the sheet opens, so the user has
  // a sensible default to confirm or edit. Guarded on `visible` so the
  // effect is a no-op when the CTA is hidden (also keeps Rules of Hooks
  // satisfied — the effect runs unconditionally, the early return below
  // comes after every hook).
  useEffect(() => {
    if (sheetOpen && visible) {
      setLabel(buildDefaultLabel(capabilityLabel, setupSnapshot));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen]);

  const trimmedLabel = label.trim();
  const labelError = trimmedLabel.length === 0 ? 'Label is required' : null;

  const handleCreate = () => {
    if (!trimmedLabel || !resolvedCapability) {
      return;
    }
    createMut.mutate(
      {
        dto: {
          label: trimmedLabel,
          capabilitySlug: resolvedCapability,
          gripText: setupSnapshot.gripText,
          attachmentSlug: setupSnapshot.attachmentSlug,
          equipmentNotes: setupSnapshot.equipmentNotes,
        },
      },
      {
        onSuccess: (preset) => {
          showToast('success', 'Setup saved');
          setSheetOpen(false);
          onSaved(preset);
        },
        onError: (err) => {
          logger.warn('mutations', 'save-as-setup failed:', err.message);
          showToast('error', 'Could not save setup');
        },
      },
    );
  };

  // Hide when there's nothing to save OR the capability isn't uniquely
  // resolved. The Settings management flow covers edge cases. This early
  // return comes AFTER every hook above so Rules of Hooks stay satisfied.
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.wrap} testID={testID}>
      <Pressable
        onPress={() => setSheetOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Save as setup"
        hitSlop={6}
        style={styles.ctaRow}
      >
        <Text style={[styles.ctaText, { color: colors.brand }]}>
          + Save as setup
        </Text>
        <Text style={[styles.ctaHint, { color: colors.textColors.tertiary }]}>
          Reuse this grip, attachment, and notes on compatible workouts.
        </Text>
      </Pressable>

      <MobileSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          if (!o) setSheetOpen(false);
        }}
        title="Save as setup"
        testID="save-setup-cta-sheet"
      >
        <View style={styles.sheetBody}>
          <Text style={[styles.capabilityLine, { color: colors.textSecondary }]}>
            Capability · {capabilityLabel}
          </Text>
          <View style={{ height: 12 }} />
          <MobileInput
            label="Label"
            value={label}
            onChangeText={setLabel}
            placeholder={buildDefaultLabel(capabilityLabel, setupSnapshot)}
            error={labelError ?? undefined}
            testID="save-setup-cta-label"
            maxLength={LABEL_MAX}
          />
          <View style={{ height: 12 }} />
          <MobilePrimaryButton
            onPress={handleCreate}
            loading={createMut.isPending}
            disabled={!trimmedLabel}
            testID="save-setup-cta-submit"
          >
            Save setup
          </MobilePrimaryButton>
        </View>
      </MobileSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
  },
  ctaRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    paddingVertical: 4,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ctaHint: {
    fontSize: 11,
    lineHeight: 14,
  },
  sheetBody: {
    paddingBottom: 12,
  },
  capabilityLine: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

export default SaveSetupCta;
