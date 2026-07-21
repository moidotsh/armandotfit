// components/composed/ExerciseSetupRow.tsx
//
// Phase 5 equipment-setup row for the active-session exercise card + the
// completed-session read-only view. Three concerns live here, each with
// per-exercise catalog discernment:
//
//   • Grip  — free text (the user's idiosyncratic label: "neutral", "wide",
//             "supinated", etc.). Suggestion chips come from the catalog's
//             exercise_grip_options rows when present; the user can ignore
//             them and type anything. The control renders only when the
//             catalog returns ≥1 option with a non-null grip_slug for THIS
//             exercise, OR a legacy userGrip value is already set.
//   • Attachment — FilterChip cluster sourced per-exercise from the catalog
//             rows (distinct non-null attachment_slug values). The control
//             renders only when the catalog returns ≥1 option with a non-
//             null attachment_slug for THIS exercise, OR a legacy
//             attachmentSlug value is already set. The global
//             CABLE_ATTACHMENT_OPTIONS list is NEVER used as a fallback —
//             machine/dumbbell/bodyweight exercises with no catalog rows
//             show no attachment control.
//   • Notes — free text for ad-hoc equipment context ("cable column 3",
//             "window-side machine", etc.). Always available — legitimate
//             free-text station/location context for any exercise.
//
// Scope — what this component does NOT do:
//   • It does not own the setup state — the parent's store does. Every
//     edit dispatches onSetupChange immediately.
//   • It does not load catalog grip options — the parent passes them in
//     via the `gripOptions` prop. The catalog fetch lives in the screen
//     via useExerciseSetupOptions so one batched query covers every row.
//   • It does not persist anything. Persistence is the save button's job,
//     threaded through workoutStore.toLogWorkoutDTO.
//   • It does not fall back to a global attachment vocabulary. Exercises
//     with no catalog attachment rows show no Attachment control — guessing
//     is explicitly forbidden by Phase 5 product scope.
//
// Read-only mode: renders static lines for non-null fields only.
// Populated values render across five concerns:
//   • Grip         — userGrip free text
//   • Attachment   — attachmentSlug resolved to a display label
//   • Notes        — userEquipmentNotes free text
//   • Per side     — perSide boolean flag (unilateral prescription)
//   • Slot notes   — slotNotes prescription text from the program slot
// A row with all five null renders nothing in read-only mode (silent —
// no "no setup" placeholder, no empty labels).

import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../../context';
import { FilterChip, FilterChipGroup } from '../MobilePremium';
import { CABLE_ATTACHMENT_OPTIONS } from '../../constants/equipmentCapabilities';
import type { ExerciseGripOption } from '../../shared/types';

/** Empty-value sentinel for the FilterChip "None" option. Lets the cluster
 *  represent "no attachment selected" without overloading the union. */
const ATTACHMENT_NONE = '__none__';

export interface ExerciseSetupRowProps {
  /** Active-session mode renders the editable controls. Read-only
   *  mode renders static lines for non-null fields only. */
  mode: 'active' | 'readOnly';
  /** Current grip text. Null = empty. */
  userGrip: string | null;
  /** Current attachment slug. Null = no attachment picked. */
  attachmentSlug: string | null;
  /** Current equipment-notes text. Null = empty. */
  userEquipmentNotes: string | null;
  /** Catalog grip options for THIS exercise (gripSlug + attachmentSlug
   *  suggestions from exercise_grip_options). The parent MUST scope the
   *  list to the current exercise — the component does not re-filter by
   *  exerciseId. Empty when the catalog has no entries for this exercise;
   *  in that case Grip + Attachment controls stay hidden unless a legacy
   *  value is already set. Equipment Notes still renders. */
  gripOptions?: ExerciseGripOption[];
  /** Per-side prescription flag from the program slot. Read-only context
   *  only — never editable from this component. Rendered in read-only
   *  mode when true. Null/false = not unilateral; the line stays hidden. */
  perSide?: boolean | null;
  /** Slot-notes prescription text from the program slot. Read-only
   *  context only — never editable from this component. Rendered in
   *  read-only mode when non-null. Carries forward the trainer-authored
   *  slot prescription into history. */
  slotNotes?: string | null;
  /** Patch dispatcher. Receives whichever fields the user just changed. */
  onSetupChange: (patch: {
    userGrip?: string | null;
    attachmentSlug?: string | null;
    userEquipmentNotes?: string | null;
  }) => void;
}

export function ExerciseSetupRow({
  mode,
  userGrip,
  attachmentSlug,
  userEquipmentNotes,
  gripOptions = [],
  perSide = null,
  slotNotes = null,
  onSetupChange,
}: ExerciseSetupRowProps) {
  const { colors } = useAppTheme();

  // Per-exercise catalog discernment. Grip and Attachment controls render
  // only when the catalog returns at least one non-null value for THIS
  // exercise, OR a legacy persisted value is already set. Machine,
  // dumbbell, bodyweight, and other exercises with no matching catalog
  // rows show neither control — guessing is forbidden by product scope.
  const hasCatalogGrip = gripOptions.some((o) => o.gripSlug);
  const hasCatalogAttachment = gripOptions.some((o) => o.attachmentSlug);
  const gripVisible = userGrip !== null || hasCatalogGrip;
  const attachmentVisible = attachmentSlug !== null || hasCatalogAttachment;

  if (mode === 'readOnly') {
    // Read-only: render lines only when at least one field is non-null.
    // No "no setup" placeholder — silent when all five are null/false.
    // perSide uses explicit `=== true` so `null` and `false` both count
    // as "no unilateral prescription" (silent).
    if (
      !userGrip &&
      !attachmentSlug &&
      !userEquipmentNotes &&
      perSide !== true &&
      !slotNotes
    ) {
      return null;
    }
    const attachmentLabel = attachmentSlug ? attachmentLabelFor(attachmentSlug) : null;
    return (
      <View style={styles.readOnlyWrap} accessibilityRole="summary">
        {userGrip ? (
          <Text style={[styles.readOnlyLine, { color: colors.textSecondary }]}>
            <Text style={[styles.readOnlyLabel, { color: colors.textColors.tertiary }]}>
              Grip{'  '}
            </Text>
            {userGrip}
          </Text>
        ) : null}
        {attachmentLabel ? (
          <Text style={[styles.readOnlyLine, { color: colors.textSecondary }]}>
            <Text style={[styles.readOnlyLabel, { color: colors.textColors.tertiary }]}>
              Attachment{'  '}
            </Text>
            {attachmentLabel}
          </Text>
        ) : null}
        {userEquipmentNotes ? (
          <Text style={[styles.readOnlyLine, { color: colors.textSecondary }]}>
            <Text style={[styles.readOnlyLabel, { color: colors.textColors.tertiary }]}>
              Notes{'  '}
            </Text>
            {userEquipmentNotes}
          </Text>
        ) : null}
        {perSide === true ? (
          <Text style={[styles.readOnlyLine, { color: colors.textSecondary }]}>
            <Text style={[styles.readOnlyLabel, { color: colors.textColors.tertiary }]}>
              Per side{'  '}
            </Text>
            unilateral
          </Text>
        ) : null}
        {slotNotes ? (
          <Text style={[styles.readOnlyLine, { color: colors.textSecondary }]}>
            <Text style={[styles.readOnlyLabel, { color: colors.textColors.tertiary }]}>
              Slot notes{'  '}
            </Text>
            {slotNotes}
          </Text>
        ) : null}
      </View>
    );
  }

  // Active mode: editable controls, but only when catalog-relevant.
  const inputBorderColor = colors.glass.emptyInputBorder;
  const inputBg = colors.glass.inputBackground;
  const attachmentValue = attachmentSlug ?? ATTACHMENT_NONE;

  // Distinct catalog grip suggestions (when the catalog carries them).
  // Keep order stable; suggestions are display-only chips that fill the
  // grip input on tap. The catalog's exercise_grip_options rows always
  // carry a non-null grip_slug (schema NOT NULL), so this picks up every
  // row for this exercise.
  const gripSuggestions = Array.from(
    new Set(gripOptions.map((o) => o.gripSlug).filter((s): s is string => Boolean(s))),
  ).slice(0, 4);

  // Distinct catalog attachment slugs (non-null only). Sourced per-
  // exercise — never from the global CABLE_ATTACHMENT_OPTIONS union.
  // If a legacy attachmentSlug exists and isn't in the catalog list
  // (e.g. user-chosen value from a prior release, or a slug from a
  // different vocabulary), we still render it as its own chip so the
  // user can see and clear the persisted selection.
  const catalogAttachments = Array.from(
    new Set(
      gripOptions.map((o) => o.attachmentSlug).filter((s): s is string => Boolean(s)),
    ),
  );
  const attachmentChips =
    attachmentSlug && !catalogAttachments.includes(attachmentSlug)
      ? [...catalogAttachments, attachmentSlug]
      : catalogAttachments;

  return (
    <View style={styles.activeWrap}>
      {gripVisible ? (
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: colors.textColors.tertiary }]}>
            Grip
          </Text>
          <TextInput
            style={[
              styles.textInput,
              { borderColor: inputBorderColor, backgroundColor: inputBg, color: colors.text },
            ]}
            value={userGrip ?? ''}
            onChangeText={(t) => onSetupChange({ userGrip: t.trim() === '' ? null : t })}
            placeholder="e.g. neutral, supinated"
            placeholderTextColor={colors.textColors.tertiary}
            returnKeyType="done"
            maxLength={60}
            accessibilityLabel="Exercise grip"
          />
          {gripSuggestions.length > 0 ? (
            <FilterChipGroup>
              {gripSuggestions.map((slug) => {
                const selected = (userGrip ?? '').toLowerCase() === slug.toLowerCase();
                return (
                  <FilterChip
                    key={slug}
                    label={slug}
                    selected={selected}
                    accessibilityRole="radio"
                    onPress={() => onSetupChange({ userGrip: selected ? null : slug })}
                  />
                );
              })}
            </FilterChipGroup>
          ) : null}
        </View>
      ) : null}

      {attachmentVisible ? (
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: colors.textColors.tertiary }]}>
            Attachment
          </Text>
          <FilterChipGroup>
            <FilterChip
              label="None"
              selected={attachmentValue === ATTACHMENT_NONE}
              accessibilityRole="radio"
              accessibilityLabel="No attachment"
              onPress={() => onSetupChange({ attachmentSlug: null })}
            />
            {attachmentChips.map((slug) => (
              <FilterChip
                key={slug}
                label={attachmentLabelFor(slug)}
                selected={attachmentValue === slug}
                accessibilityRole="radio"
                accessibilityLabel={`${attachmentLabelFor(slug)} attachment`}
                onPress={() =>
                  onSetupChange({
                    attachmentSlug: selectedToSlug(slug, attachmentSlug),
                  })
                }
              />
            ))}
          </FilterChipGroup>
        </View>
      ) : null}

      {/* Equipment notes — always available. Legitimate free-text
          station/location context for any exercise ("window-side
          machine", "cable column 3"). Optional + visually secondary. */}
      <View style={styles.fieldBlock}>
        <Text style={[styles.fieldLabel, { color: colors.textColors.tertiary }]}>
          Equipment notes
        </Text>
        <TextInput
          style={[
            styles.textInput,
            styles.notesInput,
            { borderColor: inputBorderColor, backgroundColor: inputBg, color: colors.text },
          ]}
          value={userEquipmentNotes ?? ''}
          onChangeText={(t) =>
            onSetupChange({ userEquipmentNotes: t.trim() === '' ? null : t })
          }
          placeholder="e.g. cable column 3"
          placeholderTextColor={colors.textColors.tertiary}
          returnKeyType="done"
          maxLength={140}
          accessibilityLabel="Equipment notes"
          multiline
        />
      </View>
    </View>
  );
}

/**
 * Resolve a slug to a display label. Tries the canonical
 * CABLE_ATTACHMENT_OPTIONS map first (covers the TS CableAttachmentSlug
 * union values: rope / straight-bar / v-bar / lat-bar / handle). Falls
 * back to a kebab→Sentence-Case prettifier for catalog values that don't
 * match the union (e.g. the cable-* prefixed slugs the seed migration
 * uses). Sentence case (only first letter of the whole label) reads
 * more natural than Title-Case for multi-word slugs: 'cable-rope' →
 * 'Cable rope' (not 'Cable Rope').
 */
function attachmentLabelFor(slug: string): string {
  const known = CABLE_ATTACHMENT_OPTIONS.find((o) => o.id === slug)?.label;
  if (known) return known;
  const humanized = slug.replace(/-/g, ' ');
  if (humanized.length === 0) return humanized;
  return humanized[0].toUpperCase() + humanized.slice(1);
}

/**
 * Tap handler for an attachment chip. Tapping the already-selected chip
 * clears the selection (toggles back to null); tapping a different chip
 * selects it. Mirrors the grip-suggestion behavior.
 */
function selectedToSlug(
  chipSlug: string,
  current: string | null,
): string | null {
  return current === chipSlug ? null : chipSlug;
}

const styles = StyleSheet.create({
  activeWrap: {
    gap: 12,
    paddingVertical: 8,
  },
  readOnlyWrap: {
    gap: 4,
    paddingVertical: 6,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  notesInput: {
    minHeight: 44,
  },
  readOnlyLine: {
    fontSize: 13,
    lineHeight: 18,
  },
  readOnlyLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

export default ExerciseSetupRow;
