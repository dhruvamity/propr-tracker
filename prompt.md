The current problem is no longer “the colors” or “the cards look dated.”

The underlying problem is **information architecture**.

The terminal is trying to show almost every available field at once. The result is technically information-dense, but practically hard to read. On a 27-inch 2K display, the user should be able to glance at the screen and immediately answer:

> Which account needs attention?
> How much room do I have?
> What is my current exposure?
> How much real cash is at risk?
> Is the data fresh?

Right now, those answers are surrounded by too much secondary information.

The current repository itself describes the terminal as a high-density monitoring system, but its design specification also prescribes 10px micro-metadata, 11–12px table text, many compact gauges, and multiple information-heavy screens. That combination is a major reason the interface feels dense rather than readable. ([GitHub][1])

The revamp should therefore **keep the product's data model and risk semantics, but completely rethink how much information is simultaneously visible.**

# 1. The new design principle

The terminal should use **three information levels**:

```text
LEVEL 1 — GLANCE
What needs my attention right now?

LEVEL 2 — COMPARE
How do my accounts / positions / expenses compare?

LEVEL 3 — INSPECT
Give me every underlying detail when I need it.
```

The current terminal effectively renders Level 1 + Level 2 + Level 3 simultaneously.

That is the core problem.

---

# 2. What the terminal should become

I would move from:

```text
"Dashboard made of many information blocks"
```

to:

```text
"Monitoring workspace with progressive disclosure"
```

The mental model becomes:

```text
                         PROPR

┌───────────┬───────────────────────────────────────────────┐
│           │                                               │
│ Overview  │  What needs attention?                        │
│           │                                               │
│ Risk      │  Account risk board                           │
│           │                                               │
│ Trading   │  Positions / orders                           │
│           │                                               │
│ Accounts  │  Account lifecycle                            │
│           │                                               │
│ Finance   │  Cash position                                │
│           │                                               │
│ History   │  Historical analysis                           │
│           │                                               │
│ System    │  Data health                                  │
│           │                                               │
└───────────┴───────────────────────────────────────────────┘
```

The user should never need to mentally parse eight panels just to understand the state of the system.

---

# 3. Completely redesign the global shell

## Current problem

Your sidebar is acceptable, but the entire UI still feels like a set of individual terminal screens.

The top bar, page header, cards and section headers all compete for attention.

The existing specification calls for an expanded 208px sidebar and a persistent top bar. ([GitHub][1])

Keep the structure, but simplify it.

### New sidebar

```text
PROPR
TRADING TERMINAL

──────────────

OVERVIEW

RISK
  Risk Monitor

TRADING
  Positions
  Orders

ACCOUNTS
  Active
  History

FINANCE

SYSTEM
```

That is better than eight equally weighted destinations.

`Positions` and `Orders` are really one conceptual area.

`Accounts` and `History` are also one conceptual area.

This reduces navigation noise without removing functionality.

---

# 4. Make the main canvas substantially wider

This is important for your 2K complaint.

The current content is visually constrained into a relatively narrow centered workspace. That forces:

* long labels
* wrapped descriptions
* oversized cards
* duplicated columns
* vertical stacking

At 2560×1440, use approximately:

```text
Sidebar:           220–232px
Main padding:      28–36px
Content max-width: none
Useful width:      ~1700–1900px
```

Do **not** maximize everything indiscriminately. Tables can use the width; narrative content should stay constrained.

The current design specification explicitly says wide desktop should use full multi-column layouts at ≥1440px. ([GitHub][1])

---

# 5. Stop using tiny text to create density

This needs a major change.

The current design spec says:

```text
Table:       11–12px
Metadata:    10px
Section:     12px
Page title:  14px
```

That is too small for a primary working interface, particularly with the amount of information shown. ([GitHub][1])

I would change it to:

```text
Page title          20px
Page subtitle       13px
Section title       13px
Primary number      28–34px
Secondary number    16px
Table text          13px
Table metadata      11px
Micro metadata      11px minimum
```

And a crucial rule:

**Do not make information smaller to fit it. Remove information instead.**

That is the fundamental fix.

---

# 6. Numbers need visual priority

Financial numbers should feel like financial numbers.

Current:

```text
Daily-loss threshold: $9,940.37 (DD floor $9,700)
```

Everything has approximately the same typographic weight.

Instead:

```text
DAILY LOSS ROOM

$233.31

Daily-loss threshold
$9,940.37

Drawdown room
$473.67
```

The eye lands on `$233.31`.

Everything else supports it.

This is especially important because the terminal's actual job is breach proximity. The product requirements explicitly make daily-loss cushion and drawdown consumption P0 metrics. ([GitHub][1])

---

# 7. Overview needs to become an actual command center

This is where I would make the largest change.

## Current Overview

You have:

```text
Capital ledger
↓
2 huge account cards
↓
Active accounts table
↓
Archived accounts
```

There is a lot of duplication.

## New Overview

I'd make it:

```text
OVERVIEW

ATTENTION
┌──────────────────────────────────────────────────────────┐
│ ● CRITICAL                                               │
│ Starter 1-Step Turbo                                    │
│ $22.40 daily-loss room remaining                        │
│ 86% of daily allowance used                             │
│                                     [View risk →]        │
└──────────────────────────────────────────────────────────┘


CAPITAL

₹25,394.83                  ₹7,336.19                 ₹0.00
Total cash spent            Active cash at risk       Payouts

Propr ₹21,559.58            2 active accounts
Breakout ₹3,835.25


ACTIVE ACCOUNTS

┌──────────────────────────────────────────────────────────┐
│ Starter 1-Step Turbo             CRITICAL               │
│ $5,078.47 equity                  $22.40 daily room     │
│                                                          │
│ Explorer 1-Step Turbo             SAFE                  │
│ $10,173.67 equity                $233.31 daily room     │
└──────────────────────────────────────────────────────────┘


EXPOSURE

Positions                    Orders
0                            0

Flat across 2 accounts       No pending orders
```

That is dramatically easier to scan.

---

# 8. The Overview should not contain a full account table

Your current Overview does this:

```text
Account card
+
Active accounts table
```

The table repeats almost everything already shown above.

Remove it.

Replace it with a **compact attention list**.

Example:

```text
ACTIVE ACCOUNTS                         2

Starter 1-Step Turbo     CRITICAL      $22.40 room
Explorer 1-Step Turbo    SAFE          $233.31 room
```

Then:

`View all accounts →`

The Accounts page is where the full lifecycle table belongs.

This follows the route purposes defined in the repo: Overview is the multi-account command center, while Accounts is the comprehensive account universe. ([GitHub][1])

---

# 9. Account cards need a complete simplification

This is currently the most overloaded component.

Each card contains:

* account name
* account ID
* badge
* equity
* buffer
* threshold
* daily floor
* DD floor
* daily loss budget
* threshold
* room
* trade trajectory
* trade count
* max loss
* drawdown
* daily room
* profit target
* active days
* model
* balance

That is too much.

A card should answer three questions:

```text
1. Is this account safe?
2. How much room remains?
3. What limit will kill it first?
```

### New account card

```text
┌──────────────────────────────────────────────┐
│ Starter 1-Step Turbo              CRITICAL   │
│ #fjU6                                         │
│                                              │
│ $22.40                                       │
│ DAILY LOSS ROOM                              │
│                                              │
│ ████████████████████░░░  86% used           │
│                                              │
│ Daily threshold           $5,056.07          │
│ Equity                   $5,078.47           │
│ Drawdown room              $228.47           │
│                                              │
│ Target                    1.57% / 9%         │
│                                              │
│ [View account]                               │
└──────────────────────────────────────────────┘
```

Everything else goes into the account detail view.

---

# 10. Introduce an account detail drawer

This is one of the most important structural improvements.

Instead of showing every metric on every page:

```text
Click account → right-side detail drawer
```

Example:

```text
STARTER 1-STEP TURBO

CRITICAL
$22.40 daily loss room

────────────────────

RISK

Daily limit
$22.40 remaining

Drawdown
$228.47 remaining

Equity
$5,078.47

High-water mark
...

────────────────────

TRADING

27 trades
16 winners
11 losers
Worst trade -$86.60

────────────────────

CHALLENGE

Target 9%
Progress 1.57%

Active 5 days
```

Now the default interface becomes clean, while the information remains available.

This is the right form of progressive disclosure for a read-only monitoring terminal.

---

# 11. Completely simplify Live Risk

The current Live screen still feels like Overview duplicated.

You have:

```text
Breach proximity radar
+
full account cards
+
market table
```

That is excessive.

Live Risk should have **one job**:

> Which active account is closest to breach?

So the new page should be:

```text
RISK MONITOR

2 active accounts
Sorted by nearest binding limit

┌──────────────────────────────────────────────────────┐
│ 1  STARTER 1-STEP TURBO                 CRITICAL     │
│                                                      │
│ DAILY LOSS ROOM                                      │
│ $22.40                                               │
│                                                      │
│ █████████████████████████░░ 86% USED                │
│                                                      │
│ Equity              $5,078.47                        │
│ Daily threshold     $5,056.07                        │
│ Drawdown room         $228.47                        │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ 2  EXPLORER 1-STEP TURBO                SAFE         │
│                                                      │
│ DAILY LOSS ROOM                                      │
│ $233.31                                              │
│                                                      │
│ ████████░░░░░░░░░░░░░░░░░░ 24% USED                │
└──────────────────────────────────────────────────────┘
```

Market data goes into a small secondary strip at the bottom.

No duplicate giant account cards.

---

# 12. One important risk design change

Do **not** make every risk metric a progress bar.

Current pages use bars for:

* breach
* daily loss
* profit target
* drawdown
* radar

That creates bar fatigue.

Use only one dominant visual:

### Binding-limit bar

```text
86% USED
██████████████████████░░░
```

Then represent everything else numerically:

```text
Drawdown room     $228.47
Target progress      1.57%
Daily room           $22.40
```

This is much easier to read.

---

# 13. Positions page should be table-first

Your current empty Positions page is much better structurally, but when positions exist the page should immediately become:

```text
POSITIONS                         3 OPEN

BTCUSD       LONG 5x
Starter      0.005 BTC
Entry        $68,100
Mark         $68,432
uPnL         +$1.66
ROE          +3.2%

ETHUSD       SHORT 3x
Explorer     ...
```

The repository already defines asset, side/leverage, account, quantity, mark price, ROE and related fields as the intended position table data. ([GitHub][1])

Do not wrap each position in a large card.

Use a compact table with a strong first column.

---

# 14. Positions empty state should be much smaller

Current:

```text
giant panel
large empty area
center card
```

Replace with:

```text
POSITIONS                                  0

─────────────────────────────────────────────

                         ↗

                  No open positions

             2 active accounts are flat
                    Checked now

─────────────────────────────────────────────

ACCOUNT RISK

Explorer                 $233.31 room
Starter                   $22.40 room
```

The risk information is actually useful here.

Instead of wasting the rest of the page, show the **risk context surrounding the empty state**.

---

# 15. Orders page needs a major conceptual change

The current page has:

```text
No Resting Orders
+
Execution Rules & Fee Protocol
+
Account Order Capacity
```

That is too much static instructional content.

The orders page exists to answer:

> What orders are currently active?

That is it.

### New Orders

```text
ORDERS                                   0 ACTIVE

Protective orders        0
Resting orders           0

────────────────────────────────────────────

No active orders

2 monitored accounts currently have
no pending orders or protective stops.

────────────────────────────────────────────

ACCOUNT STATUS

Explorer     no positions     no stops
Starter      no positions     no stops
```

Then put:

`Order rules`

behind a small expandable information section.

The current “Ready for orders” wording should also disappear. This is a read-only terminal and the repository explicitly says it does not place, modify or cancel orders. ([GitHub][2])

Use:

**“No active orders”**

rather than:

**“Ready for orders.”**

---

# 16. Accounts should become the data-heavy screen

This is where density belongs.

The Accounts page should be your **one intentionally dense table**.

That's the appropriate place for 8 accounts × multiple attributes.

But make it visually hierarchical.

### Header

```text
ACCOUNTS

8 accounts
2 active · 6 failed

[All] [Active] [Failed] [Funded]

Search...
Sort...
```

### Table

```text
ACCOUNT                         EQUITY       ROOM       STATUS

Starter 1-Step Turbo #fjU6      $5,078.47    $22.40    CRITICAL
Explorer 1-Step Turbo #3XGK     $10,173.67  $233.31    SAFE
Starter 1-Step Turbo #...       $5,107.99    $257.99    FAILED
...
```

Then expandable rows contain:

```text
Challenge
Starting balance
Final balance
Failure reason
Target
Drawdown
Daily loss
Trade count
Purchase
```

You preserve the data without forcing it all into the initial table.

---

# 17. History should become an analysis screen, not another archive table

The new top summary is good:

```text
6 breached
4 DD failures
2 daily loss
```

Keep that.

But below it, show the failure pattern.

For example:

```text
FAILURE BREAKDOWN

Drawdown breach        4
Daily-loss breach      2

████████████████       DD
████████               Daily
```

Then:

```text
RECENT FAILURES

Account         Failure               Final equity
#6...           Daily loss exceeded   $4,701.47
#1...           Drawdown exceeded      $4,845.48
...
```

Click a row → detail drawer.

That page becomes useful for learning from your failures instead of merely storing them.

---

# 18. Finance needs visualization

This page has enough numerical information that a little visual structure would make it much easier.

The repository's own design requirements explicitly allow a cumulative cash-outflow-vs-payouts step chart. ([GitHub][1])

I'd structure Finance as:

```text
FINANCE

NET CASH POSITION

₹25,394.83
Total spent

₹7,336.19
Active cash at risk

₹0
Payouts


CASH FLOW

₹
│                         ╭──────
│                  ╭──────╯
│           ╭──────╯
│    ╭──────╯
└──────────────────────────────
   Aug        Sep

● Cash spent
○ Payouts
```

Then:

```text
SPENDING BY FIRM

PROPR                              ₹21,559.58
████████████████████████████

BREAKOUT                            ₹3,835.25
████
```

Then the detailed ledger.

That is much easier to understand than four competing horizontal cards followed immediately by a wall of rows.

---

# 19. Finance table needs fewer columns

Current ledger:

```text
DATE
FIRM
CHALLENGE
ACCOUNT FUNDED
USD COST
BANK DEBIT
INVOICE / BANK REF
STATUS
```

That is technically useful but visually heavy.

Default table:

```text
DATE       FIRM      CHALLENGE               CASH DEBIT

24 Aug     Propr     Starter Turbo           ₹1,734.40
28 Aug     Propr     Starter Turbo           ₹2,472.88
30 Aug     Propr     Starter Classic         ₹4,451.62
...
```

Click row:

```text
BANK VERIFICATION
Invoice
Reference
USD face value
Account
Bank debit
```

Again: progressive disclosure.

---

# 20. System should be aggressively simplified

The current System page has:

```text
REST
WebSocket
Data Pipeline

Pipeline
Security

Event log
```

This is reasonable structurally.

The **event log**, however, is still too visually dominant.

Make System:

```text
SYSTEM

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ REST         │ │ WEBSOCKET    │ │ DATA         │
│ HEALTHY      │ │ DISCONNECTED │ │ FRESH        │
│ 38 ms        │ │ polling 15s  │ │ 8 accounts   │
└──────────────┘ └──────────────┘ └──────────────┘


DATA FLOW

REST ──────→ CACHE ──────→ UI
               │
             15s


RECENT EVENTS                                    11

23:58:32  Risk engine     Drawdown check passed
23:58:28  REST sync       Challenge data updated
23:58:24  Market          SOL mark updated
23:58:20  Heartbeat       14ms
...
```

Then a:

`View raw event stream`

drawer.

Raw logs should **never dominate the default System screen**.

---

# 21. The entire terminal needs a component philosophy change

Current philosophy:

```text
Every useful thing deserves a visible block.
```

New philosophy:

```text
Every question deserves one visible answer.
Everything else is available on demand.
```

That distinction will fix almost everything.

---

# 22. Replace nested cards with "bands"

You currently have:

```text
page
  card
    card
      metric
        progress
          metric
```

That is why the interface visually feels noisy.

Use:

```text
Page
 ├── Attention band
 ├── KPI band
 ├── Main workspace
 └── Supporting table
```

Example:

```text
┌─────────────────────────────────────────────┐
│ ATTENTION                                   │
└─────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┐
│ CASH     │ AT RISK  │ PAYOUTS  │
└──────────┴──────────┴──────────┘

┌─────────────────────────────────────────────┐
│ ACTIVE ACCOUNTS                             │
│                                             │
│ risk rows / compact cards                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ RECENT ACTIVITY                             │
└─────────────────────────────────────────────┘
```

Only one or two visually elevated surfaces per page.

---

# 23. Stop using uppercase for almost everything

Current interface has:

```text
CAPITAL LEDGER
ACTIVE ACCOUNTS
ACTIVE BREACH DISTANCE
DAILY LOSS BUDGET
TRADE TRAJECTORY
PERPETUAL CONTRACT CONSTRAINTS
EXECUTION RULES & FEE PROTOCOL
```

That's contributing to the “terminal output” feeling.

Use normal case for primary UI:

```text
Capital ledger
Active accounts
Breach distance
Daily loss
Trade history
Contract rules
Order rules
```

Reserve uppercase for tiny utility labels:

```text
EQUITY
ROOM
TARGET
STATUS
```

That alone will make the interface feel much less synthetic.

---

# 24. Remove most explanatory text

Current:

> "Accounts ordered by closest breach threshold (drawdown or daily loss)"

That is useful once.

Then:

```text
Sorted by nearest binding limit
```

Current:

> "2 active accounts currently hold zero open market exposure."

Use:

```text
2 active accounts · flat
```

Current:

> "No resting limit orders, trigger orders, or protective stops currently pending."

Use:

```text
No active orders
```

The no-slop guidance is useful here: concrete language should replace abstract or repetitive explanatory framing. 

---

# 25. Make tables visually lighter

The repository's specification calls for compact 36–42px rows and subtle dividers. ([GitHub][1])

Keep the compact rows, but remove the visual box around every table.

Instead:

```text
ACCOUNT        EQUITY         ROOM        STATUS
──────────────────────────────────────────────────
Starter        $5,078         $22.40      CRITICAL
Explorer      $10,173        $233.31      SAFE
```

Use the surface as the table background.

One outer border.

No heavy inner card borders.

---

# 26. One color should mean one thing

I'd lock the semantics as:

```text
GREEN    healthy / safe / positive
AMBER    caution / stale / approaching limit
RED      critical / breached / loss
CYAN     selected / navigational / informational
WHITE    primary information
GRAY     secondary information
```

No orange-ish bar for one metric and amber for another meaning unless there is a deliberate severity distinction.

Your current design system already defines green, red, amber and cyan semantically. ([GitHub][1])

---

# 27. Add an "attention score" concept

This is one of the few new abstractions I would actually add.

At Overview:

```text
ATTENTION

1 critical
1 safe
```

But more useful:

```text
NEEDS ATTENTION

Starter 1-Step Turbo
$22.40 daily room
86% consumed
```

When all accounts are healthy:

```text
ALL ACCOUNTS HEALTHY
2 active · no immediate breach risk
```

That gives the terminal a meaningful default state.

---

# 28. The browser viewport should become a design target

Design against:

```text
1440 × 900
1920 × 1080
2560 × 1440
```

not just CSS breakpoints.

At 2560×1440:

### Overview

Show:

```text
Header
Attention
Cash summary
Active account comparison
Exposure summary
```

without excessive scrolling.

### Live

Show:

```text
risk ranking
all active accounts
secondary market reference
```

in one viewport.

### Accounts

Show:

```text
filters
8–12 rows
```

comfortably.

### Finance

Show:

```text
cash summary
cash chart
ledger header + ~10 rows
```

before substantial scrolling.

### System

Show:

```text
health
pipeline
recent events
```

without raw log dominating the viewport.

This is the standard I would use to judge the redesign.

---

# 29. Typography system I would actually implement

Forget the current 10px-heavy hierarchy.

### Inter

```text
Page heading         20px / 600
Section heading      13px / 600
Body                 13px / 400
Secondary            12px / 400
```

### JetBrains Mono

```text
Hero financial      28–32px / 700
Large metric        20–24px / 700
Table values        13px / 500
IDs                 11px / 500
Micro timestamps    11px / 400
```

No important information should be rendered at 10px.

---

# 30. Spacing system

Use:

```text
4   micro
8   compact
12  row / field
16  card
24  section
32  page
```

Current screenshots have both cramped text inside cards and excessive empty space between sections.

A formal spacing scale will solve that.

---

# 31. New page structure

I would lock the terminal to these eight screens:

| Page      | Purpose                             |
| --------- | ----------------------------------- |
| Overview  | What needs my attention right now?  |
| Risk      | Which account is closest to breach? |
| Positions | What exposure do I currently have?  |
| Orders    | What protection/orders are active?  |
| Accounts  | What is the state of every account? |
| History   | Why did accounts fail?              |
| Finance   | Where has my cash gone?             |
| System    | Can I trust the data?               |

Those purposes match the repository's documented route questions. ([GitHub][1])

---

# 32. Revised navigation

I would actually make this:

```text
PROPR

OVERVIEW

RISK
  Monitor

TRADING
  Positions
  Orders

ACCOUNTS
  Active
  History

FINANCE

SYSTEM
```

On desktop:

```text
220px
```

Collapsed:

```text
64px
```

On mobile:

```text
hamburger → drawer
```

The existing specification already calls for collapsible navigation and a mobile drawer. ([GitHub][1])

---

# 33. What happens to all the information we remove?

Nothing gets deleted.

It moves.

### Visible by default

```text
risk
equity
room
status
cash
positions
orders
freshness
```

### Expandable

```text
trade trajectory
high-water mark
daily-loss math
challenge configuration
fee information
bank references
execution telemetry
```

### Detail drawer

```text
account ID
purchase
failure reason
trade breakdown
calculation inputs
raw event data
```

This is the biggest architectural change I recommend.

---

# 34. What should never be changed

The revamp must preserve the product invariants.

The repository explicitly defines:

* actual INR bank cash as authoritative
* USD face value as a separate layer
* trading metrics as a separate layer
* drawdown as percentage of allowable drawdown
* daily-loss cushion
* read-only behavior
* truthful stale/offline states
* zero synthetic data on upstream failure

Those should remain exactly as they are. ([GitHub][2])

The UI can change radically without changing those calculations.

---

# 35. The new visual language

I would move the terminal toward:

```text
Calm
Precise
Wide
Readable
Minimal
Financial
```

instead of:

```text
Dense
Terminal-ish
Technical
Box-heavy
Micro-text
Everything-visible
```

Still dark.

Still monospace-heavy for numbers.

Still clearly a trading terminal.

Just much easier to operate.

---

# 36. Complete implementation architecture

I'd rebuild the UI around these reusable primitives:

```text
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
  AccountRiskRow
  AccountRiskCard
  RiskMeter
  BindingLimit
  RiskStatus

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

The existing repo already has a component-oriented design system and documented primitives such as `MetricCard`, `RiskProgressBar`, `DataTable`, `HealthPill`, `CopyableId`, and `OfflineBanner`; the redesign should consolidate them rather than continue creating page-specific blocks. ([GitHub][1])

---

# 37. Redesign order

I would **not** redesign the pages one at a time independently.

Do it in this order.

### Phase 1 — Information architecture

Remove duplicate information.

Define:

```text
what appears globally
what appears on each page
what becomes expandable
what moves to drawers
```

This is the most important phase.

### Phase 2 — Global shell

Build:

```text
Sidebar
TopBar
PageHeader
Freshness
spacing
typography
content width
```

### Phase 3 — Core account-risk system

Build:

```text
AccountRiskCard
RiskStatus
BindingLimit
RiskMeter
AccountDrawer
```

This becomes the shared language for Overview + Risk + Accounts.

### Phase 4 — Overview + Risk

These are the most important screens.

### Phase 5 — Positions + Orders

Table-first.

### Phase 6 — Accounts + History

Data-heavy, progressive disclosure.

### Phase 7 — Finance

Cash visualization + ledger.

### Phase 8 — System

Health first, logs second.

### Phase 9 — Responsive/accessibility

Then validate:

```text
2560×1440
1920×1080
1440×900
1024×768
768
390×844
```

The repository already defines wide desktop, standard desktop, tablet and mobile breakpoints; the redesign should preserve those responsive requirements while changing the visual hierarchy. ([GitHub][1])

---

# 38. Acceptance criteria for the redesign

I'd use these as hard tests.

### Overview

Within **3 seconds**, I should know:

```text
Which account is most dangerous?
How much daily room remains?
How much actual cash is spent?
How much cash is still at risk?
```

### Risk

Within **2 seconds**:

```text
Which account is #1 risk?
What limit is binding?
How much room remains?
```

### Positions

Within **2 seconds**:

```text
Am I holding anything?
What is my exposure?
```

### Orders

Within **2 seconds**:

```text
Do I have protective orders?
```

### Accounts

Within **5 seconds**:

```text
How many are active?
Which failed?
Why?
```

### History

Within **5 seconds**:

```text
How am I failing?
DD vs daily loss?
```

### Finance

Within **5 seconds**:

```text
How much money have I spent?
How much is currently at risk?
Have I withdrawn anything?
Where did the money go?
```

### System

Within **3 seconds**:

```text
Can I trust this data?
```

---

# The most important change

The terminal should stop asking:

> **“How can I fit more data onto the screen?”**

and start asking:

> **“What decision is this screen helping me make?”**

That is why the current terminal feels bad despite containing useful information. The repository is doing the right calculations and exposing the right domains; the interface is simply exposing too much of the underlying model at the same time. The documented product goals are actually well suited to progressive disclosure because each route already has a distinct user question. ([GitHub][1])

## Final target

The finished terminal should feel roughly like:

```text
┌─────────────────────────────────────────────────────────────────┐
│ PROPR                         ● POLLING · Updated 4s ago        │
├──────────────┬──────────────────────────────────────────────────┤
│              │ OVERVIEW                                         │
│ OVERVIEW     │                                                  │
│              │ ┌──────────────────────────────────────────────┐ │
│ RISK         │ │ ⚠ STARTER 1-STEP TURBO                      │ │
│  Monitor     │ │ $22.40 daily-loss room remaining             │ │
│              │ └──────────────────────────────────────────────┘ │
│ TRADING      │                                                  │
│  Positions   │ CASH                                             │
│  Orders      │ ₹25,394.83        ₹7,336.19        ₹0            │
│              │ Spent              At risk          Payouts       │
│ ACCOUNTS     │                                                  │
│  Active      │ ACTIVE ACCOUNTS                                   │
│  History     │ ┌──────────────────────┬──────────────────────┐ │
│              │ │ Starter   CRITICAL   │ Explorer    SAFE      │ │
│ FINANCE      │ │ $22.40 room          │ $233.31 room          │ │
│              │ └──────────────────────┴──────────────────────┘ │
│ SYSTEM       │                                                  │
│              │ EXPOSURE                                         │
│              │ Positions 0                    Orders 0          │
└──────────────┴──────────────────────────────────────────────────┘
```

That would still be a **high-density trading terminal**, but the density would come from **good grouping and hierarchy**, not from fitting dozens of labels, bars and metrics into every card.

The current interface suffers from three compounding flaws on a 2K display: 10px dark grey typography that forces squinting, documentation text copy-pasted into live execution screens, and the exact same risk metrics repeated four to six times on a single view.

---

### Root Cause of the UI Clutter

* **Redundant Metric Loops:** On Overview, a single active account card shows the daily room ($22.40) and burned percentage (86%) in six separate places: the hero stat, subtext, breach slider, budget progress bar, lower table row, and the directory table directly underneath the card.
* **Documentation in Production Views:** The Positions and Orders screens dump static rulebook paragraphs (Rule P1, Rule H4, maker vs. taker fee explanations) across half the viewport to fill blank space. A trading terminal displays operational state, not reference manuals.
* **Route Duplication:** History is just a filtered view of Accounts (`status=failed`). Having both in the left sidebar creates dead navigation. Live Risk repeats 80% of Overview.
* **Low Contrast for 1440p:** Rendering labels in `text-[10px]` with `text-slate-600` against `#090a0f` violates readability standards. On a 27-inch 2K panel, dark grey micro-text disappears.

---

### System-Wide Design Rules

* **Rule of One:** A metric appears once per card. If the hero stat is Daily Breach Room ($22.40), remove all secondary text, badges, and sub-bars repeating $22.40.
* **Typography Floor:** Set the absolute minimum font size to 12px (`text-xs`) for metadata, 14px (`text-sm`) for table rows, and 24px–30px for primary figures.
* **Contrast Bump:** Replace `text-slate-600` and `text-zinc-600` across all cards with `text-zinc-400` for secondary labels and `text-zinc-200` for values.
* **Purge Rulebook Text:** Remove all static fee matrices, sizing rule cards, and leverage guideline blocks from live views. Move them to a slide-over modal or a dedicated documentation tab.

---

### Page-by-Page Revamp Blueprint

**1. Overview (`/`)**
Turn Overview into an executive portfolio summary.

* **Top Bar:** Keep the 3 Capital Ledger cards (Total Outflow, Active at Risk, Net Cash Outflow), but align the text baseline and increase font size to 24px.
* **Active Account Cards:** Strip each card down to four clean zones:
1. Header: Challenge Name, Account ID tag, and Stage badge (`Evaluation` or `Funded`).
2. Hero Stat: The single closest failure point (`$22.40 room to daily floor` on Starter; `$233.31 room` on Explorer).
3. Single Risk Bar: One dual-indicator bar showing current equity positioned between Breach Floor (left) and Profit Target (right). Delete the secondary sliders, the budget bars, and the micro sparklines.
4. Footer Grid: Four clean stats: `Balance`, `Today's Peak`, `Net P&L`, and `Daily Reset Countdown`.


* **Bottom Section:** Delete the redundant "Active Accounts" table from the bottom. Overview should show only the top capital cards and the active account cards.

**2. Live Risk (`/live`)**
Differentiate Live Risk from Overview by turning it into a real-time risk radar.

* **Top:** Keep the Breach Proximity Radar, but display a single horizontal bar per account showing consumed loss budget. Anchor the left label to the account name and the right label to the consumed amount (e.g., `Starter: $133.97 consumed of $156.37`).
* **Middle:** Full-width side-by-side position exposure cards. If an account has open positions, display entry price, live mark, liquidation price, and distance to liquidation in dollar terms.
* **Bottom:** Replace the static leverage matrix with a live tick feed showing prices, 24h change, and 8h funding rates for tradeable pairs.

**3. Positions (`/positions`)**

* Delete the "Active Account Risk & Sizing Gates" cards and "Perpetual Contract Constraints" table.
* Center the empty state vertically in the viewport when flat: oversized icon, "No Open Positions", and a small pill showing `WebSocket Connected · Listening for fills`.
* When positions exist: Render a full-bleed execution table with right-aligned values for Size, Entry Price, Mark Price, Liquidation Price, Margin, Unrealized PnL, and a quick "Market Close" trigger button.

**4. Orders (`/orders`)**

* Delete the three "Execution Rules & Fee Protocol" rulebook cards (Rule P1, Rule H4, Rule 3).
* Delete the "Account Order Capacity" table.
* When resting orders exist: Display a structured data table (Asset, Side, Type, Limit/Trigger Price, Size, Status, Time in Force, Action).
* When empty: Center the empty state cleanly without surrounding text boxes.

**5. Accounts (`/accounts`) & History (`/history`) Consolidation**
Eliminate `/history` from the sidebar. Consolidate everything into `/accounts` with clean tab filtering: `All`, `Active`, `Funded`, and `Archived / Breached`.

* **Table Layout:**
* Column 1: Stage Badge (`EVALUATION`, `FUNDED`, `BREACHED`).
* Column 2: Account Identifier + Challenge Tier.
* Column 3: Starting Capital.
* Column 4: Current Equity / Ending Equity.
* Column 5: Net PnL (in dollars and percentage).
* Column 6: Failure Trigger (or Target Progress for live accounts).
* Column 7: Action (Clickable `View Trades` link that slides out the trade history drawer).


* Right-align all dollar values and percentages. Left-align text labels.

**6. Finance (`/finance`)**

* **Summary Cards:** Keep the four KPI boxes (Total Spend, Active at Risk, Payouts Withdrawn, Net Outflow), but bump numbers to 24px font.
* **Expense Ledger Table:**
* Truncate Bank Reference IDs to `PRCR/.../DATE` with a click-to-copy tooltip.
* Right-align `USD Cost` and `Bank Debit (INR)`.
* Remove repeating "BANK VERIFIED" badges from every row; use a clean muted green checkmark icon instead.



**7. System Diagnostics (`/system`)**

* **Top Half:** Combine the three service status cards (REST, WebSocket, Pipeline) and security invariants into a compact 4-column grid.
* **Bottom Half:** Expand the Event Log Console to fill the remaining screen height. Increase font size from 10px to 13px, increase line height to 1.6, and keep syntax highlighting distinct: cyan for marks, green for order fills, and red for risk triggers.

---

### Implementation Sequence

1. **Refactor `risk-card.tsx`:** Cut out the duplicate progress bars, micro sparklines, and repeating dollar labels.
2. **Strip Positions & Orders pages:** Delete static rulebook markup from `apps/terminal/src/app/positions/page.tsx` and `orders/page.tsx`.
3. **Merge History into Accounts:** Remove `/history` route, update sidebar links, and ensure the Accounts table handles archived trade drawer lookups.
4. **Global Typography & Scale Pass:** Update `globals.css` and component tailwind classes, raising secondary text contrast to `text-zinc-400`.

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
