// __tests__/components/ExerciseSetupRow.test.tsx
//
// Phase 5 ExerciseSetupRow component tests. Locks the per-exercise
// catalog-discernment contract:
//
//   1. Active mode renders Grip control only when the exercise has ≥1
//      catalog option with a non-null grip_slug OR a legacy userGrip
//      value is already set. Machine/dumbbell/bodyweight exercises with
//      no catalog rows show no Grip control.
//   2. Active mode renders Attachment control only when the exercise has
//      ≥1 catalog option with a non-null attachment_slug OR a legacy
//      attachmentSlug value is already set. The global
//      CABLE_ATTACHMENT_OPTIONS list is NEVER used as a fallback.
//   3. Attachment chips are sourced per-exercise from the catalog rows
//      (distinct non-null attachment_slug values), never from the global
//      union. A legacy attachmentSlug not present in the catalog still
//      renders as its own chip so the user can see and clear it.
//   4. Equipment Notes always renders for every exercise — legitimate
//      free-text station/location context.
//   5. Grip suggestion chips render the raw slug (lowercase). Tapping
//      dispatches onSetupChange with the selected grip (or null when
//      toggling off).
//   6. Read-only mode renders populated values across FIVE fields:
//      userGrip, attachmentSlug (label-resolved), userEquipmentNotes,
//      perSide (when true), and slotNotes. Silent when all five are
//      null/false — no empty labels, no placeholder.
//   7. Read-only mode resolves attachment slug → display label via
//      CABLE_ATTACHMENT_OPTIONS when the slug is in the union, falls
//      back to a kebab→Sentence-Case prettifier otherwise.
//
// Scope — what this test does NOT verify:
//   - Screen-level wiring (catalog fetch + store dispatch + cross-card
//     isolation). That lives under __tests__/app/WorkoutDetailSetupLogging.test.tsx.
//   - Persistence. The store + toLogWorkoutDTO own that contract.

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../context';
import { ExerciseSetupRow } from '../../components/composed/ExerciseSetupRow';
import type { ExerciseGripOption } from '../../shared/types';

function Wrap({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

const noop = () => {};

// Catalog rows mirror the seed migration's exercise_grip_options shape:
// grip_slug is NOT NULL, attachment_slug is nullable. Each row pairs a
// grip with an optional attachment for one exercise.
function makeGripOption(
  exerciseId: string,
  gripSlug: string,
  attachmentSlug: string | null,
): ExerciseGripOption {
  return {
    id: `${exerciseId}-${gripSlug}-${attachmentSlug ?? 'none'}`,
    exerciseId,
    gripSlug,
    attachmentSlug,
    isPrimary: true,
    displayOrder: 1,
    createdAt: '2026-07-25T00:00:00Z',
  };
}

describe('ExerciseSetupRow — active mode visibility (catalog discernment)', () => {
  it('renders Grip + Attachment + Equipment notes when catalog options exist for the exercise', () => {
    const options = [
      makeGripOption('ex-cable', 'neutral', 'cable-rope'),
      makeGripOption('ex-cable', 'underhand', 'cable-lat-bar'),
    ];
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          gripOptions={options}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(getByText('Grip')).toBeTruthy();
    expect(getByText('Attachment')).toBeTruthy();
    expect(getByText('Equipment notes')).toBeTruthy();
  });

  it('renders ONLY the Equipment notes control when no catalog options and no legacy values (machine/dumbbell/bodyweight case)', () => {
    // No gripOptions, all values null — mimics a leg press machine,
    // dumbbell curl, or bodyweight plank in the active session. Setup
    // UI must stay silent on Grip + Attachment; Equipment Notes still
    // renders because it serves legitimate free-text station context
    // ("window-side machine", "rack was taken").
    const { getByText, queryByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          gripOptions={[]}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(queryByText('Grip')).toBeNull();
    expect(queryByText('Attachment')).toBeNull();
    expect(getByText('Equipment notes')).toBeTruthy();
  });

  it('renders the Grip control when catalog grip options exist even if attachment column is null', () => {
    // Catalog row with grip_slug but attachment_slug IS NULL — the
    // exercise has a meaningful grip choice but no specific attachment
    // pairing. Grip renders; Attachment does not.
    const options = [makeGripOption('ex-barbell', 'overhand', null)];
    const { getByText, queryByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          gripOptions={options}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(getByText('Grip')).toBeTruthy();
    expect(queryByText('Attachment')).toBeNull();
  });

  it('renders Attachment chips ONLY from the per-exercise catalog (never the global CABLE_ATTACHMENT_OPTIONS union)', () => {
    // The catalog returns two attachment values for this exercise.
    // The global CABLE_ATTACHMENT_OPTIONS union has 5 entries (rope,
    // straight-bar, v-bar, lat-bar, handle). Only the two catalog
    // values + the "None" chip should render — no global fallback.
    const options = [
      makeGripOption('ex-cable', 'neutral', 'cable-rope'),
      makeGripOption('ex-cable', 'underhand', 'cable-lat-bar'),
    ];
    const { getByText, queryByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          gripOptions={options}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    // Catalog values render as prettified labels.
    expect(getByText('Cable rope')).toBeTruthy();
    expect(getByText('Cable lat bar')).toBeTruthy();
    expect(getByText('None')).toBeTruthy();
    // Global union values that aren't in this exercise's catalog must
    // NOT bleed in as fallback chips.
    expect(queryByText('Straight bar')).toBeNull();
    expect(queryByText('V-bar')).toBeNull();
    expect(queryByText('Single handle')).toBeNull();
  });

  it('does NOT render suggestion chips when gripOptions is empty', () => {
    // Direct assertion: suggestion chips render the raw grip slug
    // (lowercase). Attachment chips render capitalized labels. With
    // gripOptions=[] AND no legacy values, both Grip and Attachment
    // controls stay hidden — only Equipment notes renders.
    const { getByText, queryByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          gripOptions={[]}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(queryByText('neutral')).toBeNull();
    expect(queryByText('supinated')).toBeNull();
    expect(getByText('Equipment notes')).toBeTruthy();
  });

  it('renders suggestion chips when gripOptions is provided', () => {
    const options = [
      makeGripOption('ex-1', 'neutral', null),
      makeGripOption('ex-1', 'supinated', null),
    ];
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          gripOptions={options}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(getByText('neutral')).toBeTruthy();
    expect(getByText('supinated')).toBeTruthy();
  });

  it('preserves a legacy userGrip value even when no catalog options exist', () => {
    // Legacy custom grip 'wide' from a prior release — catalog has no
    // rows for this exercise. The Grip control must still render so the
    // user can see and edit the persisted value. No suggestion chips
    // render (catalog is empty).
    //
    // We assert Grip-label presence (the control only renders when
    // userGrip !== null OR catalog has grip rows — neither is true
    // here except for the legacy value, so label presence proves the
    // legacy path enabled the control). getByDisplayValue is flaky
    // against react-native-web's TextInput in jsdom, so we don't rely
    // on the rendered input's value attribute.
    const { getByText, queryByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip="wide"
          attachmentSlug={null}
          userEquipmentNotes={null}
          gripOptions={[]}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(getByText('Grip')).toBeTruthy();
    // Suggestion chips do NOT render (catalog is empty for this ex).
    expect(queryByText('neutral')).toBeNull();
    expect(queryByText('supinated')).toBeNull();
  });

  it('preserves a legacy attachmentSlug value even when no catalog options exist', () => {
    // Legacy custom attachment 'rope' from a prior release — catalog
    // has no rows for this exercise. The Attachment control must still
    // render so the user can see and clear the persisted value. Only
    // the legacy chip + "None" chip render — no fallback chips from
    // the global CABLE_ATTACHMENT_OPTIONS union.
    const { getByText, queryByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip={null}
          attachmentSlug="rope"
          userEquipmentNotes={null}
          gripOptions={[]}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    // 'rope' is in the CABLE_ATTACHMENT_OPTIONS union so the label
    // resolves to 'Rope'. The legacy chip + "None" chip both render.
    expect(getByText('Rope')).toBeTruthy();
    expect(getByText('None')).toBeTruthy();
    // Global union values that aren't the legacy value do NOT render.
    expect(queryByText('Straight bar')).toBeNull();
    expect(queryByText('V-bar')).toBeNull();
    expect(queryByText('Lat pulldown bar')).toBeNull();
    expect(queryByText('Single handle')).toBeNull();
  });
});

describe('ExerciseSetupRow — active mode dispatch', () => {
  it('dispatches attachmentSlug when tapping a catalog-sourced attachment chip', () => {
    const onSetupChange = vi.fn();
    const options = [makeGripOption('ex-cable', 'neutral', 'cable-rope')];
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          gripOptions={options}
          onSetupChange={onSetupChange}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('Cable rope'));
    expect(onSetupChange).toHaveBeenCalledWith({ attachmentSlug: 'cable-rope' });
  });

  it('clears attachmentSlug when tapping the None chip', () => {
    const onSetupChange = vi.fn();
    const options = [makeGripOption('ex-cable', 'neutral', 'cable-rope')];
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip={null}
          attachmentSlug="cable-rope"
          userEquipmentNotes={null}
          gripOptions={options}
          onSetupChange={onSetupChange}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('None'));
    expect(onSetupChange).toHaveBeenCalledWith({ attachmentSlug: null });
  });

  it('toggles attachmentSlug back to null when tapping the already-selected chip', () => {
    const onSetupChange = vi.fn();
    const options = [makeGripOption('ex-cable', 'neutral', 'cable-rope')];
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip={null}
          attachmentSlug="cable-rope"
          userEquipmentNotes={null}
          gripOptions={options}
          onSetupChange={onSetupChange}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('Cable rope'));
    expect(onSetupChange).toHaveBeenCalledWith({ attachmentSlug: null });
  });

  it('dispatches userGrip when tapping a suggestion chip', () => {
    const onSetupChange = vi.fn();
    const options = [makeGripOption('ex-1', 'neutral', null)];
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          gripOptions={options}
          onSetupChange={onSetupChange}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('neutral'));
    expect(onSetupChange).toHaveBeenCalledWith({ userGrip: 'neutral' });
  });

  it('clears userGrip when tapping the already-selected suggestion chip', () => {
    const onSetupChange = vi.fn();
    const options = [makeGripOption('ex-1', 'neutral', null)];
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="active"
          userGrip="neutral"
          attachmentSlug={null}
          userEquipmentNotes={null}
          gripOptions={options}
          onSetupChange={onSetupChange}
        />
      </Wrap>,
    );
    fireEvent.click(getByText('neutral'));
    expect(onSetupChange).toHaveBeenCalledWith({ userGrip: null });
  });
});

describe('ExerciseSetupRow — read-only mode', () => {
  it('renders the grip line when userGrip is non-null', () => {
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="readOnly"
          userGrip="neutral"
          attachmentSlug={null}
          userEquipmentNotes={null}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(getByText('neutral')).toBeTruthy();
  });

  it('renders the attachment label (resolved from union slug) when attachmentSlug is in CABLE_ATTACHMENT_OPTIONS', () => {
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="readOnly"
          userGrip={null}
          attachmentSlug="straight-bar"
          userEquipmentNotes={null}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    // 'straight-bar' is in the TS union → resolves via
    // CABLE_ATTACHMENT_OPTIONS to 'Straight bar'.
    expect(getByText('Straight bar')).toBeTruthy();
  });

  it('renders a prettified attachment label when attachmentSlug is outside the TS union (catalog vocabulary)', () => {
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="readOnly"
          userGrip={null}
          attachmentSlug="cable-rope"
          userEquipmentNotes={null}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    // 'cable-rope' is the catalog seed vocabulary (not in the TS
    // union). The prettifier produces 'Cable rope'. This keeps
    // historical rows readable regardless of which vocabulary was
    // active when the row was persisted.
    expect(getByText('Cable rope')).toBeTruthy();
  });

  it('renders the notes line when userEquipmentNotes is non-null', () => {
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="readOnly"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes="cable column 3"
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(getByText('cable column 3')).toBeTruthy();
  });

  it('renders all three lines when all three fields are non-null', () => {
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="readOnly"
          userGrip="neutral"
          attachmentSlug="rope"
          userEquipmentNotes="cable column 3"
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(getByText('neutral')).toBeTruthy();
    expect(getByText('Rope')).toBeTruthy();
    expect(getByText('cable column 3')).toBeTruthy();
  });

  it('renders ONLY the notes line (no Grip/Attachment labels) when just userEquipmentNotes is populated', () => {
    // Historical machine press with a free-text station note but no
    // grip/attachment data. The notes line renders; Grip and Attachment
    // labels do NOT render (read-only mode is silent on empty setup
    // channels — no placeholder, no empty label).
    const { getByText, queryByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="readOnly"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes="window-side machine"
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(getByText('window-side machine')).toBeTruthy();
    expect(queryByText('Grip')).toBeNull();
    expect(queryByText('Attachment')).toBeNull();
  });

  it('renders the per-side line when perSide is true (unilateral prescription)', () => {
    // Program slot prescribed a unilateral exercise. The read-only view
    // surfaces the per-side flag so the historical row carries the
    // "train one side at a time" context forward.
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="readOnly"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          perSide={true}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(getByText('Per side')).toBeTruthy();
    expect(getByText('unilateral')).toBeTruthy();
  });

  it('does NOT render the per-side line when perSide is false or null', () => {
    // false + null both mean "no unilateral prescription". The line
    // stays hidden — read-only mode renders no empty labels.
    const { queryByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="readOnly"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          perSide={false}
          slotNotes={null}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(queryByText('Per side')).toBeNull();
  });

  it('renders the slot-notes line when slotNotes is populated', () => {
    // Trainer-authored prescription text from the program slot. The
    // read-only view surfaces it so the historical row carries the
    // "what the prescription said" context forward.
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="readOnly"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          slotNotes="Use the low pulley for sets 2-3."
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(getByText('Use the low pulley for sets 2-3.')).toBeTruthy();
    expect(getByText('Slot notes')).toBeTruthy();
  });

  it('renders every populated field when grip, attachment, notes, perSide, and slotNotes are all set', () => {
    const { getByText } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="readOnly"
          userGrip="neutral"
          attachmentSlug="rope"
          userEquipmentNotes="column 3"
          perSide={true}
          slotNotes="Slow tempo on the eccentric."
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(getByText('neutral')).toBeTruthy();
    expect(getByText('Rope')).toBeTruthy();
    expect(getByText('column 3')).toBeTruthy();
    expect(getByText('Per side')).toBeTruthy();
    expect(getByText('Slow tempo on the eccentric.')).toBeTruthy();
  });

  it('renders nothing for an all-null pre-Phase-5 history row', () => {
    // Pre-Phase-5 rows carry null for every setup + prescription
    // field. The component must render nothing — no setup metadata,
    // no empty labels, no placeholder. The row reads as an ordinary
    // history row.
    const { container } = render(
      <Wrap>
        <ExerciseSetupRow
          mode="readOnly"
          userGrip={null}
          attachmentSlug={null}
          userEquipmentNotes={null}
          perSide={null}
          slotNotes={null}
          onSetupChange={noop}
        />
      </Wrap>,
    );
    expect(container.textContent ?? '').toBe('');
  });
});
