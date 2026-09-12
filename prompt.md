Five elements in the layout suffer from dashboard bloat: redundant status dots, duplicated account counts, and decorative badges that state the obvious.

---

### 1. Top-Left Brand Block (`sidebar.tsx`)

* **Why it reads as slop:** The cyan square "P" with stacked micro-labels (`PROPR / TRADING TERMINAL`) looks like a generic boilerplate template.
* **The Fix:** Drop the cyan box. Use a clean, confident typographic lockup with tight tracking.

```tsx
// Replace the logo box with a minimal typographic header:
<div className="flex items-center gap-2 px-4 py-5 border-b border-zinc-900">
  <span className="font-semibold text-sm tracking-wider text-zinc-100">PROPR</span>
  <span className="text-[11px] font-mono text-zinc-500">// TERMINAL</span>
</div>

```

---

### 2. Top-Right Status Cluster (`top-bar.tsx`)

* **Why it reads as slop:** It clusters four separate widgets together: a `POLLING (15s)` pill, a `Updated 15s ago` timestamp, separate `REST` and `WS` indicator dots, and a refresh icon. This is telemetry overkill for a primary navigation bar.
* **The Fix:** Collapse everything into a single, muted status indicator and a plain refresh button. Move raw connection diagnostics exclusively to the `/system` page.

```tsx
// Clean top-right status:
<div className="flex items-center gap-3 text-xs text-zinc-400">
  <div className="flex items-center gap-1.5 font-mono text-[11px]">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
    <span>Synced 15s ago</span>
  </div>
  <button 
    onClick={onRefresh}
    className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
    aria-label="Refresh data"
  >
    <RefreshCw className="h-3.5 w-3.5" />
  </button>
</div>

```

---

### 3. Upper-Right Ledger Counter (`page.tsx`)

* **Why it reads as slop:** A pill displaying `2 Active · 6 Failed` floats inside the **Capital Ledger** card. Account lifecycle counts have no relationship to a fiat expense ledger. Worse, the section directly below is already titled `ACTIVE ACCOUNTS (2)`, and the link beneath says `Archived / Breached Accounts (6)`.
* **The Fix:** Delete this floating pill entirely from the Capital Ledger container. Let the ledger card focus strictly on cash numbers (Total Outflow, Active Capital, Net Outflow).

---

### 4. Shield "SAFE" Badges on Risk Cards (`risk-card.tsx`)

* **Why it reads as slop:** Antivirus-style shield badges labeled `SAFE` treat the user like an amateur. The numbers ($152.35 and $305.21 room to floor) already tell the trader their exact position.
* **The Fix:** Remove the shield badge. Show a plain, muted tag only when an account is under active risk rules, and let healthy accounts remain unbadged.

```tsx
// Instead of a green [Shield SAFE] pill:
// If healthy: render nothing or just the account tier/mode.
// If critical (<$50 to floor): render a minimal text warning.
{isNearBreach ? (
  <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 bg-rose-950/40 border border-rose-900/60 px-2 py-0.5 rounded">
    Breach Warning
  </span>
) : (
  <span className="text-[11px] font-mono text-zinc-500">
    EVALUATION
  </span>
)}

```

---

### 5. Bottom-Left Sidebar Telemetry (`sidebar.tsx`)

* **Why it reads as slop:** `REST API Healthy` and `Data updated 15s ago` repeat the top bar's telemetry word for word. Placing redundant heartbeat monitors in two opposing corners of the screen adds visual noise.
* **The Fix:** Strip out the entire bottom telemetry block. Keep the sidebar footer dedicated to the sidebar collapse button and app version.

```tsx
// Remove the stacked status dots. Keep the sidebar footer clean:
<div className="p-3 border-t border-zinc-900">
  <button
    onClick={() => setCollapsed(!collapsed)}
    className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full px-2 py-1.5"
  >
    <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
    {!collapsed && <span>Collapse</span>}
  </button>
</div>

```

---

# UI Refactor: Remove AI-Slop Shell Components

The current terminal shell still uses generic rounded pills, tiny telemetry labels,
duplicated health states, and decorative badges. Refactor these components without
changing business logic or financial calculations.

## Files

Primary:
- apps/terminal/src/components/sidebar.tsx
- apps/terminal/src/components/top-bar.tsx

Shared:
- shell-context / health state implementation
- status/badge utilities if present
- global styling tokens/classes as needed

## 1. Brand

Replace the current cyan rounded-square P logo treatment.

Current:
- cyan 24px rounded square
- "P"
- tracked PROPR
- 9px "TRADING TERMINAL"
- hover scale

New:
- use existing real brand asset from public/ if available
- otherwise use a minimal text-based mark
- PROPR: 16px semibold
- Trading Terminal: 11px muted
- no cyan square
- no hover scale
- no glow
- no decorative animation

## 2. TopBar freshness

Delete the bordered "POLLING · 15s" badge.

Create a shared DataFreshness component/state:

- LIVE: "● Live · 2s ago"
- POLLING: "● Updated 15s ago"
- STALE: "● Stale · 2m ago"
- OFFLINE: "● Offline"

Rules:
- no bordered pill
- no filled badge background
- no transport terminology in normal user-facing header
- keep refresh icon as a separate 32–36px icon button

REST/WS transport details belong on System, not the normal shell.

## 3. Remove duplicate REST/WS header telemetry

Delete the "REST ● WS ○" group from the normal top bar.

Do not remove the underlying health state.

Expose it only through:
- System page
- tooltip/detail view if needed

## 4. Account status badges

Replace rounded SAFE/CRITICAL/BREACHED pills with:

- "● SAFE"
- "● CRITICAL"
- "● BREACHED"

Rules:
- text + dot only
- no border
- no background
- no shield icon
- green/amber/red semantic color
- keep Evaluation/Funded as muted plain text, not pill-shaped badges

## 5. Active/Failed counts

Replace:
- [2 Active]
- [6 Failed]

with:
"2 active · 6 failed"

Counts become pills only when they are interactive filters on Accounts.

## 6. Sidebar footer

Delete the bottom:
- REST API healthy
- Data updated X ago

Do not replace them with another status block.

Sidebar should end after the collapse control.

## 7. Remove Sidebar health polling

Sidebar must not independently fetch /api/health.

Create or reuse one shared system-health state/hook.

TopBar and System consume the same state.

Sidebar consumes none of it.

This prevents duplicated polling and inconsistent UI state.

## 8. Sidebar section labels

Change:
- RISK
- TRADING
- ACCOUNTS
- FINANCE
- SYSTEM

to normal title case:
- Risk
- Trading
- Accounts
- Finance
- System

Style:
- 11–12px
- semibold
- muted
- Inter/system font
- no monospace
- no excessive tracking

## 9. Active nav item

Remove the rounded-card + inset-shadow appearance.

Use:
- 3px cyan left indicator
- subtle surface background
- white text
- no glow
- no heavy border

## 10. Global shell rule

Do not use the following pattern for normal UI state:
rounded pill + border + colored background + icon + tiny uppercase text.

Use:
- typography for brand
- typography + indicator for navigation
- dot + text for state
- plain text for counts
- pills only for interactive filters

## 11. Preserve invariants

Do NOT change:
- risk calculations
- breach/daily-loss calculations
- finance calculations
- account data
- polling interval
- WebSocket behavior
- read-only behavior
- stale/offline semantics

The repository is a read-only monitoring terminal, not an execution interface.

## 12. Acceptance criteria

At 2560x1440 and 1920x1080:

- top bar contains only page context + freshness + refresh
- no bordered polling badge
- no REST/WS telemetry cluster in normal top bar
- no health block at bottom of sidebar
- no rounded SAFE/CRITICAL badges
- no rounded Active/Failed summary badges unless interactive
- sidebar looks like navigation, not a monitoring console
- brand looks intentional rather than like a generated app-logo treatment
- all important shell text remains >= 12px
- no duplicated health polling between Sidebar and TopBar
The key rule

Do not replace one AI-slop component with a different AI-slop component.

Don't turn:

[ ● POLLING · 15s ]

into:

[ ● DATA FRESH ]

That is the same problem with different wording.

Turn it into:

● Updated 15s ago

Likewise:

[ 🛡 SAFE ]

shouldn't become:

[ ✓ HEALTHY ]

It should become:

● SAFE

That's the visual language this terminal needs.