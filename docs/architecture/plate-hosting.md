# Plate hosting — the temporary static project, and the plan to return to Blob

> **Status: TEMPORARY WORKAROUND ACTIVE.** The plates serve from a
> static Vercel project because the Blob store is paused. This doc is
> the reminder and the runbook — check it when the operations window
> clears (**on/after ~2026-10-24**, 30 days from the 2026-09-24 pause).

## What happened (the why, so nobody re-litigates blind)

The plate library (1,354 JPEGs, 61 MB) was moved to a Vercel Blob
store on 2026-09-24 to keep it out of every deployment's output
(Vercel meters Deployment Storage as retained deployments × output
size — 61 MB per deploy had the 10 GB Hobby tier at 75%).

The one-time bulk upload tripped the **Blob Advanced Operations cap**
(2,000/month on Hobby): the CLI's multipart default bills ~3 advanced
ops per file, so 1,354 files ≈ 4.1K ops. Enforcement was a **total
store-access pause for 30 days** — every read returned **403**, the
spec-sheet and HOW-TO plates died, and the self-service unblock form
does not apply (hard pause, not soft).

The same day, the plates moved to their own **static Vercel project**
(`armandotfit-plates`, one deployment, immutable cache headers) — a
deployment has no operations meter, so the pause cannot touch it.

## Current wiring (the temporary state)

- `EXPO_PUBLIC_PLATE_BASE` (Production) =
  `https://armandotfit-plates.vercel.app` — the PRODUCTION alias,
  never a deployment-specific URL (those sit behind SSO protection).
- Redeploy the plates project only when plates regenerate:
  `bun run plates:deploy-static`.
- The seam is unchanged: `shared/exercises/plateUrl.ts` (unset env →
  local `public/exercise-plates` for dev).
- The Blob store still exists, paused, unreferenced.

## The runbook — return to Blob when the window clears

1. **Confirm the window drained**: dashboard → Usage → Blob →
   Advanced Operations back under the 2K included line (~2026-10-24).
   Don't start early — a blocked re-upload just burns more ops.
2. **Re-upload with the fixed uploader**: `bun run plates:upload` —
   it now passes `--multipart false` (ONE advanced op per file,
   ~1.4K total, under the cap) and `--allow-overwrite` (existing
   blobs replace cleanly).
3. **Verify before flipping**: curl a handful of REAL catalog paths
   against the store base — remember the filenames are the IMPORTED
   files via the alias table (`machine-incline-press` serves
   `leverage-incline-chest-press.jpg`; sampling by exercise slug
   404s and means nothing). Expect 200 / image/jpeg.
4. **Flip the env**: `EXPO_PUBLIC_PLATE_BASE` (Production) → the
   store base (`https://<store-hash>.public.blob.vercel-storage.com`),
   then redeploy the app and grep the new bundle for the store host.
5. **Retire (optional)**: the static plates project can be deleted,
   or kept as a known-good fallback — if it's kept, note here which
   base is live.

## The honest tradeoff (either home is defensible)

- **Blob (intended)**: sanctioned upload-once object storage; its
  own 1 GB allowance, reads are Simple Operations (10K/month; CDN
  cache hits free) — a personal app never approaches it.
- **Static project (current)**: zero meters at all; costs one
  project + 61 MB of deployment storage per deploy of IT (rare).
  Slightly outside the sanctioned pattern for asset hosting.

If the re-upload ever trips anything again, the static project is
the proven fallback — flip the env back and move on.
