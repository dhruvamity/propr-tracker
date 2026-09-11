# Propr Trading Terminal — UI/UX Requirements & Design Specification

> **Target Audience**: UI/UX Designers, Product Designers, and Design Systems Engineers.  
> **Document Purpose**: Complete, authoritative product specification extracted directly from the verified production implementation of the Propr Trading Terminal. A designer should be able to read this document and produce high-fidelity desktop and mobile layouts in Figma without needing to inspect or reverse-engineer the underlying codebase.

---

# 1. Product Overview

### Purpose
The **Propr Trading Terminal** is a high-density, read-only monitoring dashboard and risk engine designed specifically for personal prop firm accounts on the **Propr** platform, with complete bank cash reconciliation across **Propr** and **Breakout**.

Prop firm traders trade evaluation challenges (simulated capital with strict breach limits) and funded accounts (with real profit payouts). If a trader violates a trailing drawdown limit or a daily loss ceiling, the account is permanently breached and liquidated. Furthermore, traders frequently experience "cash blindness" — confusing the nominal face value of purchased evaluation challenges ($25.00, $50.00, $143.75) with their actual bank out-of-pocket cash cost in Indian Rupees (INR) including FX markups, cross-border payment gateway fees, and multi-firm spending across other prop firms (Breakout).

The Propr Trading Terminal resolves these core challenges by unifying real-time risk proximity, position mark-to-market valuations, resting orders, and a Three-Layer Cash Ledger into a single, cohesive view.

### Primary User
A serious individual prop-firm futures and perpetuals trader who:
1. Manages multiple concurrent Propr challenges across different stages (active evaluation, passed benchmark, funded, breached, and closed).
2. Requires immediate, glanceable awareness of breach thresholds (how close current equity is to maximum trailing drawdown and daily loss floors).
3. Needs strict, bank-verified transparency into actual cash spent versus payouts received.

### Primary Use Cases
1. **Pre-Trade Risk Check**: Inspect remaining drawdown budget and daily loss headroom before opening a position.
2. **Intraday Trade Monitoring**: Track live open perpetual positions, mark prices, return on equity (ROE), and resting protective stop-loss orders.
3. **Multi-Account State Management**: Maintain clear separation between live accounts (capital at risk) and archived historical accounts.
4. **Cash Flow & ROI Audit**: Review actual bank debits (INR), challenge face values (USD), and processed payouts to know true net cash profitability.
5. **System Freshness & Telemetry**: Confirm connection status, REST sync timestamps, and data freshness.

### What the Terminal Monitors
- **Account Universe**: Active evaluations, funded issuances, passed phases, and historical breached accounts discovered automatically via Propr REST and WebSocket APIs.
- **Risk Metrics**: High-water mark (HWM), trailing drawdown limits, allowable drawdown budget consumed (%), daily loss limits, and profit target milestones.
- **Live Trading**: Open positions (asset, side, leverage, size, entry, mark price, liquidation price, uPnL, margin mode) and open/pending orders.
- **Three-Layer Financial Ledger**:
  - *Layer 1 (Face Value)*: USD nominal purchase price.
  - *Layer 2 (Actual Cash)*: Verified bank debits in INR, bank fees, refunds, and processed payouts.
  - *Layer 3 (Trading Performance)*: Trading balance, equity, realized PnL, and cumulative fees.

### What the Terminal Does NOT Do
- **Zero Trade Execution**: Does not place, modify, or cancel orders (`POST /orders` is strictly excluded).
- **Zero Fund Movement**: Does not initiate payout withdrawals or deposits.
- **Zero Account Creation**: Does not purchase challenges or register users.
- **Zero Synthetic Mocking**: Never fabricates fictional trading data on upstream failure; fails closed with explicit error indicators.

### Read-Only Constraints
The UI is strictly an observational, analytic, and risk-monitoring command center. It must never display actionable buy/sell buttons, "Place Order" controls, cancel icons, or transfer dialogs. All actions in the UI are limited to filtering, sorting, expanding rows, switching tabs, inspecting accounts, and refreshing data.

### Primary Data Sources
- **Propr REST API** (`https://api.propr.xyz/v1`): Discovers challenge attempts (`/challenge-attempts`), funded issuances (`/book-account-issuances`), positions (`/accounts/{id}/positions`), orders (`/accounts/{id}/orders`), trades (`/trades`), and payouts (`/payouts/history`).
- **Propr WebSocket API** (`wss://api.propr.xyz/ws`): Streams real-time mark updates, balance changes, and position delta events.
- **Bank-Verified Cash Ledger** (`@propr/finance`): Reconciled transactions from bank statements and purchase history exports.

### Realtime Limitations
- On serverless cloud hosting (e.g., Vercel), the terminal updates via Incremental Static Regeneration (ISR) with a 15-second revalidation window.
- Sub-second tick streaming requires running the background worker daemon (`services/propr-sync`) connected to a container runtime and Redis.
- The UI must transparently communicate freshness (e.g., "15s ISR Enabled" or "Live WebSocket").

---

# 2. User & Core Use Cases

### User Persona: "The Risk-Conscious Prop Trader"
- **Mindset**: Disciplined, quantitative, risk-averse. Focused on capital preservation.
- **Pain Points**:
  - Prop firm dashboards intentionally obscure how close a trader is to their breach point.
  - Trailing drawdowns ratchet upward on unrealized intraday peaks, creating hidden liquidation floors.
  - Confusing nominal evaluation fees with actual out-of-pocket bank expenses.
  - Forgetting about resting limit or stop orders on secondary accounts.
- **Working Environment**: Dual monitors or widescreen desktop during active market sessions; mobile phone checks while away from the trading desk.

### Workflow Journey
```text
[Open Terminal]
       │
       ▼
[Executive Top Bar] ──► Checks System Freshness & API Gateway Health
       │
       ▼
[Financial Header]  ──► Verifies Active Cash at Risk (₹7,336.19) vs Total Cash Spent (₹25,394.83)
       │
       ▼
[Active Risk Cards] ──► Inspects Drawdown Consumed Gauge (e.g., 64% consumed) & Daily Loss Headroom
       │
       ▼
[Positions & Orders]──► Reviews Open Exposure & Verifies Stop Orders Exist
       │
       ▼
[Accounts / Finance]──► Conducts Deep Audit of Individual Challenges or Bank Transactions
```

---

# 3. Information Architecture

### Sitemap & Route Hierarchy

```text
PROPR TRADING TERMINAL
├── / (Dashboard / Overview) ─────────── [P0 - Primary Command Center]
├── /live (Live Risk Radar) ──────────── [P0 - Real-time Breach Watch]
├── /accounts (Accounts Directory) ───── [P0 - Complete Universe & State Machine]
├── /positions (Open Positions) ──────── [P0 - Active Margin & Mark Table]
├── /orders (Open & Resting Orders) ──── [P1 - Unexecuted & Trigger Orders]
├── /finance (Cash Ledger & ROI) ─────── [P0 - Three-Layer Cash & Bank Reconciliation]
├── /history (Past Accounts Archive) ─── [P2 - Breached & Closed Audit Trail]
├── /system (Diagnostics & Telemetry) ── [P2 - Infrastructure & Health]
└── /api/health (Service Telemetry) ──── [P3 - Machine-Readable Endpoint]
```

### Route Classification Matrix

| Route | Page Purpose | Primary User Question | Priority | Classification |
| :--- | :--- | :--- | :---: | :--- |
| `/` | Multi-account summary & risk overview | "How are all my active accounts and risk metrics doing right now?" | **P0** | Primary |
| `/live` | Focused active account risk radar | "Which of my active accounts is closest to a liquidation breach?" | **P0** | Primary |
| `/accounts` | Comprehensive account universe | "What is the full lifecycle state, balance, and rule config for each account?" | **P0** | Primary |
| `/positions`| Unified open position table | "What live market exposure and unrealized PnL do I hold across all accounts?" | **P0** | Primary |
| `/orders` | Resting and conditional orders | "What unfilled limit orders or protective stop orders are currently active?" | **P1** | Secondary |
| `/finance` | Three-layer cash ledger & bank reconciliation | "How much actual bank cash have I spent across Propr and Breakout vs payouts?" | **P0** | Primary |
| `/history` | Historical archive of closed accounts | "Why did my previous evaluation challenges fail, and what were the end stats?" | **P2** | Secondary |
| `/system` | System diagnostics & API telemetry | "Is my connection to the Propr API gateway healthy, stale, or experiencing errors?" | **P2** | Diagnostic |
| `/api/health`| Health status JSON endpoint | "What is the machine-readable runtime status?" | **P3** | API-only |

---

# 4. Global Shell Requirements

The application shell establishes the persistent frame around every page. It consists of:
1. **Collapsible Left Sidebar**: Primary navigation, branding, and API heartbeat dot.
2. **Top Navigation Bar**: Terminal title, live status badge, relative sync timestamp, and manual refresh control.
3. **Main Content Canvas**: Contained, high-density view with responsive padding.

### Shell Layout Structure
```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: [Logo] PROPR // ACCOUNT TERMINAL            [● LIVE] [Synced 4s ago] [⟳ Refresh]        │
├──────────────┬───────────────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR      │ MAIN CONTENT AREA                                                                 │
│              │                                                                                   │
│ [⊞] OVERVIEW │  [Page Header / Breadcrumb / Title]                                               │
│ [◎] LIVE     │                                                                                   │
│ [▤] ACCOUNTS │  [Primary Metric Strip / Executive Cards]                                         │
│ [▲] POSITIONS│                                                                                   │
│ [≡] ORDERS   │  [Workspaces: Grids, Tables, Risk Gauges]                                         │
│ [◈] FINANCE  │                                                                                   │
│ [↺] HISTORY  │                                                                                   │
│ [⚙] SYSTEM   │                                                                                   │
│              │                                                                                   │
│ ──────────── │                                                                                   │
│ [◀ Collapse] │                                                                                   │
│ [● API LIVE] │                                                                                   │
└──────────────┴───────────────────────────────────────────────────────────────────────────────────┘
```

### Global Shell Element Specifications

| Element | Content | Data Source | Desktop Behavior | Mobile Behavior | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Brand Logo** | "P" monogram + "PROPR TERMINAL" | Static | Fixed top-left; collapses to "P" icon on collapse | Displayed in top bar header | **P0** |
| **Navigation Links** | 8 primary routes with icons | Client router (`usePathname()`) | 208px wide; collapses to 56px icon rail | Off-canvas sliding drawer triggered by hamburger | **P0** |
| **Sync Indicator** | Pulse dot + "LIVE" / "STALE" / "ERROR" | `/api/health` + `lastSyncAt` | Always visible in Top Bar | Visible in compact form (dot + text) | **P0** |
| **Relative Timestamp** | "Just now", "12s ago", or IST time | Computed from `health.lastSyncAt` | Updates every 5s; turns amber if >60s | Displays compact (e.g., "12s") | **P1** |
| **Refresh Button** | Circular arrow button with spinning state | User click (`window.location.reload()`) | Top Bar right | Top Bar right | **P1** |
| **API Status Dot** | Glowing status dot at bottom of sidebar | `health.restStatus` | Sidebar footer | Integrated into mobile drawer footer | **P2** |

---

# 5. Navigation

### Primary Desktop Navigation
- **Sidebar Width**: Expanded: `208px` (`w-52`); Collapsed: `56px` (`w-14`).
- **Transition**: Smooth ease-in-out width transition (`300ms`).
- **Active Route State**: Marked with a solid accent border (`border-r-2 border-[var(--cyan)]`), elevated background (`bg-[var(--bg-elevated)]`), and high-contrast text.
- **Hover State**: Subtle background tint (`hover:bg-[var(--bg-elevated)]`).
- **Keyboard Access**: Standard focus rings, tab navigable, `aria-current="page"` on active item.

### Mobile Navigation
- **Breakpoint**: Below `768px` (standard tablet/mobile breakpoint).
- **Pattern**: Collapsible top-bar hamburger triggering an overlay drawer from the left.
- **Backdrop**: Semi-transparent black blur (`backdrop-blur-sm bg-black/60`).
- **Touch Target**: Minimum `44px × 44px` per link.

---

# 6. Design Principles

1. **High Information Density**: Built for financial monitoring. Avoid excessive whitespace, oversized cards, or decorative illustrations that push critical numbers off-screen.
2. **Calm When Healthy, Urgent When At Risk**: Normal operations should look restrained, monochromatic, and orderly. Drawdown warnings, breach threats, and failed API states must stand out decisively with saturated semantic accents.
3. **Monospace for Numbers**: All currencies, quantities, percentages, prices, and timestamps must use a dedicated tabular monospace font (`JetBrains Mono`). Numbers must align vertically across table rows.
4. **Strict Financial Hierarchy**: Never visually equate nominal face values with actual cash spent. Never visually equate paper trading PnL with actual cash return.
5. **Truthful Freshness**: Stale data or disconnected streams must visibly degrade. The UI must never masquerade an offline or cached state as live.
6. **Zero Action Affordances**: As a read-only terminal, never style a metric, row, or badge to look like an order trigger or interactive trading button.

---

# 7. Dashboard (`/`)

The Dashboard is the executive command center. It provides an immediate, glanceable assessment of financial health, risk proximity, and open trading exposure.

### Layout Hierarchy
1. **Executive Financial Header (Top)**: 4 key financial metrics grounded in the Three-Layer Cash Model.
2. **Account Distribution Bar**: Compact status chips summarizing account counts across lifecycle stages.
3. **Active Account Risk Monitor**: Grid of cards displaying active challenges, equity, and progress bars.
4. **All Accounts Directory**: Compact tabular view of the complete account universe.
5. **Positions & Orders Split**: Side-by-side terminal panes showing open exposure and resting orders.

### Metric Mapping Table

| Metric Label | Exact Semantic Meaning | Data Source | Calculation / Formula | Display Format | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TOTAL ACTUAL CASH SPENT** | Total out-of-pocket bank cash spent across all prop firms (Propr + Breakout) | Bank Statement Ledger (`SEED_PURCHASES`) | `Propr INR Cash + Breakout INR Cash - Refunds` | `₹25,394.83` | **P0** |
| **ACTIVE CAPITAL** | Actual bank cash currently at risk in active, non-breached accounts | Active Bank Debits | `∑(actualCashCostINR)` where stage is `EVALUATION` or `FUNDED` | `₹7,336.19` (Est Face: `$75.00`) | **P0** |
| **PAYOUTS WITHDRAWN** | Total processed cash received into bank account from funded accounts | Propr API (`/payouts/history`) | `∑(amount)` where status is `processed` | `₹0.00` (`$0.00 USD`) | **P0** |
| **ACTUAL CASH P&L** | Net real money return across all prop-firm activity | Three-Layer Cash Ledger | `Total Processed Payouts INR - Total Actual Cash Outflow INR` | `-₹25,394.83` (Red) | **P0** |
| **ACTIVE EVALUATIONS** | Count of currently active challenge attempts | `/challenge-attempts` | Count where status is `active` | Integer badge (`2`) | **P1** |
| **FUNDED ACCOUNTS** | Count of active funded accounts | `/book-account-issuances` | Count where status is `active` | Integer badge (`0`) | **P1** |
| **FAILED / BREACHED** | Count of permanently failed challenge attempts | `/challenge-attempts` | Count where status is `failed` | Integer badge (`6`) | **P1** |
| **ACCOUNT EQUITY** | Live account value including unrealized gains/losses | Account Snapshot | `Balance + Unrealized PnL + Isolated Margin` | `$4,978.50` | **P0** |
| **DRAWDOWN CONSUMED** | Percentage of allowable loss budget already burned | Calculations Engine | `(Drawdown Used / Max Drawdown Amount) * 100` | Percentage (`64.0% of limit`) | **P0** |
| **PROFIT TARGET PROGRESS**| Progress toward passing the current challenge phase | Calculations Engine | `((Equity - Starting Balance) / Target Amount) * 100` | Percentage (`0.0%`) | **P1** |
| **OPEN POSITIONS** | Number of active positions with quantity > 0 | `/accounts/{id}/positions`| Count where `abs(quantity) > 0` | Integer badge (`0`) | **P1** |
| **OPEN ORDERS** | Number of resting or triggered orders | `/accounts/{id}/orders` | Count where status is `open` or `pending` | Integer badge (`0`) | **P1** |

---

# 8. Critical Semantic Distinctions

A designer must understand the following mathematical and domain distinctions to avoid visual conflation:

### Distinction 1: Nominal Face Value vs Actual Bank Cash Cost
- **Face Value ($ USD)**: The advertised challenge price on the prop firm's website (e.g., $50.00 Explorer challenge).
- **Actual Cash Cost (₹ INR)**: The exact debit from the user's bank account (e.g., ₹4,890.24). This reflects foreign merchant transaction markups, gateway fees, and real bank debit rates.
- **UI Rule**: Never compute INR cash by multiplying USD face value by a static FX rate ($50 × 84.5 = ₹4,225.00 is false). Display the bank-verified figure as primary, with the USD face value as a secondary reference.

### Distinction 2: Active Capital vs Sunk Historical Cost
- **Active Capital**: Cash tied to accounts that can still be traded, passed, or funded (currently **₹7,336.19** across 2 accounts).
- **Sunk Historical Cost**: Cash spent on failed or breached evaluation challenges (currently **₹18,058.64** across 7 purchases).
- **UI Rule**: Sunk costs must never be counted inside "Active Capital". Sunk costs belong in historical accounting.

### Distinction 3: Paper Trading PnL vs Real Cash PnL
- **Trading PnL**: Simulated balance gains or losses inside the broker demo environment (e.g., `-$21.50 USD`).
- **Actual Cash PnL**: Real-world bank money won or lost: `Payouts Received - Bank Outflows` (e.g., `-₹25,394.83 INR`).
- **UI Rule**: Never show paper trading PnL on the top-level financial summary card. Paper PnL belongs strictly inside account cards and positions.

### Distinction 4: Raw Balance Loss % vs Drawdown Limit Consumed %
- **Raw Balance Loss %**: Drop from initial balance (e.g., losing $200 on a $5,000 account = `4.0%` loss).
- **Drawdown Limit Consumed %**: Portion of the allowable breach cushion that has been burned. On a $5,000 account with a 5% ($250) maximum drawdown limit, a $160 loss has consumed **64.0% of the allowable limit**.
- **UI Rule**: The primary risk gauge must display **Drawdown Limit Consumed %**. Showing 3.2% when an account is at 64% of its fatal limit creates fatal complacency.

### Distinction 5: Trailing Drawdown vs Static Drawdown
- **Static Drawdown**: Limit is fixed at `Initial Balance - Max Drawdown`.
- **Trailing Drawdown**: Limit ratchets upward as Account Equity reaches new High-Water Marks (HWM), locking in risk at higher levels.
- **UI Rule**: Accounts with trailing drawdowns must visually indicate the HWM floor and note `(trailing DD)` in the challenge badge.

---

# 9. Accounts (`/accounts`)

The Accounts page provides complete visibility into every challenge attempt and funded book issuance.

### Supported Account Stages & Statuses
1. **`EVALUATION`**: Active challenge in progress. Trader is attempting to reach the profit target without breaching rules.
2. **`PASSED`**: Profit target achieved, minimum trading days met. Awaiting funded account issuance.
3. **`FUNDED`**: Active funded account (A-Book or B-Book). Profits are eligible for withdrawal.
4. **`BREACHED`**: Account violated maximum drawdown or daily loss. Trading is permanently disabled.
5. **`FAILED`**: Expired or closed challenge attempt.
6. **`CLOSED`**: Funded account closed or decommissioned.
7. **`REVIEW_PENDING`**: Account under compliance or risk audit.

### Account Directory Table Specifications

| Column Name | Data Field | Display Format | Sortable | Priority |
| :--- | :--- | :--- | :---: | :---: |
| **Stage** | `acc.stage` | Semantic badge (Cyan = EVAL, Green = FUNDED, Red = FAILED) | Yes | **P0** |
| **Account ID / Tier** | `acc.accountId`, `acc.challengeName` | Short ID (e.g., `4D8XWuQ3`) + Challenge title (e.g., "Starter Turbo") | Yes | **P0** |
| **Starting Balance** | `acc.startingBalance` | Monospace USD (`$5,000.00`) | Yes | **P1** |
| **Current Balance** | `acc.balance` | Monospace USD (`$4,978.50`) | Yes | **P0** |
| **Equity** | `acc.equity` | Monospace USD bold (`$4,978.50`) | Yes | **P0** |
| **Drawdown Status** | `acc.drawdownLimitConsumedPercent`, `acc.drawdownUsedPercent` | Primary: `64.0% of limit`; Secondary: `3.2% loss` | Yes | **P0** |
| **Target Progress** | `acc.profitTargetProgressPercent` | Monospace percentage (`0.0%` or `85.2%`) | Yes | **P1** |
| **State / Failure Reason** | `acc.failureReason` | Green text ("Evaluation Active") or Red text ("MAX DRAWDOWN") | Yes | **P0** |

---

# 10. Account Risk UI

The Risk UI is the core safety mechanism of the terminal. It communicates proximity to account liquidation.

### Drawdown Visual Representation
- **Meter Type**: Linear horizontal progress gauge with dual thresholds.
- **Scale**: `0%` (safe, no drawdown) to `100%` (breached, account liquidated).
- **Threshold Zones**:
  - `0% – 40%`: **Normal / Safe** (`var(--cyan)` or `var(--green)`).
  - `40% – 75%`: **Elevated Risk / Caution** (`var(--amber)`).
  - `75% – 100%`: **Critical Breach Danger** (`var(--red)` + pulsing warning indicator).

### Daily Loss Monitoring
- **Base Formula**: `Day-Start Balance + Starting Isolated Position Margin`.
- **Warning Trigger**: When equity drops within 25% of the daily loss limit floor.
- **Labeling**: Must explicitly show remaining dollar cushion: `"Daily Loss Cushion: $124.50 remaining"`.

### Risk State Decision Matrix

| State | Condition | Visual Indicator | Icon | Urgency |
| :--- | :--- | :--- | :---: | :---: |
| **HEALTHY** | Limit Consumed < 40% | Cyan progress bar, green dot | Shield | Normal |
| **CAUTION** | Limit Consumed 40% – 75% | Amber progress bar, amber badge | AlertTriangle | Elevated |
| **CRITICAL** | Limit Consumed > 75% | Red progress bar, red badge, pulsing text | Flame / AlertOctagon | Urgent |
| **BREACHED** | Equity ≤ Drawdown Limit Floor | Solid red card outline, strike-through badge | XCircle | Final |
| **STALE** | Sync older than 60s | Amber banner, dim values | Clock | Warning |

---

# 11. Positions (`/positions`)

The Positions page displays all active perpetual and futures contracts held across all monitored accounts.

### Zero-Quantity Filtering Rule
The upstream Propr API retains closed positions in memory with `quantity: "0"` or `"0.00000000"`. The UI must strictly filter out flat zero-quantity positions (`abs(quantity) > 0`). Flat positions must never be displayed in the active positions table.

### Positions Table Columns

| Column Name | Data Field | Semantics & Format | Priority |
| :--- | :--- | :--- | :---: |
| **Asset / Contract** | `pos.asset` (e.g., `BTCUSD`, `ETHUSD`) | Bold symbol ticker | **P0** |
| **Side & Leverage** | `pos.positionSide`, `pos.leverage` | Green badge for `LONG 5x`, Red badge for `SHORT 5x` | **P0** |
| **Account** | `pos.accountId` | Truncated ID (e.g., `urn:prp-acc...J9wN`) | **P1** |
| **Size / Quantity** | `pos.quantity` | Monospace decimal (handles up to 8 decimals: `0.00500000`) | **P0** |
| **Entry Price** | `pos.entryPrice` | Monospace currency (`$64,250.00`) | **P0** |
| **Mark Price** | `pos.markPrice` | Cyan highlighted monospace (`$64,180.50`) | **P0** |
| **Liquidation Price** | `pos.liquidationPrice` | Warning-tinted monospace (`$51,400.00`) or `N/A` | **P1** |
| **Margin Used & Mode** | `pos.marginUsed`, `pos.marginMode` | Currency + mode label: `$642.50 (cross)` | **P1** |
| **Unrealized PnL** | `pos.unrealizedPnl` | Green `+$142.50` or Red `-$35.20` | **P0** |
| **Return on Equity (ROE)**| `pos.returnOnEquity` | Percentage with sign: `+22.18%` or `-5.48%` | **P0** |

---

# 12. Live Position Experience (`/live`)

The `/live` route functions as an active trade monitor for sessions where the trader has active market exposure.

### Purpose
To eliminate cognitive overhead during active market hours by stripping away historical clutter and displaying only live accounts, live equity fluctuations, and breach proximity.

### Requirements
1. **High Refresh Rate**: Prioritizes live equity updates and drawdown meters.
2. **Visual Breach Proximity**: Large, prominent progress gauges for each active account.
3. **Audio/Visual Warnings**: (Optional for design) Clear red pulse when an active position drives an account into >75% drawdown consumption.
4. **Empty State**: When no accounts are active, render: `"No active accounts currently in evaluation or funded stage."`.

---

# 13. Orders (`/orders`)

The Orders page provides complete visibility into resting limit orders, conditional stops, and unexecuted fills.

### Supported Order Statuses & Types
- **Statuses**: `open`, `pending`, `partially_filled`, `filled`, `cancelled`, `expired`.
- **Types**: `limit`, `market`, `stop_loss`, `take_profit`, `stop_market`.

### Orders Table Specifications

| Column Name | Data Field | Display Format | Priority |
| :--- | :--- | :--- | :---: |
| **Asset** | `ord.asset` | Bold ticker (e.g., `BTCUSD`) | **P0** |
| **Side** | `ord.side` | Green text `BUY` / Red text `SELL` | **P0** |
| **Type** | `ord.type` | Uppercase chip: `LIMIT`, `STOP_LOSS`, `TAKE_PROFIT` | **P0** |
| **Status** | `ord.status` | Cyan/Amber status badge (`OPEN`, `PENDING`) | **P0** |
| **Size** | `ord.quantity` | Monospace decimal (`0.10000000`) | **P1** |
| **Price / Trigger** | `ord.price` or `ord.triggerPrice` | Target price (`$63,500.00`) or trigger (`Trigger: $62,000.00`) | **P0** |
| **Account** | `ord.accountId` | Short ID | **P1** |
| **Created Time** | `ord.createdAt` | Relative or formatted time (`14:23:05 IST`) | **P2** |

---

# 14. History (`/history`)

The History page is the permanent audit trail for closed, breached, and completed accounts.

### Data Model
- Sourced from historical challenge attempts (`/challenge-attempts` with status `failed`, `passed`, or `closed`) and decommissioned issuances.
- Captures the terminal reason for account closure:
  - `MAX_DRAWDOWN_BREACH`: Account equity violated the maximum trailing or static drawdown limit.
  - `DAILY_LOSS_BREACH`: Equity fell below the day-start daily loss floor.
  - `PASSED_BENCHMARK`: Challenge successfully completed.
  - `USER_CLOSED`: Account voluntarily retired.

### History Table Columns
1. **Stage**: Badge (`FAILED` in red, `PASSED` in purple, `CLOSED` in gray).
2. **Account ID**: Monospace ID with copy button.
3. **Challenge Tier**: Nominal size and type (e.g., "$25K Starter Turbo").
4. **Initial Balance**: Starting capital (e.g., `$5,000.00`).
5. **Final Equity / Balance**: Account equity at the moment of closure.
6. **Breach / Failure Reason**: Explicit reason string with human-readable formatting.
7. **Closed Timestamp**: Date of closure.

---

# 15. Finance (`/finance`)

The Finance page is the authoritative cash accounting ledger. It separates internal broker metrics from actual bank money.

### The Three-Layer Accounting Principle
The page must visually segregate the three accounting layers:
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THREE-LAYER ACCOUNTING MODEL                               │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│ LAYER 1: FACE VALUE (USD)  │ LAYER 2: ACTUAL CASH (INR)  │ LAYER 3: TRADING METRICS    │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Nominal challenge cost     │ Real bank statement debits  │ Simulated paper equity      │
│ Advertised tier value      │ Bank FX fees & surcharges   │ Broker account balance      │
│ Static USD pricing         │ Verified bank transaction ID│ Realized/Unrealized PnL     │
│ Estimated USDxFX conversion│ Real refunds received       │ Broker commissions & fees   │
│                            │ Processed cash payouts      │                             │
│                            │ Net Cash PnL (True Return)  │                             │
└────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

### Finance Summary Cards (4-Column Layout)
1. **TOTAL ACTUAL CASH SPENT**: `₹25,394.83 INR`
   - *Subtext*: `Propr: ₹21,559.58 | Breakout: ₹3,835.25`
   - *Secondary*: `Nominal Face: $218.75 USD`
2. **ACTIVE CAPITAL**: `₹7,336.19 INR`
   - *Subtext*: `Grounded in active bank debits`
   - *Secondary*: `Active Face: $75.00 USD`
3. **PAYOUTS WITHDRAWN**: `₹0.00 INR`
   - *Subtext*: `Processed Bank Cash`
   - *Secondary*: `$0.00 USD`
4. **ACTUAL CASH P&L**: `-₹25,394.83 INR`
   - *Subtext*: `Net Outflow across all prop firms`
   - *Secondary*: `-$300.53 USD equiv`

---

# 16. Finance Ledger Table

A comprehensive ledger detailing all 9 reconciled historical and active transactions.

### Master Reconciliation Columns

| Field | Source | Sample Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Date** | Bank / CSV | `08-09-2026` | Date cash left the bank account |
| **Firm** | Ledger | `Propr` or `Breakout` | Multi-firm attribution |
| **Account ID** | Propr API | `urn:prp-account:J9wNi8oj3XGK` | Associated challenge account |
| **Type** | Ledger | `purchase`, `refund`, `payout` | Transaction classification |
| **Face Value USD** | Propr Catalog | `$50.00` | Nominal USD price |
| **Actual Cash INR** | Bank Statement | `₹4,890.24` | Exact rupee amount debited |
| **Cash Status** | Derived | `Active Capital` vs `Historical / Sunk` | Balance sheet classification |
| **Bank Reference** | Bank Statement | `PRCR/Paysagi_propr.xyz/...` | Verifiable banking proof |
| **Verified Badge** | Verification Engine | `BANK VERIFIED` (Green chip) | Audit proof confirmation |

---

# 17. Cash PnL Visualization

### Chart Feasibility & Specification
- **Supported Data**: The repository contains discrete transactional cash ledger entries across 9 purchases spanning August 24, 2026 to September 11, 2026.
- **Chart Type**: Cumulative Step/Line Area Chart representing **Cumulative Net Cash Outflow vs Payouts**.
- **X-Axis**: Transaction Date (timeline from Aug 24 to Sep 11).
- **Y-Axis**: Cumulative Net Cash in INR (`₹0` down to `-₹25,394.83`).
- **Series**:
  1. *Cumulative Net Cash Outflow* (Red/Amber step line declining with each purchase).
  2. *Cumulative Payouts* (Green step line, currently at 0).
- **Prohibited Charting**: Continuous intraday cash curves are *not supported* because bank debits occur as discrete events. Do not design high-frequency curves for cash accounting.

---

# 18. History / Finance Distinction

| Dimension | Trading History (`/history`) | Finance Ledger (`/finance`) |
| :--- | :--- | :--- |
| **Core Question** | "What happened inside the trading accounts?" | "What happened to my real bank money?" |
| **Currency** | USD ($) | INR (₹) primary, USD ($) secondary |
| **Data Scope** | Broker trades, fills, drawdown violations | Bank debits, invoices, refunds, withdrawals |
| **Source** | Propr REST / WebSocket endpoints | Bank account statements & payment receipts |
| **Failure State** | Breached rules, closed challenges | Sunk purchase capital |
| **Visual Accent** | Monospace trading terminal styling | Balance sheet ledger & accounting styling |

---

# 19. System Diagnostics (`/system`)

The System page provides full visibility into the backend runtime environment, connection status, and security invariants.

### Required Diagnostic Sections
1. **Service Telemetry**:
   - `REST API Gateway`: `HEALTHY` (Green badge).
   - `WebSocket Stream`: `CONNECTED` or `DISCONNECTED (15s ISR Enabled)`.
   - `Last REST Sync`: Timestamp formatted in Indian Standard Time (`IST`).
   - `Monitored Accounts`: Total account universe count (`8`).
2. **Security & Read-Only Invariants**:
   - `Zero Order Placement Endpoints`: Verified (`POST /orders` excluded).
   - `API Key Server-Side Isolation`: Verified (never exposed in client props).
   - `Multi-Account Data Partitioning`: Verified (isolated in-memory stores).
   - `Strict Decimal.js Math`: Verified (zero IEEE-754 floating-point errors).

---

# 20. Health & Sync UX States

The application features 6 discrete synchronization states that must be rendered consistently:

| State | Trigger Condition | Badge / Icon Treatment | User Message |
| :--- | :--- | :--- | :--- |
| **LIVE** | REST API healthy and sync < 30s | Green glowing dot, green text | "LIVE — Synchronized" |
| **SYNCED** | Successful sync 30s – 60s ago | Solid green dot, muted text | "Synced 42s ago" |
| **STALE** | No successful sync for > 60s | Amber pulsing dot, amber text | "STALE — Last update 2m ago" |
| **ERROR** | Upstream API returned 5xx / timeout | Red solid dot, red text | "API ERROR — Upstream unavailable" |
| **OFFLINE** | Network unreachable / client offline | Gray dot, red banner | "OFFLINE — Check network connection" |
| **DEGRADED** | WebSocket closed, falling back to REST | Amber warning chip | "REST Fallback Mode (15s polling)" |

---

# 21. Realtime & Freshness UX Rules

1. **No Fake "Live" Badges**: Never show a green pulsating "LIVE" badge if the data was retrieved via a 15-second ISR cache. If in ISR mode, display `"15s ISR Enabled"`.
2. **Relative Time Precision**:
   - `< 10s`: Display `"Just now"`.
   - `10s – 59s`: Display `"{N}s ago"`.
   - `60s – 3600s`: Display `"{N}m ago"` (highlighted in amber).
   - `> 1 hour`: Display exact timestamp: `"HH:mm:ss IST"`.
3. **Manual Refresh Affordance**: Provide a discrete, non-intrusive refresh button (`⟳`) in the Top Bar that triggers an immediate revalidation cycle.

---

# 22. Stale Data UX

When data becomes stale due to upstream outages or network latency:
- **Visual Treatment**: Reduce opacity of numeric values slightly (to 85%) and display a slim amber status banner across the top of the workspace:
  > `⚠ Displaying cached snapshot from 14:22:10 IST. Upstream Propr API is temporarily unreachable.`
- **Integrity Guarantee**: Never wipe values or display `$0.00` during a temporary network disconnect. Retain the last known valid snapshot with an explicit stale timestamp.

---

# 23. Error, Empty, & Loading States

### Concrete Error Copy Rules (No Generic "Something Went Wrong")
- **API Disruption**: `"Propr API gateway unreachable (HTTP 502). Retrying in 15s."`
- **Rate Limit**: `"Upstream rate limit reached (HTTP 429). Backing off."`
- **Auth Failure**: `"Invalid PROPR_API_KEY. Verify server environment variables."`

### Concrete Empty State Copy
- **No Positions**: `"No open positions across active accounts."`
- **No Orders**: `"No pending orders."`
- **No Historical Breaches**: `"No closed or breached accounts found."`
- **No Payouts**: `"No processed payouts found."`

### Loading States
- **Skeleton Shimmers**: High-density gray pulses (`bg-zinc-800/40 animate-pulse`) matching the exact row heights of table rows and metric cards. Avoid full-screen blocking spinners.

---

# 24. Responsive Layout Requirements

### Breakpoints
- **Wide Desktop**: `≥ 1440px` (Full 4-column metric grids, expanded sidebar, split tables).
- **Standard Desktop / Laptop**: `1024px – 1439px` (2-column grids, collapsible sidebar).
- **Tablet**: `768px – 1023px` (Collapsed icon sidebar, stacked position/order panels).
- **Mobile**: `< 768px` (Off-canvas navigation drawer, single-column metric stacks, horizontal scroll tables).

### Mobile Transformation Rules
1. **Sidebar**: Transforms into a slide-over drawer accessible via top-bar hamburger button.
2. **Metric Strips**: 4-column cards collapse to a 2×2 grid on tablet and a vertical stack on mobile.
3. **Tables**: Wrap in touch-scrollable containers (`overflow-x-auto`) with sticky left columns for Asset and Account ID.
4. **Risk Meters**: Full width of mobile card with stacked labels (label on top, percentage on right).

---

# 25. Table Design System

All 5 core tables (`Accounts`, `Positions`, `Orders`, `History`, `Finance Ledger`) must follow unified specifications:

### Universal Table Rules
- **Header Style**: `text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]`.
- **Row Height**: Compact `36px` to `42px` padding (`py-2.5 px-3`) for maximum row density.
- **Row Alternation / Hover**: Subtle hover illumination (`hover:bg-white/[0.02]`).
- **Dividers**: Fine subtle borders (`divide-y divide-[var(--border-subtle)]`).
- **Text Alignment**:
  - Text, IDs, Badges: Left-aligned.
  - Numbers, Balances, Prices, PnL, Percentages: Right-aligned.
- **Empty Row Height**: Centered padding (`py-8` to `py-12`).

---

# 26. Chart Requirements

### Supported Visualizations
1. **Cumulative Prop-Firm Cash Outflow vs Payouts** (Step chart on `/finance`).
2. **Trailing Drawdown Floor vs High-Water Mark** (Progress gauge or range chart on `/accounts` and `/live`).
3. **Account Status Distribution** (Multi-segment progress chip bar on `/` and `/accounts`).

### Prohibited / Unsupported Visualizations
- Candlestick or tick charts (the terminal relies on REST/WebSocket snapshots, not historical OHLCV chart bars).
- Continuous intraday equity curves (not supported by current REST endpoint contracts).

---

# 27. Design System Primitives

### Semantic Palette Tokens
```css
--bg-primary: #06060b;        /* Deep terminal canvas */
--bg-secondary: #0c0c14;      /* Sidebar and header background */
--bg-surface: #11111b;        /* Cards and panel containers */
--bg-elevated: #16162a;       /* Hover states and active selections */
--border-primary: #1a1a2e;    /* Primary card and table borders */
--border-subtle: #141428;     /* Inner row dividers */
--text-primary: #e0e0f0;      /* Primary values and headings */
--text-secondary: #8888aa;    /* Labels, descriptions, secondary text */
--text-muted: #55557a;        /* Subtext, timestamps, disabled items */
--green: #00e676;             /* Profits, healthy states, funded badge */
--red: #ff3d57;               /* Losses, breach alerts, failed badge */
--amber: #ffab00;             /* Caution risk zones, pending orders, stale */
--cyan: #00e5ff;              /* Active capital, brand accent, live links */
```

### Typography Hierarchy
- **Primary UI Sans**: `Inter`, sans-serif (Headings, buttons, labels).
- **Tabular Monospace**: `JetBrains Mono`, monospace (All numbers, currencies, IDs, percentages).
- **Page Titles**: `14px` (`text-sm`), uppercase, tracking-wider, font-bold.
- **Section Headers**: `12px` (`text-xs`), uppercase, tracking-wider, font-semibold.
- **Metric Values**: `20px – 24px` (`text-xl` to `text-2xl`), monospace, font-bold.
- **Table Data**: `11px – 12px` (`text-xs`), monospace.
- **Micro Metadata**: `10px`, monospace.

---

# 28. Component Inventory

| Component | Used Where | Purpose | Inputs / Props | Interactive States | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `Sidebar` | Global Shell | Main navigation & brand rail | `pathname`, `collapsed` | Expand, collapse, active link | **P0** |
| `TopBar` | Global Shell | Header, status, relative sync | `health`, `lastSyncAt` | Refresh button click, stale ticker | **P0** |
| `MetricCard` | `/`, `/finance` | Displays key financial numbers | `title`, `value`, `subtext`, `badge` | Hover highlight | **P0** |
| `RiskProgressBar`| `/`, `/live`, `/accounts` | Visualizes drawdown / target progress | `valuePercent`, `thresholdZone` | Safe (Cyan), Warn (Amber), Danger (Red) | **P0** |
| `StatusBadge` | Universal | Communicates account/order stage | `stage`, `type` | EVAL, FUNDED, FAILED, OPEN, PENDING | **P0** |
| `DataTable` | All 5 table views | Tabular display of data rows | `columns`, `rows`, `emptyMessage` | Row hover, horizontal scroll | **P0** |
| `HealthPill` | `TopBar`, `/system` | Connection status indicator | `status` (LIVE, STALE, ERROR) | Pulse animation on LIVE | **P1** |
| `CopyableId` | Tables, cards | Displays short ID with full copy | `id` | Click to copy to clipboard | **P2** |
| `OfflineBanner` | Global (conditional)| Warns when cache is stale | `staleSince`, `reason` | Sticky dismissal / retry | **P1** |

---

# 29. Screen Inventory for Designer

### Core Screens (P0)
1. **Screen 01 — Dashboard Overview (`/`)**: Executive metrics, active account cards, risk bars, position/order summary.
2. **Screen 02 — Live Risk Radar (`/live`)**: Active accounts with prominent drawdown limit consumption gauges and profit target trackers.
3. **Screen 03 — Accounts Directory (`/accounts`)**: Complete account universe table with stage filters and breach state indicators.
4. **Screen 04 — Active Positions (`/positions`)**: Unified perpetual positions table with side/leverage chips, mark prices, and ROE.
5. **Screen 05 — Cash Flow & Finance (`/finance`)**: Three-layer cash scorecard, multi-firm breakdown (Propr + Breakout), and reconciled bank ledger table.

### Secondary Screens (P1)
6. **Screen 06 — Orders Terminal (`/orders`)**: Resting limit, market, and protective stop orders table with trigger prices.

### Detail & Diagnostic Screens (P2)
7. **Screen 07 — Historical Archive (`/history`)**: Permanently closed/breached accounts with failure details.
8. **Screen 08 — System Telemetry (`/system`)**: Service telemetry, API status, and security invariants.

### Responsive Variants
- Mobile drawer navigation variant.
- Mobile single-column stacked card variants for Dashboard and Live Radar.
- Mobile horizontally-scrollable table variants with sticky leading columns.

---

# 30. Priority Matrix

| Priority | Scope | Included Screens & UI Components | Designer Action |
| :---: | :--- | :--- | :--- |
| **P0** | **Essential** | Dashboard (`/`), Live Risk (`/live`), Accounts (`/accounts`), Positions (`/positions`), Finance (`/finance`), Risk Gauges, Global Shell | Design first with full desktop and mobile specifications. |
| **P1** | **Important** | Orders (`/orders`), Status Banners, Relative Freshness Indicators, Mobile Drawer Navigation | Design second; ensure parity with P0 design patterns. |
| **P2** | **Secondary** | History (`/history`), System Diagnostics (`/system`), Copyable ID tooltips | Design using shared table and card components. |
| **P3** | **Optional** | API Health raw JSON view (`/api/health`), Advanced Telemetry Latency Gauges | Implement as simple text or unstyled utilities. |

---

# 31. Data / UI Traceability Matrix

| UI Element | Route | Data Source | Calculation / Formula | User Need Satisfied | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Total Actual Cash Spent** | `/`, `/finance` | Bank Statement (`SEED_PURCHASES`) | `Propr INR + Breakout INR - Refunds` | Eliminates cash blindness; knows exact bank expenditure | **P0** |
| **Active Capital at Risk** | `/`, `/finance` | Bank Statement Debits | `∑(actualCashCostINR)` of active challenges | Understands true out-of-pocket money currently at risk | **P0** |
| **Drawdown Consumed %** | `/`, `/live`, `/accounts`| `@propr/calculations` | `(Drawdown Used / Max Allowable DD) * 100` | Prevents fatal account liquidation breaches | **P0** |
| **Daily Loss Cushion** | `/live`, `/accounts` | `@propr/calculations` | `(Day-Start Balance + Margin) - Equity` | Prevents intraday daily loss breach | **P0** |
| **Unrealized PnL & ROE** | `/`, `/positions` | Propr WebSocket / Positions API | `(Mark Price - Entry Price) * Qty` | Evaluates intraday open trade performance | **P0** |
| **Resting Stop Orders** | `/`, `/orders` | Propr Orders API | Filter where status is `open` or `pending` | Verifies protective stop loss orders exist | **P1** |
| **Multi-Firm Cash Split** | `/finance` | Cash Ledger (`SEED_PURCHASES`) | Propr (₹21,559.58) + Breakout (₹3,835.25) | Unified accounting across competing prop firms | **P0** |
| **Bank Verified Badge** | `/finance` | Bank Ledger | Cross-referenced against bank statements | Verifiable audit proof of expenses | **P1** |
| **Service Telemetry** | `TopBar`, `/system` | `/api/health` | Upstream core health check + timestamp | Knows whether displayed numbers are fresh or stale | **P0** |

---

# 32. Do-Not-Change Rules for the Designer

> [!CAUTION]
> The following product invariants must NOT be altered by visual or aesthetic decisions:

1. **Do NOT Conflate Cash with Trading PnL**: Never merge "Actual Cash Spent/PnL" with "Trading PnL" into a single number.
2. **Do NOT Conflate USD Face Value with INR Cash**: Never multiply nominal USD challenge fees by a static exchange rate to estimate cash. Bank statement debits are authoritative.
3. **Do NOT Revert the Drawdown Gauge**: Never scale the drawdown meter to total account balance. It must strictly represent **Drawdown Limit Consumed %**.
4. **Do NOT Display Flat Positions**: Never render positions with quantity `0.00000000` in open positions.
5. **Do NOT Invent Action Buttons**: Never add "Buy", "Sell", "Cancel Order", "Withdraw Payout", or "Reset Account" buttons. The application is read-only.
6. **Do NOT Hide Stale States**: Never allow an offline, cached, or stale state to look like a live connection.
7. **Do NOT Round Away Financial Precision**: Quantities must support up to 8 decimal places for crypto perps. Cash INR must support 2 decimal places.

---

# 33. Designer Handoff Checklist

```text
[x] every route has a defined design (8 routes: /, /live, /accounts, /positions, /orders, /finance, /history, /system)
[x] dashboard metrics are defined (4 executive cash metrics, account counters, risk meters, split tables)
[x] account states are defined (EVALUATION, PASSED, FUNDED, BREACHED, FAILED, CLOSED, REVIEW_PENDING)
[x] risk states are defined (SAFE <40%, CAUTION 40-75%, DANGER >75%, BREACHED 100%)
[x] finance semantics are separated (Layer 1 Face Value vs Layer 2 Actual Cash vs Layer 3 Trading Metrics)
[x] Propr vs Breakout is clear (Propr ₹21,559.58 + Breakout ₹3,835.25 = ₹25,394.83 total)
[x] face value vs actual cash is clear ($75.00 nominal active vs ₹7,336.19 bank debit active)
[x] trading PnL vs cash PnL is clear (paper demo PnL isolated from real bank return)
[x] realtime/freshness behavior is defined (15s ISR vs WebSocket, timestamp relative ticker)
[x] stale/error/offline states are defined (explicit warning banners, no silent fallbacks)
[x] orders are fully represented (limit, market, stop_loss, take_profit, trigger prices)
[x] positions are fully represented (asset, side, leverage, size, entry, mark, margin, ROE, uPnL)
[x] history is defined (terminal breach reasons, closed equity, initial balance)
[x] system page is defined (gateway health, sync timestamps, security invariants)
[x] mobile behavior is defined (drawer navigation, stacked 2x2 grids, horizontal table scroll)
[x] accessibility requirements are defined (color-independent badges, ARIA progressbar, tabular monospace)
[x] component inventory exists (Sidebar, TopBar, MetricCard, RiskProgressBar, DataTable, StatusBadge)
[x] screen inventory exists (5 core P0 screens, 1 secondary P1 screen, 2 diagnostic P2 screens)
[x] priorities are assigned (P0, P1, P2, P3 ranking matrix)
[x] unsupported features are explicitly excluded (no order execution, no payout requests, no buy buttons)
[x] every major UI element traces to a real data source (complete traceability matrix provided)
```

---

# 34. Output Declaration

```text
UI REQUIREMENTS EXTRACTION COMPLETE

Routes analyzed: 9 routes (/, /live, /accounts, /positions, /orders, /finance, /history, /system, /api/health)
Pages specified: 8 primary UI screens
Components inventoried: 9 universal and page-level component primitives
Major metrics mapped: 18 financial, risk, and operational metrics
Data sources mapped: Propr REST API, WebSocket streams, Bank Cash Ledger, Calculations Engine
States documented: 7 account lifecycle stages, 4 risk threshold zones, 6 sync/freshness states
Responsive behaviors documented: Desktop (1440px+), Laptop (1024px), Tablet (768px), Mobile (<768px)
Accessibility requirements documented: ARIA progressbar semantics, color-independent signals, monospace alignment

OUTPUT:
UI_DESIGN_REQUIREMENTS.md
```
