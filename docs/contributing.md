# Contributing to vellum

> How to evolve vellum itself. The recurring question for a starter repo is: "when something needs to change, does the fix land in vellum or in the consumer?" This doc answers that.

## Vellum is a starter, not a framework

There's no `npm install vellum`. Consumers clone, own the copy, modify freely. This means:

- **There's no "upgrade path" from vellum to a new version.** Once a consumer forks, their copy is its own thing. They cherry-pick fixes from vellum if they want to, manually.
- **Vellum's job is to be a good starting point.** Bug fixes and improvements that benefit *future* consumers belong here. Domain-specific extensions belong in the consumer.

## When to fix in vellum vs. in a consumer

| Change | Lands in vellum? | Why |
|---|---|---|
| Bug in a MobilePremium primitive | **Yes** | Every current and future consumer inherits the bug. |
| Audit script false-positive | **Yes** | The next consumer hits the same noise. |
| Audit script missed a real violation | **Yes** | The audit's whole purpose is to catch this. |
| Token retune (color, spacing, motion timing) | **Yes, with care** | Future consumers get the better-tuned version. Current consumers may or may not cherry-pick — the change is theirs to make. |
| New MobilePremium primitive (e.g. `MobileDatePicker`) | **Yes** | Future consumers benefit. Add it to the showcase (`app/dev/premium.tsx`) in the same change — the showcase IS the visual source of truth. |
| New cross-cutting store (e.g. `themeStore`) | **Yes** | Most consumers need it. |
| New audit script for a pattern every consumer benefits from | **Yes** | Add it to `.husky/pre-commit` and `package.json` → `lint:structure` in the same change. |
| New repository interface (e.g. `ISoftDeletableRepository`) | **Yes** | Pattern-level; consumers extend. |
| Domain-specific repository (e.g. `WorkoutRepository`) | **No** | That's consumer code. Vellum ships abstractions, not domain implementations. |
| Domain-specific route (e.g. `/workout-detail`) | **No** | Consumer. |
| Brand-specific token override | **No** | Consumer. Vellum ships the default; the consumer overrides. |
| PIN-auth primitives | **No** | Consumer-specific extension. Vellum defaults to email/password; the consumer guide documents the re-add path. |
| Native-target support (iOS/Android build config) | **No** | Vellum is PWA-only by invariant #2. A consumer wanting native re-adds it; that's a fork decision, not a shell change. |
| Dark mode | **No** | Vellum is light-mode-only by invariant #3. A consumer wanting dark mode does the retune work themselves. |

## The decision rule

> **Does every future consumer benefit from this change, with no consumer-specific assumption baked in?**

- **Yes** → lands in vellum.
- **No, or "only my consumer needs it"** → consumer-side change.

When unsure, default to consumer-side. Promoting a consumer-specific change into vellum later is cheap; rolling back a vellum-wide change that turned out to be domain-specific is expensive (every consumer has to react).

## Evolving the audit gate

The 10-audit gate is the load-bearing enforcement of the constitution. Evolve it deliberately:

1. **New audit script.** Drops into `scripts/audit-*.ts`. Wire into `.husky/pre-commit` (in pre-commit order — read the existing order to find the right slot) AND `package.json` → `lint:structure`. Update `CLAUDE.md` → "The 10 audits" table in the same change. If the audit corresponds to a new S/C/D/SE/T/R code, also update `ARCHITECTURE.md` with the definition.

2. **Tightening an existing audit (regex tweak, removed allowlist entry).** Run the audit on the current vellum tree first. If vellum passes, ship. If vellum doesn't pass, fix the violations in the same change.

3. **Loosening an audit (new allowlist entry, broader exemption).** Justify in the script's docstring or a comment next to the allowlist entry. Loosening is the dangerous direction — every future consumer inherits the looser rule. The bar is "the rule as written produces false positives that aren't fixable at the violation site."

4. **Removing an audit.** Almost never. If you're considering this, the pattern it enforced is being sunset — that's an `ARCHITECTURE.md` change too.

## Evolving the constitution

`ARCHITECTURE.md` holds the 47-pattern constitution. Add a pattern when:

- A recurring code-review nit can be mechanically checked → also add a `scripts/audit-*.ts`.
- A recurring class of bug has a statically-checkable shape → also add an audit.
- An architectural decision needs to be recorded so consumers don't accidentally invert it → no audit (the decision is the point, not a mechanical check).

Drop a pattern when:

- The violation no longer occurs in practice AND the audit produces false positives → remove the audit script, leave the pattern in `ARCHITECTURE.md` with a "deprecated" note explaining why.

## Evolving the design system

The MobilePremium kit is documented in `docs/architecture/mobile-premium-design-system.md`. The showcase at `app/dev/premium.tsx` (the `/dev/premium` route) IS the visual source of truth — a primitive not in the showcase doesn't exist as far as a consumer can tell.

- **Add a primitive** → also add a section to the showcase AND a row in the design-system doc's inventory table. Same change.
- **Retune a primitive** → visit `/dev/premium` to see the change in context. Update the doc's treatment section if the retune alters a documented property (e.g. hairline opacity goes from 8% to 6%).
- **Retune an atmosphere palette** → all 7 palettes render side-by-side in the showcase; use it to confirm the family still reads as distinct.

## Evolving the PWA layer

`docs/architecture/pwa-installability.md` is the canonical reference. The load-bearing invariant: Expo Web static export strips every PWA-related tag from `<head>` except `<link rel="icon">`. The runtime injection block in `app/_layout.tsx` restores them. Don't remove that block. If a future Expo SDK version stops stripping those tags, the injection block becomes a no-op (the existence guards make it safe to leave in place).

## Workspace integration

Vellum lives at `qep/vellum/`. It's a sibling of `qep-tracker/`, `qepler/`, `qep-tracker-insights/`, `landing/`, `shop/`. Workspace docs that mention vellum:

- `qep/CLAUDE.md` — per-repo cheatsheet row + per-repo CLAUDE.md pointers section. Both must stay in sync.
- `qep/README.md` — repo map.

When vellum changes its canonical doc set (new doc, deprecated doc, renamed doc), update both workspace docs in the same change. The workspace `CLAUDE.md` maintenance contract governs.

## What NOT to do

- **Don't add domain code to vellum.** No `Workout` types, no `WorkoutRepository`, no fitness-specific routes. The moment vellum has domain code, every consumer has to delete it.
- **Don't add a second color slot.** The `brand` slot is the single override point. A second accent slot fragments the surface — every consumer wins from one canonical override.
- **Don't add an abstraction without a second consumer in mind.** "We might need this someday" is the failure mode. Add abstractions when there are two concrete consumers; not before.
- **Don't re-add PIN auth, native targets, or dark mode.** These are deliberate omissions. Documented in `CLAUDE.md` → "When to add PIN auth" and the "What vellum isn't" section of `README.md`. A consumer needing them does the work in their fork.
- **Don't re-introduce a circular import via the showcase.** `components/MobilePremium/showcase.tsx` imports each primitive directly (`./MobileSurface`), not via `./index` — the barrel re-exports the showcase, so going via the barrel is a cycle. Audit S5 catches this; just don't do it.
