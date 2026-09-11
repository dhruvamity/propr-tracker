Format the floating-point numbers
In Screenshot 2026-09-12 at 01.02.06.jpg and Screenshot 2026-09-12 at 01.02.10.png, the target percentages bleed out to 16 decimal places (e.g., 19.297219444444444%). Clamp these to two decimal places (19.30%).

Color-code the WebSocket stream
The raw terminal stream in Screenshot 2026-09-12 at 01.02.21.jpg is a massive improvement, but reading monochromatic grey JSON is slow. Apply basic syntax highlighting. Differentiate the event types (e.g., make mark.updated cyan and order.filled green) and dim the JSON keys so the values stand out.

Fix the active state hierarchy
In the left sidebar across all views, the active tab uses a cyan border and text. The high contrast draws the eye immediately to the navigation instead of the data. Keep the cyan left border, but drop the text color back to a bright white or light grey. The border is enough to anchor the user.

Center the empty states vertically
The new empty state components in Screenshot 2026-09-12 at 01.02.14.png and Screenshot 2026-09-12 at 01.02.16.png sit slightly too high on the screen. Vertically center them within the remaining viewport height, rather than centering them inside a static container.

Standardize the risk metrics layout
In the Live Risk Command cards (Screenshot 2026-09-12 at 01.02.06.jpg), the three metric blocks (Breach Floor, Drawdown Buffer, Daily Allowance) are packed too tightly against their internal borders. Increase the vertical padding inside those cells so the text has room to breathe.

1. Fix the global shell first

Current navigation is a flat 8-item icon/text rail and the top bar repeats PROPR // ACCOUNT TERMINAL on every screen. The sidebar implementation is also fixed-width and has no visible mobile drawer behavior.

I'd change it to:

PROPR
TRADING TERMINAL
────────────────────

OVERVIEW

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

────────────────────
● REST HEALTHY
● DATA FRESH

Then the top bar becomes contextual:

Live Risk
Which account is closest to its breach floor?

                         ● LIVE
                         Synced 4s ago
                         REST ●   WS ●
                         ↻

That immediately tells the user where they are and what they should look at, rather than making every page feel identical.

The design spec itself calls for a persistent shell, contextual status, relative sync timing, and mobile drawer navigation.

2. Fix the biggest semantic UX problem: “LIVE”

This is the highest-priority change.

Your current TopBar decides whether the interface says LIVE primarily from:

health.restStatus === "HEALTHY"

while WebSocket state is displayed separately.

That means the UI can communicate LIVE while the WebSocket is disconnected.

And your supplied System screenshot actually shows this exact ambiguity:

REST API Gateway: HEALTHY
WebSocket Realtime Stream: DISCONNECTED
15s ISR Enabled

while other parts of the shell still look “LIVE”.

That should become a first-class state:

State	UI
REST + WS connected	LIVE • REALTIME
REST healthy + WS disconnected	SYNCED • POLLING
Last update >60s	STALE
API unavailable	OFFLINE

The user should never have to interpret what REST/WS dots mean.

Your own specification says stale/disconnected data must visibly degrade and the interface must never masquerade cached data as live.

3. Redesign the Overview hierarchy

Right now the Overview starts with four equal cards:

TOTAL ACTUAL CASH SPENT
ACTIVE CAPITAL
PAYOUTS WITHDRAWN
ACTUAL CASH PNL

The implementation gives all four almost identical visual treatment.

I'd make this hierarchy:

┌──────────────────────────────────────────────────────────┐
│ PORTFOLIO CASH POSITION                                  │
│                                                          │
│ ₹25,394.83                  ₹7,336.19                   │
│ Total cash spent            Currently at risk          │
│                                                          │
│ Propr ₹21,559.58            2 active accounts           │
│ Breakout ₹3,835.25          0 funded                   │
│                                                          │
│ Payouts ₹0.00               Net cash outflow ₹25,394.83│
└──────────────────────────────────────────────────────────┘

Then:

ACCOUNT HEALTH
2 ACTIVE    0 FUNDED    0 PASSED    6 FAILED

┌─────────────────────────┐ ┌─────────────────────────┐
│ Explorer 1-Step Turbo   │ │ Starter 1-Step Turbo    │
│                         │ │                         │
│ $10,173.67 EQUITY       │ │ $5,078.47 EQUITY        │
│ +1.74%                  │ │ +1.57%                  │
│                         │ │                         │
│ BREACH BUFFER           │ │ BREACH BUFFER           │
│ $473.67                 │ │ $228.47                 │
│ █████████████░░░  SAFE  │ │ ███████████░░░░  SAFE   │
│                         │ │                         │
│ Daily loss room $336.84 │ │ Daily loss room $55.95  │
│ Target 19.3%             │ │ Target 17.4%             │
└─────────────────────────┘ └─────────────────────────┘
The important change

The existing UI treats profit target progress and drawdown consumption as equally important horizontal bars.

For a prop trader, the more important question is:

How much room do I have before I kill the account?

So make the breach buffer the dominant visual.

Profit target becomes secondary.

4. Make the risk card much easier to scan

Current card:

Profit Target Progress          19.29%
████████

Max Drawdown Consumed            0%
────────────────

Then three small boxes underneath.

This forces the user to mentally connect several numbers.

Instead:

EXPLORER 1-STEP TURBO
$10,173.67
+$173.67 today

RISK STATUS
SAFE

$473.67
TO BREACH FLOOR

Equity       $10,173.67
Floor         $9,700.00
Daily room      $336.84

DD consumed        0%
Target progress  19.3%

Use one large remaining-risk number and make the floor relationship obvious.

A small horizontal ruler would work better than another generic progress bar:

$9,700 floor                         $10,173.67
│────────────────────────────────────────●
                  $473.67 buffer

That is much more immediately understandable.

Your documented risk states already have HEALTHY / CAUTION / CRITICAL / BREACHED semantics; lean into those rather than relying on generic colored bars.

5. Stop using cyan as the default visual hierarchy

The current implementation uses cyan for:

active navigation
active accounts
profit bars
active capital
headings
table states
market prices
assorted metadata

That makes cyan lose meaning.

I'd establish:

WHITE       primary data
LIGHT GRAY  secondary data
CYAN        active / selected / informational
GREEN       healthy / profitable
AMBER       caution / stale
RED         danger / breach / loss

So a healthy account becomes mostly neutral with one green status indicator, instead of an entire cyan card.

This matches the design requirement that normal operations remain restrained and semantic colors should carry urgency.

6. Increase typography noticeably

Your current CSS makes the interface very small:

section headers: 10–12px
table data: 11–12px
metadata: 10px

and the page implementation heavily relies on text-[10px], text-[11px], and text-xs.

For a personal trading monitor, I'd use:

Page title          18–20px
Section title       13–14px
Primary metric      28–32px
Secondary metric    16–18px
Table data          12–13px
Metadata            10–11px

Keep JetBrains Mono for numbers, prices, IDs, percentages, but use Inter much more aggressively for labels and explanatory copy.

The existing design spec already distinguishes Inter and JetBrains Mono, so this is an evolution rather than a change of direction.

7. Replace “everything is a bordered box”

This is one of the biggest visual problems in the screenshots.

Almost every region is:

border
background
border
background
border
background

That creates visual grid noise.

Use three levels instead:

Canvas
  ↓
Section
  ↓
Primary card / table
  ↓
Internal divider

Only important containers get borders.

For example, your account card can lose the outer glowing/bordered look and instead use:

subtle surface
1px hairline border
left semantic status rail
clear internal dividers

The current CSS's --border-primary, --border-subtle, bg-surface, and bg-elevated tokens already provide enough primitives to do this.

8. Redesign empty states

Your /positions and /orders screenshots have a large empty rectangle occupying most of the page.

The current Positions implementation literally renders a large padded container around the empty state.

Instead:

POSITIONS                                          0

No open positions

Your 2 active accounts currently have no market exposure.

Active accounts      2
Open positions       0
Open orders          0

Last checked 8s ago

Height: ~180–220px.

Do the same for Orders.

When there is no data, reduce the visual footprint, rather than preserving the same giant table container.

9. Make Accounts a real working directory

The Accounts screen currently shows a table but very little interaction.

Add a compact control strip:

ACCOUNTS                              8 total

[ All ] [ Active ] [ Failed ] [ Funded ]

Search account / ID...       Sort: Risk ▼

Then make each row feel inspectable:

● ACTIVE
J9WNi8oj                    Explorer 1-Step Turbo
$10,173.67                  +1.74%

DD BUFFER       $473.67
DAILY ROOM      $336.84
TARGET          19.3%

[SAFE]

The row can expand rather than navigating away.

Useful interactions:

copy account ID
sort by breach proximity
sort by target progress
filter lifecycle state
expand failure details
show account freshness

That fits the read-only interaction model specified for the product.

10. Fix the wording of “ACTUAL CASH PNL”

This label is potentially misleading.

Your data is currently showing:

ACTUAL CASH PNL
-₹25,394.83
Net Outflow: ₹25,394.83

because there are currently zero payouts. The finance implementation confirms this is derived from cash spent and payouts, not the trader's market P&L.

A trader could easily read that as:

“I lost ₹25,394 trading.”

I'd rename it:

NET CASH POSITION

and display:

NET CASH OUTFLOW

−₹25,394.83

₹0 payouts
₹25,394.83 spent

That distinction is important.

11. Finance should visually explain the three-layer accounting

The data model is one of the strongest parts of the project. The README explicitly defines:

Face Value
Actual Bank Cash
Trading Metrics

The UI currently presents these mostly as cards and a ledger.

Make the accounting relationship visual:

                    CASH POSITION

₹25,394.83
TOTAL ACTUAL CASH SPENT
        │
        ├── Propr        ₹21,559.58
        └── Breakout      ₹3,835.25

        ↓

₹7,336.19
ACTIVE CASH AT RISK

        ↓

₹0.00
PAYOUTS RECEIVED

Then the detailed ledger below.

That would make Finance feel like an actual cash audit tool, instead of another table.

12. System page should have two layers

Currently the System screenshot jumps quickly into raw WebSocket log output.

Make the page:

SYSTEM HEALTH

┌────────────┐ ┌────────────┐ ┌────────────┐
│ REST       │ │ WEBSOCKET  │ │ DATA       │
│ HEALTHY    │ │ DISCONNECTED│ │ FRESH     │
│ 38ms       │ │ fallback    │ │ 12s ago   │
└────────────┘ └────────────┘ └────────────┘

DATA PIPELINE

REST API                 HEALTHY
Realtime stream          DISCONNECTED
Fallback                 ISR 15s
Monitored accounts       8

────────────────────────────────────

DIAGNOSTIC STREAM
[23:58:10] Gateway initialized
[23:58:10] Authentication verified
...

Raw logs should be secondary, not the first thing the user sees.

13. Remove the “fake futuristic” details

I'd remove or significantly tone down:

excessive uppercase labels
constant letter spacing
repeated //
glowing text
unnecessary pulsing
tiny terminal metadata
grid background on every page
decorative borders
“SYSTEM / STREAM / ENGINE / MATRIX” language everywhere

The product isn't a fictional trading movie interface.

It is a serious personal risk monitor.

The visual language should communicate:

“I can understand the state of my money and my accounts in three seconds.”

14. Use page-specific visual hierarchy

Every page currently feels like the same template with different content.

Make each route have one dominant job:

Page	Dominant question	Primary visual
Overview	What is happening overall?	Portfolio + account risk
Live	Which account is closest to breach?	Ranked risk radar
Accounts	What accounts do I have?	Filterable directory
Positions	What exposure exists?	Position table
Orders	What protective orders exist?	Order table
Finance	How much money have I spent?	Cash-flow summary
History	What failed and why?	Failure archive
System	Is my data trustworthy?	Health/status dashboard

The existing architecture already maps these routes this way.

15. One very strong addition: “Risk ranking”

The /live page should not simply show accounts in arbitrary order.

Sort them by:

BREACH PROXIMITY
↓
CRITICAL
CAUTION
SAFE

Example:

LIVE RISK RADAR

1  Starter 1-Step Turbo
   $228.47 to breach
   ███████████████░░
   CAUTION

2  Explorer 1-Step Turbo
   $473.67 to breach
   █████████████░░░░
   SAFE

This directly answers the user's actual pre-trade question.

The specification identifies breach proximity as one of the core use cases, so this is a much stronger use of the existing data than adding more widgets.

Recommended component architecture

I'd refactor the UI around these primitives:

<AppShell>
 ├── <Sidebar />
 ├── <TopBar />
 └── <PageContainer>

<MetricCard />
<RiskCard />
<RiskMeter />
<StatusBadge />
<HealthIndicator />
<DataTable />
<EmptyState />
<SectionHeader />
<FilterBar />
<AccountRow />
<CashBreakdown />
<FreshnessBadge />

The repo currently has only a small shared component layer, including Sidebar, TopBar, EmptyState, TradeDrawer, and the bank reference badge.

That is the right place to centralize the redesign rather than styling every page independently.

Priority order I'd use
P0 — do first

1. Global shell + typography
2. Live/stale/WS semantics
3. Overview hierarchy
4. Risk card redesign
5. Reduce cyan/glow/border noise

P1

6. Accounts filters + expandable rows
7. Finance cash-flow visualization
8. Better empty states
9. Live page risk ranking
10. System health redesign

P2

11. Mobile drawer
12. Copyable IDs/tooltips
13. Keyboard/focus improvements
14. Loading/skeleton states
15. Subtle transitions

Your specification already identifies the shell, Dashboard, Live Risk, Accounts, Positions and Finance as P0, with mobile behavior and status/freshness as important follow-up areas.

The visual target

I would aim for this style:

                         PROPR
                    PERSONAL RISK TERMINAL

┌──────────────┬──────────────────────────────────────────────┐
│              │ Overview                         ● Live      │
│  OVERVIEW    │                              Synced 8s ago  │
│              │──────────────────────────────────────────────│
│  MONITOR     │                                              │
│  Live Risk   │ PORTFOLIO                                    │
│  Positions   │ ₹25,394.83        ₹7,336.19                 │
│  Orders      │ Cash Spent         Active Cash at Risk       │
│              │                                              │
│  ACCOUNTS    │ 2 ACTIVE    0 FUNDED    0 PASSED    6 FAILED│
│  Accounts    │                                              │
│  History     │ ACTIVE ACCOUNT RISK                          │
│              │                                              │
│  FINANCE     │ ┌────────────────┐ ┌─────────────────────┐  │
│  Cash & P&L │ │ Explorer       │ │ Starter             │  │
│              │ │ $10,173.67     │ │ $5,078.47           │  │
│  SYSTEM      │ │ SAFE           │ │ SAFE                │  │
│  Diagnostics │ │ $473 to breach │ │ $228 to breach      │  │
│              │ │                │ │                     │  │
│              │ │ Daily $336.84  │ │ Daily $55.95        │  │
│              │ └────────────────┘ └─────────────────────┘  │
│              │                                              │
│  ● REST OK  │ ACCOUNTS                                     │
│              │ 8 accounts • 2 active • 6 failed             │
└──────────────┴──────────────────────────────────────────────┘

That keeps the identity you already built while making it significantly easier to operate.