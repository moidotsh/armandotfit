// app/setup-presets.tsx
//
// Phase 6 setup-presets management route. Full CRUD: create, edit,
// retire, un-retire, delete. Reached from settings → "Setup Presets".
//
// What this screen does:
//   • Lists every preset for the current user (active + retired),
//     grouped into "Active" and "Retired" sections.
//   • Each row surfaces the label, capability, and a preview of the
//     stored grip / attachment / notes values, with Edit / Retire or
//     Restore / Delete actions.
//   • Hosts a MobileSheet form for create + edit.
//   • Hosts a MobileDialog for destructive delete confirmation.
//
// What this screen does NOT do:
//   • It does not let the user apply a preset to a workout — that's
//     the active-session picker's job (components/composed/SetupPresetPicker).
//   • It does not enforce capability/exercise compatibility — management
//     edits are unconstrained. Compatibility is re-evaluated at apply
//     time by the picker + the store's applyPresetToDraftExercise gate.
//
// History-independence: deleting a preset only removes the preset row.
// Phase 5 denormalized the applied values into workout_session_exercises
// at save time, so saved workouts survive any edit / retire / delete
// here unchanged.

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobileSectionEyebrow,
  MobileActionFooter,
  MobilePrimaryButton,
  MobileInput,
  MobileSelect,
  MobileSheet,
  MobileDialog,
  EmptyState,
  CopyForAiButton,
  type MobileSelectOption,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { useAppTheme, useToast } from '../context';
import { safeGoBack } from '../navigation';
import {
  useAllSetupPresets,
  useCreateSetupPreset,
  useUpdateSetupPreset,
  useRetireSetupPreset,
  useUnretireSetupPreset,
  useDeleteSetupPreset,
  useAiPayload,
} from '../hooks';
import { logger } from '../utils/logger';
import { SCREEN_BODY_STYLE } from '../constants';
import { EQUIPMENT_CAPABILITY_LIST } from '../constants/equipmentCapabilities';
import type {
  SetupPreset,
  CreateSetupPresetDTO,
  UpdateSetupPresetDTO,
  ID,
} from '../shared/types';

// ─── Helpers ───────────────────────────────────────────────────────────

const CAPABILITY_OPTIONS: MobileSelectOption[] = EQUIPMENT_CAPABILITY_LIST.map(
  (c) => ({ value: c.slug, label: c.label, description: c.description }),
);

function capabilityLabel(slug: string): string {
  return (
    EQUIPMENT_CAPABILITY_LIST.find((c) => c.slug === slug)?.label ?? slug
  );
}

function previewParts(p: SetupPreset): string[] {
  const parts: string[] = [];
  if (p.gripText) parts.push(`Grip · ${p.gripText}`);
  if (p.attachmentSlug) parts.push(`Attachment · ${p.attachmentSlug}`);
  if (p.equipmentNotes) parts.push(`Notes · ${p.equipmentNotes}`);
  return parts;
}

// ─── Form state ────────────────────────────────────────────────────────

interface FormState {
  label: string;
  capabilitySlug: string;
  gripText: string;
  attachmentSlug: string;
  equipmentNotes: string;
}

const EMPTY_FORM: FormState = {
  label: '',
  capabilitySlug: EQUIPMENT_CAPABILITY_LIST[0].slug,
  gripText: '',
  attachmentSlug: '',
  equipmentNotes: '',
};

function presetToForm(p: SetupPreset): FormState {
  return {
    label: p.label,
    capabilitySlug: p.capabilitySlug,
    gripText: p.gripText ?? '',
    attachmentSlug: p.attachmentSlug ?? '',
    equipmentNotes: p.equipmentNotes ?? '',
  };
}

function trimToNull(s: string): string | null {
  const t = s.trim();
  return t.length > 0 ? t : null;
}

function formToCreateDto(f: FormState): CreateSetupPresetDTO {
  return {
    label: f.label,
    capabilitySlug: f.capabilitySlug,
    gripText: trimToNull(f.gripText),
    attachmentSlug: trimToNull(f.attachmentSlug),
    equipmentNotes: trimToNull(f.equipmentNotes),
  };
}

function formToUpdateDto(f: FormState): UpdateSetupPresetDTO {
  return {
    label: f.label,
    capabilitySlug: f.capabilitySlug,
    gripText: trimToNull(f.gripText),
    attachmentSlug: trimToNull(f.attachmentSlug),
    equipmentNotes: trimToNull(f.equipmentNotes),
  };
}

// ─── Screen ────────────────────────────────────────────────────────────

export default function SetupPresetsScreen() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();

  const query = useAllSetupPresets();
  const createMut = useCreateSetupPreset();
  const updateMut = useUpdateSetupPreset();
  const retireMut = useRetireSetupPreset();
  const unretireMut = useUnretireSetupPreset();
  const deleteMut = useDeleteSetupPreset();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<SetupPreset | null>(null);

  const presets = query.data ?? [];
  const active = presets.filter((p) => !p.isRetired);
  const retired = presets.filter((p) => p.isRetired);

  const aiPayload = useAiPayload({
    visibleContent: [
      `- Active presets: ${active.length}`,
      `- Retired presets: ${retired.length}`,
    ].join('\n'),
  });

  // ─── Form handlers ───────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (p: SetupPreset) => {
    setEditingId(p.id);
    setForm(presetToForm(p));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    const trimmedLabel = form.label.trim();
    if (!trimmedLabel) {
      showToast('error', 'Label is required.');
      return;
    }
    if (editingId) {
      const dto = formToUpdateDto(form);
      updateMut.mutate(
        { presetId: editingId, dto },
        {
          onSuccess: () => {
            showToast('success', 'Preset updated');
            closeForm();
          },
          onError: (err) => {
            logger.warn('mutations', 'update preset failed:', err.message);
            showToast('error', 'Update failed');
          },
        },
      );
    } else {
      const dto = formToCreateDto(form);
      createMut.mutate(
        { dto },
        {
          onSuccess: () => {
            showToast('success', 'Preset created');
            closeForm();
          },
          onError: (err) => {
            logger.warn('mutations', 'create preset failed:', err.message);
            showToast('error', 'Create failed');
          },
        },
      );
    }
  };

  const handleRetire = (p: SetupPreset) => {
    retireMut.mutate(
      { presetId: p.id },
      {
        onSuccess: () => showToast('success', 'Preset retired'),
        onError: (err) => {
          logger.warn('mutations', 'retire preset failed:', err.message);
          showToast('error', 'Retire failed');
        },
      },
    );
  };

  const handleUnretire = (p: SetupPreset) => {
    unretireMut.mutate(
      { presetId: p.id },
      {
        onSuccess: () => showToast('success', 'Preset restored'),
        onError: (err) => {
          logger.warn('mutations', 'un-retire preset failed:', err.message);
          showToast('error', 'Restore failed');
        },
      },
    );
  };

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target) return;
    deleteMut.mutate(
      { presetId: target.id },
      {
        onSuccess: () => {
          showToast('success', 'Preset deleted');
          setDeleteTarget(null);
        },
        onError: (err) => {
          logger.warn('mutations', 'delete preset failed:', err.message);
          showToast('error', 'Delete failed');
        },
      },
    );
  };

  const submitLabel = editingId ? 'Save changes' : 'Create preset';
  const submitLoading = createMut.isPending || updateMut.isPending;
  const labelError = form.label.trim().length === 0 ? 'Label is required' : null;

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="analytics" />
      <MobileHeader
        title="Setup Presets"
        eyebrow="Equipment"
        onBack={safeGoBack}
        navRightAction={
          <CopyForAiButton payload={aiPayload} testID="setup-presets-copy-for-ai" />
        }
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {query.isLoading ? (
          <LoadingSpinner />
        ) : presets.length === 0 ? (
          <EmptyState
            title="No presets yet"
            message="Save your usual grip, attachment, and station combinations as reusable presets. Compatible presets surface in the active workout for one-tap apply."
            action={{ label: 'Create preset', onPress: openCreate, variant: 'primary' }}
            testID="setup-presets-empty"
          />
        ) : (
          <>
            {active.length > 0 ? (
              <>
                <MobileSectionEyebrow flush={false}>
                  {`Active · ${active.length}`}
                </MobileSectionEyebrow>
                {active.map((p) => (
                  <PresetRow
                    key={p.id}
                    preset={p}
                    onEdit={() => openEdit(p)}
                    onRetire={() => handleRetire(p)}
                    onDelete={() => setDeleteTarget(p)}
                  />
                ))}
              </>
            ) : null}

            {retired.length > 0 ? (
              <>
                <View style={{ height: 16 }} />
                <MobileSectionEyebrow flush={false}>
                  {`Retired · ${retired.length}`}
                </MobileSectionEyebrow>
                {retired.map((p) => (
                  <PresetRow
                    key={p.id}
                    preset={p}
                    onEdit={() => openEdit(p)}
                    onUnretire={() => handleUnretire(p)}
                    onDelete={() => setDeleteTarget(p)}
                  />
                ))}
                <Text
                  style={[styles.retiredHint, { color: colors.textColors.tertiary }]}
                >
                  Retired presets stay editable + deletable here. They never appear in the active-session picker.
                </Text>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <MobileActionFooter>
        <MobilePrimaryButton
          onPress={openCreate}
          testID="setup-presets-new-cta"
        >
          + New preset
        </MobilePrimaryButton>
      </MobileActionFooter>

      {/* Create / edit form */}
      <MobileSheet
        open={formOpen}
        onOpenChange={(o) => {
          if (!o) closeForm();
        }}
        title={editingId ? 'Edit preset' : 'New preset'}
        testID="setup-presets-form-sheet"
      >
        <ScrollView
          contentContainerStyle={styles.formScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <PresetForm
            value={form}
            onChange={setForm}
            labelError={labelError}
          />
        </ScrollView>
        <View style={{ height: 12 }} />
        <MobilePrimaryButton
          onPress={handleSubmit}
          loading={submitLoading}
          disabled={!!labelError}
          testID="setup-presets-form-submit"
        >
          {submitLabel}
        </MobilePrimaryButton>
      </MobileSheet>

      {/* Destructive delete confirmation */}
      <MobileDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title="Delete preset"
        destructive
        primaryLabel="Delete"
        primaryLoading={deleteMut.isPending}
        onPrimary={handleDelete}
        showSecondary
        secondaryLabel="Cancel"
      >
        <Text style={[styles.deleteCopy, { color: colors.text }]}>
          {deleteTarget
            ? `Delete "${deleteTarget.label}"? This cannot be undone. Saved workouts keep the values you already applied — only the preset is removed.`
            : ''}
        </Text>
      </MobileDialog>
    </SafeAreaView>
  );
}

// ─── PresetRow (file-local) ────────────────────────────────────────────

function PresetRow({
  preset,
  onEdit,
  onRetire,
  onUnretire,
  onDelete,
}: {
  preset: SetupPreset;
  onEdit: () => void;
  onRetire?: () => void;
  onUnretire?: () => void;
  onDelete: () => void;
}) {
  const { colors } = useAppTheme();
  const parts = previewParts(preset);
  return (
    <MobileSurface padding={12}>
      <View style={rowStyles.header}>
        <Text
          style={[rowStyles.label, { color: colors.text }]}
          numberOfLines={1}
        >
          {preset.label}
        </Text>
        {preset.isRetired ? (
          <View
            style={[
              rowStyles.badge,
              { backgroundColor: `${colors.textSecondary}20` },
            ]}
          >
            <Text style={[rowStyles.badgeText, { color: colors.textSecondary }]}>
              Retired
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[rowStyles.capability, { color: colors.textSecondary }]}>
        {capabilityLabel(preset.capabilitySlug)}
      </Text>
      {parts.length > 0 ? (
        <Text
          style={[rowStyles.preview, { color: colors.textColors.tertiary }]}
          numberOfLines={3}
        >
          {parts.join('\n')}
        </Text>
      ) : null}
      <View style={rowStyles.actions}>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit preset ${preset.label}`}
          hitSlop={6}
        >
          <Text style={[rowStyles.action, { color: colors.brand }]}>Edit</Text>
        </Pressable>
        {onRetire ? (
          <Pressable
            onPress={onRetire}
            accessibilityRole="button"
            accessibilityLabel={`Retire preset ${preset.label}`}
            hitSlop={6}
          >
            <Text style={[rowStyles.action, { color: colors.textSecondary }]}>
              Retire
            </Text>
          </Pressable>
        ) : null}
        {onUnretire ? (
          <Pressable
            onPress={onUnretire}
            accessibilityRole="button"
            accessibilityLabel={`Restore preset ${preset.label}`}
            hitSlop={6}
          >
            <Text style={[rowStyles.action, { color: colors.brand }]}>
              Restore
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Delete preset ${preset.label}`}
          hitSlop={6}
        >
          <Text style={[rowStyles.action, { color: colors.alert }]}>Delete</Text>
        </Pressable>
      </View>
    </MobileSurface>
  );
}

// ─── PresetForm (file-local) ───────────────────────────────────────────

function PresetForm({
  value,
  onChange,
  labelError,
}: {
  value: FormState;
  onChange: (next: FormState) => void;
  labelError: string | null;
}) {
  return (
    <View>
      <MobileInput
        label="Label"
        value={value.label}
        onChangeText={(t) => onChange({ ...value, label: t })}
        placeholder="e.g. Cable column — rope, low"
        error={labelError ?? undefined}
        testID="setup-presets-form-label"
        maxLength={60}
      />
      <View style={{ height: 12 }} />
      <MobileSelect
        label="Capability"
        value={value.capabilitySlug}
        onValueChange={(v) => onChange({ ...value, capabilitySlug: v })}
        options={CAPABILITY_OPTIONS}
        sheetTitle="Choose capability"
        testID="setup-presets-form-capability"
      />
      <View style={{ height: 12 }} />
      <MobileInput
        label="Grip (optional)"
        value={value.gripText}
        onChangeText={(t) => onChange({ ...value, gripText: t })}
        placeholder="e.g. neutral, shoulder-width"
        testID="setup-presets-form-grip"
      />
      <View style={{ height: 12 }} />
      <MobileInput
        label="Attachment slug (optional)"
        value={value.attachmentSlug}
        onChangeText={(t) => onChange({ ...value, attachmentSlug: t })}
        placeholder="e.g. rope, straight-bar, v-bar"
        testID="setup-presets-form-attachment"
      />
      <View style={{ height: 12 }} />
      <MobileInput
        label="Equipment notes (optional)"
        value={value.equipmentNotes}
        onChangeText={(t) => onChange({ ...value, equipmentNotes: t })}
        placeholder="e.g. Cable column #3, near the dumbbells"
        testID="setup-presets-form-notes"
        maxLength={200}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE, flex: 1 },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 80,
  },
  formScrollContent: {
    paddingBottom: 12,
  },
  retiredHint: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  deleteCopy: {
    fontSize: 13,
    lineHeight: 18,
  },
});

const rowStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  capability: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  preview: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
  },
});
