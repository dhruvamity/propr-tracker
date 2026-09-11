# Propr Trading Terminal — UI/UX Requirements Extraction for a Designer

Repository:

https://github.com/dhruvamity/propr-tracker.git

You have full access to the repository and its current implementation.

Your task is NOT to redesign, code, or modify the website.

Your task is to produce a **complete UI/UX requirements document** that can be handed directly to a professional UI/UX designer or design agent who has not seen the codebase.

The designer should be able to understand:

* what the product is;
* who it is for;
* what every screen needs to show;
* what every page and route needs to contain;
* what data each component represents;
* what states each component needs;
* what interactions are required;
* what information is critical vs secondary;
* what must remain visible at all times;
* what can be collapsed or hidden;
* how risk should be communicated;
* how finance should be separated from trading performance;
* how desktop/tablet/mobile layouts should behave;
* what the designer must NOT change because it would alter product semantics.

Do not make design decisions that are unsupported by the existing application.

Extract the requirements from the actual repository.

---

# 1. READ THE ENTIRE PRODUCT BEFORE WRITING

Before producing the requirements document, inspect:

```text
apps/terminal/
packages/
services/
README.md
FINAL_RELEASE_AUDIT.md
FINAL_RELEASE_FINDINGS.md
FINAL_RELEASE_RECONCILIATION.md
FINAL_RELEASE_TEST_REPORT.md
prompt.md
```

Also inspect:

```text
all app routes
all page components
all shared components
all hooks
all API/data-fetching code
all calculation utilities
finance/ledger code
Propr client
WebSocket/sync worker
schemas
types
fixtures
tests
```

Do not base the UI specification only on the homepage.

Trace the data from:

```text
Propr API
→ normalization
→ calculations
→ state
→ page
→ component
→ displayed UI
```

This is necessary to understand what each displayed number actually means.

---

# 2. FIRST DELIVERABLE — PRODUCT MODEL

Start the document with a concise description of the product based strictly on the repository.

Explain:

```text
Product purpose
Primary user
Primary use cases
What the terminal monitors
What the terminal does NOT do
Read-only constraints
Primary data sources
Realtime limitations
Financial data sources
```

Do not turn this into marketing copy.

Use concrete language.

---

# 3. ROUTE INVENTORY

Discover every current route from the repository.

Produce:

| Route         | Page Purpose | Primary User Question | Priority |
| ------------- | ------------ | --------------------- | -------- |
| `/`           |              |                       |          |
| `/accounts`   |              |                       |          |
| `/positions`  |              |                       |          |
| `/orders`     |              |                       |          |
| `/finance`    |              |                       |          |
| `/history`    |              |                       |          |
| `/live`       |              |                       |          |
| `/system`     |              |                       |          |
| `/api/health` |              |                       |          |

Do not assume these are the only routes.

Search the actual App Router structure and list every route.

For each route identify whether it is:

```text
primary
secondary
utility
diagnostic
API-only
```

---

# 4. INFORMATION ARCHITECTURE

Describe the ideal information hierarchy based on the existing functionality.

Identify:

## Global navigation

What belongs in:

```text
sidebar
top bar
header
global status area
account selector
finance summary
```

## Page-level navigation

Identify tabs, filters, segmented controls, breadcrumbs, or account-specific navigation already implied by the implementation.

## Global persistent information

Determine what should remain accessible across pages.

Examples may include:

```text
connection/sync status
current account
risk state
last sync time
finance summary
navigation
```

Do not invent persistent widgets unless the application actually benefits from them based on existing data.

---

# 5. GLOBAL SHELL REQUIREMENTS

Extract all requirements for the global application shell.

Document:

```text
sidebar
top navigation
page header
account context
sync indicator
system status
responsive navigation
mobile navigation
global notifications
```

For each specify:

```text
purpose
content
data source
interaction
priority
desktop behavior
mobile behavior
```

---

# 6. DASHBOARD `/`

Analyze the existing dashboard deeply.

For every currently displayed metric identify:

```text
metric name
exact meaning
source
calculation
currency/unit
update behavior
importance
```

Create a table:

| Metric | Meaning | Source | Formula/Logic | Priority | UI Treatment |
| ------ | ------- | ------ | ------------- | -------- | ------------ |

Include every relevant dashboard value, such as where applicable:

```text
Active Capital
Total Invested
Actual Cash Cost
Cash PnL
Payouts
Account Count
Equity
Balance
Realized PnL
Unrealized PnL
Fees
Drawdown
Daily Loss
Profit Target
Trade Count
Position Count
Order Count
Last Sync
System Health
```

Do not assume all are present. Verify.

---

# 7. CRITICAL SEMANTIC DISTINCTIONS

These distinctions are mandatory in the design requirements.

The designer must NOT visually merge concepts that have different meanings.

Document the required separation between:

```text
Account Face Purchase Value
Actual Cash Cost
Active Capital
Historical/Sunk Cost
Trading PnL
Realized PnL
Unrealized PnL
Actual Cash PnL
Balance
Equity
Drawdown Used
Drawdown Limit Consumed
Daily Loss
High-Water Mark
Payout Requested
Payout Processed
```

For every pair that could be confused, explain the UI requirement.

Example:

```text
Active Face Capital ≠ Actual Cash Cost
```

The designer must not present them as interchangeable metrics.

---

# 8. ACCOUNT DETAIL REQUIREMENTS

Analyze `/accounts`.

Document what an account card/table/detail view must show.

At minimum investigate:

```text
account ID
firm
challenge
stage
status
balance
equity
PnL
drawdown
daily loss
profit target
HWM
purchase
fees
trading days
trade count
position count
order count
purchase date
start date
failure state
funded state
```

Only include fields actually supported by the code/data.

For each field specify:

```text
primary/secondary
always visible / expandable
numeric / badge / chart / table
```

---

# 9. ACCOUNT RISK UI

This is one of the most important design areas.

Document exactly how the designer should represent:

```text
drawdown
drawdown limit
drawdown consumed %
daily loss
profit target
high-water mark
breach risk
account status
```

Explain the difference between:

```text
raw account loss %
```

and:

```text
drawdown limit consumed %
```

The design must prioritize the amount of allowable risk already consumed.

Specify required states:

```text
safe
normal
warning
high risk
near breach
breached
unknown
stale
```

Describe:

```text
color
text
iconography
progress meter
numeric label
tooltip
accessibility
```

Do not invent exact colors unless the current product specifies them; describe the semantic requirement.

---

# 10. DASHBOARD ACCOUNT SUMMARY

Determine how multiple accounts should be represented simultaneously.

Document:

```text
account cards
compact table
risk heatmap
status badges
sorting
filtering
selected account
active vs failed
evaluation vs funded
```

Identify the minimum information required to compare accounts at a glance.

---

# 11. POSITIONS `/positions`

Inspect the actual position model.

Document required columns/details:

```text
symbol
side
quantity
entry price
mark price
margin
leverage
liquidation price
unrealized PnL
ROE
account
timestamp
```

Only list what is actually available.

Specify:

```text
table
mobile card
expanded detail
sorting
filters
account grouping
open/flat state
```

Flat zero-quantity positions must not be represented as active positions.

---

# 12. LIVE POSITION EXPERIENCE

Analyze the `/live` page.

Determine whether it is intended for:

```text
rapid market monitoring
account monitoring
risk monitoring
position monitoring
order monitoring
```

Document the exact user workflow.

Identify what should update automatically.

Describe:

```text
last update
stale state
connection state
rapid-changing numbers
risk alerts
```

The designer must understand that stale data must never visually look live.

---

# 13. ORDERS `/orders`

Document all order states supported by the implementation.

Include where applicable:

```text
open
pending
partially filled
triggered
filled
cancelled
```

Identify order types:

```text
limit
market
stop
take profit
stop loss
conditional
```

Only include types actually supported by the repository.

Define:

```text
status badge
price
quantity
filled quantity
remaining quantity
side
symbol
account
created time
trigger price
```

Clarify which orders should be visible as active.

---

# 14. HISTORY `/history`

Determine exactly what historical data the repository supports.

Document:

```text
closed trades
realized PnL
fees
symbol
side
entry
exit
quantity
duration
account
date/time
```

Separate:

```text
trade history
account history
financial transaction history
```

Do not combine them into one ambiguous "history" experience.

---

# 15. FINANCE `/finance`

This is a high-priority page.

Document the finance information architecture.

Separate:

## Trading/account metrics

from:

## Actual cash metrics

The page must clearly communicate:

```text
Propr purchases
Breakout purchases
face purchase value
actual bank cost
active cash cost
historical/sunk cash cost
refunds
adjustments
processed payouts
actual cash PnL
```

For every finance metric identify its source:

```text
Propr API
finance ledger
bank-verified source
manual seed
derived calculation
```

Do not let the designer create a visually attractive finance page that collapses these meanings.

---

# 16. FINANCE LEDGER TABLE

Document the complete transaction table.

Determine which fields need to be visible:

```text
date
firm
account
transaction type
purchase face value
actual cash cost
USD
INR
bank reference
verification
notes
```

Document:

```text
filters
sorting
search
transaction grouping
expandable rows
status badges
```

---

# 17. CASH PNL VISUALIZATION

Determine whether the current implementation supports a chart or only summary values.

If charting is appropriate, specify exactly what should be plotted.

Potential dimensions:

```text
cash outflow
payouts
cumulative cash PnL
active vs sunk cost
firm comparison
monthly spending
```

Do NOT invent unsupported historical data.

If the repository does not contain enough historical data for a chart, explicitly say:

```text
Not currently supported by available data.
```

---

# 18. HISTORY / FINANCE DISTINCTION

Explicitly explain to the designer:

```text
Trading History
≠
Finance Ledger
```

Trading history answers:

> What happened in the trading account?

Finance answers:

> What happened to actual money?

These should have visually distinct experiences.

---

# 19. SYSTEM `/system`

Analyze the system diagnostics page.

Document:

```text
API health
sync health
last successful REST sync
WebSocket status
API latency
error state
reconnect state
schema error
cache state
```

Determine what ordinary users need versus diagnostic information.

Recommend:

```text
normal mode
advanced diagnostics
```

only where supported by current architecture.

---

# 20. HEALTH / SYNC UX

Define visual requirements for:

```text
LIVE
SYNCED
STALE
SYNC ERROR
OFFLINE
DEGRADED
UNKNOWN
```

For each:

```text
meaning
trigger
visual treatment
copy
timestamp
user action
```

Never allow an error state to resemble healthy data.

---

# 21. REALTIME INDICATORS

Document exactly what "live" means in the current application.

The designer must know whether the deployment currently operates via:

```text
REST
15s ISR
polling
WebSocket
external worker
```

Distinguish:

```text
data freshness
connection status
last successful sync
last WebSocket event
```

Do not use a decorative "LIVE" indicator that implies tick-level streaming when the current deployment only refreshes periodically.

---

# 22. STALE DATA UX

Describe what happens visually when:

```text
API unavailable
API timeout
HTTP 429
HTTP 500
network disconnected
WebSocket disconnected
cache is stale
schema validation fails
```

Required UX:

```text
clear stale indicator
last known timestamp
system state
safe interpretation
```

Do not simply show zero values.

---

# 23. ERROR / EMPTY / LOADING STATES

For every page specify:

```text
loading
empty
partial data
stale
API error
permission/auth error
unknown
```

Provide actual UI copy requirements.

Avoid generic:

```text
Something went wrong.
No data available.
An unexpected error occurred.
```

unless there is no more useful information available.

---

# 24. RESPONSIVE REQUIREMENTS

Define layouts for:

```text
wide desktop
standard desktop
tablet
mobile
narrow mobile
```

For every page specify:

```text
what stays visible
what collapses
what becomes horizontally scrollable
what becomes stacked
what becomes a drawer
what becomes a card
```

Do not simply say "responsive."

Describe actual behavior.

---

# 25. TABLE DESIGN SYSTEM

List all tables.

For each define:

```text
columns
priority columns
optional columns
sortable columns
filterable columns
sticky columns
row actions
mobile behavior
empty state
loading state
```

Determine whether a shared table component should be used.

---

# 26. CHART REQUIREMENTS

Inventory every chart or visual metric currently supported.

For each chart specify:

```text
purpose
x-axis
y-axis
series
time range
tooltip
legend
thresholds
risk regions
empty state
```

Do not invent charts purely because a trading terminal "should" have charts.

Only specify charts supported by existing data or explicitly useful to the existing product.

---

# 27. DESIGN SYSTEM REQUIREMENTS

Extract reusable visual primitives from the application:

```text
cards
badges
status indicators
risk meters
tables
tabs
buttons
inputs
dropdowns
tooltips
charts
alerts
empty states
loading skeletons
modals/drawers
```

For each determine:

```text
purpose
variants
states
usage rules
```

---

# 28. TYPOGRAPHY REQUIREMENTS

Recommend hierarchy based on information importance.

Document:

```text
page title
section title
metric number
metric label
body
table
caption
timestamp
status
warning
error
```

Do NOT specify a font family unless the existing product or designer needs it.

Specify hierarchy and density.

This is a trading terminal, so information density matters.

---

# 29. COLOR SEMANTICS

Do not arbitrarily pick colors.

Define semantic states:

```text
positive
negative
warning
danger
neutral
stale
unknown
```

Especially ensure:

```text
PnL
drawdown
daily loss
breach
API health
payout
cash flow
```

remain visually distinct.

Avoid using green/red as the only signal.

---

# 30. INFORMATION DENSITY

The designer should understand that this is a trading terminal, not a marketing site.

Document:

```text
high-density areas
low-density areas
primary glance information
secondary detail
diagnostic information
```

Recommend where visual breathing room is useful without hiding important numbers.

---

# 31. DESKTOP LAYOUT SPECIFICATION

For each page produce a rough content hierarchy:

```text
Top
Middle
Primary workspace
Secondary panels
Bottom / footer
```

No visual mockup is required.

The output should be a blueprint a designer can turn into Figma.

---

# 32. MOBILE LAYOUT SPECIFICATION

For each page explain what changes on mobile.

Examples:

```text
sidebar → drawer
tables → horizontal scroll or cards
multi-column metrics → stacked
secondary metadata → expandable
system diagnostics → collapsed
```

Only specify behavior justified by the content.

---

# 33. INTERACTION REQUIREMENTS

Document every meaningful interaction:

```text
account selection
filter
sort
search
expand/collapse
tab switch
time range
refresh
reconnect
view detail
copy ID
open external reference
```

For each:

```text
trigger
result
loading
disabled state
error state
```

---

# 34. TOOLTIP / EXPLANATION REQUIREMENTS

Identify metrics that require explanatory UI.

Especially:

```text
active capital
cash PnL
drawdown consumed
daily loss
HWM
purchase face value
actual cash cost
processed payout
stale state
```

Specify exactly what a tooltip should clarify.

Keep explanations short and concrete.

---

# 35. ACCESSIBILITY REQUIREMENTS

Document:

```text
keyboard navigation
focus
screen reader semantics
ARIA
progress bars
table semantics
status announcements
color-independent meaning
contrast
touch targets
```

Risk and system state cannot depend only on color.

---

# 36. DATA PRECISION DISPLAY RULES

Document how financial values should appear.

Specify:

```text
USD decimals
INR decimals
PnL signs
percentages
quantities
prices
timestamps
large numbers
zero values
unknown values
stale values
```

Important:

Never design the UI in a way that makes:

```text
0
unknown
stale
API failure
```

look equivalent.

---

# 37. NUMBER FORMATTING SEMANTICS

Identify every major number format in the existing implementation.

Document:

```text
$75.00
₹7,336.19
+2.35%
-$218.75
0.00000001
```

and what the display communicates.

Do not invent arbitrary precision.

Follow the existing financial calculations.

---

# 38. ACCOUNT COMPARISON

Determine whether users need to compare:

```text
account A vs B
active vs historical
evaluation vs funded
Propr vs Breakout
```

If supported by the data, document:

```text
comparison UI
sorting
risk ranking
capital comparison
performance comparison
```

---

# 39. DESIGNING FOR FINANCIAL RISK

This is a monitoring product.

Identify what the user must notice immediately:

```text
breach risk
daily loss risk
large drawdown
API stale state
account failure
large negative PnL
unexpected position
unexpected order
cash discrepancy
```

For each specify:

```text
visibility
urgency
placement
visual priority
notification treatment
```

Do not create alarm fatigue.

---

# 40. DO NOT DESIGN UNSUPPORTED FEATURES

Explicitly identify features that are NOT currently supported:

```text
order placement
order cancellation
payout requests
challenge purchasing
account modification
live broker execution
automated bank synchronization
```

The design must not imply these actions exist.

---

# 41. READ-ONLY UI RULE

Because the product is read-only, specify that the UI must not contain action affordances that imply trading execution.

Viewing:

```text
order
position
payout
account
```

is not the same as controlling it.

---

# 42. UI REQUIREMENTS TRACEABILITY

Every major UI element must trace back to:

```text
route
component
data source
calculation
user need
```

Create a table:

| UI Element | Route | Source | Calculation | Why It Exists | Priority |
| ---------- | ----- | ------ | ----------- | ------------- | -------- |

This becomes the primary handoff document for the designer.

---

# 43. PAGE-BY-PAGE DESIGN REQUIREMENTS

Create a complete section for every route.

For EACH page use:

```text
Page purpose

Primary user question

Primary actions

Required content

Primary metrics

Secondary information

Tables

Charts

Filters

Interactions

Loading state

Empty state

Error state

Stale state

Responsive behavior

Accessibility

Visual priority

Data source

Do-not-change semantics
```

Do not skip pages simply because they currently look simple.

---

# 44. COMPONENT INVENTORY

Produce:

| Component | Used Where | Purpose | Inputs | States | Designer Priority |
| --------- | ---------- | ------- | ------ | ------ | ----------------- |

Include shared components.

Do not limit this to files named `components`.

Identify reusable UI patterns even when currently implemented inline.

---

# 45. REQUIRED SCREEN INVENTORY FOR DESIGNER

At the end, give the designer the exact set of screens they should design.

Separate into:

## Core screens

## Secondary screens

## Detail screens

## System/diagnostic screens

## Responsive variants

For each provide:

```text
screen name
route
purpose
desktop
mobile
priority
```

---

# 46. DESIGN PRIORITY

Assign:

```text
P0 — essential
P1 — important
P2 — secondary
P3 — optional
```

P0 should include screens and UI elements necessary to understand:

```text
account state
risk
positions
orders
finance
system freshness
```

---

# 47. DESIGN DIRECTION

Do NOT choose a random visual style.

Instead describe the qualities the design needs:

```text
classy
professional
high information density
clear financial hierarchy
calm when healthy
urgent when risk rises
technical without looking like a developer console
premium without becoming decorative
```

Avoid generic "futuristic crypto dashboard" styling unless the current product actually supports it.

---

# 48. WHAT THE DESIGNER SHOULD NOT CHANGE

Create an explicit list:

```text
financial terminology
metric definitions
risk semantics
account states
cash-vs-trading distinction
read-only behavior
data provenance
stale/error semantics
precision
existing API meaning
```

Visual improvements must not alter these semantics.

---

# 49. DESIGNER HANDOFF FORMAT

Produce one final document:

```text
UI_DESIGN_REQUIREMENTS.md
```

Structure it as:

```text
1. Product Overview
2. User & Core Use Cases
3. Information Architecture
4. Global Shell
5. Navigation
6. Design Principles
7. Dashboard
8. Accounts
9. Positions
10. Orders
11. History
12. Finance
13. Live
14. System
15. Error/Loading/Empty States
16. Realtime/Freshness
17. Risk UI
18. Finance UI
19. Tables
20. Charts
21. Responsive
22. Accessibility
23. Design System
24. Component Inventory
25. Screen Inventory
26. Priority Matrix
27. Data/UI Traceability
28. Do-Not-Change Rules
29. Designer Handoff Checklist
```

---

# 50. FINAL DESIGNER CHECKLIST

End the document with a concise checklist:

```text
[ ] every route has a defined design
[ ] dashboard metrics are defined
[ ] account states are defined
[ ] risk states are defined
[ ] finance semantics are separated
[ ] Propr vs Breakout is clear
[ ] face value vs actual cash is clear
[ ] trading PnL vs cash PnL is clear
[ ] realtime/freshness behavior is defined
[ ] stale/error/offline states are defined
[ ] orders are fully represented
[ ] positions are fully represented
[ ] history is defined
[ ] system page is defined
[ ] mobile behavior is defined
[ ] accessibility requirements are defined
[ ] component inventory exists
[ ] screen inventory exists
[ ] priorities are assigned
[ ] unsupported features are explicitly excluded
[ ] every major UI element traces to a real data source
```

---

# 51. IMPORTANT OUTPUT RULE

Do NOT produce:

* HTML
* CSS
* React code
* Tailwind code
* Figma code
* visual mockups
* image prompts
* implementation code

The output must be a **requirements and design-specification document** for another designer.

The designer should be able to read the document and begin designing without needing to reverse-engineer the repository.

---

# 52. FINAL QUALITY CHECK

Before returning the document, verify:

1. Every current route was inspected.
2. Every significant page-level component was inspected.
3. Every major displayed metric has a source.
4. Every financial metric has an explicit meaning.
5. Every risk metric has explicit semantics.
6. Every realtime state has defined UX.
7. Every important error state has defined UX.
8. Every page has desktop and mobile requirements.
9. Unsupported product capabilities are excluded.
10. No design requirement invents data that the application does not have.
11. Propr terminology is preserved.
12. Finance terminology is preserved.
13. Read-only behavior is reflected in the UI requirements.
14. The requirements are specific enough for a designer to work directly from them.

Finally state:

```text
UI REQUIREMENTS EXTRACTION COMPLETE

Routes analyzed:
Pages specified:
Components inventoried:
Major metrics mapped:
Data sources mapped:
States documented:
Responsive behaviors documented:
Accessibility requirements documented:

OUTPUT:
UI_DESIGN_REQUIREMENTS.md
```

Do not modify the application code.

Do not commit UI changes.

This task ends when the designer-ready requirements document is complete.
