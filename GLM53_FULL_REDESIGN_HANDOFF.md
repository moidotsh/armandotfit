# HANDOFF — FULL UI/UX REDESIGN OF ARMANDOTFIT

**Audience:** GLM-5.3 (no vision). **Mandate:** total upend, typography-first, hierarchy-first, premium modern. You have FULL REIGN. This is not iteration.

---

## 0. Orientation — do this first

- Workspace: `/Users/koba/Documents/Code/arman`. Child repos: `armandotfit/` (the product) and `arqavellum/` (the public starter shell it consumes). This directory is **not** a git repo — all git commands go inside a child repo, with explicit `cd` every time (cwd never persists between commands).
- Package manager is **bun** everywhere.
- Read, in order: `armandotfit/CLAUDE.md` (repo law — invariants, the 13 audits, arqavellum relationship), `armandotfit/ARCHITECTURE.md` (the pattern constitution), `docs/architecture/mobile-premium-design-system.md` (the current design system), `constants/theme.ts` (canonical tokens), then every file in `app/`, `components/MobilePremium/`, `components/composed/`, `components/primitives/`.
- The untracked `REDESIGN_HANDOFF.md` / `UIUX_HANDOFF.md` describe the PREVIOUS mandate. Its **taste rules are rescinded** by this handoff; its environment/capture sections remain accurate.
- Current baseline you are replacing: an "ember ink on warm paper" ink dialect, a 12-token type scale with a `Figure` number primitive, honest loading/empty/error states, 623 passing tests, 13 structural audits + `tsc` gating every commit. It is coherent and quiet. Your job is to replace it with something with a stronger point of view — not to polish it.

## 1. Your authority — upend, don't iterate

The owner's instruction: **FULL REIGN. UPEND basically EVERYTHING for a better premium UI/UX/design.** Explicitly:

- Every previously protected visual decision is now **fair game**: the `InkRail` substitution glyph (⇄) and its bare sheet, the "quiet receipt" orthodoxy, the one-hero-figure rule, the current palette, the current type scale, every screen's composition, the drawer, the motion language, the kit primitives' internals, the navigation chrome itself.
- You are not asked to preserve anything. If the best design keeps a current decision, keep it because it **survives your thesis** — never because it was already there.
- "Daring" means a committed point of view, radical scale contrast, structural replacement — **not** decoration bolted onto the old layout. Additive garnish is the failure mode this mandate exists to prevent.

## 2. The product and its context

- A personal fitness PWA with **one user: the owner**. Used **in the gym**: one hand, sweat, gloves, glare, iPhone SE-class to Pro-Max screens. AM/PM hypertrophy program, five-table logging core, progression computed at read time.
- Screens: home (daily brief), split-selection (start workout), workout-detail in both modes (live logging + readonly receipt), program, exercise library + exercise detail, progression, analytics, settings, login/register/forgot-password, not-found, the drawer, the substitution sheet.
- Design for **glanceability at arm's length mid-set**. Every screen must pass the 490px height budget (the primary action reachable without scrolling on a 390×667 viewport). That budget is a hard invariant.

## 3. The assignment

Center the redesign on **typography** and **visual hierarchy**:

- **Typography is the interface.** Rebuild the type system from zero: choose a scale (modular ratio and/or fluid `clamp` system), name every token, pair faces deliberately (the kit already has `FONTS.display` and `FONTS.mono` seams), assign weight/tracking/case per role, `tabular-nums` on every number that changes, and enforce vertical rhythm (a spacing scale that line-heights derive from).
- **Hierarchy is the product.** One focal point per screen. An explicit figure language for numbers (the current `Figure` primitive is a seam you may replace or radicalize). A surface/elevation language (what recedes, what advances). For every screen, know and be able to state: what is loudest, what is second, what is quiet — and why.
- **Premium = optical discipline + confidence.** Rhythm, restraint where a screen should be calm, audacity exactly at the focal moment. Premium is not gold gradients and glassmorphism; it is the feeling that nothing is accidental.

## 4. You are visionless — this is how you see

You **cannot** look at images. Never claim visual verification. Never write "looks good." Your eyes are:

1. **Math that needs no rendering.** WCAG contrast is computable from hex pairs: compute it for **every** text token × every surface it rides, **both modes**, before you commit any palette or type color. Spacing rhythm and type-scale ratios are arithmetic — check them.
2. **Computed-style probes.** Headless Playwright WebKit: assert `fontSize`/`fontWeight`/`letterSpacing`/`textTransform`/`fontVariant`/`color` on key nodes per screen against your token spec. This is your screenshot.
3. **Geometry probes.** Bounding boxes: touch targets ≥44×44, no horizontal overflow, stacked-card gaps on your spacing scale, primary action above the fold at 390×667 and 390×844.
4. **Pixel probes.** You can't see PNGs but you can measure them: cluster rendered colors and assert membership in the theme set; detect blank/failed renders; pixel-diff before/after captures and report changed-region percentage (proof the change landed, plus a change-heat report for the owner).
5. **The existing gates.** 13 audits + structural ESLint + `tsc --noEmit` + the test suite + the 490px walk.

Build these as scratch scripts under `/Users/koba/Documents/Code/arman/.shots/` (gitignored location — **never commit** captures or probes). Produce before/after PNG pairs per screen in light + dark + SE as the **owner's review record** — they are the human-reviewable artifact of a visionless redesign.

A blank page during capture is usually a build problem (dev-surfaces flag, stale Metro transform), not a design verdict. Diagnose before you judge.

## 5. Non-negotiables — repo laws that survive the upend

- **No new package dependencies, ever, without asking first.** If a dependency seems required, stop and ask. Font files ride the existing `FONTS` seams; new font assets are acceptable only if they require no new package (ask if unsure).
- **The data spine is not design territory.** Five tables, no migrations or seed changes, history immutable, computed-at-read, exercise identity joins by name, tag vocabulary semantics. UI-state stores may be adapted for the design; service contracts may be extended behind existing seams, not broken.
- **Auth guard stays ON.** PWA plumbing (manifest injection, service worker, boot plate) stays intact — if your design changes `theme-color` values, keep `index.html`, `scripts/inject-critical-web.ts`, and the runtime block in sync.
- **Accessibility is floor, not ceiling:** roles + labels on every interactive element, 44×44 targets, reduced motion respected, WCAG AA in both modes — computed, not hoped.
- **Tests stay green** (623 now). Rewrite expectations where the design legitimately changes them; document any removals in the commit message. Never delete tests to make a gate pass.
- **The audits are canonical.** If your design genuinely requires a new exemption or an audit change, that is an arqavellum-protocol change (§7.5) with justification — never `--no-verify`.
- Never commit screenshots, probes, or scratch. Never chain `git commit && git push`.

## 6. Fair game — the upend territory

Everything visual and structural in the presentation layer: theme token **values and structure** (`theme.ts` remains the canonical owner), the dialect system itself, every MobilePremium primitive's design, the showcase (it is the visual source of truth), composed components, every screen's information architecture, navigation patterns (drawer/sheets/tabs — you may invent different chrome), motion choreography, empty/loading/error treatments, data-viz language, icon usage, the substitution sheet. If it renders, you may rebuild it.

## 7. Working method

1. **Baseline.** Capture every screen (light + dark + SE) into `.shots/` as the "before" gallery. Write a textual audit of the current design from the JSX: what the hierarchy actually is today, where it is mushy, where it is timid.
2. **The thesis first.** Before any code, write the design thesis as a doc under `docs/architecture/` (separate docs commit): the point of view in one paragraph, the full type-token table, the spacing scale, the surface/elevation language, the figure language, motion rules, and a screen-by-screen hierarchy map (focal element, second read, quiet tail — with reasons). This document is your compass and the owner's review artifact. Commit it, push it, and build to it.
3. **Tokens, then kit.** Rebuild `constants/theme.ts` and the MobilePremium kit + showcase to the thesis. Gate, commit, push **before** touching screens.
4. **Screens one at a time.** Rebuild → probes green → captures archived → gate → commit. Per-screen or tight clusters; no mega-commits. Update route docs if information architecture changes.
5. **Port shell-owned work to arqavellum in the same window.** Token structure, kit primitives, audits, plumbing fixes: arqavellum gets the same structure with domain-neutral commits (no sibling repo names, no private context — its hooks enforce this). Arqavellum keeps its own palette values. If the new token structure conflicts with the shell's constitution, stop at §11.
6. **Close.** Full walk (light + dark + SE), the after gallery, and a closing summary: thesis paragraph, per-screen before/after inventory, commit list, and an explicit list of everything only the owner's eyes can still confirm.

## 8. Environment realities (learned the hard way — obey them)

- Dev server: `cd armandotfit && bun run web` (port 8081; sets `EXPO_PUBLIC_DEV_SURFACES=1` — `/dev/premium` renders null without it). The server may need to write `~/.expo/`; if the sandbox denies that write, retry the exact command with your harness's widest sanctioned permission or ask the user.
- **Headless Chrome is broken in this environment.** Use Playwright **WebKit**. The full setup recipe (browser path, `TMPDIR`, `BUN_INSTALL_CACHE_DIR` redirects into `.shots/`) is in the workspace `CLAUDE.md` capture section — follow it exactly. Existing working capture scripts live in `.shots/` (`fit-walk.ts light|dark|se|all`).
- Viewport 390×844 @2x (plus 390×667 for SE). `fullPage: true` is viewport-only here — the app scrolls an inner container; step-scroll it.
- Dark mode: seed `localStorage['arqavellum:color-scheme']='dark'` via `addInitScript`; do **not** also set the context `colorScheme` (reproducibly renders light).
- Metro sometimes misses edits: `touch` changed files and re-request; the first walk after edits can time out — warm the bundle, raise timeouts, re-run.
- Every bash command needs an explicit `cd`; the cwd does not persist.

## 9. Git discipline

- One logical milestone per commit: thesis doc; type system; kit; screen or tight cluster; docs. Gate **before** staging: `cd armandotfit && bun run lint:structure && bunx tsc --noEmit` (plus `bun run test:run` for code milestones).
- Commit, then push **as a separate command**. Never chain. Doc edits are their own commits after the code push.
- Never commit from the workspace root. Verify `git status` scope before every push.

## 10. Definition of done

- Every screen rebuilt under the thesis; each verified by probes in light + dark; 490px budget PASS; 13 audits + `tsc` green; tests green with count changes documented; before AND after captures archived per screen (light + dark + SE).
- `theme.ts`, the design-system doc, and the showcase tell one consistent story (they are the tri-source of the system).
- Every shell-owned file you changed also lives in arqavellum, domain-neutrally.
- The closing summary exists and is honest about what remains eyeball-only.

## 11. Stop and ask when

- A dependency seems needed. A schema/migration/seed change seems needed. You find yourself wanting to weaken a gate (audit/test) rather than change the design. The new token structure conflicts with arqavellum's public constitution. Anything would break auth or PWA plumbing.

## 12. Refuse these failure modes (they are yours to police)

Decorative noise you cannot see. Relaxing contrast to hit a vibe. Deleting tests. Claiming you looked at anything. Endless polish loops instead of **thesis → tokens → kit → screens**. Preserving old decisions out of inertia. Presenting captures as verification — they are evidence for the owner, not for you.

---

*The last line of this handoff is the whole handoff: you have full reign to upend everything, and you are blind — so make the design so principled that assertions can carry your eyes, and leave the owner a gallery worth reviewing.*
