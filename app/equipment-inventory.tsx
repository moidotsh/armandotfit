// app/equipment-inventory.tsx
//
// Phase 2 equipment capability onboarding wizard. Three steps:
//   1. Capability selection — grouped multi-select of the 26 equipment
//      capabilities (constants/equipmentCapabilities.ts).
//   2. Detail configuration — for each detail-bearing capability the
//      user selected (bench / cable-station / leg-curl / calf-raise),
//      collect the variants/positions/attachments that determine which
//      concrete equipment_type slugs the resolver will emit.
//   3. Review + Save — list the selections + resolved equipment slugs,
//      fire the save mutation, and pop the screen on success.
//
// The wizard state is a Record<capabilitySlug, details>. Step 1's
// capability selection toggles keys in this record; step 2's detail
// config mutates the values. The save mutation accepts the record
// serialized as EquipmentCapabilitySelectionDTO[].
//
// Pre-load: when the screen mounts and useEquipmentCapabilities
// returns cached rows, the wizard state is seeded from them so the
// user can edit a previously-saved inventory rather than re-pick from
// scratch.

import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobileSectionEyebrow,
  MobileSelectionList,
  Wizard,
  type WizardStep,
  type MobileSelectionOption,
} from '../components/MobilePremium';
import { useAppTheme } from '../context';
import { safeGoBack } from '../navigation';
import { useEquipmentCapabilities, useSaveEquipmentCapabilities } from '../hooks';
import { logger } from '../utils/logger';
import { SCREEN_BODY_STYLE } from '../constants';
import {
  EquipmentCapabilitySlug,
  EQUIPMENT_CAPABILITIES,
  EQUIPMENT_CAPABILITY_GROUPS,
  EQUIPMENT_CAPABILITY_LIST,
  CABLE_ATTACHMENT_OPTIONS,
  CABLE_HEIGHT_OPTIONS,
  BENCH_POSITION_OPTIONS,
  LEG_CURL_VARIANT_OPTIONS,
  CALF_RAISE_VARIANT_OPTIONS,
  resolveCapabilityToEquipmentSlugs,
  type EquipmentCapabilitySlug as CapabilitySlug,
  type CableAttachmentSlug,
  type CableHeightSlug,
  type BenchPositionSlug,
  type LegCurlVariantSlug,
  type CalfRaiseVariantSlug,
} from '../constants/equipmentCapabilities';
import { EQUIPMENT_DISPLAY_NAMES } from '../shared/exercises/data';
import type { EquipmentCapabilitySelectionDTO } from '../shared/types';

// Detail-bearing slugs that trigger the per-capability config step.
const DETAIL_BEARING: Set<CapabilitySlug> = new Set([
  EquipmentCapabilitySlug.CABLE_STATION,
  EquipmentCapabilitySlug.BENCH,
  EquipmentCapabilitySlug.LEG_CURL,
  EquipmentCapabilitySlug.CALF_RAISE,
]);

type WizardState = Record<string, Record<string, unknown>>;

function capabilitiesToWizardState(
  rows: { capabilitySlug: string; details: Record<string, unknown> }[] | undefined,
): WizardState {
  if (!rows) return {};
  const out: WizardState = {};
  for (const row of rows) {
    out[row.capabilitySlug] = row.details ?? {};
  }
  return out;
}

function wizardStateToSelections(state: WizardState): EquipmentCapabilitySelectionDTO[] {
  return Object.entries(state).map(([slug, details]) => ({
    slug,
    details: Object.keys(details).length > 0 ? details : undefined,
  }));
}

export default function EquipmentInventoryScreen() {
  const { colors } = useAppTheme();
  const capabilitiesQuery = useEquipmentCapabilities();
  const saveMutation = useSaveEquipmentCapabilities();

  const [state, setState] = useState<WizardState>({});
  const [step, setStep] = useState(0);

  // Seed from cached query data once on mount + whenever the underlying
  // row set changes from server-authoritative invalidation.
  useEffect(() => {
    if (capabilitiesQuery.data) {
      setState(capabilitiesToWizardState(capabilitiesQuery.data));
    }
  }, [capabilitiesQuery.data]);

  const selectedSlugs = Object.keys(state) as CapabilitySlug[];
  const detailBearerSelected = selectedSlugs.filter((s) => DETAIL_BEARING.has(s));
  const hasDetailStep = detailBearerSelected.length > 0;
  const totalSteps = hasDetailStep ? 3 : 2;

  // ─── Step handlers ───────────────────────────────────────────────────

  const toggleCapability = (id: string) => {
    setState((prev) => {
      const next = { ...prev };
      if (id in next) {
        delete next[id];
      } else {
        // Seed details with empty arrays so the detail step shows
        // unchecked options instead of nothing.
        next[id] = initialDetailsFor(id as CapabilitySlug);
      }
      return next;
    });
  };

  const setDetailField = <K extends string>(
    capability: CapabilitySlug,
    field: string,
    nextValue: K[],
  ) => {
    setState((prev) => ({
      ...prev,
      [capability]: { ...prev[capability], [field]: nextValue },
    }));
  };

  const handleBack = () => {
    if (step === 0) {
      safeGoBack();
      return;
    }
    setStep(step - 1);
  };

  const handleContinue = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }
    handleSave();
  };

  const handleSave = () => {
    const selections = wizardStateToSelections(state);
    saveMutation.mutate(selections, {
      onSuccess: () => {
        safeGoBack();
      },
      onError: (err) => {
        logger.warn(
          'mutations',
          'save equipment capabilities failed:',
          err.message,
        );
      },
    });
  };

  // ─── canContinue per step ────────────────────────────────────────────

  const canContinue = useMemo(() => {
    if (step === 0) return true; // empty selection is a valid inventory
    if (step === 1 && hasDetailStep) {
      // Every detail-bearing capability must have at least one option
      // picked in each required field.
      for (const slug of detailBearerSelected) {
        if (!detailsSatisfiesRequired(slug, state[slug] ?? {})) return false;
      }
      return true;
    }
    return true;
  }, [step, hasDetailStep, detailBearerSelected, state]);

  // ─── Steps ───────────────────────────────────────────────────────────

  const steps: WizardStep[] = useMemo(() => {
    const arr: WizardStep[] = [
      {
        id: 'select',
        eyebrow: 'Step 1',
        title: 'What do you have access to?',
        content: (
          <CapabilitySelectionStep
            selectedSlugs={selectedSlugs}
            onToggle={toggleCapability}
          />
        ),
      },
    ];
    if (hasDetailStep) {
      arr.push({
        id: 'details',
        eyebrow: 'Step 2',
        title: 'Configure details',
        content: (
          <DetailConfigurationStep
            detailBearerSelected={detailBearerSelected}
            state={state}
            onSetField={setDetailField}
          />
        ),
      });
    }
    arr.push({
      id: 'review',
      eyebrow: hasDetailStep ? 'Step 3' : 'Step 2',
      title: 'Review + save',
      content: <ReviewStep selections={state} saving={saveMutation.isPending} />,
    });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasDetailStep,
    selectedSlugs,
    detailBearerSelected,
    state,
    saveMutation.isPending,
  ]);

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="analytics" />
      <MobileHeader
        title="Equipment Inventory"
        eyebrow="Training"
        onBack={safeGoBack}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        <Wizard
          steps={steps}
          currentStep={Math.min(step, steps.length - 1)}
          onBack={handleBack}
          onContinue={handleContinue}
          canContinue={canContinue}
          continueLabel={
            step === totalSteps - 1
              ? saveMutation.isPending
                ? 'Saving…'
                : 'Save'
              : undefined
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Step components (file-local — not exported; the route owns them)
// ──────────────────────────────────────────────────────────────────────

function CapabilitySelectionStep({
  selectedSlugs,
  onToggle,
}: {
  selectedSlugs: CapabilitySlug[];
  onToggle: (id: string) => void;
}) {
  const selectedIds = selectedSlugs;
  return (
    <View>
      {EQUIPMENT_CAPABILITY_GROUPS.map((group) => {
        const optionsInGroup: MobileSelectionOption[] = EQUIPMENT_CAPABILITY_LIST.filter(
          (c) => c.group === group.id,
        ).map((c) => ({
          id: c.slug,
          label: c.label,
          description: c.description,
        }));
        if (optionsInGroup.length === 0) return null;
        return (
          <View key={group.id} style={stepStyles.groupBlock}>
            <MobileSectionEyebrow flush={false}>{group.label}</MobileSectionEyebrow>
            <MobileSurface padding={0}>
              <MobileSelectionList
                multiSelect
                selectedIds={selectedIds}
                onSelect={onToggle}
                options={optionsInGroup}
              />
            </MobileSurface>
          </View>
        );
      })}
    </View>
  );
}

function DetailConfigurationStep({
  detailBearerSelected,
  state,
  onSetField,
}: {
  detailBearerSelected: CapabilitySlug[];
  state: WizardState;
  onSetField: <K extends string>(
    capability: CapabilitySlug,
    field: string,
    nextValue: K[],
  ) => void;
}) {
  return (
    <View>
      {detailBearerSelected.map((slug) => {
        const info = EQUIPMENT_CAPABILITIES[slug];
        const details = state[slug] ?? {};
        if (slug === EquipmentCapabilitySlug.CABLE_STATION) {
          const attachments = (details.attachments as CableAttachmentSlug[]) ?? [];
          const heights = (details.heights as CableHeightSlug[]) ?? [];
          return (
            <View key={slug} style={stepStyles.groupBlock}>
              <MobileSectionEyebrow flush={false}>{info.label}</MobileSectionEyebrow>
              <MobileSurface>
                <Text style={stepStyles.detailHeading}>Attachments</Text>
                <MobileSelectionList
                  multiSelect
                  selectedIds={attachments}
                  onSelect={(id) =>
                    onSetField<CableAttachmentSlug>(
                      slug,
                      'attachments',
                      toggleInArray(attachments, id as CableAttachmentSlug),
                    )
                  }
                  options={CABLE_ATTACHMENT_OPTIONS}
                />
                <Text style={stepStyles.detailHeading}>Heights (optional)</Text>
                <MobileSelectionList
                  multiSelect
                  selectedIds={heights}
                  onSelect={(id) =>
                    onSetField<CableHeightSlug>(
                      slug,
                      'heights',
                      toggleInArray(heights, id as CableHeightSlug),
                    )
                  }
                  options={CABLE_HEIGHT_OPTIONS}
                />
              </MobileSurface>
            </View>
          );
        }
        if (slug === EquipmentCapabilitySlug.BENCH) {
          const positions = (details.positions as BenchPositionSlug[]) ?? [];
          return (
            <View key={slug} style={stepStyles.groupBlock}>
              <MobileSectionEyebrow flush={false}>{info.label}</MobileSectionEyebrow>
              <MobileSurface>
                <MobileSelectionList
                  multiSelect
                  selectedIds={positions}
                  onSelect={(id) =>
                    onSetField<BenchPositionSlug>(
                      slug,
                      'positions',
                      toggleInArray(positions, id as BenchPositionSlug),
                    )
                  }
                  options={BENCH_POSITION_OPTIONS}
                />
              </MobileSurface>
            </View>
          );
        }
        if (slug === EquipmentCapabilitySlug.LEG_CURL) {
          const variants = (details.variants as LegCurlVariantSlug[]) ?? [];
          return (
            <View key={slug} style={stepStyles.groupBlock}>
              <MobileSectionEyebrow flush={false}>{info.label}</MobileSectionEyebrow>
              <MobileSurface>
                <MobileSelectionList
                  multiSelect
                  selectedIds={variants}
                  onSelect={(id) =>
                    onSetField<LegCurlVariantSlug>(
                      slug,
                      'variants',
                      toggleInArray(variants, id as LegCurlVariantSlug),
                    )
                  }
                  options={LEG_CURL_VARIANT_OPTIONS}
                />
              </MobileSurface>
            </View>
          );
        }
        if (slug === EquipmentCapabilitySlug.CALF_RAISE) {
          const variants = (details.variants as CalfRaiseVariantSlug[]) ?? [];
          return (
            <View key={slug} style={stepStyles.groupBlock}>
              <MobileSectionEyebrow flush={false}>{info.label}</MobileSectionEyebrow>
              <MobileSurface>
                <MobileSelectionList
                  multiSelect
                  selectedIds={variants}
                  onSelect={(id) =>
                    onSetField<CalfRaiseVariantSlug>(
                      slug,
                      'variants',
                      toggleInArray(variants, id as CalfRaiseVariantSlug),
                    )
                  }
                  options={CALF_RAISE_VARIANT_OPTIONS}
                />
              </MobileSurface>
            </View>
          );
        }
        return null;
      })}
    </View>
  );
}

function ReviewStep({
  selections,
  saving,
}: {
  selections: WizardState;
  saving: boolean;
}) {
  const { colors } = useAppTheme();
  const slugs = Object.keys(selections) as CapabilitySlug[];
  if (slugs.length === 0) {
    return (
      <MobileSurface>
        <Text style={[stepStyles.emptyText, { color: colors.textColors.tertiary }]}>
          No capabilities selected. Saving will clear your inventory.
        </Text>
      </MobileSurface>
    );
  }
  return (
    <View>
      {slugs.map((slug) => {
        const info = EQUIPMENT_CAPABILITIES[slug];
        const resolved = resolveCapabilityToEquipmentSlugs({
          slug,
          details: selections[slug],
        });
        const equipmentLabel =
          resolved.length > 0
            ? resolved
                .map((s) => EQUIPMENT_DISPLAY_NAMES[s] ?? s)
                .join(', ')
            : '—';
        return (
          <View
            key={slug}
            style={[stepStyles.reviewRow, { borderBottomColor: colors.mobilePremium.hairlineBorder }]}
          >
            <Text style={[stepStyles.reviewLabel, { color: colors.text }]}>
              {info.label}
            </Text>
            <Text
              style={[stepStyles.reviewHint, { color: colors.textColors.tertiary }]}
              numberOfLines={3}
            >
              {equipmentLabel}
            </Text>
          </View>
        );
      })}
      {saving ? (
        <Text style={[stepStyles.savingHint, { color: colors.textColors.tertiary }]}>
          Saving…
        </Text>
      ) : null}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function initialDetailsFor(slug: CapabilitySlug): Record<string, unknown> {
  switch (slug) {
    case EquipmentCapabilitySlug.CABLE_STATION:
      return { attachments: [], heights: [] };
    case EquipmentCapabilitySlug.BENCH:
      return { positions: [] };
    case EquipmentCapabilitySlug.LEG_CURL:
      return { variants: [] };
    case EquipmentCapabilitySlug.CALF_RAISE:
      return { variants: [] };
    default:
      return {};
  }
}

function detailsSatisfiesRequired(
  slug: CapabilitySlug,
  details: Record<string, unknown>,
): boolean {
  if (slug === EquipmentCapabilitySlug.CABLE_STATION) {
    return Array.isArray(details.attachments) && details.attachments.length > 0;
  }
  if (slug === EquipmentCapabilitySlug.BENCH) {
    return Array.isArray(details.positions) && details.positions.length > 0;
  }
  if (slug === EquipmentCapabilitySlug.LEG_CURL) {
    return Array.isArray(details.variants) && details.variants.length > 0;
  }
  if (slug === EquipmentCapabilitySlug.CALF_RAISE) {
    return Array.isArray(details.variants) && details.variants.length > 0;
  }
  return true;
}

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

// ──────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  body: {
    ...SCREEN_BODY_STYLE,
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 80,
  },
});

const stepStyles = StyleSheet.create({
  groupBlock: {
    marginBottom: 16,
  },
  detailHeading: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  reviewRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  savingHint: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
});
