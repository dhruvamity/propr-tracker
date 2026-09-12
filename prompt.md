# PROPR Terminal UI/UX Revamp

## Status

This is the implementation brief for the coding agent. Treat this document as the authoritative UI/UX direction for the revamp.

The existing terminal is functionally useful but visually overloaded. The primary problem is information architecture, not branding: too many fields are visible at once, the same metrics are repeated across cards/tables, typography is too small, and static rulebook/diagnostic information competes with live operational state.

The redesign must keep the existing business logic, risk calculations, cash accounting, read-only behavior, and truthful data freshness semantics. Change the presentation layer and component structure aggressively.

---

## 1. Product goal

PROPR is a personal prop-trading monitoring terminal.

The default experience must let the user answer these questions almost immediately:

1. Which account needs attention?
2. How much room remains before the binding risk limit?
3. What exposure do I currently have?
4. How much real INR cash have I spent and how much is still at risk?
5. Can I trust the freshness of the displayed data?

The UI should feel like a calm financial monitoring workspace, not a developer console or documentation site.

---

## 2. Core UX model: progressive disclosure

The current UI exposes three information levels simultaneously. Replace that with:

### Level 1: Glance
Show only the information needed to understand the current state.

### Level 2: Compare
Show compact comparisons across accounts, positions, orders, expenses, or failures.

### Level 3: Inspect
Expose detailed calculations, IDs, trade history, bank references, challenge configuration, and raw telemetry only when the user opens a detail drawer, row, modal, or dedicated inspection view.

### Rule
Do not shrink text to fit more information. Remove or defer secondary information instead.

---

## 3. Non-negotiable product invariants

Do not change the underlying calculations or semantics while redesigning the UI.

- Actual INR bank cash is the authoritative cash layer.
- USD face value is a separate nominal layer.
- Trading metrics are a separate layer from actual bank cash.
- Drawdown and daily-loss calculations must remain exactly as implemented.
- The application remains read-only.
- Do not add order placement, cancellation, modification, or market-close actions.
- Do not imply that the terminal can execute trades.
- Never synthesize or guess upstream data.
- Never display cached/polled data as realtime.
- When WebSocket is unavailable, explicitly show the polling/fallback state.
- Preserve existing account/risk business logic and server-side calculation boundaries.

---

## 4. Global visual direction

### Keep

- Dark UI.
- Inter for interface text.
- JetBrains Mono for monetary values, percentages, account IDs, timestamps, and dense numeric data.
- Green / amber / red semantic risk states.
- Cyan for selected/navigation/system information.
- Dense desktop information architecture where density is useful.

### Remove

- Tiny text used to force more content onto the screen.
- Repeated progress bars for the same metric.
- Heavy nested card-on-card layouts.
- Excessive uppercase headings.
- Long descriptive paragraphs inside operational screens.
- Static rulebook text embedded in live screens.
- Decorative terminal/cyberpunk language.
- Large empty panels around empty states.
- Duplicate account information shown in both cards and full tables.

### Typography floor

Use these as defaults:

| Element | Size |
|---|---:|
| Page title | 20px |
| Page subtitle | 13px |
| Section title | 13px |
| Body | 13px |
| Secondary text | 12px |
| Metadata minimum | 11px |
| Table rows | 13–14px |
| Primary financial metric | 28–34px |
| Secondary financial metric | 18–24px |

No important information should use 10px text.

### Contrast

Use clearly readable secondary text. Replace very dark grey metadata with approximately `text-zinc-400` / equivalent. Primary values should be `text-zinc-100` / equivalent.

Do not use low contrast to create visual hierarchy. Use size, spacing, grouping, and color semantics instead.

### Color semantics

- Green = safe / healthy / positive.
- Amber = caution / stale / approaching a limit.
- Red = critical / breached / loss.
- Cyan = selected / navigation / informational.
- White = primary content.
- Gray = secondary content.

One color must have one meaning throughout the application.

---

## 5. Layout system

### Desktop targets

Design and validate against:

- 2560×1440
- 1920×1080
- 1440×900
- 1024×768
- mobile layouts around 390×844

### Wide desktop

At 1440px and above:

- Sidebar: approximately 220–232px expanded.
- Main content uses the available horizontal space.
- Page padding: approximately 28–36px.
- Do not impose a narrow centered max-width that wastes 2K screen real estate.
- Tables may use most of the available width.
- Narrative/detail content may remain constrained where helpful.

### Spacing scale

Use a consistent spacing scale:

- 4px micro
- 8px compact
- 12px row/field
- 16px component
- 24px section
- 32px page

### Page structure

Prefer four visual bands over nested cards:

1. Attention / current state.
2. KPI summary.
3. Main workspace.
4. Supporting table or activity.

Only one or two areas on a page should have strong visual elevation.

---

## 6. Global shell

### Navigation

Use grouped navigation:

```text
PROPR
TRADING TERMINAL

OVERVIEW

RISK
  Monitor

TRADING
  Positions
  Orders

ACCOUNTS
  Active
  Archived

FINANCE

SYSTEM
```

Do not give every route equal visual weight.

`History` should no longer be a primary sidebar destination. Preserve `/history` as a compatibility route that redirects to `/accounts?tab=archived` (or equivalent) so existing links do not break.

### Sidebar

- Desktop expanded state around 220–232px.
- Collapsed state around 64px.
- Mobile becomes a drawer.
- Keep a compact footer with API and freshness state.

Footer example:

```text
● REST API healthy
● Data updated 12s ago
```

### Top bar

The top bar must communicate freshness truthfully.

Possible states:

```text
● LIVE · REALTIME
Updated 2s ago   REST ●   WS ●
```

```text
● POLLING · 15s
Updated 12s ago   REST ●   WS ○
```

```text
● STALE
Updated 2m ago   REST ○   WS ○
```

Never show `LIVE` when the realtime stream is disconnected.

---

## 7. Core component philosophy

The current design effectively follows "every useful field gets a visible block".

Replace that with:

> Every screen answers one primary question. Secondary information is available on demand.

### Recommended component structure

```text
components/
  layout/
    AppShell
    Sidebar
    TopBar
    PageHeader

  attention/
    AttentionBanner
    RiskAlert

  metrics/
    MetricStrip
    Metric
    ComparisonMetric

  risk/
    AccountRiskCard
    AccountRiskRow
    RiskMeter
    BindingLimit
    RiskStatus
    AccountDrawer

  trading/
    PositionTable
    OrderTable
    ExposureSummary

  accounts/
    AccountTable
    AccountDrawer
    AccountStatus

  finance/
    CashSummary
    CashFlowChart
    FirmBreakdown
    LedgerTable

  system/
    HealthGrid
    DataPipeline
    EventList
    RawLogDrawer

  shared/
    EmptyState
    Freshness
    StatusBadge
    CopyableId
    FilterBar
    DataTable
```

Consolidate existing primitives such as metric cards, risk bars, status badges, data tables, health pills, copyable IDs, and offline/freshness indicators into the shared system.

---

## 8. Rule of one

A metric should have one dominant visual occurrence per context.

Do not show the same `$22.40 daily room` in:

- hero stat
- subtext
- two progress bars
- lower metric row
- summary table
- directory table

on the same screen.

One dominant appearance is enough. Other views can reference it compactly.

---

# 9. Page specifications

## 9.1 Overview `/`

### Purpose

Executive command center: what needs attention right now, how much cash is involved, and what the current active accounts look like.

### Default layout

```text
OVERVIEW

[ATTENTION]
Critical account / or "All accounts healthy"

[CASH]
Total spent | Active cash at risk | Payouts

[ACTIVE ACCOUNTS]
Compact comparison of active accounts

[EXPOSURE]
Positions count | Orders count
```

### Attention section

If any account is critical/caution:

```text
NEEDS ATTENTION
Starter 1-Step Turbo
$22.40 daily-loss room remaining
86% consumed
[View risk →]
```

If everything is healthy:

```text
ALL ACCOUNTS HEALTHY
2 active · no immediate breach risk
```

### Cash summary

Show:

- Total actual cash spent.
- Active actual cash at risk.
- Payouts received.

Optional compact breakdown:

```text
Propr      ₹21,559.58
Breakout    ₹3,835.25
```

Do not turn this into four large competing cards.

### Active accounts

Show compact comparison rows/cards only. Do not repeat the complete Accounts table.

```text
Starter 1-Step Turbo      CRITICAL     $22.40 room
Explorer 1-Step Turbo     SAFE        $233.31 room
```

Clicking an account opens the shared Account Drawer.

### Remove

- Full active-account table from Overview.
- Repeated archived account information.
- Repeated risk calculations already visible in the account card.

---

## 9.2 Risk Monitor `/live`

### Purpose

Answer one question:

> Which active account is closest to its binding risk limit?

### Layout

```text
RISK MONITOR
2 active accounts · sorted by nearest binding limit

[Risk row/card 1]
[Risk row/card 2]

[small Market Reference strip]
```

### Risk card

Show only:

- Account name.
- Stage/status.
- Binding risk type.
- Remaining room.
- One dominant consumed-budget bar.
- Equity.
- Other relevant room metric.

Example:

```text
Starter 1-Step Turbo                     CRITICAL

$22.40
DAILY LOSS ROOM

██████████████████████░░  86% used

Equity              $5,078.47
Daily threshold     $5,056.07
Drawdown room         $228.47
```

### Binding limit

Explicitly label which rule is currently closest:

```text
BINDING LIMIT   Daily-loss threshold
```

Use `Daily-loss threshold`, not `Daily floor`, for the daily-loss rule to avoid confusion with the drawdown/breach floor.

### Progress bars

Use only one dominant risk-consumption bar.

Do not simultaneously render separate bars for:

- breach distance
- daily loss
- drawdown
- target progress
- radar

Secondary metrics should be numeric.

### Market reference

Keep this secondary and compact. Show only useful live market fields such as:

- Symbol/market.
- Mark price.
- 24h change.
- Funding rate.

Do not let the market table compete with account risk.

---

## 9.3 Positions `/positions`

### Purpose

Answer:

> Do I currently have exposure, and what is it?

### When positions exist

Use a table-first layout.

Suggested columns:

```text
Account | Asset | Side | Size | Entry | Mark | Liquidation | uPnL | ROE
```

Right-align numeric values.

Do not turn each position into a large card.

### When flat

Use a compact centered empty state:

```text
POSITIONS                         0

No open positions
2 active accounts · flat
Checked 12s ago
```

Then optionally show a compact account-risk context row below.

Do not create a huge empty card that consumes most of the viewport.

### Remove

- Static account sizing-gate cards from the default page.
- Perpetual contract rulebook table from the default page.
- Any trading mutation controls.

Detailed sizing/risk constraints may be accessible through account/detail inspection if useful, but must not dominate the page.

---

## 9.4 Orders `/orders`

### Purpose

Answer:

> What orders or protective stops are currently active?

### When orders exist

Use a table:

```text
Asset | Account | Side | Type | Trigger/Limit | Size | Status | Time in Force
```

No order mutation actions should be added.

### When empty

```text
ORDERS                         0 ACTIVE

No active orders
2 active accounts · no pending orders or protective stops
Checked 12s ago
```

### Remove from default page

- Static execution-rules cards.
- Fee explanations.
- Account-capacity instructional table.
- "Ready for orders" language.

If rulebook/reference content is useful, expose it through a secondary drawer/modal or documentation area, not the operational page.

---

## 9.5 Accounts `/accounts`

### Purpose

The one intentionally data-dense screen. This is where the user can inspect the complete account universe.

### Tabs

```text
All | Active | Funded | Archived / Breached
```

Keep search and sort controls visible.

### Primary table

Use these default columns:

```text
Stage | Account | Equity | Room | Status | Target / Failure
```

Keep the initial table readable. Do not expose every field by default.

### Account row

Compact row example:

```text
Starter 1-Step Turbo #fjU6
$5,078.47 equity
$22.40 room
CRITICAL
```

### Expanded/detail drawer

Expose deeper inspection here:

- Full account ID.
- Challenge/tier.
- Starting capital.
- Current/ending equity.
- Breach floor.
- Daily-loss threshold.
- Drawdown room.
- Target.
- Failure reason.
- Trade count/history.
- Purchase/cash reference.
- Other calculation inputs already available in the application.

### History consolidation

Do not maintain a separate primary History navigation item.

Use `/accounts?tab=archived` (or equivalent).

Keep `/history` as a redirect for compatibility.

---

## 9.6 Finance `/finance`

### Purpose

Answer:

> How much real money have I spent, how much is still at risk, and where did it go?

### Summary

Use a simple KPI strip:

```text
Total cash spent | Active cash at risk | Payouts | Net cash outflow
```

Primary values around 24px or larger.

Do not use arrows between these KPIs as if they are sequential process steps. They are related accounting measures, not a workflow.

### Visualization

Add one lightweight cash-flow visualization if supported by existing data:

- cumulative cash outflow
- cumulative payouts

Optionally show firm-level spend:

```text
Propr       ₹21,559.58
Breakout     ₹3,835.25
```

### Ledger

Default visible columns:

```text
Date | Firm | Challenge | Cash Debit (INR)
```

Use row expansion/detail drawer for:

- USD cost/face value.
- Account funded.
- Invoice.
- Bank reference.
- Verification state.

Truncate long bank references and provide copy-to-clipboard on interaction.

Do not repeat a large `BANK VERIFIED` badge on every row. Use a compact status/icon and reserve the full verification detail for inspection.

---

## 9.7 System `/system`

### Purpose

Answer:

> Can I trust this data right now?

### Health summary

Three compact status areas:

```text
REST API        HEALTHY
WebSocket       DISCONNECTED
Data pipeline   FRESH
```

Each state must show the relevant fallback/freshness detail.

### Pipeline

Compact representation:

```text
REST → CACHE → UI
       15s polling
```

Include monitored account count and last successful sync.

### Security

Keep only genuinely useful read-only/security invariants in a compact list.

### Recent events

Show a short, readable recent-event list by default.

Do not let the raw WebSocket console dominate the initial viewport.

Add:

`View raw event stream`

which opens a drawer/panel with the full telemetry console.

### Important wording

Use `Observed order event` / `Upstream fill event` terminology where necessary so event logs cannot be interpreted as the terminal executing trades.

---

# 10. Empty-state rules

Empty states must be small and useful.

Every empty state should contain:

- Current count.
- One clear sentence.
- Freshness/check time.
- Minimal context if useful.

Do not create a giant centered card simply because a table is empty.

Examples:

```text
No open positions
2 active accounts · flat
Checked 12s ago
```

```text
No active orders
2 active accounts · no pending orders
Checked 12s ago
```

---

# 11. Tables

Tables are the correct place for dense information, but they must remain readable.

Rules:

- Use one outer surface/border.
- Use subtle row dividers.
- Avoid a card around every row.
- Left-align text labels.
- Right-align money, percentages, quantities, prices, and counts.
- Use 13–14px row text.
- Keep metadata at 11–12px.
- Prefer fewer columns in the default state.
- Use row expansion/drawers for secondary fields.

---

# 12. Progressive disclosure rules

### Visible by default

- Risk status.
- Binding limit.
- Remaining room.
- Equity/balance when relevant.
- Cash summary.
- Positions count/exposure.
- Orders count.
- Freshness.

### Expandable / inspectable

- Trade trajectory.
- High-water mark.
- Calculation inputs.
- Detailed challenge rules.
- Fees.
- Bank references.
- Failure details.
- Raw telemetry.
- Detailed trade history.

Nothing should be deleted from the data model merely because it is hidden from the default view.

---

# 13. Risk visual rules

### One dominant risk visual

Every account/risk screen should have one primary consumption bar representing the binding/current risk budget.

Everything else stays numeric.

### Severity thresholds

Use one consistent severity mapping across the application. Derive it from the existing risk state/business logic rather than inventing a second risk model.

The visual must agree with the status badge:

- SAFE must not have a red danger bar.
- CRITICAL must look critical.
- BREACHED must look terminal/final.
- STALE must be visually distinct from risk severity.

Do not let freshness color and risk color become ambiguous.

---

# 14. Content / wording rules

Use short, operational labels.

Prefer:

- `Risk Monitor`
- `Active accounts`
- `Daily-loss room`
- `Drawdown room`
- `Market reference`
- `System health`
- `Recent events`
- `No active orders`
- `No open positions`

Avoid unnecessarily formal labels such as:

- `Perpetual Contract Constraints`
- `Execution Rules & Fee Protocol`
- `Active Breach Distance`
- `System Diagnostics & Gateway Health`
- `Data Pipeline Status`

Use normal title case for major headings. Reserve uppercase for compact field labels such as `EQUITY`, `ROOM`, `TARGET`, `STATUS`.

---

# 15. Avoid visual repetition

Do not repeat the same information in multiple nearby components.

Examples:

- If Overview has compact active-account risk rows, do not repeat a full Active Accounts table below them.
- If a risk card shows daily room, do not repeat the same daily room in three bars on that card.
- If Finance shows firm totals, the ledger does not need to repeat a large firm summary block.
- If System shows REST/WS/Data status at the top, do not repeat the same exact labels again in every subsection.

---

# 16. Responsive behavior

### Desktop

Use the wide canvas and multi-column layouts.

### Tablet

Reduce the number of simultaneous columns. Keep the most important risk metrics visible first.

### Mobile

- Collapsible navigation drawer.
- Single-column account cards.
- Horizontal scrolling for genuinely tabular data only.
- Sticky/visible key status and freshness state.
- Avoid forcing tiny fonts to fit tables.

---

# 17. Accessibility / readability

Treat readability as a product requirement, not polish.

Validate:

- Text contrast.
- Keyboard navigation.
- Focus visibility.
- Click/tap target sizes.
- Tooltip accessibility.
- Screen-reader labels for icon-only controls.
- No state communicated by color alone.
- Numeric alignment and scanability.

Do not use font size below 11px for essential information.

---

# 18. Implementation sequence

Do not redesign the pages as unrelated one-off screens. Build the shared system first.

## Phase 1 — Information architecture

- Remove duplicate information from each page.
- Decide default vs inspectable fields.
- Consolidate History into Accounts with Archived/Breached tab.
- Preserve `/history` compatibility via redirect.

## Phase 2 — Global shell

- Refactor Sidebar.
- Refactor TopBar freshness/realtime semantics.
- Add PageHeader.
- Establish typography and spacing tokens.
- Establish wide desktop container behavior.

## Phase 3 — Shared risk system

Build/refactor:

- `AccountRiskCard`
- `AccountRiskRow`
- `BindingLimit`
- `RiskMeter`
- `RiskStatus`
- `AccountDrawer`

Use these across Overview, Risk, and Accounts.

## Phase 4 — Overview + Risk

- Build the new command-center Overview.
- Build the simplified Risk Monitor.
- Remove duplicate account table from Overview.

## Phase 5 — Positions + Orders

- Table-first operational layouts.
- Small empty states.
- Remove static rulebook blocks from default views.
- Preserve read-only behavior.

## Phase 6 — Accounts

- Build dense but readable account table.
- Add tabs, filters, search, sort.
- Add account detail drawer.
- Integrate archived/breached accounts.

## Phase 7 — Finance

- Simplify cash summary.
- Add lightweight cash-flow visualization if data supports it.
- Reduce ledger columns and move details to inspection.

## Phase 8 — System

- Health-first layout.
- Compact pipeline/security summary.
- Recent events list.
- Raw log drawer.

## Phase 9 — QA

Validate at:

- 2560×1440
- 1920×1080
- 1440×900
- 1024×768
- 390×844

Also test:

- REST healthy + WS connected.
- REST healthy + WS disconnected.
- Stale data.
- API unavailable.
- No active positions.
- Active positions.
- No active orders.
- Active orders.
- All accounts healthy.
- Critical account.
- Failed/breached accounts.
- Empty Finance data if ever applicable.

---

# 19. Acceptance criteria

The redesign is complete only when these are true.

### Overview

Within ~3 seconds the user can identify:

- Most dangerous account.
- Daily room remaining.
- Total actual cash spent.
- Active cash at risk.

### Risk Monitor

Within ~2 seconds the user can identify:

- #1 risk account.
- Binding limit.
- Remaining room.
- Risk severity.

### Positions

Within ~2 seconds the user can tell:

- Whether any position is open.
- What exposure exists.

### Orders

Within ~2 seconds the user can tell:

- Whether any active/protective order exists.

### Accounts

Within ~5 seconds the user can identify:

- Active vs archived/funded accounts.
- Current equity.
- Risk room.
- Failure reason for archived accounts.

### Finance

Within ~5 seconds the user can identify:

- Total cash spent.
- Active cash at risk.
- Payouts.
- Net cash outflow.
- Major firm spending.

### System

Within ~3 seconds the user can answer:

- Is the API healthy?
- Is realtime connected?
- Is the displayed data fresh?
- What fallback mode is active?

---

# 20. Non-goals

Do not use this redesign to:

- Change risk calculations.
- Change challenge/account lifecycle logic.
- Add trading execution capabilities.
- Add fake/demo data.
- Replace the dark financial-terminal identity with a generic SaaS admin theme.
- Add decorative charts that do not help a decision.
- Add static documentation blocks to operational screens.

---

# 21. Final design test

The terminal should feel:

- Calm.
- Precise.
- Wide.
- Readable.
- Financial.
- Minimal in default presentation.
- Dense only where density improves comparison.

The target is not "show less data". The target is:

> **Show the right data at the right level of attention.**

A user on a 27-inch 2K monitor should not have to squint, hunt through repeated metrics, or mentally decode multiple competing progress bars to understand the state of the trading accounts.

The final UI should be judged by decision speed, readability, and state clarity, not by how many fields fit into a card.
