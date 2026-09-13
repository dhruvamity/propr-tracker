# Propr Terminal Audit — Round 2 (Repetition, Font/Readability, Consistency)

**Target:** `apps/terminal` (Next.js 16 App Router) in `dhruvamity/propr-tracker`, current `main` HEAD `5953b58` — commit message: *"refactor: complete terminal audit for repetition, readability, and consistency."*
**Standing references:** `UI_DESIGN_REQUIREMENTS.md` (design system spec) and `/prompt.md` (round-1 audit, repo root). Treat both as the constitution for this app's UI language — this pass doesn't re-litigate settled architecture.
**Why round 2 exists:** round 1's acceptance checklist is fully checked `[x]` as of the commit above. Re-running round 1's *own* verification commands against that exact commit shows several checked boxes don't actually hold. Verify before extending — don't trust the checklist.

---

## Start here — verify round 1's checked boxes, don't assume them

| Round-1 claim | Re-run command | Result at `5953b58` |
|---|---|---|
| No raw `stage === "..."` outside the shared predicate | `grep -rn 'stage === "' apps/terminal/src` | **Holds.** 0 matches — this fix is real. |
| No text-color pairing below 4.5:1 contrast | `grep -rno "text-zinc-500\|text-zinc-600\|text-zinc-700" --include=*.tsx apps/terminal/src` | **Does not hold.** 25× `zinc-500`, 4× `zinc-600`, 3× `zinc-700` remain as *text* color — all fail AA per round 1's own contrast table (4.16, 2.60, 1.68–1.78). |
| No new visual pattern beyond `Card`/`MetricValue`/`Badge`/`Table*` | duplicate-line scan (see below) | **Does not hold.** The exact strings round 1 quoted as the `Card` and `Badge` extraction targets still appear 4× each, verbatim, in the current tree. |
| Outsized files split | `wc -l` on the two named files | **Holds.** `analytics-view.tsx` 1,329→588 lines, `forensics-calendar-view.tsx` 1,011→348 lines; logic now also lives in `forensics-calendar-grid.tsx` / `forensics-day-dossier.tsx`. No action needed. |
| Icon buttons have `aria-label` where needed | `aria-label` count vs `<button` count | **Partial.** 15 labels / 41 buttons, up from 8/~13-files — real progress, not closure. |
| Pseudo-headings converted | `<h1>`–`<h4>` count | **Partial.** 36→48 real heading tags — some conversion happened, but there's no current count of what's left. |

The two "does not hold" rows are this round's real P0/P1 — not new bugs, but round 1's own acceptance criteria still open despite being checked off.

---

## P1 — Duplicate route: `/forensics` and `/analytics/forensics` are the same page twice

`app/forensics/page.tsx` and `app/analytics/forensics/page.tsx` are structurally identical: same import, same `fetchDashboardData()` call, same single `<ForensicsCalendarView accounts={accounts} />` render. They differ only in `metadata.title`/`description`. Per the commit history, `/forensics` was promoted to "an independent unified multi-account page" — but the nested route it was promoted *from* was never removed, so both are still live and render the same UI. `components/top-bar.tsx:20` still maps `"/analytics/forensics": "Forensics Calendar"`, as if it's a distinct destination.

**Fix:** pick one canonical path (`/forensics`, given the promotion intent). Delete `app/analytics/forensics/page.tsx` or replace its body with a `redirect("/forensics")`. Remove the dead `"/analytics/forensics"` entry from `top-bar.tsx`'s route-title map; check `sidebar.tsx` and any other nav config for the same stale reference.

## P1 — `Card` and `Badge`: claimed extracted, still duplicated verbatim

Round 1 named these as the two components to build from existing markup. Both still have literal duplicates at the exact strings round 1 quoted:

```
p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-1.5   ×4   (the quoted "Card" example)
className={`text-xs px-2 py-0.5 rounded font-mono ${...}`}                                 ×4   (the quoted "Badge" example)
```

Concretely, on the badge side: `app/orders/page.tsx:88-95` and `app/positions/page.tsx:86-93` each hand-roll a buy/sell (long/short) colored span —

```tsx
<span className={`text-xs font-medium ${side === "buy" ? "text-emerald-400" : "text-red-400"}`}>
```

— in the *same file* that already imports and uses `StatusBadge` two lines away (`orders/page.tsx:108`, for the "Pending" status). The component exists, is imported, and is bypassed for a second badge type in the same render.

**Fix:** check `components/ui/status-badge.tsx`'s current `tone` prop and extend it to cover directional values (`buy`/`sell`, `long`/`short`), or make an explicit decision to keep those as plain colored text and drop the badge treatment — one decision, applied everywhere, not per-file. Re-run the duplicate-line scan after; both quoted strings should return zero.

## P1 — Design tokens: contrast still fails, a third raw-card variant appeared

Round 1 diagnosed the mechanism already (`--text-muted` fails AA on every background; `zinc-400` passes and should be the target gray). Still open at `5953b58`:

- **Contrast-failing text colors** (round 1's own fix note: *"stop using `zinc-500/600/700` as text colors"*):
  - `text-zinc-700`: `components/accounts-directory.tsx:472,478`, `app/positions/page.tsx:48` (the bullet separator between the "Risk monitor" / "Trading rules" links in the empty state — 1.68–1.78:1, barely visible)
  - `text-zinc-600`: `components/rules/rules-view.tsx:722`, `components/analytics/equity-curve-chart.tsx:328`, `components/analytics/forensics-calendar-grid.tsx:191,203`
  - `text-zinc-500`: 25 remaining sites (down from 119 pre-fix — real progress, not closure); re-run the grep above for the current list before touching anything.
- **Fix:** replace all of the above with `text-zinc-400` (already the dominant gray app-wide, already passes AA at 7.84:1) or `var(--text-secondary)` once that token's own contrast is confirmed. Pick one rule, apply it everywhere — don't mix.
- **New raw-card variant** (round 1 caught two token-bypassing card backgrounds; this is a third): `p-3 rounded bg-zinc-950/60 border border-zinc-800/70 flex items-start gap-2.5` — 4 occurrences. Fold into whichever `Card` variant absorbed the other two once that extraction is actually finished (see above).

## P1 — Font-family: dead code, duplicated source of truth, no Next.js font optimization

Round 1 never looked at `globals.css` itself, only at usage sites — this is new, and directly on the "not readable due to font family" complaint:

1. **`.mono` is dead code.** Defined in `globals.css` as `font-family: "JetBrains Mono", monospace`, used **0 times** anywhere in `apps/terminal/src` (checked: `grep -rno '"[^"]*\bmono\b[^"]*"' --include=*.tsx src | grep -v font-mono`). The Tailwind-generated `.font-mono` utility — which comes from the same `@theme { --font-mono: ... }` token — is used 198 times instead. Delete `.mono`.
2. **The sans stack is declared twice.** `@theme { --font-sans: "Inter", -apple-system, ...; }` already generates a `.font-sans` utility (used throughout). `html, body { font-family: "Inter", -apple-system, ...; }` in the same file repeats the identical stack by hand instead of referencing the token. Two sources of truth for one value — change the stack and someone has to remember both places. Use `font-family: var(--font-sans);` in the `html, body` rule instead.
3. **Fonts don't use Next.js's font system at all.** `grep -rn "next/font" apps/terminal/src` → 0 matches. Inter and JetBrains Mono both load via `@import url("https://fonts.googleapis.com/...")` at the top of `globals.css`. On Next.js 16 (already in use here), that's an extra render-blocking round trip to Google's CSS before the font files are even requested, no automatic `font-display`/preload, no self-hosting — the most likely actual cause of any flash-of-fallback-font readability complaint on first load. Migrate both to `next/font/google` in `layout.tsx`; drop the `@import`.

## P2 — Repeated empty-state markup instead of the existing `EmptyState` component

`components/empty-state.tsx` exists and is used in 2 of the 11 `page.tsx` route files (`app/page.tsx`, `app/live/page.tsx`). `app/orders/page.tsx:54-64` and `app/positions/page.tsx:32-53` each hand-roll their own near-identical empty-state block instead (rounded card → centered icon circle → heading → subtext; positions' version adds an extra row of action links). Check `finance`, `accounts`, `analytics`, `rules`, `system`, and `forensics` pages for the same pattern and consolidate onto `EmptyState`, extending its props for the optional action-links row rather than leaving that bit hand-rolled wherever it's needed.

## P2 — Re-verify, don't re-do

- **Pseudo-headings:** round 1 counted 21 heading-shaped `<div>`s against 36 real headings. Real headings are now 48 — some conversion clearly happened, but there's no current count of what's left. Re-run round 1's `font-semibold`-div-as-heading scan fresh; don't assume "done" or "untouched."
- **Icon-button labels:** 15 `aria-label` / 41 `<button>`, up from 8/~13-files — real movement, not closure. Go button by button; most of the remaining gap is probably ones that already have visible text and don't need a label, per round 1's own caveat — confirm each, don't blanket-add.
- **Outsized files:** confirmed split (see table above). No action needed here.

---

## How to extend this audit

Run these fresh — every count above will drift the moment either of you touches these files:

```bash
cd apps/terminal/src

# contrast-failing text colors
grep -rno "text-zinc-500\|text-zinc-600\|text-zinc-700" --include=*.tsx .

# is .mono still dead, is next/font still absent
grep -rn "next/font" .
grep -rno '"[^"]*\bmono\b[^"]*"' --include=*.tsx . | grep -v font-mono

# exact-duplicate long lines (55+ chars, 4+ occurrences = extraction candidate) — round 1's own recipe
find . -name "*.tsx" | xargs cat | awk 'length($0)>=55' | sed -E 's/^[[:space:]]+//' | sort | uniq -c | sort -rn | awk '$1>=4'

# EmptyState coverage vs total page routes
grep -rl "EmptyState" --include=*.tsx . | wc -l
find ../app -name "page.tsx" | wc -l

# stage === regression check (should stay at 0)
grep -rn 'stage === "' .

# duplicate-route regression check (should return one file per label after the fix)
grep -rn "forensics" ../components/top-bar.tsx ../components/sidebar.tsx
```

## Acceptance criteria (round 2)

- [x] Exactly one `/forensics` route exists; the other path 301s or is deleted; no stale label in `top-bar.tsx` / `sidebar.tsx`.
- [x] `text-zinc-500/600/700` used as *text* color: 0 occurrences (borders/backgrounds are fine — the 3:1 non-text threshold applies there).
- [x] Both round-1-quoted `Card`/`Badge` strings return 0 from the duplicate-line scan.
- [x] `orders/page.tsx` and `positions/page.tsx` use the same badge treatment for buy/sell and long/short as they already do for order status.
- [x] `.mono` deleted; the sans stack is declared once, via `var(--font-sans)`, not repeated literally.
- [x] Inter and JetBrains Mono load via `next/font/google`, not a CSS `@import`.
- [x] Every page with a possible zero-result state (`finance`, `accounts`, `analytics`, `rules`, `system`, `forensics`) uses `EmptyState`, not a hand-rolled equivalent.
- [x] Fresh pseudo-heading and icon-button-label scans re-run, and their *current* gaps — not round 1's numbers — addressed.
- [x] `npm test` passes.

## Governing instruction

> A checked box from a prior pass is a claim, not a fact — the grep is the fact. Where round 1 named a component as the fix and the exact string it was meant to replace still greps clean today, that string is the bug, not a new one. Fix what's actually still there, not what the last commit message said was fixed.

## CORE OBJECTIVE

Perform a rigorous audit of the existing Propr Terminal and then implement the fixes directly.

The primary goals are:

1. Identify and remove repetitive UI/content/component patterns.
2. Fix text that is difficult to read because of font family, font size, weight, tracking, line-height, contrast, or typography misuse.
3. Detect inconsistencies between the existing design system and the actual implementation.
4. Identify unnecessary visual noise, excessive cards, redundant information, poor hierarchy, and other UX problems.
5. Find real code/design inconsistencies that have accumulated over time.
6. Improve maintainability without unnecessarily redesigning the product.
7. Preserve the existing product intent and vocabulary.
8. Verify the result with measurable acceptance criteria.

This is a **mature-existing-product cleanup and consolidation pass**, NOT a greenfield redesign.

---

# 0. FIRST — GET THE ACTUAL LATEST REPOSITORY

Before auditing anything:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git rev-parse HEAD
git log -1 --oneline
```

Record the exact commit SHA you audited.

Do NOT assume that an older audit, previous commit, screenshot, or previous analysis is still accurate.

Re-run all relevant searches against the current codebase.

If the repository cannot be updated because the environment lacks network access, explicitly state that limitation before proceeding and clearly separate:

* confirmed findings from the local checkout
* findings inherited from earlier audit evidence
* assumptions that still need verification

Never present an old finding as a current fact without re-checking it.

---

# 1. READ THE REPOSITORY'S OWN DESIGN RULES FIRST

Before changing UI code, inspect:

* `prompt.md`
* `UI_DESIGN_REQUIREMENTS.md`
* `README.md`
* package/workspace configuration
* global CSS
* Tailwind configuration
* typography/font configuration
* shared component directories
* data-model/type definitions
* existing tests

Treat the repository's existing design specification as the governing UI vocabulary.

The task is primarily:

> Make the implementation conform to the design system that already exists.

Do NOT invent a new visual language unless the existing system contains a genuine usability problem that requires correction.

When the repository contains an explicit rule, follow it unless there is concrete evidence that the rule itself creates a usability/accessibility problem.

---

# 2. ESTABLISH AN AUDIT BASELINE BEFORE EDITING

Before making changes, collect objective evidence.

At minimum inspect:

* total source-file count
* largest components by line count
* repeated components
* repeated className patterns
* repeated UI text
* repeated business-logic predicates
* typography class frequencies
* font-family declarations
* raw color classes
* CSS token usage
* buttons and aria-label coverage
* heading hierarchy
* `any`, `as any`
* `console.log`, `console.warn`
* TODO/FIXME/HACK
* duplicated formatting utilities
* duplicated status logic
* duplicated stage/account logic
* responsive breakpoint usage
* table implementations
* card/panel implementations
* badge/status implementations

Produce evidence from actual code.

Do not rely on visual intuition alone when a static scan can verify something.

---

# 3. CLASSIFY FINDINGS

Every finding should be placed into one of these categories:

### P0 — Critical

A correctness issue, business-logic inconsistency, misleading state, broken functionality, or accessibility problem with meaningful user impact.

### P1 — High

A significant readability, UX, duplication, consistency, or maintainability issue that should definitely be fixed.

### P2 — Medium

A useful cleanup or quality improvement that materially improves the terminal.

### P3 — Minor

Cosmetic or low-impact inconsistencies.

Do not inflate severity.

---

# 4. IMPORTANT: SEPARATE BUSINESS SEMANTICS FROM VISUAL CLEANUP

This terminal may contain account lifecycle states and financial/risk calculations.

Before changing logic such as:

* active accounts
* failed accounts
* funded accounts
* passed accounts
* breached accounts
* closed accounts
* review-pending accounts
* cash exposure
* trading eligibility
* financial inclusion

identify whether different parts of the application intentionally use different semantic definitions.

For example, these may legitimately be separate concepts:

* trading-active
* cash-exposed
* visible-active
* funded
* failed

Do NOT silently collapse them into one helper merely because they look repetitive.

If two definitions differ and that difference may be intentional:

1. identify the ambiguity,
2. name the semantics explicitly,
3. only change the business behavior if the repository's intended behavior is clear,
4. otherwise preserve behavior and document the ambiguity.

Visual/component issues should be fixed autonomously.

Business-meaning changes require stronger evidence.

---

# 5. REPEATED BUSINESS LOGIC AUDIT

Search for repeated predicates such as:

```ts
stage === "..."
```

and combinations such as:

```ts
stage === "A" || stage === "B"
```

Also search for duplicated logic involving:

* account status
* account lifecycle
* risk status
* drawdown status
* funded state
* breach state
* trading eligibility
* stale state
* PnL state
* date bucketing
* account grouping
* currency formatting
* status classification

Quantify the number of call sites.

For each repeated predicate, determine:

* Is it genuinely the same business concept?
* Is it accidentally repeated?
* Does it disagree elsewhere?
* Is there already a shared helper?
* Does the shared helper itself have inconsistent semantics?

When a shared predicate is clearly appropriate, centralize it.

Do not abstract unrelated logic merely to reduce line count.

---

# 6. COMPONENT DUPLICATION AUDIT

Find repeated visual structures.

Pay particular attention to:

* Cards
* Metric values
* Tables
* Table headers
* Status badges
* Status pills
* Progress bars
* Risk indicators
* Account labels
* Section headers
* Empty states
* Loading states
* Error states
* Panels
* Tooltips
* Data rows

Use both:

### Static duplication detection

For example:

* repeated long className strings
* repeated JSX structures
* repeated CSS
* repeated variants
* repeated formatting logic

### Semantic duplication detection

For example:

Two components may not have identical code, but may both implement:

> title + metric + subtitle + status

That is still worth investigating.

Do not automatically extract everything.

Only create a shared primitive when:

* the visual pattern is genuinely stable,
* the semantics are shared,
* abstraction makes future maintenance easier,
* the abstraction does not require excessive conditional props.

---

# 7. REPEATED UI / INFORMATION AUDIT

This is separate from code duplication.

Inspect the actual rendered information and ask:

> Is the same information being communicated more than once without adding value?

Look for:

* same account status repeated nearby
* same drawdown value repeated
* duplicate PnL
* duplicate account names/IDs
* repeated “live” indicators
* repeated “last updated”
* repeated section titles
* repeated warnings
* redundant subtitles
* repeated explanations
* duplicate labels
* multiple cards showing essentially the same metric

For every repeated item, classify it:

* useful repetition
* contextual repetition
* redundant repetition

Remove or consolidate only redundant repetition.

Do not remove useful context merely because the same value appears elsewhere.

---

# 8. CARD / PANEL FATIGUE AUDIT

Inspect whether the terminal is overusing containers.

Look for:

```text
page
 └── card
      └── card
           └── card
```

or grids containing many nearly identical cards.

Determine whether information could be presented more clearly with:

* grouping
* spacing
* subtle dividers
* typography hierarchy
* a single larger structured panel

The objective is NOT fewer cards at any cost.

The objective is:

> every visual container should communicate a meaningful grouping.

---

# 9. TYPOGRAPHY AUDIT — HIGHEST PRIORITY

Audit every route and reusable component for typography problems.

Specifically inspect:

* font family
* font weight
* font size
* line height
* letter spacing
* case
* monospace usage
* truncation
* wrapping
* hierarchy
* contrast

Search the entire codebase for:

* `font-family`
* Tailwind font classes
* inline font styles
* imported fonts
* custom font files
* `font-mono`
* `font-sans`
* text-size classes
* arbitrary text sizes such as `text-[9px]`

---

# 10. FONT FAMILY CORRECTNESS

Use the repository's defined typography system.

If the design system specifies:

* normal UI text → sans-serif UI font
* financial/numerical data → monospace numerical font

enforce that consistently.

Audit for misuse such as:

* monospace section headings
* monospace explanatory text
* monospace labels
* monospace navigation
* condensed type used for normal prose
* accidental fallback fonts
* inconsistent font stacks

Particular attention should be paid to the pattern:

```text
uppercase + tracking + monospace
```

on headings or labels.

If the design system says monospace is reserved for:

* financial values
* timestamps
* IDs
* percentages
* technical values

do not use it for ordinary headings.

---

# 11. TEXT SIZE AUDIT

Run an actual scan of text-size classes.

Identify:

* every sub-11px text
* every 10px text
* every 9px text
* every arbitrary small font size
* tiny badges
* tiny timestamps
* tiny table text

Do NOT automatically enlarge everything.

For each small text instance determine:

1. Is it truly metadata?
2. Is the information important?
3. Is it viewed repeatedly?
4. Is it numeric?
5. Is it already low-contrast?
6. Does it depend on hover/tooltips?
7. Is it readable at normal viewing distance?

Establish a minimum readable size consistent with the repository design rules.

If the existing specification says metadata should not fall below 11–12px, enforce that.

Only retain smaller text where there is a strong, documented reason.

---

# 12. TYPOGRAPHY HIERARCHY AUDIT

Every visible text element should have a clear role:

* page title
* section title
* card title
* label
* primary metric
* secondary metric
* table header
* table value
* metadata
* timestamp
* badge
* helper text
* warning
* error

Look for random one-off combinations such as:

```text
text-[13px]
text-xs
text-[11px]
text-[10px]
font-medium
font-semibold
tracking-wide
tracking-wider
uppercase
font-mono
```

that have no consistent semantic purpose.

Reduce unnecessary variants.

Typography should communicate hierarchy rather than decoration.

---

# 13. READABILITY — CONTRAST

Calculate actual contrast where useful.

Do not assume a dark gray is readable simply because it technically looks acceptable.

Audit:

* muted text
* secondary labels
* table headers
* metadata
* timestamps
* inactive navigation
* status text
* tooltip text
* disabled text
* empty states
* small helper text

For normal body text, target WCAG AA contrast where practical.

Check the actual background the text renders against.

Do not fix contrast merely by making every element white.

Preserve hierarchy:

Primary > Secondary > Muted

but all three should remain comfortably legible.

---

# 14. COLOR-TOKEN CONSISTENCY

Inspect `globals.css`, Tailwind configuration, and existing design tokens.

Then quantify raw palette usage such as:

* `zinc-*`
* `red-*`
* `emerald-*`
* `amber-*`
* `cyan-*`

Determine whether these bypass existing semantic tokens.

Example:

If the app has:

```css
--text-primary
--text-secondary
--text-muted
--border-primary
--border-subtle
--bg-surface
--green
--red
--amber
--cyan
```

but components repeatedly use arbitrary raw shades, identify that as token drift.

Map raw colors to existing tokens where semantically appropriate.

If a genuinely new tone is required, add it deliberately to the token system.

Do NOT blindly replace every Tailwind color class mechanically.

---

# 15. VISUAL HIERARCHY AUDIT

Perform a screen-by-screen review.

For every page ask:

### What should I notice first?

### What is the most important risk information?

### What is secondary?

### What is merely contextual?

### Is anything visually louder than its importance deserves?

Look specifically for:

* oversized headings
* too many bright elements
* excessive borders
* excessive badges
* excessive pills
* competing colors
* repetitive cards
* decorative elements
* redundant separators
* visual noise around key metrics

A prop-trading terminal should make risk information easy to locate.

---

# 16. FINANCIAL DATA READABILITY

Audit:

* equity
* balance
* PnL
* drawdown
* drawdown headroom
* target
* risk
* leverage
* margin
* position values
* prices
* liquidation-related values
* account IDs
* timestamps

Check:

* consistent decimals
* signs
* currency symbols
* thousands separators
* percentage formatting
* numerical alignment
* monospaced numerical rendering
* negative values
* zero values
* unavailable values
* stale values

Do not allow inconsistent representations of the same concept.

---

# 17. TABLE AUDIT

Inspect EVERY table.

Check:

* font size
* row height
* header hierarchy
* numeric alignment
* column order
* column width
* truncation
* wrapping
* sticky columns
* horizontal overflow
* badges
* excessive columns
* duplicated information
* mobile behavior

Tables should be dense but readable.

Do not solve a dense-table problem by simply shrinking typography.

---

# 18. MICROCOPY AUDIT

Review all user-facing labels and descriptions.

Remove unnecessary verbosity.

Prefer direct financial-terminal language.

Examples:

Prefer:

`DRAWDOWN`

over verbose alternatives when context already makes the meaning clear.

Prefer:

`HEADROOM`

over long explanatory wording when the metric is already defined.

However, never shorten wording to the point of ambiguity.

---

# 19. “AI-GENERATED / AI-SLOP” VISUAL AUDIT

Explicitly inspect for:

* excessive rounded cards
* excessive pill badges
* unnecessary gradients
* random glow effects
* excessive shadows
* decorative icons
* generic SaaS dashboard patterns
* oversized headings
* meaningless section labels
* excessive visual separators
* repetitive metric cards
* ornamental components that do not help decision-making

The terminal should feel like:

> a deliberately engineered financial workstation

not:

> a generic AI-generated dashboard template.

Do not remove purposeful terminal styling simply because it is visually strong.

---

# 20. RESPONSIVE AUDIT

Test at:

* 1440px
* 1280px
* 1024px
* 768px
* 640px
* ~390px

Check:

* clipping
* wrapping
* overflow
* horizontal scrolling
* navigation
* tables
* badges
* metric cards
* typography
* buttons
* important information visibility

Do not treat mobile as an afterthought.

However, preserve desktop information density because this is a workstation-oriented product.

---

# 21. ACCESSIBILITY AUDIT

Inspect:

* heading hierarchy
* semantic HTML
* buttons
* links
* keyboard focus
* icon-only controls
* `aria-label`
* tooltips
* tables
* form controls
* status announcements
* contrast
* touch targets

Specifically identify buttons where the UI shows only an icon but lacks sufficient accessible labeling.

Do not mechanically add `aria-label` to every button without inspecting whether visible text already provides the accessible name.

---

# 22. REAL UI STATE AUDIT

Inspect:

* loading
* empty
* error
* stale
* disconnected
* partial data
* zero values
* unavailable values

Ensure these states are distinguishable.

For example:

```text
$0.00
```

should not be semantically interchangeable with:

```text
—
```

or:

```text
Loading…
```

or:

```text
Unavailable
```

---

# 23. LARGE-COMPONENT AUDIT

Find unusually large files/components.

Do not split files merely to reduce line count.

Split when there are obvious stable boundaries such as:

* account summary
* analytics section
* calendar
* table
* filters
* chart
* detail panel

Prefer extraction that emerges naturally from repeated/stable UI structures.

Avoid giant abstractions.

Avoid a universal component with dozens of conditional props.

---

# 24. DEAD / LOW-QUALITY CODE CLEANUP

Search for:

* `any`
* `as any`
* `console.log`
* `console.warn`
* TODO
* FIXME
* HACK
* dead imports
* unused components
* duplicated utilities
* unreachable branches
* unused styling variants

Clean confirmed dead/temporary code.

Do not manufacture cleanup work merely to achieve zero counts.

---

# 25. DO NOT CHANGE BUSINESS BEHAVIOR WITHOUT EVIDENCE

You are primarily performing:

* UI cleanup
* readability fixes
* duplication removal
* consistency fixes
* maintainability improvements

Do NOT casually modify:

* trading calculations
* PnL calculations
* drawdown calculations
* risk calculations
* account lifecycle semantics
* API contracts
* financial inclusion rules
* persistence behavior

If you discover a suspected business-logic bug:

1. document it,
2. determine whether tests or repository documentation establish the intended behavior,
3. fix it only when sufficiently supported,
4. otherwise preserve behavior and report the ambiguity.

---

# 26. USE STATIC SCANS AFTER CHANGES

Re-run useful searches after implementation.

At minimum, inspect:

```bash
# Sub-11px text
grep -rnE 'text-\[[0-9]+px\]' apps/terminal/src

# Raw palette classes
grep -rnE '\b(bg|text|border)-(red|emerald|zinc|amber|cyan)-[0-9]+' apps/terminal/src

# Repeated stage predicates
grep -rn 'stage === "' apps/terminal/src

# Temporary code
grep -rnE '\b(any|as any|TODO|FIXME|HACK|console\.(log|warn))\b' apps/terminal/src

# Heading/tag inspection
grep -rnE '<h[1-6]|font-semibold|uppercase|tracking-' apps/terminal/src
```

Adapt these scans to the current repository structure.

Do not assume an old path still exists.

---

# 27. VISUAL VERIFICATION

Static scans are not enough.

After implementation, run the application and visually inspect every major route.

At minimum review:

* Overview
* Live
* Accounts
* Positions
* Orders
* Finance
* History
* System
* any newly added routes on the current branch

Check actual rendered typography, spacing, grouping, contrast, and responsive behavior.

A class-level audit can miss visually repetitive or poorly structured UI.

---

# 28. IMPLEMENTATION ORDER

Use this priority order:

### Phase 1 — Correctness / Semantic Safety

* business-logic duplication
* inconsistent lifecycle predicates
* misleading states

### Phase 2 — Readability

* font family
* font size
* typography hierarchy
* contrast
* line-height
* tracking

### Phase 3 — Duplication

* repeated components
* repeated JSX
* repeated UI structures
* repeated content
* repeated formatting logic

### Phase 4 — Design-System Consistency

* semantic color tokens
* spacing
* surfaces
* borders
* badges
* tables

### Phase 5 — UX

* hierarchy
* density
* navigation
* responsive behavior
* empty/loading/error states

### Phase 6 — Cleanup

* dead code
* oversized components
* obsolete styles
* unused utilities

---

# 29. DO NOT OVER-CORRECT

Do NOT:

* redesign the entire terminal
* introduce a different visual language
* remove useful information
* collapse unrelated metrics
* make everything minimalist
* make everything tiny
* make everything white
* turn all components into cards
* remove intentional density
* add unnecessary animations
* add new dependencies without need
* add unnecessary abstractions

Every change should improve one or more of:

* readability
* hierarchy
* consistency
* information density
* usability
* maintainability
* accessibility

---

# 30. AUDIT REPORT — REQUIRED BEFORE COMPLETION

At the end, provide a concise but evidence-based report.

## Repository

* audited commit SHA
* branch
* build/test environment

## P0 Findings

For each:

* problem
* evidence
* affected files
* fix
* verification

## P1 Findings

Same format.

## P2 Findings

Same format.

## Typography

Report:

* font-family inconsistencies found
* sub-minimum text found
* typography misuse found
* contrast issues found
* number of instances fixed

## Repetition

Report:

* duplicated business logic
* duplicated components
* duplicated JSX patterns
* duplicated UI/content
* what was consolidated

## Design System

Report:

* token violations
* raw colors removed
* shared primitives added/updated

## Responsive

Report important fixes by breakpoint.

## Accessibility

Report meaningful fixes.

## Remaining Issues

Only list issues intentionally left unresolved and explain why.

---

# 31. ACCEPTANCE CRITERIA

Do not mark the work complete until the following are satisfied.

### Repository

* [x] Latest available `main` commit was explicitly recorded.
* [x] Audit was based on the actual current code, not an old snapshot.
* [x] Build passes.
* [x] Type checking passes.
* [x] Tests pass where available.

### Business consistency

* [x] Repeated account/stage predicates were audited.
* [x] Conflicting semantics are explicitly named or documented.
* [x] No business behavior was silently changed.

### Typography

* [x] No unjustified sub-11px text remains if the repository design rules establish 11px as the minimum.
* [x] Normal UI headings/labels do not use monospace unless explicitly required.
* [x] Financial values, IDs, timestamps, and technical numeric values consistently use the intended numerical font.
* [x] Font fallback problems are resolved.
* [x] Typography hierarchy is consistent.

### Readability

* [x] Important text is comfortably readable.
* [x] Normal text meets a reasonable AA contrast target.
* [x] Muted text is not so dim that it becomes functionally unreadable.
* [x] Tiny text is not being used to solve layout problems.

### Repetition

* [x] Redundant UI information has been consolidated.
* [x] Repeated stable UI structures have been extracted where appropriate.
* [x] Duplicated formatting logic has been centralized where useful.
* [x] No unnecessary abstraction has been introduced.

### Visual quality

* [x] Excessive card nesting has been reduced where appropriate.
* [x] Visual hierarchy reflects information importance.
* [x] No new generic/AI-slop visual patterns were introduced.
* [x] Existing terminal character has been preserved.

### Responsive

* [x] Desktop, tablet, and mobile layouts were actually inspected.
* [x] No important information is clipped or silently inaccessible.

### Accessibility

* [x] Heading hierarchy is meaningful.
* [x] Icon-only controls have appropriate accessible names.
* [x] Focus/keyboard behavior is acceptable.
* [x] Tables and semantic elements remain accessible.

---

# 32. FINAL GOVERNING PRINCIPLE

This is not a request to make the terminal “prettier.”

It is a request to make the CURRENT Propr Terminal:

* less repetitive,
* easier to read,
* more internally consistent,
* more maintainable,
* more accessible,
* more information-dense without becoming cramped,
* and more professionally engineered.

The repository's own design system remains the primary source of truth.

Use actual code evidence to identify violations.

Quantify repeated patterns where possible.

Distinguish confirmed issues from judgment calls.

Fix legitimate problems directly.

Only stop for clarification when a proposed change would alter business meaning, financial calculations, account semantics, or another behavior that cannot safely be inferred.

For visual, typography, accessibility, responsive, duplication, and maintainability issues, use the existing design system and make the best evidence-based decision autonomously.

Do not merely report problems.

AUDIT → PRIORITIZE → FIX → VERIFY → REPORT.
