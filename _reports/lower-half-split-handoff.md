# HANDOFF: The Lower-Half Split — a female-equivalent program edition

## Context

armandotfit is a personal fitness PWA with an AM/PM hypertrophy program defined entirely in TypeScript (`shared/exercises/splits.ts`). The catalog (`shared/exercises/data.ts` + `shared/exercises/importedData.ts`) holds 699 exercises, each with a slug, modality (barbell/dumbbell/cable/machine/floor), muscles, and tags. The current split is upper-body-dominant; the owner wants a **female equivalent that emphasizes the lower half** (glutes, quads, hamstrings, calves) while keeping enough upper-body work for balance.

## The current split (the one to mirror)

### Two-a-day — 4 days × AM + PM (32 slots)

**Day 1**
- AM: Leg Press 3×8–10 · Leg Press Calf Raise 3×15–20 · Back Extension 2×10–12 · Leg Raise 2–3×15–20 [captains-chair]
- PM: Incline Barbell Press 3×6–8 · Cable Overhead Tricep Extension 2–3×10–12 [rope, neutral] · Shoulder Press 2×8–10 [machine] · Cable Lateral Raise 3×15–20 [egyptian, handle]

**Day 2**
- AM: Machine Shrug 3×8–10 · Machine Chest Fly 2×12–15 · Tibia Raise 2–3×15–20 [machine] · Machine Leg Curl 3×8–10 [seated]
- PM: Lat Pulldown 3×8–10 [underhand, lat-bar] · Machine Ab Crunch 2–3×15–20 [eccentric] · Dumbbell Curl 3×8–10 [seated, incline] · Face Pull 2–3×15–20 [rope, neutral]

**Day 3**
- AM: Bulgarian Split Squat 2×8–10 [dumbbell, per-leg] · Standing Machine Calf Raise 3×15–20 · Straight-Arm Pulldown 2–3×12–15 [rope, neutral] · Leg Raise 2–3×15–20 [captains-chair]
- PM: Machine Incline Press 3×8–10 · Machine Dip 2×8–10 · Dumbbell Overhead Press 2×8–10 · Cable Lateral Raise 3×15–20 [egyptian, handle]

**Day 4**
- AM: Dumbbell Shrug 3×8–10 · Incline Dumbbell Fly 2×12–15 · Tibia Raise 2–3×15–20 [machine] · Machine Leg Curl 3×8–10 [seated]
- PM: Cable Row 3×8–10 [seated, v-grip, neutral] · Machine Ab Crunch 2–3×15–20 [eccentric] · Cable Curl 3×10–12 [rope, neutral] · Face Pull 2–3×15–20 [rope, neutral]

### One-a-day — 4 days × 1 session (7 lifts each, 28 total)

Omits from the AM+PM union: Back Extension (D1), Machine Ab Crunch (D2), Leg Raise (D3), Dumbbell Shrug (D4).

## The ask

Create a **lower-half-dominant** edition with the same structure (4 days, two-a-day AM+PM with 4 slots per window, plus a one-a-day compression at 7 lifts/day). The split should:

1. **Shift the volume ratio** to roughly 60–65% lower body / 35–40% upper body (the current split is ~35% lower / 65% upper).
2. **Prioritize glutes and hamstrings** — hip thrusts, RDLs, glute bridges, cable kickbacks, hip abductions — while maintaining quad, calf, and core work.
3. **Keep enough upper-body pulling** (rows, pulldowns, face pulls) for postural balance, but reduce direct pressing and isolation (fewer lateral raises, no shrugs).
4. **Use only slugs that exist in the catalog.** Verify every slug against `SYSTEM_EXERCISES_BY_SLUG` before committing. The catalog includes (non-exhaustive lower-body options): `barbell-back-squat`, `front-squat`, `romanian-deadlift`, `dumbbell-romanian-deadlift`, `bulgarian-split-squat`, `barbell-split-squat`, `leg-press`, `machine-leg-curl`, `lying-leg-curl`, `leg-extension`, `glute-bridge`, `barbell-glute-bridge` (imported), `hip-thrust` (imported: `glute-kickback` etc.), `standing-machine-calf-raise`, `seated-calf-raise`, `leg-press-calf-raise`, `single-leg-calf-raise`, `tibia-raise`, `leg-raise`, `floor-leg-raise`, `machine-ab-crunch`, `cable-row`, `lat-pulldown`, `face-pull`, `straight-arm-pulldown`, plus the full imported catalog.
5. **Follow the same data shape**: each slot is `{ exercise: '<slug>', suggestedTags: string[], sets: [number, number], reps: [number, number] }`.
6. **Same tag vocabulary** (see `TAG_VOCABULARY_SEED` in splits.ts: rope, straight-bar, ez-bar, lat-bar, v-grip, handle, neutral, underhand, overhand, machine, dumbbell, seated, standing, incline, captains-chair, egyptian, eccentric, per-leg).
7. **Create TWO new exports**: `TWO_A_DAY_LOWER_SPLITS` and `ONE_A_DAY_LOWER_SPLITS` alongside the existing ones (do not replace the current split — it stays as the upper-dominant edition).
8. **Update `getSlotsForDay`** and any split-resolution helpers to accept an edition parameter, or export a parallel resolution function.

## Validation

After writing the new split:

```bash
cd armandotfit && bun run lint:structure && bunx tsc --noEmit
```

Then verify every slug resolves:

```typescript
// Quick check (paste in a script or test):
import { TWO_A_DAY_LOWER_SPLITS } from './shared/exercises/splits';
import { SYSTEM_EXERCISES_BY_SLUG } from './shared/exercises/data';
for (const day of TWO_A_DAY_LOWER_SPLITS) {
  for (const slot of [...day.am, ...day.pm]) {
    if (!SYSTEM_EXERCISES_BY_SLUG[slot.exercise]) {
      console.error(`MISSING: ${slot.exercise}`);
    }
  }
}
```

## Style guardrails

- The Rx follows hypertrophy conventions: compounds at 3×6–10, isolations at 2–3×12–20, calves/high-rep at 3×15–20.
- Suggested tags describe the REALIZATION (grip, attachment, stance), never the muscle or the machine brand — use the vocabulary above.
- Every exercise must have a plate (image) in the catalog — if a slug has no plate, note it and prefer an alternative that does.
- The one-a-day compression omits exactly one lift per day (the least-critical isolation), documented in a comment.

## Deliverable

The modified `shared/exercises/splits.ts` with both new split exports, passing the full gate (`lint:structure` + `tsc --noEmit` + all tests), committed as:

```
feat(program): the lower-half split — a female-equivalent edition (4 days, glute/ham-dominant)
```
