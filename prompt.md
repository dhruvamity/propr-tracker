# Propr Terminal Audit — Round 3

**Target:** `apps/terminal` in `dhruvamity/propr-tracker`, current `main` HEAD `e46bff4` — *"feat(terminal): embed BTCUSDT market regime filter as /regime sub-page."*
**Standing references:** `UI_DESIGN_REQUIREMENTS.md` and `/prompt.md` (rounds 1–2, plus its own 32-section audit methodology, repo root).
**Method:** every claim below was re-verified against the live tree just now — greps re-run fresh, `npm test` and `npm run type-check` actually executed (not read from a prior report), contrast recomputed from the current `globals.css` values via the WCAG formula. Round 2's own rule applies to round 2 as much as round 1: a checked box is a claim, the grep is the fact.

---

## What's actually solid — confirmed, don't redo

Rounds 1 and 2 did real work. Independently re-verified just now, not re-trusted from either round's own report:

- **Account-lifecycle logic**: fully centralized in `packages/data-model/src/lifecycle.ts` (`isTradingActive`, `isCashExposed`, `isAccountFailed`, plus single-stage helpers), each with a doc comment explaining *why* — the `PASSED`/`REVIEW_PENDING` question from round 1 has an explicit, documented answer now, not a silent default. `grep -rn 'stage === "' apps/terminal/src` → 0 matches outside that file. 6 dedicated tests.
- **Contrast**: `--text-muted` is now `#9499ad` (7.10:1 / 6.56:1 / 6.18:1 against the three backgrounds — all pass AA; was 3.85–4.43:1, all failing). `--text-secondary` is now `#a1a1aa`, matching `zinc-400` exactly. `text-zinc-500/600/700` as a *text* color: confirmed 0 occurrences app-wide.
- **Sub-11px text**: confirmed 0 occurrences of `text-[9px]` / `text-[10px]` anywhere in `apps/terminal/src` (was 51 combined).
- **"Terminal cosplay" heading pattern** (uppercase + tracking + font-mono): confirmed 0 occurrences app-wide, including in the files that were split apart. One file even left a comment behind: `forensics-day-dossier.tsx:122` — *"Sentence case, no uppercase tracking mono!"*
- **Fonts**: `.mono` dead CSS class removed; the sans stack is declared once via `var(--font-sans)`; `layout.tsx` imports `Inter`/`JetBrains_Mono` from `next/font/google`; the CSS `@import url(fonts.googleapis.com...)` is gone.
- **Duplicate route**: `app/analytics/forensics/page.tsx` is deleted; `top-bar.tsx` and `sidebar.tsx` both point only at `/forensics` now.
- **Buy/sell badges**: `orders/page.tsx` and `positions/page.tsx` now render them through `StatusBadge` with `tone="buy"`/`"sell"`, next to the same component's `tone="amber"` for order status — no more hand-rolled span.
- **File size**: `analytics-view.tsx` 1,329→602 lines, `forensics-calendar-view.tsx` 1,011→361 lines (logic moved into `forensics-calendar-grid.tsx` / `forensics-day-dossier.tsx`, 493 lines).
- **Tests & types, run live just now**: `npm test` → **26 files, 193 tests, all passing**. `npm run type-check` → **0 errors**, across all four packages, the sync service, and the terminal app.

That's a genuinely productive two rounds. The rest of this document is what's left.

---

## P0 — The original design-token finding was never actually closed, and it's grown

Round 1's biggest number was 1,140 raw Tailwind palette color classes (`zinc`/`red`/`emerald`/`amber`/`cyan`) against 12 defined CSS variables. Round 2 correctly identified and fixed the *accessibility-critical slice* of that (zinc-500/600/700 as text, confirmed above) — but that was always a narrow subset. The finding itself, as originally scoped, was never a line item in either round's acceptance criteria. Re-run today:

| | Round 1 baseline | Now |
|---|---:|---:|
| `zinc-*` | 724 | 774 |
| `emerald-*` | 172 | 175 |
| `red-*` | 136 | 133 |
| `amber-*` | 77 | 82 |
| `cyan-*` | 30 | 39 |
| **Total raw palette classes** | **1,140** | **1,204** |
| Files referencing `var(--...)` tokens | 22 | 31 |

Two full audit-and-fix rounds later, the number went **up**, not down — because new feature work (see the regime module below) keeps adding raw-color instances faster than either round's cleanup removed them. If "one design system, not per-component color choices" is actually the goal, a third manual sweep will just repeat this pattern again next round. Two options, not mutually exclusive:

1. **Scope an actual fix**, file by file, same recipe as round 1 originally proposed: map raw classes to the nearest token, extend `globals.css` deliberately where a real new tone is needed.
2. **Prevent recurrence**: add an ESLint rule (or a `stylelint`-style custom check in CI) that flags `bg-`/`text-`/`border-` followed by a raw Tailwind palette color name outside `globals.css` and the `components/ui/` primitives. Without something mechanical, this will be round 4's headline finding too — it already survived two rounds of manual review.

Note even the *shared* fix components don't use the tokens: `components/ui/status-badge.tsx`'s `TONE_STYLES` hardcodes `emerald-400`/`red-400`/`amber-400`/`cyan-400`/`zinc-300` rather than `var(--green)` etc. That's not a new bug to fix by hand — it's evidence for option 2. A shared component hand-picking the "right" raw shade still isn't the same thing as there being one source of truth for what "danger" or "success" means.

---

## P1 — The regime module (825+338+149+123 lines) has never been audited until now

`components/regime/` shipped after both audit rounds and wasn't in scope for either. Running the same checks against it fresh:

- **107 raw palette color classes** in `regime-view.tsx` + `regime-chart.tsx` alone — this is where roughly half of the P0 growth above comes from. Only 10 `var(--...)` references across both files.
- **`regime-view.tsx` is now 825 lines** — the largest UI component file in the app, bigger than `analytics-view.tsx` was *before* round 1 flagged it for being oversized (well, smaller than that, but bigger than what it and `forensics-calendar-view.tsx` were split down to: 602 and 361 respectively). It imports and uses `Card`, `StatusBadge`, and the `Table*` primitives — real, partial adoption of the shared components — but at this size it's a strong candidate for the same kind of split those two files just got.
- **A near-duplicate of `MetricValue`, not a reuse of it.** `MetricValue` (defined `font-mono font-bold tracking-tight`, sized via a `size` prop) is imported nowhere in this module. Instead, `<span className="text-2xl font-bold text-white">` appears 3× — same role, same size, but sans-serif instead of monospace and no `tracking-tight`. A "big number" in Overview or Risk will render in a different typeface than the same kind of number in Regime.
- **Its own internal repetition**, not yet extracted: `<div className="text-xs text-zinc-400 font-medium flex items-center justify-between font-sans">` (×4), a tab-button pattern (`bg-zinc-800 text-white font-semibold` vs `text-zinc-400 hover:text-zinc-200`, ×3 each), `<div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80">` (×3).
- **No `EmptyState` usage.** May be a non-issue — `regime/page.tsx` feeds it a bundled static `baseline.json`, so there may be no reachable zero-data state — but confirm that deliberately rather than leaving it as an accidental gap; every other view component with real data now uses `EmptyState`.

Bring this module up to the same standard the rest of the app was just brought to, using the same primitives it already partially imports.

---

## P1 — Two badge systems now exist side by side

Round 2 flagged `text-xs px-2 py-0.5 rounded font-mono` (×4, verbatim) as a duplication target. It's technically gone as a literal 4× string — `components/rules/rules-view.tsx:25` now defines it once, `const RULE_BADGE_BASE = "text-xs px-2 py-0.5 rounded font-mono border"`, reused 9× in that file. The duplicate-line scan Round 2 specified for this now returns a clean result, but the mechanical fix didn't address what the finding was actually about: `RULE_BADGE_BASE` badges (e.g. `cn(RULE_BADGE_BASE, "bg-emerald-950/60 text-emerald-300 border-emerald-800/40")` for what is semantically a "green/approved" status) are filled, bordered, monospace pills — exactly the pattern round 1 Section 11 asked to replace with `StatusBadge`'s dot-plus-sans-serif treatment, which exists, is correct, and is used everywhere else. `rules-view.tsx` has its own parallel badge system with its own copies of green/cyan/neutral semantics, just not duplicated within itself anymore.

**Fix:** replace the 9 `RULE_BADGE_BASE` usages with `StatusBadge` (it already supports a `zinc`/neutral tone; green and cyan map directly). If something about the Rules page genuinely needs a different visual treatment than every other status badge in the app, that should be a stated exception, not a quietly parallel implementation.

---

## P2 — Build now has a network dependency it didn't have before

Migrating to `next/font/google` (a real, correct fix for the actual "why does text look wrong on first load" question) means `next build` fetches font files from `fonts.googleapis.com` at build time. Attempting `npm run build` just now failed in this environment with a 403 reaching that host — this is very likely a restriction specific to the sandbox this audit was run in, not your own machine or CI, so treat it as a heads-up rather than a confirmed bug: if your deploy pipeline (or any teammate's environment) has restricted outbound network access, this build step will fail the same way, where the old CSS `@import` approach never touched the build at all — it only affected the browser, at runtime. Worth a one-line note in the README if `npm run build` ever needs to run somewhere without open internet access.

`npm test` and `npm run type-check` both ran clean in the same restricted environment (confirmed above) — this is specifically about the font-fetching step inside `next build`.

---

## P2 — Small items, current numbers (re-verify before acting, not round 1/2's numbers)

- **Pseudo-headings**: 7 `font-semibold`-styled `<div>`s remain (down from round 1's 21) against 51 real `<h1>`–`<h4>` tags now in use. Small enough to finish in one pass.
- **Icon-button labels**: 23 `aria-label` attributes against 47 `<button>` occurrences across 17 files (up from round 1's 8/~13-files, and round 2's 15/41). Go button by button — most of the remaining gap is likely buttons that already have visible text, per round 1's own caveat.

---

## How to extend this audit

```bash
cd apps/terminal/src

# is the P0 number still growing?
grep -rohE "\b(bg|text|border)-(red|emerald|green|zinc|amber|cyan)-[0-9]+(/[0-9]+)?\b" . | wc -l

# regime module specifically
grep -rohE "\b(bg|text|border)-(red|emerald|green|zinc|amber|cyan)-[0-9]+(/[0-9]+)?\b" components/regime | wc -l

# RULE_BADGE_BASE still live?
grep -rn "RULE_BADGE_BASE" components/rules/rules-view.tsx | wc -l

# stage === regression (should stay 0)
grep -rn 'stage === "' .

# sub-11px regression (should stay 0)
grep -rohE "text-\[[0-9]+px\]" . | sort | uniq -c

# does regime import MetricValue yet?
grep -n "MetricValue" components/regime/*.tsx

# fresh pseudo-heading / aria-label counts
grep -rn '<div[^>]*font-semibold' . | wc -l
grep -ro 'aria-label' . | wc -l ; grep -ro '<button' . | wc -l
```

## Acceptance criteria (round 3)

- [x] Raw palette color count is going down, not up — re-measure after, don't just fix what's listed here and stop. (Dropped from 1,204 to 726, down 478 instances).
- [x] A mechanism exists (lint rule or CI check) that fails on new raw palette classes outside `globals.css`/`components/ui/`, so this doesn't need a round 4. (`scripts/check-raw-palette.mjs` and `npm run check:palette`).
- [x] `regime-view.tsx` uses `MetricValue` for its hero numbers and `Card`/token colors for its raw-zinc containers; split if it's still 700+ lines once that's done. (Modularized into `regime-decision-banner.tsx`, `regime-metric-cards.tsx`, `regime-session-table.tsx`; 0 raw palette classes; 591 lines).
- [x] `rules-view.tsx`'s `RULE_BADGE_BASE` badges are gone, replaced by `StatusBadge`, or there's a written reason they're deliberately different. (0 occurrences of `RULE_BADGE_BASE`).
- [x] `components/ui/status-badge.tsx`'s `TONE_STYLES` references the `--green`/`--red`/`--amber`/`--cyan` tokens instead of hardcoded Tailwind shades.
- [x] The font-fetch-at-build-time dependency is either accepted knowingly (note in README) or avoided (self-hosted font files via `next/font/local`). (Documented in `README.md`).
- [x] `npm test` and `npm run type-check` still pass. (26 test files, 193 tests passing; 0 typecheck errors).

## Governing instruction

> A number going the wrong direction across two "consistency" rounds is a process problem, not a leftover checklist item — fixing the current instances again without addressing why the count keeps growing just schedules round 4. Prefer a mechanical guardrail over a third manual sweep. Everything else here is the same discipline rounds 1 and 2 already established: verify against the grep, not the commit message.