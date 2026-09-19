# armandotfit — Canonical Doc Ownership

> Settles "which doc owns claim X" disputes. If two docs appear to own the same claim, one is canonical and the other cross-links. This file is the authority.

## Claim-type → canonical-owner map

| Claim type | Canonical owner | Notes |
|---|---|---|
| Repo operating context (invariants, pre-commit checks, consumer guide, doc maintenance contract) | `CLAUDE.md` | Auto-loads in Claude Code sessions at the armandotfit root. The "How to consume" section is the load-bearing consumer guide. |
| Architecture constitution (47 patterns, S/C/D/SE/T/R codes) | `ARCHITECTURE.md` | Every architectural decision is grounded here. This file is the cheatsheet; `scripts/audit-*.ts` are canonical for enforcement. |
| Project orientation (what armandotfit is, quickstart) | `README.md` | Navigation surface — points at canonical content, doesn't redefine it. |
| Claim-type → owner-doc map (this meta-layer) | this file (`docs/OWNERSHIP.md`) | — |
| MobilePremium design system (four pillars, primitive inventory, atmosphere palettes, 490px test, gating policy) | `docs/architecture/mobile-premium-design-system.md` | The visual source of truth is `app/dev/premium.tsx`; the doc is the written reference. |
| The active design thesis (THE INTERVAL: the live figure owns the counter — the two-state logger, ink as state, the ruled row, the harmonic ramp, the still system + the re-weight, one red ink strictly kept) | `docs/architecture/interval-thesis.md` | Supersedes `scoreboard-thesis.md`, `gauge-thesis.md`, `board-thesis.md`, `quiet-page-thesis.md`, `signal-thesis.md` (all retired, kept as records). |
| PWA installability (manifest, SW, runtime injection, icons) | `docs/architecture/pwa-installability.md` | The runtime injection block in `app/_layout.tsx` is load-bearing — keep it in sync with the doc. |
| Logging data model (five logging tables + music_picks) | `supabase/migrations/20261001000000_greenslate_rebuild.sql` | The migration file is the schema of record. |
| Exercise identity + logging governance (identity test, tags, promotion rule) | `docs/architecture/exercise-logging-governance.md` | Source of truth for the identity-vs-realization boundary and when tags earn structure. CLAUDE.md invariants #4–#8 cross-link. |
| The AM/PM program (slots, Rx, suggested tags) | `shared/exercises/splits.ts` | The program is TypeScript data, never a doc or a table. |
| Theme tokens (canonical hex values) | `constants/theme.ts` | Source of truth. Docs that mention a color link here; they don't restate the hex. |
| Animation durations | `constants/animation.ts` | Source of truth. `ARCHITECTURE.md` §S3 cross-links. |
| Responsive breakpoints | `constants/breakpoints.ts` | Source of truth. `ARCHITECTURE.md` §C3 and §C9 cross-link. |
| Audit scripts (canonical regex / exempt lists / escape hatches) | `scripts/audit-*.ts` | If `CLAUDE.md`'s cheatsheet and the scripts disagree, the scripts win. |
| Package manifest (dependencies, scripts) | `package.json` | Source of truth. `CLAUDE.md` and `README.md` cross-link specific scripts (e.g. `lint:structure`). |

## Rules

1. **One owner per claim.** If two docs appear to own the same claim, one is canonical and the other cross-links. The table above settles which is which.
2. **Navigation layers don't restate content.** `README.md`, `CLAUDE.md` intro paragraphs are navigation surfaces — they point at canonical content; they don't paraphrase it.
3. **Source code is canonical for what it owns.** `constants/theme.ts` owns the hex values; `scripts/audit-*.ts` own the audit regexes; `package.json` owns the dependency list. Docs describe and link; they don't duplicate.
4. **If a change doesn't fit the contract, update the contract first.** Add a row to this table (or to a more specific doc's maintenance contract), then make the change.
