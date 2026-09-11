The table rendering lives in `apps/terminal/src/components/accounts-directory.tsx`.

To clamp the percentages, update the formatting utility in `apps/terminal/src/lib/utils.ts`. Use `Intl.NumberFormat` to lock the output to two decimal places instead of rendering the raw strings calculated in `packages/calculations/src/risk.ts`.

For the other UI adjustments:

* **WebSocket colors:** Parse the JSON strings in `apps/terminal/src/components/system-terminal-stream.tsx` and map text color classes to the `type` field.


* **Active tab styling:** Edit `apps/terminal/src/components/sidebar.tsx`. Change the active text color to white or light grey while keeping the cyan border.


* **Empty state centering:** Update `apps/terminal/src/components/empty-state.tsx`. Add `flex-1 items-center justify-center` to the parent wrapper so it dynamically fills the remaining viewport height.


* **Risk card padding:** Increase the vertical padding inside the metric blocks in `apps/terminal/src/components/risk-card.tsx`.





### 1. Fix the realtime state everywhere

This is the biggest remaining issue.

Your screenshots show:

```text
SYNCED • POLLING
REST ●
WS ●
```

and Diagnostics shows:

```text
REST API         HEALTHY
WEBSOCKET        DISCONNECTED
DATA PIPELINE    FRESH
```

but elsewhere you still show:

```text
REALTIME RADAR
```

and inside the account cards:

```text
SYNC
REALTIME
```

That is contradictory.

Your own specification explicitly says that a disconnected WebSocket must enter a degraded REST-fallback state and must never present cached/polled data as live. ([GitHub](https://github.com/dhruvamity/propr-tracker/blob/main/UI_DESIGN_REQUIREMENTS.md "propr-tracker/UI_DESIGN_REQUIREMENTS.md at main · dhruvamity/propr-tracker · GitHub"))

Make the vocabulary global:

| Actual stateUI                 |                    |
| ------------------------------ | ------------------ |
| REST + WS                      | `LIVE • REALTIME`  |
| REST healthy + WS disconnected | `SYNCED • POLLING` |
| Data older than 60s            | `STALE • {time}`   |
| API unavailable                | `OFFLINE`          |

Then `/live` should say:

```text
Live Risk

Breach proximity across active accounts

2 ACTIVE ACCOUNTS
● REST POLLING
```

not:

```text
REALTIME RADAR
```

The current GitHub `TopBar` still derives its primary status from `restStatus`, so it can call the interface `LIVE` while `wsStatus` is disconnected.

That should be corrected in code, not merely visually.

---

# 2. Make the Overview top section more useful

The new portfolio block is much better than the four-card arrangement.

But the current hierarchy is:

```text
₹25,394.83                    ₹7,336.19

Total cash spent              Currently at risk

Propr ₹21,559.58              Active accounts 2 at risk
Breakout ₹3,835.25            Funded accounts 0 active
```

The numbers are good, but the user has to scan horizontally to understand the relationship.

I'd make the top block:

```text
PORTFOLIO CASH POSITION

₹25,394.83                         ₹7,336.19
TOTAL CASH SPENT                   ACTIVE CASH AT RISK

Propr        ₹21,559.58            2 active accounts
Breakout      ₹3,835.25            0 funded accounts

Payouts received     ₹0.00
Net cash outflow    -₹25,394.83
```

And add a tiny visual relationship:

```text
TOTAL SPENT
████████████████████████████  ₹25,394.83

ACTIVE AT RISK
███████                       ₹7,336.19
```

Not a percentage chart. Just a proportional visual.

The design requirements specifically distinguish actual bank cash from face value and trading P&L, so preserving that hierarchy is more important than adding more KPIs. ([GitHub](https://github.com/dhruvamity/propr-tracker/blob/main/UI_DESIGN_REQUIREMENTS.md "propr-tracker/UI_DESIGN_REQUIREMENTS.md at main · dhruvamity/propr-tracker · GitHub"))

---

# 3. Rename “ACTUAL CASH P&L” in the UI

I still don't like that label.

The repo defines it as:

`processed payouts - actual cash outflow`. ([GitHub](https://github.com/dhruvamity/propr-tracker/blob/main/UI_DESIGN_REQUIREMENTS.md "propr-tracker/UI_DESIGN_REQUIREMENTS.md at main · dhruvamity/propr-tracker · GitHub"))

For a trader, “P&L” strongly suggests trading performance.

Use:

**NET CASH POSITION**

Then:

```text
NET CASH POSITION
-₹25,394.83

₹25,394.83 spent
₹0.00 withdrawn
```

You can retain the technical `actualCashPnLINR` field internally.

This removes a potential semantic misunderstanding without changing the data model.

---

# 4. The account cards are now good, but still too tall

The new cards are substantially better.

The strongest area is:

```text
REMAINING BREACH BUFFER

$473.67                    $10,173.67
to breach floor            CURRENT EQUITY
```

followed by:

```text
Floor $9,700                       Equity $10,173.67
───────────────────────────────●
       $473.67 buffer headroom
```

Keep that.

What I'd remove from the card is some duplication.

You currently show:

```text
Remaining breach buffer
↓
Drawdown buffer
↓
Drawdown consumed
```

Those are closely related.

I'd structure it as:

```text
$473.67
REMAINING TO BREACH

Floor               $9,700
Equity             $10,173.67
Buffer                 $473.67

Daily loss room        $336.84

Target                 19.30%
```

Then one small secondary meter for target progress.

The current implementation still gives the target meter and drawdown meter almost equal visual weight. The product's primary safety task is avoiding liquidation, so breach distance should win that hierarchy. The specification itself puts drawdown consumption and daily-loss cushion at P0. ([GitHub](https://github.com/dhruvamity/propr-tracker/blob/main/UI_DESIGN_REQUIREMENTS.md "propr-tracker/UI_DESIGN_REQUIREMENTS.md at main · dhruvamity/propr-tracker · GitHub"))

---

# 5. Make risk color semantic, not decorative

Your current healthy state uses quite a lot of green.

A healthy card should mostly look neutral.

Something closer to:

```text
┌────────────────────────────────────────────┐
│ ① Explorer 1-Step Turbo       ● SAFE      │
│                                            │
│ $473.67                                    │
│ remaining to breach                        │
│                                            │
│ Floor $9,700 ───────────────● $10,173.67  │
│                                            │
│ Daily room     $336.84                     │
│ Target         19.30%                      │
└────────────────────────────────────────────┘
```

Green should mainly mark:

`SAFE`

`+PnL`

`healthy`

not entire components.

That follows the intended design principle of “calm when healthy, urgent when at risk.” ([GitHub](https://github.com/dhruvamity/propr-tracker/blob/main/UI_DESIGN_REQUIREMENTS.md "propr-tracker/UI_DESIGN_REQUIREMENTS.md at main · dhruvamity/propr-tracker · GitHub"))

---

# 6. Remove “REALTIME” from account cards

This is worth repeating separately because it appears in two places.

Current:

```text
SYNC
REALTIME
```

Change dynamically to:

```text
SYNC
POLLING
```

when WebSocket is unavailable.

Or even better:

```text
DATA
11s ago
```

The global top bar already communicates the transport state, so duplicating `REALTIME` inside every card isn't necessary.

---

# 7. Live Risk should be more opinionated

The current ordering is good:

```text
1 Starter   $228.47
2 Explorer  $473.67
```

That's much more useful than arbitrary ordering.

I'd make the heading itself answer the user's question:

```text
LIVE RISK

Closest accounts to breach
```

Then:

```text
#1 STARTER 1-STEP TURBO

$228.47 TO BREACH
SAFE

#2 EXPLORER 1-STEP TURBO

$473.67 TO BREACH
SAFE
```

Don't spend prime screen space on the perpetual-market matrix.

Move it below the risk section as:

```text
MARKET REFERENCE
BTC   $68,432.50   +2.45%
ETH    $3,542.80   +1.82%
SOL      $178.45   +4.12%
SUI        $1.84   -0.65%
```

or behind a collapsed `Market reference` section.

The Live page's job is account risk. Market metadata is secondary.

---

# 8. Positions and Orders have too much dead space

This is now the weakest visual area.

The screenshots essentially show:

```text
──────────────────────────────────────────────

                  [icon]

               No Open Positions

      Your 2 active accounts currently
       have no market exposure.

            Active accounts 2
            Open positions 0
            Open orders 0

              ● Position stream active

──────────────────────────────────────────────
```

inside a huge empty canvas.

The design requirements explicitly call for centered empty states, but the same document also prioritizes high information density. ([GitHub](https://github.com/dhruvamity/propr-tracker/blob/main/UI_DESIGN_REQUIREMENTS.md "propr-tracker/UI_DESIGN_REQUIREMENTS.md at main · dhruvamity/propr-tracker · GitHub"))

Bring it closer to the content header and shrink the container:

```text
ACTIVE TRADING POSITIONS                              0

┌───────────────────────────────────────────────────┐
│                                                   │
│              No open positions                    │
│                                                   │
│  2 active accounts are currently flat.            │
│                                                   │
│  Last checked 16s ago                             │
│                                                   │
└───────────────────────────────────────────────────┘
```

Same treatment for Orders.

No giant vertical dead zone.

---

# 9. Accounts page is close

This is probably your strongest table screen now.

Keep:

```text
All (8)   Active (2)   Failed (6)   Funded (0)
```

and:

```text
Search account / ID...
Sort: Risk (Breach Proximity)
```

But make the table more actionable visually.

For active accounts, surface the actual useful number:

```text
EVALUATION
Starter 1-Step Turbo

$5,078.47
$228.47 to breach
```

instead of making the reader infer risk from:

```text
100.00% of limit
```

for failed accounts.

Also, the little chevron at the beginning of every row currently promises an expandable row.

If it isn't genuinely expandable, remove it.

If it is, make the expanded view worthwhile:

```text
Account details
├─ Challenge
├─ Purchase cost
├─ Breach floor
├─ Daily loss limit
├─ Failure reason
├─ Trade count
└─ Last sync
```

That is much better than a decorative chevron.

---

# 10. History needs a small summary strip

Right now History is basically a raw archive table.

You already have:

```text
6 archived
137 trades
55 trades
73 trades
26 trades
58 trades
15 trades
```

Use that information.

At the top:

```text
HISTORY

6 breached accounts

┌────────────┐ ┌────────────┐ ┌────────────┐
│ 6          │ │ 5          │ │ 1          │
│ Breached   │ │ DD failures│ │ Daily loss │
└────────────┘ └────────────┘ └────────────┘
```

Then the table.

I wouldn't add invented financial statistics. Everything above can be derived from the existing archive.

---

# 11. Diagnostics currently has a serious contradiction

This is the other major issue after realtime state.

Your screenshot shows:

```text
WEBSOCKET STREAM
DISCONNECTED

Fallback active • 15s ISR polling
```

but at the bottom:

```text
STATUS: STREAMING
PROTOCOL: WebSocket 13
```

Those cannot both be true.

Also the log contains:

```text
FILLS order.filled
```

which can make the user wonder whether this application can execute trades, even though the repository explicitly says the terminal has **zero order-placement/cancellation mutation endpoints**. ([GitHub](https://github.com/dhruvamity/propr-tracker "GitHub - dhruvamity/propr-tracker · GitHub"))

Change the bottom bar to:

```text
STATUS: POLLING
FALLBACK: ISR 15s
WS: DISCONNECTED
```

When connected:

```text
STATUS: STREAMING
WS: CONNECTED
HEARTBEAT: 2.4s
```

When disconnected:

```text
STATUS: POLLING
WS: DISCONNECTED
LAST EVENT: 42s ago
```

That makes the diagnostics page trustworthy.

---

# 12. Don't make Diagnostics look like a developer console

The log console is useful, but it dominates the screen.

I'd make the hierarchy:

```text
SYSTEM HEALTH

REST API          HEALTHY
WEBSOCKET         DISCONNECTED
DATA PIPELINE     FRESH

--------------------------------

PIPELINE
REST → CACHE → UI
       ↓
   15s polling

--------------------------------

EVENT LOG
```

Then logs.

The user is monitoring a financial terminal, not debugging a backend daemon.

---

# 13. Sidebar needs grouping consistency

Your screenshot now has:

```text
MONITOR
  Live Risk
  Positions
  Orders

ACCOUNTS
  Accounts
  History

FINANCE
  Cash & P&L

SYSTEM
  Diagnostics
```

This is much better than the original flat navigation.

Keep it.

One change: remove all-uppercase route labels from the older version and use normal title case consistently:

```text
Overview
Live Risk
Positions
Orders
Accounts
History
Cash & P&L
Diagnostics
```

Keep uppercase only for section labels.

That reduces the “synthetic terminal UI” feel.

---

# 14. Add one extremely useful visual: risk ranking bar

You have enough data to make this very effective.

On Live:

```text
BREACH DISTANCE

Starter 1-Step Turbo
$228.47
███████████████████░░░░

Explorer 1-Step Turbo
$473.67
███████████████████████░
```

The cards already contain the data, so this is not a new feature.

The user instantly understands:

> Starter is the account I need to watch first.

That is exactly the use case described for `/live`. ([GitHub](https://github.com/dhruvamity/propr-tracker/blob/main/UI_DESIGN_REQUIREMENTS.md "propr-tracker/UI_DESIGN_REQUIREMENTS.md at main · dhruvamity/propr-tracker · GitHub"))

---

# 15. Fix the visual “AI-generated dashboard” fingerprints

This is where your supplied no-slop guidance is useful.

The current screenshots still have several patterns that make the UI feel generated rather than designed:

```text
ACTIVE ACCOUNT RISK MONITOR
PERPETUAL MARKETS REFERENCE MATRIX
SYSTEM DIAGNOSTICS & GATEWAY HEALTH
DATA PIPELINE STATUS
SECURITY & READ-ONLY INVARIANTS
```

The labels are technically descriptive, but there are too many formal nouns stacked together.

Use:

```text
ACTIVE ACCOUNTS

MARKET REFERENCE

SYSTEM HEALTH

DATA PIPELINE

SECURITY
```

Similarly, avoid repeatedly writing:

```text
across active evaluation and funded accounts
```

when the surrounding context already tells the user that.

The supplied editing rules specifically call for concrete, direct language, removal of repetitive abstraction, and less robotic symmetry.

---

# 16. Keep the visual system, don't redesign the brand

I would **not** switch you to a white SaaS dashboard, glassmorphism, gradients, charts everywhere, or a generic shadcn admin template.

The current identity is appropriate:

```text
#06060b
#0c0c14
#11111b
#16162a
```

with:

```text
cyan = active/system
green = healthy/profit
amber = caution/stale
red = failure/breach
```

Those are already defined in your design system. ([GitHub](https://github.com/dhruvamity/propr-tracker/blob/main/UI_DESIGN_REQUIREMENTS.md "propr-tracker/UI_DESIGN_REQUIREMENTS.md at main · dhruvamity/propr-tracker · GitHub"))

The issue isn't the palette.

It's **how often each semantic color appears**.

---

# 17. One architecture change I'd make in the repo

You already have a component inventory specifying:

`Sidebar`, `TopBar`, `MetricCard`, `RiskProgressBar`, `StatusBadge`, `DataTable`, `HealthPill`, `CopyableId`, and `OfflineBanner`. ([GitHub](https://github.com/dhruvamity/propr-tracker/blob/main/UI_DESIGN_REQUIREMENTS.md "propr-tracker/UI_DESIGN_REQUIREMENTS.md at main · dhruvamity/propr-tracker · GitHub"))

I'd actually implement that abstraction instead of continuing to style page-specific blocks.

Something like:

```text
components/
  layout/
    sidebar.tsx
    top-bar.tsx
    page-header.tsx

  finance/
    cash-position.tsx
    metric-card.tsx

  risk/
    risk-card.tsx
    risk-meter.tsx
    breach-distance.tsx
    status-badge.tsx

  data/
    data-table.tsx
    copyable-id.tsx
    empty-state.tsx

  system/
    health-pill.tsx
    freshness-banner.tsx
```

Then all pages share exactly the same semantics.

That matters because your biggest remaining problem is **state consistency**, not styling.

---

# My priority order

### Fix immediately

**1. WebSocket / polling semantics everywhere**
**2. Remove contradictory** **`REALTIME`** **/** **`STREAMING`** **states**
**3. Rename** **`Actual Cash P&L`** **→** **`Net Cash Position`**
**4. Reduce Positions/Orders empty-state height**
**5. Reduce account-card duplication**

### Then

**6. Simplify Live Risk**
**7. Add History summary strip**
**8. Make Accounts row expansion genuinely useful**
**9. Simplify section naming**
**10. Reduce semantic-color usage**

### Don't touch

**Dark terminal identity**
**Monospace financial values**
**Breach-buffer-first risk card**
**Breach-proximity sorting**
**Cash reconciliation structure**
**Read-only interaction model**

