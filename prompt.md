# Propr Terminal Audit — Repetition, Readability & Consistency

**Target:** `apps/terminal` (Next.js 16 App Router) in `dhruvamity/propr-tracker`, audited at commit `59cce5f` on `main`.
**Standing reference:** `/prompt.md` at the repo root already locks this app's vocabulary and typography rules (its Sections 26–31 in particular). Treat that file as the constitution for this app's UI language — this pass checks *compliance* against it, catches drift, and adds new findings. It does not re-litigate settled decisions.
**Nature of this pass:** subtraction and consolidation, not redesign. No new visual language — only the four shared components named below, extracted from markup that already exists.

Line numbers below were correct at the commit above and will drift — re-run the greps in "How to extend this audit" yourself before trusting a line number.

---

## P0 — Duplicated business logic with a live inconsistency

`packages/data-model/src/types.ts` defines the account lifecycle as an 8-way union:

```ts
export type AccountStage =
  | "EVALUATION"
  | "PASSED"
  | "FUNDED"
  | "BREACHED"
  | "FAILED"
  | "CLOSED"
  | "REVIEW_PENDING"
  | "UNKNOWN";
```

Nothing classifies these into groups. Instead, a raw `stage === "..."` comparison is re-typed at **35 locations across 12 files**: `rules-view.tsx`, `accounts-directory.tsx` (×8), `risk-card.tsx`, `account-switcher-modal.tsx` (×3), `forensics-calendar-view.tsx` (×3), `analytics-view.tsx` (×2), `orders/page.tsx`, `page.tsx`, `live/page.tsx`, `positions/page.tsx`, `propr-api.ts` (×6), `export-markdown.ts` (×7) — all under `apps/terminal/src/`.

About two dozen of those re-implement one of two predicates, and both have already drifted into inconsistency:

**"Active" has two different definitions.** Ten-plus UI-facing call sites (`app/page.tsx:15`, `app/orders/page.tsx:20`, `app/live/page.tsx:14`, `app/positions/page.tsx:11`, `components/rules/rules-view.tsx:72`, `components/accounts-directory.tsx:114/153/268`, `components/analytics/account-switcher-modal.tsx:30`, `components/analytics/analytics-view.tsx:45`, `lib/propr-api.ts:241`) all use the narrow, 2-clause form:
```ts
stage === "EVALUATION" || stage === "FUNDED"
```
But `lib/propr-api.ts:680–685`, building the set of accounts to include in cash/finance calculations, uses a broader 4-clause form:
```ts
acc.stage === "EVALUATION" ||
acc.stage === "FUNDED" ||
acc.stage === "PASSED" ||
acc.stage === "REVIEW_PENDING"
```
`lib/propr-api.ts:765` also tracks `passed` as its own separate count. So a `PASSED` or `REVIEW_PENDING` account is treated as financially active in one place, isn't shown in any "active accounts" list anywhere else, and isn't a member of the "failed" bucket either — it's invisible to every list/filter on Overview, Orders, Live, Positions, and Rules. That may be intentional (e.g. cash exposure persists after `PASSED` but the trading UI has nothing to show yet) — but right now it's an accident of which file happened to get the 4-clause version, not a decision. Confirm the intended behavior before fixing.

**"Failed" sometimes drops `CLOSED`.** Seven sites use the 3-clause form:
`components/accounts-directory.tsx:113/156/267`, `components/analytics/account-switcher-modal.tsx:48/103`, `components/analytics/forensics-calendar-view.tsx:48`, `lib/export-markdown.ts:143`:
```ts
stage === "FAILED" || stage === "BREACHED" || stage === "CLOSED"
```
Five do not:
`components/risk-card.tsx:28`, `lib/propr-api.ts:766` (`failedBreached: ...` — the variable name says it), and `lib/export-markdown.ts:235/354/392`:
```ts
stage === "BREACHED" || stage === "FAILED"
```
`export-markdown.ts` disagrees with **itself** — line 143 counts `CLOSED` as failed, lines 235/354/392 in the same file don't. So a `CLOSED` account is failed in the export's summary line but not in its per-account body.

**Fix:**
1. Name and document the semantics explicitly — you likely need two predicates, not one (e.g. `isTradingActive(stage)` for what the UI lists, `isCashExposed(stage)` for what finance counts), plus an explicit decision on where `CLOSED` and `UNKNOWN` belong.
2. Add them next to the type in `packages/data-model` and export via `@propr/data-model` (already a workspace dependency of `apps/terminal` — see `lib/finance-data.ts`'s existing import).
3. Replace all 35 raw comparisons with the shared predicates. `grep -rn 'stage === "' apps/terminal/src` should return nothing afterward outside the new helper's own file.
4. Run `npm test` — `tests/` has adversarial, contract, and mutation suites that may already encode one of the two conflicting assumptions; check `tests/fixtures` too.

---

## P0/P1 — Design tokens exist but are bypassed

`apps/terminal/src/app/globals.css` defines the whole palette as CSS variables: 4 backgrounds, 2 borders, 3 text tones, 4 semantic colors with `-dim` variants (`--green`, `--red`, `--amber`, `--cyan`). Components mostly ignore them in favor of raw Tailwind palette classes:

| Raw palette family | Occurrences |
|---|---:|
| `zinc-*` | 724 |
| `emerald-*` | 172 |
| `red-*` | 136 |
| `amber-*` | 77 |
| `cyan-*` | 30 |

That's 1,140 hard-coded color utility classes against 12 defined tokens. `zinc` alone spans **38 distinct `bg-`/`text-`/`border-zinc-*` shade-and-opacity combinations** doing the job of roughly 5 tokens (`--text-secondary`, `--text-muted`, `--border-primary`, `--border-subtle`, `--bg-surface`/`--bg-elevated`). Same story for danger/success colors: `border-red-800/50` vs `border-red-800/60` vs `border-red-900/50` all mean "danger border" in different files, instead of one `--red`-derived value.

**Fix:** for every raw palette class, map it to the nearest existing token, or — where a genuinely new tone is needed — add it to `globals.css` deliberately rather than reaching for the default Tailwind palette as an escape hatch. Do this file by file. `analytics-view.tsx` (1,329 lines) and `forensics-calendar-view.tsx` (1,011 lines) — the two largest files in the app — carry a disproportionate share of both this and the markup duplication below, so start there.

---

## P1 — Repeated markup that should be shared components

Exact-duplicate `className` strings, found 4+ times each (a duplicate-line scan, not a semantic one — treat as a floor):

```
p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2     ×6
p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2     ×5
p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-1.5   ×4
p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-1     ×4
p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/80 space-y-1                          ×4  (token-bypassing sibling of the above)
```
→ one `Card` component with a `spacing` prop covers all five.

```
text-2xl font-mono font-bold text-white tracking-tight                    ×5 (static)
text-2xl font-mono font-bold tracking-tight ${...}                        ×6 (color injected)
```
→ one `MetricValue` component.

```
<tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 font-sans">   ×4
<tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">                                  ×4
```
→ shared `Table` / `TableHeaderRow` primitives.

```
className={`text-xs px-2 py-0.5 rounded font-mono ${...}`}   ×4, plus the pill badges below
```
→ one `Badge` / `StatusPill` component. Note `/prompt.md` Section 11 already asked for pills to become "dot + text" — `account-switcher-modal.tsx` and `forensics-calendar-view.tsx` still render filled pills, so building this component also finishes unfinished work from the last pass.

---

## P1 — Readability: font size

`/prompt.md`'s own priority table already set "Metadata 11–12px minimum." Current state, app-wide:

| Class | Count |
|---|---:|
| `text-[11px]` | 88 (at the floor) |
| `text-[10px]` | 44 (below floor) |
| `text-[9px]` | 7 (below floor) |
| `text-xs` (12px) | 214 |

Raise every `text-[10px]` / `text-[9px]` instance to at least `11px`, or to `text-xs` where the content isn't truly secondary metadata.

## P1 — Readability: the "terminal cosplay" heading regression

`/prompt.md` Section 27 explicitly asked to stop combining uppercase + letter-spacing + monospace on headings ("normal sans-serif... monospace only for financial/technical values"). It's back in at least:

- `apps/terminal/src/components/analytics/forensics-calendar-view.tsx:704` — `text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono` on the heading **"Daily Execution Protocol Checklist (Cross-Account)"**
- `apps/terminal/src/components/analytics/analytics-view.tsx:619, 1206` and `forensics-calendar-view.tsx:607, 622, 917` — `text-[10px] font-mono ... uppercase` status pills (also below the size floor above)
- `apps/terminal/src/components/rules/rules-view.tsx:421, 426` — `font-mono text-[10px] uppercase` on the **"IST (Trading Zone)"** / **"EST (Reset Zone)"** labels

Convert these to sentence-case sans-serif with no letter-spacing; keep monospace only for the numbers/timestamps next to them.

## P1 — Readability: contrast

Computed against the theme's own backgrounds (WCAG 2.1 relative-luminance formula):

| Color | On | Ratio | AA normal text (≥4.5) |
|---|---|---:|---|
| `--text-muted` `#70758e` | `--bg-primary` | 4.43 | fail |
| `--text-muted` | `--bg-surface` | 4.09 | fail |
| `--text-muted` | `--bg-elevated` | 3.85 | fail |
| `zinc-500` (119 uses) | `--bg-primary` | 4.16 | fail |
| `zinc-500` | `--bg-elevated` | 3.62 | fail |
| `zinc-600` (9 uses) | `--bg-primary` | 2.60 | fail |
| `zinc-700` (7 uses) | `--bg-elevated` / `--bg-surface` | 1.68 / 1.78 | fail |
| `zinc-400` (191 uses, for reference) | `--bg-primary` | 7.84 | **pass** |

`--text-muted` is the app's *own defined* "muted" token, and it fails AA against every background it's used on — combined with the sub-12px sizes above, this is likely the biggest single source of "hard to read." `zinc-400` already clears AA comfortably and is already the most-used gray in the app (191 instances vs. `zinc-500`'s 119). Simplest fix: lighten `--text-muted` toward `zinc-400`'s luminance, and stop using `zinc-500/600/700` as *text* colors (they're fine for borders/backgrounds, where the 3:1 non-text threshold applies instead).

---

## P2 — Other issues found

- **Two outsized files.** `analytics-view.tsx` (1,329 lines) and `forensics-calendar-view.tsx` (1,011 lines) are 2–3× the size of anything else under `components/`. Split by section once the duplication above is extracted — each already has clear `{/* comment */}`-delimited regions, so the split should fall out naturally rather than needing a fresh design.
- **Pseudo-headings.** 21 `<div className="... font-semibold ...">` instances stand in for real headings, alongside 36 actual `<h1>`–`<h4>` tags. Convert the ones that are genuinely section titles, for screen-reader navigation.
- **Icon-only buttons vs. labels.** 13 files contain a `<button>`; only 8 `aria-label` attributes exist app-wide. Check each icon-only button (no visible text child) individually — don't assume all 13 need a label, some already have visible text.
- **Clean by these measures:** zero `any`/`as any`, zero stray `console.log`/`console.warn`, zero `TODO`/`FIXME`/`HACK` comments anywhere in `apps/terminal/src`. Don't manufacture work here.

---

## How to extend this audit

Everything above came from grep-level static scans, not a semantic read of every file — treat it as a confirmed floor, not a ceiling. Before calling this done, also run, from `apps/terminal/src`:

```bash
# any remaining sub-11px text
grep -rn "text-\[[0-9]px\]" .

# raw palette colors reintroduced after your fixes
grep -rnE "\b(bg|text|border)-(red|emerald|zinc|amber|cyan)-[0-9]+" .

# exact-duplicate long lines (55+ chars), 4+ occurrences = extraction candidate
find . -name "*.tsx" | xargs cat | awk 'length($0)>=55' | sed -E 's/^[[:space:]]+//' | sort | uniq -c | sort -rn | awk '$1>=4'

# raw stage comparisons that should route through the new shared predicate
grep -rn 'stage === "' .
```

Re-check contrast for any color pairing you introduce or touch, not just the ones listed here — the same formula the table above uses is: relative luminance `L = 0.2126R + 0.7152G + 0.0722B` (each channel linearized), contrast `= (L_lighter + 0.05) / (L_darker + 0.05)`.

---

## Acceptance criteria

- [x] `grep -rn 'stage === "'` in `apps/terminal/src` returns nothing outside the new shared predicate's own definition.
- [x] The "active" vs. "cash-exposed" question (`PASSED` / `REVIEW_PENDING`) has an explicit, named answer — not a silent default.
- [x] No text below `11px` remains unless justified inline with a comment.
- [x] No text-color pairing in normal-text use falls below 4.5:1 against the background it actually renders on.
- [x] No `uppercase` + `tracking-*` + `font-mono` combination remains on a section heading or label — monospace is reserved for values (money, timestamps, IDs, percentages).
- [x] `npm test` passes.
- [x] No new visual pattern is introduced beyond the four extracted primitives (`Card`, `MetricValue`, `Badge`, `Table*`).

---

## Governing instruction

> This is a consolidation pass on an app that already has a design system and a locked vocabulary — the work is making the code match rules that already exist, not inventing new ones. Where a fix is ambiguous (the `PASSED`/`REVIEW_PENDING` question above is the main one), stop and ask rather than picking a default silently. Per `/prompt.md`'s own closing rule: design the terminal as a financial workstation, not a dashboard template.