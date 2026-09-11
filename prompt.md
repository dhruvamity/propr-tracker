there are two UX logic flaws and one frontend discrepancy you need to handle.1. The Radar Bar UX MismatchLook at the "Breach Proximity Radar" at the top of the Live Risk tab. The red bar for the Starter account is 86% full, but the text anchored to the right of it reads $22.40 USD room.A massive red bar visually implies "a lot of something." Putting it next to the word "room" causes cognitive dissonance. If the bar fills up as risk increases, the label must state the consumed amount (e.g., $133.97 burned). If you want the label to state the remaining room, the bar should shrink as room vanishes. Pick one mental model and align the text to it.2. The Over-Pruned Market Table
In the bottom Market Reference matrix, you deleted the 8H FUNDING, MAX LEVERAGE, and TICK SIZE columns. You went too far on the visual cleanup. Put them back. Traders holding perpetual swaps need the 8H funding rate to calculate holding costs, especially since Propr restricts altcoin leverage to 2x while BTC/ETH get 10x.  3. Propr’s Frontend Rounding vs. Your Exact MathDo not chase Propr's frontend analytics when you see minor mismatches. Propr's UI aggressively rounds numbers for display:Your terminal shows Profit Target progress at 1.74% ($173.67 / $10,000). Propr’s UI rounds this up to 2.00%.Your terminal shows the worst loss at -$67.63. Propr rounds this to -$68.Propr's analytics tab shows a Net P&L of +$173.66, but their own equity reads $10,173.67, revealing a 1-cent display drift.Your terminal uses raw ledger execution data with exact Decimal.js precision. Your numbers are the mathematical truth. Keep your precise values, but consider adding a tooltip mapping them to Propr's rounded display numbers so you don't mistakenly think your API connection is broken during a session.4. Zero is NeutralIn the Overview tab, Payouts withdrawn: ₹0.00 is styled in bright green. Zero is a neutral state, not a positive achievement. Keep it a muted grey until a payout is actually processed.

The repo's own UI spec says the core hierarchy is financial header → account risk → account universe → exposure, with strict separation between actual cash, trading metrics, and freshness state.

The 7 changes I would make now
1. Fix the Live Risk radar color logic

This is the biggest visible problem in the newest screenshots.

You have:

Starter
$22.40 room
86% daily loss burned
CRITICAL
████████████████████ red

and:

Explorer
$233.31 room
24% daily loss burned
SAFE
████████ red

The second account is marked SAFE, but its radar bar is still red.

That creates a conflict:

the badge says safe, the graphic says danger.

Make the radar semantic:

0–49% consumed     green / neutral
50–74%             amber
75–89%             orange
90–99%             red
100%               breached

And apply the same threshold system everywhere.

So Explorer should look approximately:

Explorer 1-Step Turbo                         $233.31 room
████████████░░░░░░░░░░░░░░░░░░░░░░
24% used                                      SAFE

while Starter is:

Starter 1-Step Turbo                          $22.40 room
███████████████████████████░░
86% used                                      CRITICAL

This is exactly in line with the design requirement that healthy states remain restrained while breach threats use saturated semantic accents.

2. Make the account card say which risk is actually binding

The newest card contains:

$22.40 USD buffer
Daily floor $5,056.07
(DD floor: $4,850.00)

Then separately:

Drawdown 0.00% / 3%
Daily room $22.40

The user has to infer why the account is critical.

Give the card one explicit line:

BINDING LIMIT
Daily loss

or:

BINDING LIMIT
Daily loss threshold
$22.40 remaining

For Explorer:

BINDING LIMIT
Daily loss threshold
$233.31 remaining

Then underneath:

Drawdown room
$228.47

Now the card explains itself.

I would also rename:

Daily floor → Daily-loss threshold

because "floor" naturally sounds like the account's liquidation/equity floor, while your separate DD floor already owns that terminology.

The product's documented use case is explicitly to inspect remaining drawdown budget and daily-loss headroom before trading.

3. Make "Active Capital at Risk" visually subordinate to actual cash

The finance numbers themselves are correct.

The repo explicitly defines:

ACTIVE CAPITAL = actual bank cash currently at risk in active evaluation/funded accounts, currently ₹7,336.19.

So don't change the number.

But the visual presentation:

₹7,336.19
Active Capital at Risk (2 Evals)

sits almost equally beside:

₹25,394.83
Total Capital Outflow

I would make the relationship clearer:

TOTAL CASH SPENT
₹25,394.83

ACTIVE CASH STILL AT RISK
₹7,336.19
2 active evaluations

and keep:

Estimated face value
$75.00

as a small secondary line.

That reinforces the three-layer accounting model instead of making $15,000 Trading Capital visually compete with actual INR cash.

The repo specifically requires the UI to avoid equating nominal challenge value with actual cash spent.

4. Remove the arrows between Finance cards

This:

Total Capital Outflow
        →
Active Capital at Risk
        →
Payouts Received
        →
Net Capital Outflow

looks like a four-step process.

It isn't.

Active Capital at Risk is a subset of current purchases, while payouts are a separate cash movement.

So the arrows imply a relationship that doesn't exist.

I'd replace the four cards with:

CASH RECONCILIATION

TOTAL CASH SPENT                     ₹25,394.83
ACTIVE CASH AT RISK                   ₹7,336.19
PAYOUTS RECEIVED                           ₹0.00

──────────────────────────────────────────────

NET CASH OUTFLOW                      -₹25,394.83

Or retain four cards but remove the arrows.

This is a small visual change with a large semantic improvement.

5. The Overview account cards contain too much duplicated information

You're showing:

Active account card
        ↓
Active Accounts table
        ↓
Archived / Breached Accounts

The card already contains:

equity
daily room
drawdown
target
trade trajectory
balance
active days

Then the table repeats:

account
balance
equity
buffer
daily room
trajectory
target
risk state

That is a lot of repeated scanning.

I'd make the Overview table much lighter:

ACTIVE ACCOUNTS (2)

Account                  Equity       Risk        Room
Starter 1-Step Turbo     $5,078.47    CRITICAL    $22.40
Explorer 1-Step Turbo    $10,173.67   SAFE       $233.31

The cards own the detail.

The table owns comparison.

That's a much cleaner division.

6. The System page is now structurally good

This version is substantially better:

REST API       HEALTHY
WEBSOCKET      DISCONNECTED
DATA PIPELINE  FRESH

REST → CACHE → UI
15s polling

The repo explicitly requires stale/disconnected states to be visible and not masqueraded as live.

One thing still bothers me:

FILLS order.filled

inside the log.

Because this is a read-only terminal, a user could interpret that as "the terminal executed an order."

The repository explicitly says the application has zero order-placement/modification endpoints and is observational only.

Change the event label to something like:

UPSTREAM_FILL
Observed order.filled event

or:

FILL_EVENT
Upstream execution observed

That removes the ambiguity without hiding useful telemetry.

7. Rename the sidebar footer states

Currently:

● REST connected
● Data synchronized

I would use:

● REST API healthy
● Data updated 15s ago

The second line is particularly important.

"Data synchronized" sounds binary. It doesn't tell you how fresh the data is.

Your top bar already handles relative freshness, and the design spec explicitly calls for relative timestamps such as "Just now" / "12s ago" with stale degradation after the threshold.

So the footer should reinforce that rather than introduce another status vocabulary.

One change I would make to the Overview header

You currently have:

POLLING (15s)
Synced 25s ago
● REST   ● WS

This is much better than the old LIVE behavior.

But I'd simplify it to:

● POLLING · 15s
Updated 25s ago
REST ●   WS ○

And when WS connects:

● LIVE · REALTIME
Updated 2s ago
REST ●   WS ●

The repo currently still has code in TopBar that derives the main status from REST health rather than WS state, so the actual source code needs to keep this distinction intact rather than relying only on the visual treatment.

The visual hierarchy I would lock in

At this point I'd establish this as the final hierarchy:

1. BINDING RISK
   How close am I to losing the account?

2. DAILY LOSS ROOM
   How much can I lose today?

3. DRAWDOWN ROOM
   How much equity buffer remains?

4. EQUITY / BALANCE
   Where am I now?

5. PROFIT TARGET
   How far am I from passing?

6. TRADE TRAJECTORY
   What has today's trading looked like?

7. ACCOUNT METADATA
   Phase / days / model / IDs

And for Finance:

1. TOTAL CASH SPENT
2. ACTIVE CASH AT RISK
3. PAYOUTS
4. NET CASH POSITION
5. BANK LEDGER

That matches the actual jobs described in your specification: pre-trade risk checking, intraday monitoring, account-state management, and cash-flow audit.

What I would NOT change anymore

I would leave these alone:

Dark theme.
It fits the monitoring-terminal use case.

JetBrains Mono for financial values.
The design spec explicitly calls for monospace numeric alignment.

Red/amber/green semantic colors.
They're appropriate here.

15s polling presentation.
The degraded POLLING state is honest.

Breach-proximity ranking.
That's one of the most useful additions you've made.

Trade trajectory mini-chart.
Keep it, but make its meaning slightly clearer.

Read-only behavior.
The UI should remain observational and never acquire trading controls.

The next pass should be small

I would make the next implementation pass only these changes:

P0
✓ Risk radar colors follow actual severity
✓ Show BINDING LIMIT on every active account
✓ Rename Daily floor → Daily-loss threshold
✓ Remove Finance arrows
✓ Remove duplicated metrics from Overview table
✓ Rename upstream FILLS in diagnostics
✓ Make sidebar freshness explicit

P1
✓ Standardize all risk thresholds
✓ Clarify trade trajectory
✓ Tighten spacing by ~5–10%
✓ Verify mobile/tablet layout

At that point, I would stop redesigning and do a real UX/accessibility pass: keyboard focus, 44px touch targets, text contrast, responsive breakpoints, loading/error states, and whether every number answers a concrete trader question. Your UI spec explicitly calls for those shell/navigation behaviors as well.

The no-slop guidance also points in the same direction: keep concrete information, remove redundant framing, avoid robotic repetition, and preserve the actual character of the product rather than replacing it with a generic polished dashboard.
