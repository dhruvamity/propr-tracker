# PROPR TERMINAL — DEEP UI/UX AUDIT + CLEANUP + READABILITY + DEDUPLICATION



You are auditing and improving an existing production-oriented prop-trading monitoring terminal.

This is NOT a request to redesign the product from scratch.

Your job is to deeply inspect the existing implementation, identify everything that makes the terminal feel repetitive, visually noisy, hard to read, inconsistent, unnecessarily dense, poorly structured, or less professional than it should be, and then FIX the problems directly in the code.

The final product should feel like a polished professional trading/risk terminal: dense, calm, information-first, highly readable, consistent, and intentional.

---

# 1. FIRST: FULL REPOSITORY + UI AUDIT

Before modifying anything, inspect the entire repository.

Pay particular attention to:

* `apps/terminal`
* shared packages
* reusable UI components
* layouts
* pages/routes
* CSS/Tailwind configuration
* fonts
* typography utilities
* design tokens
* tables
* cards
* badges
* progress bars
* navigation
* headers
* responsive layouts
* loading states
* empty states
* error states
* tooltips
* data formatting
* duplicated components
* duplicated CSS/classes
* repeated patterns across pages

Also inspect:

* `UI_DESIGN_REQUIREMENTS.md`
* `README.md`
* `prompt.md`

Treat `UI_DESIGN_REQUIREMENTS.md` as an important design reference, but DO NOT blindly assume that the current implementation perfectly follows it.

The current implementation is the source of truth for what actually exists.

Your responsibility is to identify the gap between:

1. intended design,
2. implemented design,
3. actual usability/readability.

Do not stop at obvious issues.

---

# 2. DO NOT REDESIGN THE PRODUCT

Preserve the existing product purpose and information architecture.

This is a read-only prop-firm monitoring/risk terminal.

Do NOT introduce:

* order execution
* buy/sell controls
* unnecessary animations
* decorative dashboard elements
* generic SaaS-style hero sections
* giant cards
* excessive whitespace
* unnecessary illustrations
* gamification
* meaningless gradients
* visual clutter
* ornamental UI that reduces information density

The terminal should remain:

* analytical
* dense
* professional
* restrained
* highly scannable
* information-first
* risk-oriented

Make it better, not different.

---

# 3. PRIMARY AUDIT OBJECTIVE: READABILITY

A major problem to investigate is text that technically fits but is difficult to read.

Audit EVERY route and EVERY reusable component for:

## Typography problems

Find:

* font families that are poorly suited to the text
* inconsistent font families
* accidental fallback fonts
* overly condensed typography
* fonts that make uppercase labels difficult to scan
* excessive letter spacing
* insufficient letter spacing
* text that is too small
* text that is too thin
* text that is too tightly packed
* text with insufficient line height
* numbers that are difficult to distinguish
* unclear `0/O`
* unclear `1/l/I`
* tiny timestamps
* tiny table values
* tiny secondary labels
* low-contrast metadata
* overly muted labels
* labels that become unreadable against dark backgrounds
* text that becomes unreadable when values are large
* text that becomes cramped inside cards
* text wrapping in places where it should not
* truncation without useful indication
* tooltip-dependent information that should be readable directly

Do not merely increase every font size.

Instead establish a coherent typography hierarchy.

---

# 4. TYPOGRAPHY SYSTEM

Use the existing design specification as the baseline.

The intended system is:

* Inter for general UI text
* JetBrains Mono for financial/numerical data
* Page titles around 14px
* Section labels around 12px
* Metric values around 20–24px
* Table data around 11–12px
* Micro metadata around 10px

However:

DO NOT blindly preserve a size just because it exists in the specification.

If a value is technically 11px but objectively difficult to read in the implemented UI, improve it.

The goal is:

> maximum information density WITHOUT sacrificing comfortable reading.

Establish clear roles for:

* page title
* section title
* card heading
* metric label
* metric value
* primary table value
* secondary table value
* badge
* metadata
* timestamp
* helper text
* status text
* error text
* navigation text

Every role should use a predictable typography rule.

Avoid having dozens of one-off font-size combinations.

---

# 5. FONT FAMILY AUDIT

Search the complete codebase for:

* `font-family`
* Tailwind `font-*`
* inline font declarations
* imported Google fonts
* local font files
* fallback stacks
* component-specific font overrides

Identify every place where typography deviates unnecessarily from the design system.

Create a centralized typography strategy wherever practical.

For example:

UI:
Inter

Financial/numeric:
JetBrains Mono

Do not allow random components to use:

* Arial
* system UI
* monospace
* another condensed font
* random Google font
* browser default

unless there is a deliberate reason.

Also check whether fonts are actually loaded correctly in production.

A declared font that silently falls back to another font is a bug.

---

# 6. READABILITY BY CONTRAST

Audit all text against its actual background.

Pay special attention to:

* muted labels
* timestamps
* table headers
* disabled states
* secondary descriptions
* empty-state text
* chart labels
* sidebar text
* inactive navigation
* small badges
* status indicators
* tooltip content

Dark terminal UI often becomes unreadable because designers keep reducing opacity.

Do NOT use opacity as a substitute for hierarchy.

Where needed:

* increase contrast
* increase font weight
* slightly increase font size
* simplify text
* reduce visual competition

Do not make every piece of text bright.

The hierarchy should remain:

Primary > Secondary > Muted

but all three must remain comfortably readable.

---

# 7. IDENTIFY REPETITIVE UI

This is a major priority.

Inspect every page and identify repeated information that does not provide additional value.

Look for:

* the same metric appearing in multiple nearby cards
* the same account status being repeated multiple times
* duplicate labels
* duplicate account identifiers
* repeated explanatory text
* repeated section titles
* repeated risk percentages
* duplicated badges
* multiple components conveying the same state
* repeated “live” indicators
* repeated freshness indicators
* redundant headings
* duplicated summary metrics
* redundant subtotals
* repeated instructions
* repeated visual warnings
* excessive use of cards around already-grouped information

Ask for every element:

> “Does this tell the user something new?”

If not, remove it or consolidate it.

Do NOT remove information merely to make the interface emptier.

Consolidate intelligently.

---

# 8. REDUCE “CARD FATIGUE”

Audit the dashboard and every secondary page for excessive card usage.

A common problem in financial dashboards is:

Card inside card inside card inside card.

This creates:

* visual noise
* excessive borders
* excessive padding
* poor hierarchy
* fragmented information

Determine which information genuinely deserves a separate container.

Where appropriate:

* merge related metrics
* use a single structured panel
* use subtle dividers instead of individual cards
* group related values horizontally
* remove unnecessary nested surfaces

Do not turn every metric into an independent visual object.

---

# 9. AUDIT INFORMATION DENSITY

The product is intended for serious prop traders and should work well on widescreen / dual-monitor environments.

Check every route for:

* excessive unused whitespace
* oversized vertical gaps
* oversized cards
* unnecessarily tall table rows
* redundant padding
* content being pushed below the fold unnecessarily
* important risk information requiring unnecessary scrolling
* section ordering that makes users search for critical information

But do NOT compress everything blindly.

The target is:

> HIGH INFORMATION DENSITY + HIGH READABILITY.

Not:

> AS MUCH INFORMATION AS POSSIBLE IN THE SMALLEST SPACE.

---

# 10. TABLE AUDIT

Deeply inspect every table.

Check:

* font size
* row height
* column width
* header readability
* numerical alignment
* decimal alignment
* currency alignment
* negative/positive values
* badges
* truncation
* IDs
* timestamps
* horizontal scrolling
* sticky columns
* excessive columns
* duplicate columns
* unnecessary labels
* column ordering

All numerical values should be visually easy to compare.

Financial numbers should consistently use the numerical font.

Check whether tables contain information that could be removed, merged, shortened, or moved to secondary/detail interaction.

Do not remove useful trading/risk information simply because the table is dense.

---

# 11. NUMERIC READABILITY

Financial terminals depend heavily on numbers.

Audit:

* balances
* equity
* PnL
* percentages
* drawdown
* leverage
* prices
* liquidation prices
* margins
* account IDs
* timestamps
* cash values
* FX values

Check:

* consistent decimals
* consistent currency formatting
* consistent sign formatting
* consistent negative-value treatment
* consistent thousand separators
* decimal alignment
* appropriate use of `$`
* appropriate use of `₹`
* consistent abbreviation rules

Avoid visually inconsistent formats such as:

`$5,000`

`5000 USD`

`USD 5k`

appearing in the same context without reason.

Create consistent formatting utilities where necessary.

---

# 12. VISUAL HIERARCHY AUDIT

For every screen ask:

1. What should the user see first?
2. What should they see second?
3. What requires attention?
4. What is contextual information?
5. What is diagnostic information?

The visual hierarchy should reflect risk importance.

For example:

Critical breach risk > drawdown headroom > active exposure > PnL > secondary metadata

Do not allow:

* decorative elements
* secondary labels
* low-value metrics
* oversized headings
* excessive borders

to compete with critical risk information.

---

# 13. COLOR SYSTEM AUDIT

Preserve the established semantic palette unless there is a strong usability reason to change it.

Audit whether colors are being overused.

Semantic meaning should remain clear:

* green = healthy / profit / funded
* red = loss / breach / failure
* amber = warning / stale / caution
* cyan = active / brand / informational emphasis

Do NOT color every metric.

Especially avoid:

* rainbow dashboard effects
* multiple accent colors on one component
* unnecessary glowing elements
* excessive gradients
* bright text everywhere

Normal healthy states should remain calm.

Urgent states should become visually dominant.

---

# 14. BORDER / SURFACE / SHADOW AUDIT

Check whether the interface contains too many:

* borders
* boxes
* panel outlines
* shadows
* glows
* separators

A terminal UI should feel structured without every element being boxed.

Replace unnecessary hard borders with:

* spacing
* subtle background differences
* typography hierarchy
* fine dividers

where appropriate.

Avoid making the UI look like hundreds of separate widgets.

---

# 15. SPACING CONSISTENCY

Search for random spacing values.

Identify:

* arbitrary margins
* arbitrary paddings
* inconsistent gaps
* inconsistent card padding
* different section spacing
* inconsistent table spacing
* inconsistent header spacing

Create a consistent spacing rhythm.

Avoid situations where visually equivalent components use noticeably different spacing without a reason.

---

# 16. COMPONENT DUPLICATION

Search the codebase for components that perform essentially the same job under different names.

Examples:

* multiple metric-card implementations
* multiple status badges
* multiple table wrappers
* multiple risk bars
* multiple panel components
* multiple loading states
* multiple empty states
* multiple data formatting functions

Where two components are functionally equivalent, consolidate them.

Do not over-abstract.

A shared component should only be introduced where the repeated pattern is genuinely stable.

Avoid creating a giant “universal component” with dozens of conditional props just to eliminate a few duplicated lines.

---

# 17. DUPLICATED CONTENT

Search the actual rendered UI for repeated text.

Examples:

* repeated “Account Status”
* repeated account name
* repeated risk percentage
* repeated “Last Updated”
* repeated live indicator
* repeated explanatory copy
* repeated labels that are already obvious from context

Simplify wording where possible.

Trading terminals should use concise language.

Prefer:

`DRAWDOWN`

over:

`CURRENT TRAILING DRAWDOWN CONSUMPTION`

Prefer:

`HEADROOM`

over:

`REMAINING AVAILABLE LOSS HEADROOM`

unless the additional wording genuinely prevents ambiguity.

---

# 18. NAVIGATION + GLOBAL SHELL

Audit:

* sidebar width
* navigation spacing
* active item styling
* icons
* text size
* collapsed sidebar readability
* top bar density
* live indicator
* refresh control
* sync timestamp
* mobile navigation

Check whether the shell itself consumes too much space.

The global shell must remain visually consistent across every route.

Avoid each page feeling like it was designed independently.

---

# 19. PAGE-BY-PAGE AUDIT

Inspect every implemented route individually.

At minimum:

* `/`
* `/live`
* `/accounts`
* `/positions`
* `/orders`
* `/finance`
* `/history`
* `/system`

For each page identify:

### A. Readability problems

### B. Repetition

### C. Excessive UI elements

### D. Missing hierarchy

### E. Unnecessary whitespace

### F. Poor mobile behavior

### G. Misleading emphasis

### H. Weak states

### I. Redundant information

### J. Inconsistent component usage

### K. Inconsistent typography

### L. Inconsistent formatting

Do not assume fixing one shared component fixes every page.

Verify every route individually after changes.

---

# 20. RESPONSIVE AUDIT

Test at minimum:

* 1440px
* 1280px
* 1024px
* 768px
* 640px
* 390px

Check for:

* text collisions
* clipped values
* overflowing tables
* broken layouts
* excessive scrolling
* navigation problems
* unreadable tiny text
* cards becoming ridiculously tall
* horizontal overflow
* buttons becoming too small
* badges wrapping badly
* important values disappearing below the fold

Mobile should not simply be “desktop but narrower”.

Maintain the same information hierarchy while restructuring where needed.

---

# 21. ACCESSIBILITY AUDIT

Check:

* contrast
* focus states
* keyboard navigation
* semantic HTML
* aria labels
* button semantics
* tooltips
* table semantics
* screen-reader labels
* touch targets
* status communication

Do not fix accessibility by making everything oversized.

Use proper semantics first.

---

# 22. LOADING / EMPTY / ERROR STATES

Audit every state.

Check:

* loading skeletons
* empty tables
* missing account data
* API failure
* stale data
* disconnected state
* partial data
* zero-value state
* unavailable data

The interface must clearly communicate the difference between:

* zero
* unavailable
* loading
* stale
* error

For example:

`$0.00`

is NOT the same as:

`—`

and neither should be silently interchangeable.

---

# 23. MICROCOPY AUDIT

Review every visible label.

Remove:

* unnecessary words
* repetitive wording
* long explanations inside compact cards
* awkward uppercase phrases
* engineering terminology exposed to users
* unnecessary punctuation
* overly verbose helper text

Make the language feel like a serious trading terminal.

Concise, precise, direct.

---

# 24. “AI SLOP” AUDIT

Explicitly inspect for anything that makes the UI look AI-generated or templated.

Examples include:

* excessive rounded cards
* excessive pills
* random gradients
* unnecessary glow
* decorative icons everywhere
* giant typography
* generic dashboard compositions
* repetitive card grids
* excessive section headings
* over-explained labels
* arbitrary symbols
* inconsistent icon styles
* excessive shadows
* overly polished but information-poor UI

Remove or redesign these elements.

The result should look like a deliberately engineered trading terminal, not an AI-generated SaaS dashboard.

---

# 25. DO NOT OVER-CORRECT

Important:

Do not turn the UI into a minimalist empty dashboard.

Do not:

* remove important metrics
* hide useful information
* merge unrelated concepts
* eliminate necessary status indicators
* shrink everything
* make all text tiny
* remove useful explanatory context
* replace meaningful controls with ambiguous icons

Every change must improve:

READABILITY
or
HIERARCHY
or
EFFICIENCY
or
CONSISTENCY
or
INFORMATION DENSITY.

---

# 26. IMPLEMENTATION RULES

After auditing:

1. Fix the issues directly.
2. Reuse existing components where practical.
3. Create shared primitives where repetition is real.
4. Remove obsolete styles and dead UI code.
5. Remove duplicated components where appropriate.
6. Centralize typography rules where practical.
7. Centralize formatting utilities where needed.
8. Keep business logic unchanged unless you find an actual bug.
9. Do not alter financial calculations merely to improve UI.
10. Do not change API behavior unnecessarily.
11. Do not introduce new dependencies unless genuinely required.
12. Keep the application production-safe.

---

# 27. VERIFY AFTER EVERY MAJOR CHANGE

Run:

* type checking
* lint
* tests
* production build

Resolve regressions.

Then inspect every affected route again.

Do not consider the task complete just because the build passes.

A build passing does not prove that:

* text is readable
* hierarchy is good
* duplication is gone
* responsive layout works
* typography is consistent
* the interface looks professional

---

# 28. CREATE AN AUDIT REPORT BEFORE FINALIZING

Before completing the work, produce a concise but detailed report containing:

## Critical Issues

Issues that materially hurt usability.

## Readability Issues

Every major typography/font/contrast problem found and fixed.

## Repetition Issues

Every major duplicated UI/content/component pattern found and what was consolidated.

## Visual Hierarchy Issues

What previously competed for attention and how it was corrected.

## Responsive Issues

Desktop/tablet/mobile issues found.

## Component Cleanup

What was merged, removed, or standardized.

## Design-System Improvements

Typography, spacing, colors, borders, surfaces, and reusable primitives standardized.

## Remaining Issues

Anything intentionally left unchanged and why.

---

# 29. FINAL QUALITY BAR

Do not stop at:

“Looks cleaner.”

The final result should pass this test:

### At a glance

I can immediately understand:

* overall financial state
* which accounts are active
* which account is closest to breach
* current drawdown risk
* current exposure
* PnL
* important system/freshness state

### At normal reading distance

I can comfortably read:

* account names
* values
* risk percentages
* table rows
* timestamps
* statuses
* metadata

without squinting or relying heavily on hover tooltips.

### During active trading

The interface remains calm and readable.

Critical warnings stand out.

Normal information does not scream for attention.

### Visually

The terminal feels:

* professional
* dense
* deliberate
* coherent
* consistent
* technically polished

and NOT:

* repetitive
* cramped
* noisy
* generic
* AI-generated
* over-designed
* unreadable

---

# 30. MOST IMPORTANT INSTRUCTION

Do not limit yourself to the issues explicitly listed above.

Use your own design judgement.

While inspecting the repository, identify any additional problem involving:

* UX
* UI
* typography
* accessibility
* visual hierarchy
* responsive behavior
* component architecture
* repetition
* spacing
* information density
* semantic clarity
* interaction design
* state handling
* data presentation
* consistency
* maintainability

Fix legitimate issues even if they were not specifically mentioned in this prompt.

However:

DO NOT invent product requirements.

DO NOT add unnecessary features.

DO NOT redesign the information architecture without a strong reason.

DO NOT change financial/business logic unless there is an actual correctness issue.

The objective is to take the EXISTING Propr Terminal and make it feel like a significantly more mature, readable, coherent, and professionally engineered product.

Start with a full audit.

Then implement the fixes.

Then verify the entire terminal.
