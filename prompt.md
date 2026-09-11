scan entire repo to understand where we stand, and what propr provides, then proceed with following
Build a production-grade, read-only personal **Propr Trading Terminal** that runs on **Vercel** and continuously displays my latest Propr account data accurately, cleanly, and with a premium terminal-style UI.

## 1. Core objective

Create a private dashboard that acts as my single live command center for all Propr accounts.

The application must automatically discover and track:

* all active evaluation/challenge accounts
* passed evaluations
* failed/breached evaluations
* funded accounts
* closed funded accounts
* accounts currently under review
* newly purchased accounts
* current open trades / positions
* open orders
* live equity and balance
* realized PnL
* unrealized PnL
* fees
* drawdown
* daily-loss usage
* profit-target progress
* remaining drawdown buffer
* account lifecycle/status
* payout status/history
* total money spent on prop accounts
* total payouts withdrawn
* actual net cash PnL
* account-by-account financial performance

The application is **READ ONLY**.

Do not implement order creation, cancellation, leverage changes, margin changes, challenge purchases, payout requests, wallet changes, or any other mutation against Propr.

The interface should make it extremely difficult to confuse:

**evaluation account → passed → funded → breached/closed → payout**

with clean lifecycle visualization.

---

# 2. Propr API integration

Use the provided Propr API documentation as the source of truth.

Base REST API:

`https://api.propr.xyz/v1`

Authenticated requests use:

`X-API-Key: <PROPR_API_KEY>`

Never expose the API key in client-side JavaScript, browser localStorage, public environment variables, source code, or the repository.

Use server-side environment variables only.

Relevant Propr endpoints documented in the provided material include:

### User

`GET /users/me`

### Evaluation / challenge accounts

`GET /challenge-attempts`

`GET /challenge-attempts/{attemptId}`

Supported status filtering includes:

* active
* passed
* failed

Challenge attempt responses provide:

* status
* total PnL
* win rate
* max drawdown
* trading days
* failure reason
* linked accountId
* current phase

Use this endpoint to determine evaluation lifecycle/status.

### Funded accounts

`GET /book-account-issuances`

`GET /book-account-issuances/{issuanceId}`

Supported statuses include:

* active
* closed
* review_pending

Funded accounts are separate from challenge attempts and must not be inferred merely from challenge status.

A challenge that passes can result in a separately provisioned funded account.

### Trading data

For every known account:

`GET /accounts/{accountId}/orders`

`GET /accounts/{accountId}/positions`

Use appropriate trade/account endpoints available in the supplied OpenAPI/documentation as well.

Never assume that one account endpoint contains the entire account lifecycle.

### Daily/risk metrics

Retrieve the account's daily metrics and challenge/funded configuration required to calculate:

* current equity
* drawdown used
* daily loss used
* remaining drawdown
* remaining daily loss
* profit target progress
* breach proximity

The supplied Propr integration documentation explicitly provides formulas for deriving these values from account state, positions, marks, daily metrics, and challenge/funded configuration.

### Payout history

Use:

`GET /payouts/history`

Display historical processed payouts and payout statuses where available.

Payout objects can contain:

* payoutId
* reason
* status
* amount
* txHash
* processedAt
* createdAt

The API documents payout lifecycle statuses including:

`requested → processing → processed`

as well as:

`rejected / cancelled / failed`.

---

# 3. VERY IMPORTANT DATA ARCHITECTURE

Do NOT simply fetch everything directly from the browser.

Create this architecture:

```text
                    ┌──────────────────────────┐
                    │       Propr API          │
                    │ REST + WebSocket         │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │ Secure Server/API Layer  │
                    │ API key never exposed    │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
       REST synchronization                 Realtime worker
              │                              / WebSocket
              ▼                                     │
       normalized account               normalized realtime state
             state                                     │
              └──────────────────┬──────────────────┘
                                 ▼
                         cache / database
                                 │
                                 ▼
                         Vercel frontend
                                 │
                                 ▼
                         Trading Terminal
```

The frontend must consume normalized application data rather than repeatedly knowing Propr API response formats.

Create an internal normalized data model such as:

```ts
type AccountStage =
  | "EVALUATION"
  | "PASSED"
  | "FUNDED"
  | "BREACHED"
  | "FAILED"
  | "CLOSED"
  | "REVIEW_PENDING"
  | "UNKNOWN";

type AccountSnapshot = {
  accountId: string;
  firm: "Propr";

  stage: AccountStage;
  source:
    | "challenge_attempt"
    | "funded_issuance";

  challengeName?: string;
  challengeId?: string;
  attemptId?: string;
  issuanceId?: string;

  initialBalance?: DecimalString;
  startingBalance?: DecimalString;
  phaseStartingBalance?: DecimalString;

  balance?: DecimalString;
  equity?: DecimalString;

  realizedPnl?: DecimalString;
  unrealizedPnl?: DecimalString;
  fees?: DecimalString;

  totalPnl?: DecimalString;

  profitTargetPercent?: DecimalString;
  profitTargetProgressPercent?: DecimalString;

  maxDrawdownPercent?: DecimalString;
  drawdownUsedPercent?: DecimalString;
  drawdownRemaining?: DecimalString;

  maxDailyLossPercent?: DecimalString;
  dailyLossUsedPercent?: DecimalString;
  dailyLossRemaining?: DecimalString;

  highWaterMark?: DecimalString;

  openPositionCount: number;
  openOrderCount: number;

  positions: PositionSnapshot[];
  orders: OrderSnapshot[];

  purchaseCostINR?: DecimalString;
  payoutsWithdrawnINR?: DecimalString;
  actualCashPnLINR?: DecimalString;

  lastUpdatedAt: string;
};
```

Do not use floating-point arithmetic for money.

Use `Decimal`, `decimal.js`, or `BigInt`/fixed-point arithmetic appropriately.

The Propr documentation explicitly says monetary API values are decimal strings and should not be processed using floating point.

---

# 4. REST synchronization strategy

On startup:

1. authenticate against Propr
2. retrieve user profile
3. retrieve all challenge attempts
4. retrieve all funded-account issuances
5. build the complete account universe
6. deduplicate account IDs
7. determine lifecycle stage for every account
8. retrieve account configuration
9. retrieve account positions
10. retrieve open orders
11. retrieve daily metrics
12. retrieve relevant trade/account statistics
13. retrieve payout history
14. normalize everything into the internal data model
15. store/cache the normalized snapshot

Do NOT only retrieve active accounts.

The terminal must retain historical breached, passed, failed, and closed accounts so the financial history does not disappear.

---

# 5. Account lifecycle engine

Build an explicit lifecycle engine.

Example:

```text
PURCHASED
   ↓
EVALUATION ACTIVE
   ↓
   ├── FAILED / BREACHED
   │       ↓
   │    CLOSED
   │
   └── PASSED
          ↓
       FUNDED
          ↓
       ACTIVE
          ↓
    ┌─────┴─────┐
    ↓           ↓
  PAYOUT      CLOSED
```

Do not infer "funded" merely because an evaluation has `passed`.

Use `/book-account-issuances` to determine funded-account existence.

The documentation explicitly states funded accounts are separate from challenge attempts and are returned by `/book-account-issuances`.

---

# 6. Evaluation account calculations

For every evaluation display:

### Progress

```text
PROFIT TARGET
Current PnL
Target
Progress %
Remaining
```

### Drawdown

```text
MAX DD
Used
Remaining
Distance to breach
```

### Daily loss

```text
DAILY LOSS
Used
Remaining
Today's reference
```

### Trading days

```text
TRADING DAYS
X / Required
```

### Status

Possible prominent statuses:

```text
ACTIVE
NEAR TARGET
NEAR BREACH
PASSED
FAILED
BREACHED
```

Do not invent thresholds for "near breach".

Make the threshold configurable in the application.

The Propr-side enforcement is authoritative. Local calculations are for display and monitoring.

---

# 7. Real-time WebSocket architecture

Propr provides:

`wss://api.propr.xyz/ws`

with an API-key authentication header.

Relevant realtime events include:

* `account.updated`
* `order.created`
* `order.updated`
* `order.cancelled`
* `order.triggered`
* `order.filled`
* `order.partially_filled`
* `position.opened`
* `position.updated`
* `position.closed`
* `position.liquidated`
* `trade.created`
* `mark.updated`

Because the Propr websocket requires a custom `X-API-Key` header, do not put the key in the browser.

Implement a server-side persistent realtime listener.

The listener should:

* connect to Propr WS
* authenticate
* automatically reconnect
* maintain connection health
* process all relevant events
* update normalized account state
* write the latest state to the cache/database
* expose sanitized state to the Vercel frontend

Include heartbeat/reconnect logic.

The Propr documentation states the server pings every 20 seconds and dead connections are terminated automatically.

If Vercel is not appropriate for a persistent websocket process, keep the **frontend on Vercel** and deploy the persistent realtime worker separately on an appropriate backend/worker platform.

Do not sacrifice realtime reliability just to force the worker onto Vercel.

---

# 8. Live calculations

The frontend should show realtime:

* balance
* equity
* unrealized PnL
* open positions
* margin
* available balance
* drawdown
* daily loss
* liquidation proximity
* account health

Use the Propr `mark.updated` feed to derive price-dependent values.

The Propr documentation specifically states that unrealized PnL, equity, liquidation price and drawdown are derived locally using live marks plus account/position data.

Important:

```text
mark.updated
      ↓
update mark prices
      ↓
recalculate every open position
      ↓
sum account uPnL
      ↓
calculate equity
      ↓
calculate drawdown
      ↓
calculate daily loss usage
      ↓
update UI
```

Ignore position records with zero quantity when determining active positions.

The supplied Propr docs explicitly warn that closed positions can remain with quantity `0`.

---

# 9. Terminal UI

Make the interface look like a premium institutional trading terminal.

Design language:

* dark near-black background
* subtle grid
* thin borders
* muted typography
* highly readable monospace numbers
* restrained green/red/amber status colors
* no excessive gradients
* no cartoon-style dashboard cards
* no giant rounded SaaS cards everywhere
* dense but very readable information
* desktop-first
* responsive for tablet/mobile
* subtle terminal glow
* excellent spacing
* animations only when useful

Think:

```text
Bloomberg Terminal
+
TradingView
+
modern developer terminal
+
high-end quant dashboard
```

but cleaner and more modern.

---

# 10. Main terminal layout

## TOP BAR

```text
PROPR // ACCOUNT TERMINAL

LIVE ●
Last Sync: 20:04:31 IST
WebSocket: CONNECTED
REST: HEALTHY

[ Refresh ]
```

Show a small data-health indicator.

Example:

```text
● LIVE
● REST OK
● WS CONNECTED
```

If data becomes stale:

```text
⚠ DATA STALE — LAST UPDATE 18s AGO
```

Never silently display stale data as current.

---

# 11. Executive financial header

At the top:

```text
TOTAL INVESTED        ₹25,394.83
ACTIVE CAPITAL        ₹7,336.19
PAYOUTS WITHDRAWN     ₹0
ACTUAL CASH PNL       -₹25,394.83

ACTIVE EVALS          2
FUNDED                0
PASSED                0
FAILED/BREACHED       1
```

These values should be generated dynamically from the underlying account/finance data.

Do not hardcode them.

---

# 12. Account overview table

Create the main account table:

| Account | Firm | Stage | Challenge | Balance | Equity | uPnL | Realized | DD Used | Daily Loss | Target | Open Pos | Orders | Cost | Payouts | Cash PnL |
| ------- | ---- | ----- | --------- | ------: | -----: | ---: | -------: | ------: | ---------: | -----: | -------: | -----: | ---: | ------: | -------: |

Use compact formatting.

Status chips:

```text
EVAL
PASSED
FUNDED
BREACHED
FAILED
CLOSED
REVIEW
```

Sorting:

1. active/funded first
2. active evaluations
3. passed
4. review
5. failed/breached
6. closed

---

# 13. Active evaluation cards

For every active evaluation display a compact risk panel:

```text
PROPR / $25K TURBO

ACTIVE
Account: urn:...

EQUITY       $25,842
PnL          +$842
TARGET       $1,250

TARGET PROGRESS
████████████████░░░░ 67.4%

MAX DD
$1,250
Used       41.2%
Remaining  $735

DAILY LOSS
Used       18.4%
Remaining  $1,020

TRADING DAYS
4 / 5

OPEN POSITIONS
2

OPEN ORDERS
3
```

The progress bars must be mathematically accurate.

---

# 14. Funded account panel

For funded accounts show:

```text
FUNDED // A-BOOK
or
FUNDED // B-BOOK

Account
Status
Balance
Equity
Realized PnL
Unrealized PnL
Current DD
Max DD
Available balance
Open positions
Open orders

PAYOUT

Withdrawable / payout information where supported
Last payout
Total payouts
Payout count
```

The distinction between:

* trading balance
* withdrawable payout
* previously paid out

must be visually explicit.

The documentation states that funded trading balance is not the same thing as withdrawable cash.

---

# 15. Open positions terminal

Create a dense positions table:

```text
ACCOUNT
ASSET
SIDE
QTY
ENTRY
MARK
NOTIONAL
MARGIN
LEV
uPNL
ROE
LIQ PRICE
```

Example:

```text
Turbo A
BTC
LONG
0.012
94,210
94,825
$1,137
$284
4x
+$7.38
+2.60%
89,421
```

Use live marks.

Update visually without causing the page to jump.

---

# 16. Open orders terminal

Separate table:

```text
ACCOUNT
ASSET
TYPE
SIDE
PRICE
TRIGGER
QTY
FILLED
STATUS
CREATED
```

Only use valid Propr order statuses.

Do not create an invented "active" backend filter.

The provided docs specifically note that exact order statuses/enums must be used.

---

# 17. Account detail drawer

Clicking an account opens a full-screen or large side drawer containing:

### Overview

Balance
Equity
PnL
Fees
DD
Daily loss

### Challenge

Target
Current phase
Trading days
Rules

### Positions

All open positions

### Orders

All current/open orders

### Trade history

Recent executions

### Lifecycle

Purchased
Started
Passed
Funded
Breached
Closed

### Financial

Purchase cost
Payouts
Net cash PnL

### Data integrity

Last REST sync
Last websocket update
Source
Status

---

# 18. PnL distinction — VERY IMPORTANT

Never merge these concepts.

Create three separate financial concepts:

### Trading PnL

```text
Realized PnL
+ Unrealized PnL
- Fees
```

### Account performance

Trading-level performance of that account.

### Actual cash PnL

This is the personal finance metric:

```text
ACTUAL CASH PNL
=
TOTAL PAYOUTS WITHDRAWN
-
TOTAL PROP EXPENSES
```

For example:

```text
Total purchases       ₹25,394.83
Total payouts         ₹10,000
--------------------------------
Actual cash PnL       -₹15,394.83
```

This is different from trading PnL.

Do not call unrealized trading PnL "profit withdrawn".

---

# 19. Expense integration

The existing finance tracker should remain the source of truth for purchase expenses.

Support:

```text
Purchase
Payout
Refund
Adjustment
```

Every transaction should have:

```text
date
firm
account
type
amount INR
amount USD where available
bank verified
bank reference
notes
```

The frontend should read these values.

Do not invent bank transactions.

If a purchase has not been bank verified, visibly mark it:

```text
UNVERIFIED
```

rather than presenting it as confirmed.

---

# 20. Payout integration

Where Propr payout API data exists, automatically ingest payout history.

Store:

```text
payoutId
accountId
amount
status
createdAt
processedAt
txHash
```

Convert processed account payouts into the cashflow ledger.

Never count a requested/failed/cancelled payout as withdrawn cash.

Only count a successfully processed payout toward:

```text
Total Payouts Withdrawn
Actual Cash PnL
```

The payout status lifecycle documented by Propr must be respected.

---

# 21. Finance analytics

Create a dedicated Finance screen.

### Headline metrics

```text
TOTAL PROP SPEND
₹25,394.83

TOTAL PAYOUTS
₹0

NET CASH PNL
-₹25,394.83

ACTIVE CAPITAL AT RISK
₹7,336.19
```

### Breakdown

```text
Propr Spend
Breakout Spend
Active Account Spend
Failed Account Spend
Funded Account Spend
Payouts
Refunds
```

### Account ROI

For each account:

```text
Account Cost
Payouts
Net Cash Result
ROI
```

Formula:

```text
ROI =
(Payouts - Purchase Cost) / Purchase Cost
```

If there are no payouts yet, show negative ROI rather than hiding it.

---

# 22. Historical account lifecycle

Never delete an account from the system.

Instead preserve its lifecycle:

```text
Purchased
↓
Evaluation
↓
Passed / Failed
↓
Funded
↓
Payouts
↓
Closed
```

This allows historical analytics such as:

```text
Total accounts purchased
Pass rate
Failure rate
Funding rate
Average cost per passed account
Average cost per funded account
Average payout per funded account
Total lifetime payout
Total lifetime spend
Net lifetime cash PnL
```

---

# 23. Data accuracy rules

This is critical.

The UI must never silently fabricate or guess:

* account status
* challenge phase
* drawdown
* payout
* balance
* equity
* purchase cost
* account linkage

If a value cannot be obtained:

display:

```text
N/A
```

or:

```text
DATA UNAVAILABLE
```

Do not estimate.

Always show data-source provenance internally.

For calculated values show:

```text
LIVE CALCULATED
```

For REST-provided values:

```text
PROPR API
```

For finance records:

```text
FINANCE LEDGER
```

---

# 24. Reconciliation / integrity system

Create an internal integrity monitor.

Every synchronization should validate:

### Account consistency

```text
Every challenge attempt has accountId
Every funded issuance has accountId
No duplicate active account IDs
```

### Position consistency

```text
Only quantity > 0 counted as active
```

### Payout consistency

```text
Only processed payouts count as withdrawn
```

### Financial consistency

```text
total expenses = ledger purchases
total payouts = processed payout records
actual cash pnl = payouts - expenses
```

### Realtime consistency

Compare:

```text
REST snapshot
vs
current websocket state
```

If inconsistent:

```text
SYNC REQUIRED
```

and automatically refresh REST state.

---

# 25. Stale-data handling

Each account must have:

```text
lastRestSyncAt
lastRealtimeUpdateAt
lastKnownState
```

Define configurable stale thresholds.

For example:

```text
< 5 sec       LIVE
5–30 sec      DELAYED
30–120 sec    STALE
> 120 sec     OFFLINE
```

Do not silently show stale balances as current.

Display the actual last-update time.

---

# 26. Connection recovery

Implement:

```text
WebSocket connected
        ↓
heartbeat
        ↓
disconnect
        ↓
exponential backoff
        ↓
reconnect
        ↓
REST full resync
        ↓
resume realtime stream
```

A reconnect must trigger a REST reconciliation so missed websocket events do not leave the dashboard in an inconsistent state.

---

# 27. API rate handling

Respect the documented API limits.

Cache data aggressively.

Do not refresh every component independently.

Create one centralized data-sync service.

Avoid:

```text
AccountCard → API call
PositionTable → API call
OrderTable → API call
Header → API call
```

Instead:

```text
Sync Engine
     ↓
Normalized Store
     ↓
All UI components
```

---

# 28. Security

Absolutely no write operations.

No:

```text
POST /accounts/.../orders
POST /checkout-sessions
POST /payouts/request
PUT /margin-config
POST /wallet/link
```

The dashboard must be read-only.

API key:

```text
PROPR_API_KEY
```

must remain server-side.

Never render it into HTML.

Never return it from an API route.

Never log it.

Never put it in NEXT_PUBLIC_* variables.

---

# 29. Vercel architecture

Preferred structure:

```text
apps/
  terminal/
    Next.js frontend

services/
  propr-sync/
    REST synchronizer
    WebSocket listener
    normalization
    reconciliation

packages/
  propr-client/
  data-model/
  calculations/
  finance/
  ui/
```

Frontend:

```text
Next.js
TypeScript
Tailwind
shadcn/ui
Lucide
Recharts or lightweight charting
```

Backend:

Use server-side Next.js API routes/server actions where suitable for REST.

For persistent realtime WebSocket synchronization, use a dedicated worker/service if necessary.

State:

Use a proper persistent store/cache so the dashboard survives browser refreshes.

Suggested approach:

```text
Postgres
+
Redis / equivalent cache
```

Keep architecture simple enough for a personal terminal.

---

# 30. Dashboard pages

Create:

```text
/
        OVERVIEW

/accounts
        ALL ACCOUNTS

/accounts/[id]
        ACCOUNT DETAIL

/live
        LIVE TRADING TERMINAL

/finance
        PROP FINANCE

/history
        ACCOUNT LIFECYCLE

/system
        DATA HEALTH / API STATUS
```

---

# 31. Navigation

Left sidebar:

```text
PROPR TERMINAL

⌂ OVERVIEW

◉ LIVE
◫ ACCOUNTS
▣ POSITIONS
≋ ORDERS
◎ FINANCE
◌ HISTORY
⚙ SYSTEM
```

Bottom:

```text
PROPR API
● CONNECTED
```

---

# 32. Overview dashboard

The default screen should immediately answer:

```text
How many accounts do I have?
Which ones are active?
Which ones are at risk?
Which ones passed?
Which ones are funded?
How much have I spent?
How much have I withdrawn?
What is my actual cash PnL?
Do I have open trades?
Are any accounts near breach?
```

Top-level layout:

```text
┌──────────────────────────────────────────────────────────┐
│ PROPR TERMINAL                    LIVE ●   20:04:31 IST │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ₹25,394.83       ₹7,336.19       ₹0       -₹25,394.83  │
│ TOTAL SPEND      ACTIVE COST     PAYOUTS   CASH PNL     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ ACCOUNT STATUS                                           │
│                                                          │
│ EVAL 2     FUNDED 0     PASSED 0     FAILED 1           │
├──────────────────────────────────────────────────────────┤
│ ACTIVE ACCOUNTS                                          │
│                                                          │
│ [Account cards / compact table]                          │
├──────────────────────────────────────────────────────────┤
│ OPEN POSITIONS                                           │
│                                                          │
│ [Live positions table]                                   │
└──────────────────────────────────────────────────────────┘
```

---

# 33. Visual status language

Use:

GREEN:

```text
FUNDED
PASSED
HEALTHY
PROFITABLE
LOW RISK
CONNECTED
```

AMBER:

```text
NEAR TARGET
ATTENTION
HIGH DAILY LOSS
SYNC DELAYED
REVIEW
```

RED:

```text
BREACHED
FAILED
LIQUIDATED
HIGH DD
DISCONNECTED
STALE
```

Do not use colors as the only indicator; always include text.

---

# 34. Charts

Use charts sparingly.

Useful charts:

### Portfolio cash flow

```text
expenses vs payouts over time
```

### Account equity

```text
equity curve
```

### Drawdown

```text
drawdown curve
```

### Lifecycle

```text
purchased → passed → funded → payout
```

### Spending breakdown

```text
active accounts
failed accounts
funded accounts
other
```

---

# 35. Performance

The dashboard must feel instant.

Do not block the UI waiting for all accounts.

Initial sequence:

```text
Render shell
↓
show cached snapshot
↓
connect realtime
↓
sync current data
↓
replace stale snapshot
```

Use skeleton loaders.

Use optimistic visual transitions only for data updates, never for financial values.

---

# 36. Error handling

Never present a blank dashboard when Propr temporarily fails.

Instead:

```text
PROPR API UNAVAILABLE

Showing last known state

Last successful sync:
20:03:41 IST

[Retry]
```

Per-account errors should not take down the entire dashboard.

Example:

```text
ACCOUNT DATA UNAVAILABLE
Account: xxxx
Retrying...
```

---

# 37. Audit log

Create a hidden/system audit trail containing:

```text
timestamp
source
accountId
event
old value
new value
sync status
```

Useful for debugging discrepancies.

---

# 38. Developer implementation requirements

Use strict TypeScript.

Use schemas for API validation with Zod.

Separate:

```text
API client
normalization
calculations
state
UI
```

Do not put business calculations directly inside React components.

Create pure calculation functions:

```ts
calculateUnrealizedPnl()
calculateEquity()
calculateDrawdown()
calculateDailyLoss()
calculateProfitTargetProgress()
calculateActualCashPnL()
calculateROI()
deriveAccountStage()
```

All functions must have tests.

---

# 39. Calculation testing

Create deterministic fixtures for:

1. healthy evaluation
2. evaluation near drawdown
3. evaluation passed
4. evaluation failed
5. funded account
6. funded account with payout
7. multiple open positions
8. long position
9. short position
10. cross margin
11. isolated margin
12. reconnect after websocket disconnect
13. stale REST data
14. zero-quantity position
15. duplicate account discovery

Verify outputs numerically.

---

# 40. Important Propr-specific rules

Respect these source-specific details:

* challenge/evaluation accounts come from `/challenge-attempts`
* funded accounts come from `/book-account-issuances`
* a trader can have both evaluation and funded accounts simultaneously
* funded accounts have different lifecycle semantics from challenges
* positions can contain zero-quantity historical records
* REST marks can lag
* live marks should come from `mark.updated`
* account state changes should come from account/position/order/trade events
* monetary values should use precise decimal arithmetic
* challenge rules are enforced server-side
* local calculations are monitoring/display calculations
* payouts should only count as cash after successful processing

## These behaviors are explicitly documented in the supplied Propr materials.

# 41. Final product requirement

The finished product should feel like a personal professional prop-trading operating system.

It should be possible to open it and know within 5 seconds:

```text
WHAT ACCOUNTS DO I HAVE?
WHAT STAGE IS EACH ACCOUNT IN?
HOW MUCH MONEY HAVE I SPENT?
HOW MUCH MONEY HAVE I WITHDRAWN?
WHAT IS MY ACTUAL CASH PNL?
WHICH ACCOUNTS ARE LIVE?
WHAT TRADES ARE OPEN?
HOW CLOSE IS EACH ACCOUNT TO FAILURE?
WHICH ACCOUNTS PASSED?
WHICH ACCOUNTS ARE FUNDED?
IS THE DATA CURRENT?
```

Everything must be backed by actual Propr data or explicitly labelled as calculated.

Never fabricate missing values.

Never expose credentials.

Never issue trading actions.

Build the complete application, including:

* architecture
* backend sync layer
* Propr REST client
* WebSocket worker
* normalized data model
* calculations
* persistence/cache
* API routes
* UI
* account lifecycle engine
* financial analytics
* charts
* realtime updates
* stale-data handling
* reconnect logic
* tests
* deployment configuration
* `.env.example`
* README
* Vercel deployment instructions

At the end, provide:

1. exact environment variables required
2. exact deployment steps
3. exact location where the Propr API key must be entered
4. architecture diagram
5. API endpoint inventory used
6. data refresh/realtime strategy
7. known limitations
8. security checklist
9. test results
10. local development instructions

Do not leave placeholder mock data in the production dashboard once the Propr connection is configured.
