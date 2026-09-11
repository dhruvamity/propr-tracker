You are performing a **production-grade end-to-end audit, security review, correctness review, data-integrity review, realtime-system review, and comprehensive testing pass** on this repository.

Repository:

`https://github.com/dhruvamity/propr-tracker.git`

You have access to the repository source code locally. Treat the actual repository code as the primary source of truth.

The application is intended to be a **read-only Propr trading/account terminal** that tracks:

* Propr evaluation accounts
* passed evaluations
* failed/breached evaluations
* funded accounts
* account lifecycle
* current balances/equity
* realized/unrealized PnL
* trading fees
* drawdown
* daily loss
* profit-target progress
* open positions
* open orders
* account health
* payouts
* prop-firm expenses
* actual cash PnL
* realtime account state

Do NOT assume the implementation is correct merely because the UI appears correct.

The goal is to find **all real defects, incorrect assumptions, stale-data problems, security problems, API-integration mistakes, financial calculation errors, lifecycle bugs, race conditions, deployment issues, and missing tests**.

Do not stop after finding the first issue.

---

# 1. INITIAL REPOSITORY RECONNAISSANCE

First inspect the entire repository.

Produce a structured inventory of:

```text
package manager
framework
runtime
language
build system
frontend architecture
backend/API architecture
database
cache
realtime layer
authentication
environment variables
test framework
CI/CD
deployment platform
```

Identify:

```text
package.json
lockfile
tsconfig
next.config
middleware
API routes
server actions
database schema
ORM
migrations
WebSocket code
Propr API client
state management
calculation engine
components
pages/routes
hooks
utilities
tests
fixtures
mocks
GitHub workflows
Vercel configuration
Docker files
README
environment examples
```

Construct an architecture diagram based on the actual code.

Do not guess.

---

# 2. BUILD BASELINE

Before changing anything, execute all appropriate repository commands.

At minimum identify and run, where available:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

If the project uses pnpm/yarn/bun instead, use the repository's actual package manager.

Also inspect all package scripts.

Record:

```text
PASS
FAIL
WARN
NOT AVAILABLE
```

for every available quality gate.

If a command fails, determine whether it is:

* code failure
* environment failure
* missing dependency
* incorrect configuration
* deployment-only issue
* test infrastructure issue

Do not simply label all failures as application bugs.

---

# 3. DEPENDENCY AUDIT

Audit every dependency.

Look for:

* abandoned packages
* vulnerable packages
* unnecessary packages
* duplicate packages
* direct dependencies that should be dev dependencies
* dev dependencies accidentally required at runtime
* mismatched React/Next versions
* incompatible libraries
* dependency bloat
* package-lock inconsistencies
* transitive security issues

Run appropriate security scans:

```bash
npm audit
```

or the appropriate equivalent.

For each relevant issue classify:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

Do not inflate severity.

---

# 4. PROPR API CONTRACT AUDIT

Compare the implementation against the supplied Propr API documentation.

The following behavior is mandatory to validate.

## Evaluation accounts

Evaluation/challenge accounts come from:

`GET /challenge-attempts`

The API can return challenge progress including:

* status
* total PnL
* win rate
* max drawdown
* trading days
* failure reason
* linked accountId
* current phase

Validate:

* pagination
* status filtering
* retries
* error handling
* empty responses
* duplicate responses
* accountId extraction
* passed state
* failed state
* active state
* historical state

The implementation must NOT assume only active evaluations exist.

---

# 5. FUNDED ACCOUNT CONTRACT

Funded accounts are separate from evaluation attempts.

Validate that the implementation retrieves them through:

`GET /book-account-issuances`

and handles:

```text
active
closed
review_pending
```

Do not accept any implementation that treats:

```text
challenge status = passed
```

as automatically equivalent to:

```text
funded account exists
```

A passed challenge should only be considered funded when the funded-account issuance actually exists.

This distinction is explicitly part of Propr's documented account model.

---

# 6. ACCOUNT DISCOVERY AUDIT

Test scenarios:

```text
0 evaluations
1 evaluation
multiple evaluations
0 funded accounts
1 funded account
multiple funded accounts
evaluation + funded simultaneously
passed evaluation but no funded issuance yet
failed evaluation
closed funded account
review_pending funded account
duplicate account IDs
same account returned by multiple data sources
```

Confirm the system creates one canonical account representation rather than duplicated UI entries.

---

# 7. ACCOUNT LIFECYCLE AUDIT

Determine how the implementation derives:

```text
PURCHASED
EVALUATION
PASSED
FAILED
BREACHED
FUNDED
REVIEW_PENDING
CLOSED
```

Audit every transition.

Construct a lifecycle state-machine test.

Example:

```text
PURCHASED
   ↓
EVALUATION
   ↓
PASSED
   ↓
FUNDED
   ↓
ACTIVE
   ↓
CLOSED
```

and:

```text
EVALUATION
   ↓
FAILED/BREACHED
   ↓
CLOSED
```

Check for impossible transitions.

Example invalid behavior:

```text
funded → evaluation
closed → active without new issuance
passed → funded without funded issuance
active → failed due to frontend-derived approximation
```

---

# 8. READ-ONLY GUARANTEE

The product is intended to be strictly read-only.

Search the entire repository for:

```text
POST /orders
PUT /margin-config
POST /payouts/request
POST /checkout-sessions
POST /wallet/link
DELETE /wallet
order creation
order cancellation
leverage updates
margin configuration
purchase creation
```

Find every API mutation.

Determine whether those mutations are:

```text
unused
dead code
reachable
UI-triggerable
server-triggerable
accidentally exposed
```

The final production application must not permit trading or account mutations.

---

# 9. API KEY SECURITY AUDIT

Search the entire repository for:

```text
PROPR_API_KEY
pk_live_
X-API-Key
Authorization
NEXT_PUBLIC_
localStorage
sessionStorage
cookies
console.log
```

Determine whether the Propr API key can ever reach:

* client bundles
* browser devtools
* React props
* public API responses
* logs
* analytics
* error messages
* source maps
* static HTML
* Next.js client components

The key must remain server-side.

The Propr docs explicitly require `X-API-Key` authentication and state that the API key must be kept secret.

Report any violation as at least HIGH severity.

---

# 10. ENVIRONMENT VARIABLE AUDIT

Inspect:

```text
.env
.env.local
.env.production
.env.example
Vercel environment assumptions
```

Ensure secrets are NOT prefixed with:

```text
NEXT_PUBLIC_
```

unless they are genuinely public.

Ensure the repository does not contain:

* API keys
* tokens
* wallet private keys
* database passwords
* connection strings
* webhook secrets

Search git history if necessary.

---

# 11. WEBSOCKET AUDIT

Inspect the realtime architecture.

Propr provides:

`wss://api.propr.xyz/ws`

and authenticated WebSocket events including:

```text
account.updated
order.created
order.updated
order.cancelled
order.triggered
order.filled
order.partially_filled
position.opened
position.updated
position.closed
position.liquidated
trade.created
mark.updated
```

Audit:

* authentication
* connection establishment
* heartbeat
* reconnect
* exponential backoff
* duplicate events
* out-of-order events
* missed events
* event deduplication
* state replacement
* state merging
* concurrent updates
* stale connection detection
* memory growth
* subscription management
* server/client boundary

Test:

```text
connect
disconnect
reconnect
network interruption
server restart
duplicate event
out-of-order event
event burst
websocket unavailable
REST available but websocket unavailable
websocket available but REST unavailable
```

---

# 12. REST + WEBSOCKET CONSISTENCY

This is a high-priority audit.

Determine whether the application has:

```text
REST authoritative snapshot
+
WebSocket incremental state
```

or whether it incorrectly uses only one of them.

Test:

```text
REST state A
WS event 1
WS event 2
WS reconnect
REST refresh
```

Check whether state becomes:

```text
duplicated
stale
reverted
double-counted
missing
```

A reconnect should trigger a fresh authoritative reconciliation.

---

# 13. STALE DATA AUDIT

Every displayed live metric should have a known freshness timestamp.

Inspect whether the application tracks:

```text
last REST sync
last websocket event
last account update
last mark update
```

Test:

```text
0 sec old
5 sec old
30 sec old
2 min old
10 min old
WebSocket disconnected
API unavailable
```

The UI must distinguish:

```text
LIVE
DELAYED
STALE
OFFLINE
```

It must never silently present stale data as current.

---

# 14. POSITION DATA AUDIT

Audit:

`GET /accounts/{accountId}/positions`

and all normalization logic.

Propr documents that fully closed positions may remain with:

```text
quantity = "0"
```

Therefore active-position counts must not simply count returned records.

Test:

```text
1 open position
1 zero-quantity position
mixed open/zero records
multiple assets
long positions
short positions
closed positions
liquidated positions
```

Check:

```text
position count
open position count
uPnL
notional
margin
ROE
liquidation price
```

---

# 15. OPEN ORDER AUDIT

Audit:

`GET /accounts/{accountId}/orders`

Validate exact status enums.

Do NOT use invented filters such as:

```text
active
triggered
```

The provided Propr documentation explicitly states these are invalid REST order filters and distinguishes websocket-triggered events from REST status filters.

Test:

```text
pending
open
partially_filled
filled
cancelled
expired
rejected
triggered websocket event
```

Ensure open-order counts are mathematically correct.

---

# 16. FINANCIAL MATH AUDIT

This is a critical section.

Locate every financial calculation in the codebase.

Audit:

```text
balance
equity
realized PnL
unrealized PnL
fees
ROI
drawdown
daily loss
profit target
actual cash PnL
payout totals
expense totals
```

Do not assume UI formatting equals correct calculations.

---

# 17. DECIMAL PRECISION AUDIT

The Propr API returns monetary values as decimal strings.

The repository must NOT use JavaScript floating-point arithmetic for financial calculations where precision matters.

Search for:

```text
parseFloat
Number(...)
.toFixed()
Math.*
```

inside financial calculation paths.

Determine whether values are represented with:

```text
Decimal
BigNumber
fixed-point integers
```

where appropriate.

The supplied Propr documentation specifically recommends Decimal/BigNumber and warns against floating-point monetary arithmetic.

Create precision tests with values such as:

```text
0.1 + 0.2
0.000001
999999.999999
tiny fee values
repeated fee accumulation
```

---

# 18. UNREALIZED PNL AUDIT

Verify implementation against:

```text
sign
quantity
entry price
mark price
position side
```

For long:

```text
uPnL = qty × (mark - entry)
```

For short:

```text
uPnL = qty × (entry - mark)
```

Verify aggregation across positions.

Test:

```text
long profit
long loss
short profit
short loss
zero movement
multiple positions
multiple assets
```

Compare implementation against the formulas in the provided Propr integration documentation.

---

# 19. EQUITY AUDIT

Verify how the application derives:

```text
equity
available balance
cross margin
isolated margin
unrealized PnL
```

Test:

```text
no positions
long position
short position
cross margin
isolated margin
multiple positions
open orders with reserved margin
```

The Propr documentation provides explicit formulas for these values; use those as the reference implementation.

---

# 20. DRAWDOWN AUDIT

This is another critical correctness area.

Validate:

```text
static drawdown
trailing drawdown
high-water mark
initial balance
drawdown limit
drawdown used %
remaining drawdown
breach threshold
```

Test:

```text
equity exactly at limit
equity 0.01 above limit
equity 0.01 below limit
new high-water mark
drawdown recovery
trailing DD
static DD
```

Compare formulas against the supplied Propr implementation guidance.

---

# 21. DAILY LOSS AUDIT

Validate the documented calculation using:

```text
startingBalance
startingIsolatedPositionMargin
dailyLossBase
dailyLoss limit
current equity
```

Test edge cases around:

```text
day rollover
timezone
midnight UTC
midnight local time
new trading day
open positions across day boundary
negative equity
isolated margin
```

The Propr documentation states that daily-loss calculations use the opening realized value represented by starting balance plus starting isolated-position margin.

---

# 22. PROFIT TARGET AUDIT

Verify:

```text
phaseStartingBalance
current equity
target percentage
progress
remaining
passed state
```

Test:

```text
below target
exact target
above target
negative PnL
phase transition
```

Ensure rounding does not cause premature "passed" UI.

---

# 23. ACCOUNT STATUS AUTHORITY

Determine which system is authoritative for:

```text
passed
failed
breached
funded
closed
```

The frontend must NOT independently decide that an account has passed or breached purely from approximate local calculations when an authoritative server status exists.

Local calculations may provide:

```text
NEAR BREACH
NEAR TARGET
```

but official lifecycle state should be derived from the authoritative Propr API.

---

# 24. PAYOUT AUDIT

Audit:

`GET /payouts/history`

and all payout mapping.

Payout statuses include:

```text
requested
processing
processed
rejected
cancelled
failed
```

Only:

```text
processed
```

should contribute to:

```text
payouts withdrawn
actual cash PnL
```

unless the application's explicit accounting model says otherwise.

Test:

```text
requested payout
processing payout
processed payout
rejected payout
cancelled payout
failed payout
multiple payouts
same payout fetched twice
pagination
```

Check for double counting.

---

# 25. CASH PNL AUDIT

This metric must be clearly separated from trading PnL.

Expected conceptual formula:

```text
Actual Cash PnL
=
Processed Payouts
-
Confirmed Prop Expenses
+
Refunds
± Adjustments
```

Do NOT substitute:

```text
realized trading PnL
```

for:

```text
cash PnL
```

Audit whether the repository makes this distinction.

---

# 26. EXPENSE / PURCHASE DATA AUDIT

If the project has a manual finance ledger or database:

Audit:

```text
purchase
payout
refund
adjustment
```

Validate:

* duplicate transactions
* bank verification
* currency conversion
* account linkage
* historical account linkage
* orphaned transactions
* unlinked transactions
* incorrect account attribution

No expense should disappear when an account becomes breached or closed.

---

# 27. BANK-VERIFIED DATA INTEGRITY

Where a transaction is based on a real bank transaction, distinguish:

```text
VERIFIED
UNVERIFIED
ESTIMATED
```

Never mix estimated INR values with bank-settled INR values without labeling them.

Run a reconciliation test:

```text
sum of transaction ledger
=
dashboard total expense
```

---

# 28. DUPLICATION AUDIT

Search for places where the same concept is stored independently:

```text
account purchase cost
ledger purchase cost
dashboard total cost
manual payout total
computed payout total
cached payout total
```

This is a major source of financial bugs.

Prefer:

```text
single source of truth
+
derived calculations
```

instead of manually duplicated totals.

---

# 29. CACHE / PERSISTENCE AUDIT

Determine:

```text
what is persisted
what is cache
what is ephemeral
what is derived
```

Test:

```text
page refresh
server restart
deployment
cold start
database outage
cache outage
WS reconnect
```

The application should recover to a correct state without accumulating duplicate records.

---

# 30. RACE CONDITION AUDIT

Test simultaneous events:

```text
position.updated
account.updated
mark.updated
trade.created
order.filled
```

arriving within milliseconds.

Look for:

```text
lost update
last-write-wins corruption
double aggregation
state regression
stale snapshot overwrite
```

---

# 31. EVENT ORDERING AUDIT

Test:

```text
event A
event C
event B
```

where B and C arrive out of order.

If Propr events contain timestamps or sequence indicators, determine whether the application uses them appropriately.

---

# 32. MULTI-ACCOUNT AUDIT

Test at least:

```text
1 evaluation
3 evaluations
1 funded
3 funded
2 evaluations + 2 funded
historical + active + failed + funded
```

Ensure every account is isolated.

A trade from Account A must never affect:

* Account B balance
* Account B PnL
* Account B positions
* Account B drawdown
* Account B payout
* Account B lifecycle

---

# 33. TIMEZONE AUDIT

The UI is intended for Indian usage.

Audit:

```text
UTC
IST
browser timezone
server timezone
API timestamp parsing
day rollover
purchase dates
payout dates
daily metrics
```

Never derive daily-loss state from a browser-local date if Propr's authoritative metrics are UTC/server-based.

Display:

```text
IST
```

while internally preserving UTC timestamps.

---

# 34. API FAILURE TESTING

Mock:

```text
401
403
404
409
429
500
502
503
timeout
connection reset
malformed JSON
empty data
partial data
```

Verify:

* retry policy
* backoff
* no duplicate writes
* no infinite loops
* visible error state
* recovery
* stale-state safety

---

# 35. RATE LIMIT TESTING

The Propr docs document API request limits.

Ensure the application does NOT:

```text
poll every component separately
refresh every account independently without coordination
retry immediately in a tight loop
create duplicate requests on React rerenders
```

Use:

```text
central synchronization
caching
request deduplication
backoff
```

---

# 36. FRONTEND AUDIT

Inspect every component for:

* unnecessary rerenders
* excessive websocket state propagation
* expensive calculations
* memory leaks
* timers not cleared
* event listeners not removed
* duplicate fetches
* hydration mismatch
* layout shift
* flickering metrics
* stale state
* race conditions

Test:

```text
30 sec
5 min
30 min
6 hours
24 hours
```

of continuous browser runtime.

Check memory growth.

---

# 37. TERMINAL UI AUDIT

Evaluate:

```text
visual hierarchy
density
readability
responsive behavior
number formatting
negative numbers
zero values
loading states
error states
stale states
dark mode
keyboard navigation
mobile layout
long account names
large PnL
tiny PnL
many accounts
many positions
```

Make sure financial numbers never visually merge together.

---

# 38. ACCESSIBILITY AUDIT

Test:

```text
keyboard-only
screen reader semantics
ARIA
focus management
color contrast
status chips
tables
tooltips
dialogs
```

Critical statuses such as:

```text
BREACHED
FAILED
FUNDED
```

must not be communicated through color alone.

---

# 39. API ROUTE SECURITY AUDIT

For every custom backend route determine:

```text
authentication
authorization
input validation
output sanitization
rate limiting
cache control
error leakage
secret leakage
CORS
CSRF where applicable
```

Attempt:

```text
unauthenticated request
wrong account ID
another account ID
malformed account ID
query injection
path traversal
header manipulation
```

Even for a personal application, prevent arbitrary account access.

---

# 40. SSR / CLIENT BOUNDARY AUDIT

For Next.js or similar framework:

Search for components that accidentally turn sensitive server code into client code.

Audit:

```text
"use client"
server-only imports
API clients
environment variables
database clients
secret access
WebSocket secrets
```

A client component must never be able to access `PROPR_API_KEY`.

---

# 41. LOGGING AUDIT

Search for:

```text
console.log
logger.*
JSON.stringify(response)
request headers
environment dumps
```

Confirm that logs cannot expose:

```text
API key
authorization headers
wallet credentials
private tokens
full payout credentials
sensitive user data
```

---

# 42. DEPLOYMENT AUDIT

Inspect Vercel configuration.

Check:

```text
build command
install command
runtime
regions
environment variables
Node version
serverless limitations
websocket assumptions
cron assumptions
database connectivity
timeouts
cold starts
```

Very importantly:

If the application expects a long-lived WebSocket connection inside a Vercel Serverless Function, identify this as an architectural issue.

Determine whether the realtime worker needs a separate persistent service.

Do not blindly claim that Vercel can maintain a persistent WebSocket worker if the deployment model does not support it.

---

# 43. CRON / REVALIDATION AUDIT

If the project uses:

```text
Vercel Cron
ISR
setInterval
background refresh
```

determine whether the mechanism actually executes reliably in production.

Test whether cache invalidation produces fresh account data.

---

# 44. TEST COVERAGE AUDIT

Map source files to test files.

Produce:

```text
tested
partially tested
untested
```

for:

```text
API client
normalizers
account lifecycle
financial calculations
drawdown
daily loss
PnL
positions
orders
payouts
WebSocket
reconnect
REST/WS reconciliation
UI
API routes
database
deployment behavior
```

Do not rely on percentage coverage alone.

Identify **critical business logic with zero tests**.

---

# 45. PROPERTY-BASED / INVARIANT TESTING

Add invariant tests such as:

```text
equity === balance + applicable margin/uPnL components
open position count never includes quantity 0
processed payout count cannot decrease without source deletion
cash PnL changes only when cash transaction changes
account A updates cannot mutate account B
negative quantity is never treated as an active position
duplicate events must be idempotent
reconciliation cannot create duplicate accounts
```

---

# 46. END-TO-END SCENARIOS

Create full integration/E2E tests for:

## Scenario A — New evaluation

```text
purchase exists
↓
evaluation appears
↓
account details load
↓
positions load
↓
live metrics update
```

## Scenario B — Evaluation trading

```text
open position
↓
mark moves
↓
uPnL changes
↓
equity changes
↓
drawdown updates
```

## Scenario C — Evaluation passes

```text
challenge status = passed
↓
evaluation becomes PASSED
↓
funded issuance appears
↓
new funded account appears
```

## Scenario D — Evaluation fails

```text
drawdown/daily limit reached
↓
API status = failed
↓
UI shows FAILED/BREACHED
↓
account remains historically visible
```

## Scenario E — Funded account

```text
funded account active
↓
trade
↓
PnL
↓
payout
↓
processed payout
↓
finance total updates
↓
cash PnL updates
```

## Scenario F — Reconnect

```text
WS connected
↓
trade
↓
connection lost
↓
events missed
↓
reconnect
↓
REST reconciliation
↓
correct final state
```

---

# 47. ADVERSARIAL TESTING

Actively try to break the system.

Inject:

```text
duplicate account
duplicate payout
duplicate websocket event
negative PnL
huge PnL
zero quantity
null mark
missing entry price
missing accountId
missing challenge
missing funded issuance
malformed payout
stale event
future timestamp
very old timestamp
API timeout
WS timeout
429 storm
500 storm
```

Verify the system fails safely.

---

# 48. DATA CONTRACT TESTS

Build Zod/JSON-schema validators around Propr responses.

If Propr changes:

```text
field removed
field null
field renamed
new enum
new status
new account type
```

the application should fail loudly and diagnostically rather than silently displaying incorrect values.

---

# 49. NO MOCK DATA IN PRODUCTION

Search for:

```text
mock
demo
dummy
fake
sample
hardcoded account
hardcoded balance
hardcoded pnl
```

Ensure production code cannot accidentally fall back to fake financial data.

If mocks are needed, they must exist only in:

```text
test/
fixtures/
mocks/
```

---

# 50. UI NUMBER FORMAT AUDIT

Verify formatting for:

```text
$0
$1
$1,000
$1,234.56
-$123.45
₹0
₹25,394.83
very small decimal
large decimal
```

Never display:

```text
NaN
Infinity
undefined
null
$NaN
₹undefined
```

---

# 51. ACCOUNT DETAIL CONSISTENCY

When opening an account detail page, verify that:

```text
header balance
account card balance
positions
orders
PnL
drawdown
daily loss
```

all originate from the same normalized snapshot.

The page must never show:

```text
header = current
positions = old
PnL = different snapshot
```

---

# 52. DATABASE CONSISTENCY

If a database exists:

Audit:

```text
schema
indexes
unique constraints
foreign keys
transactions
upserts
idempotency
retention
cleanup
```

Ensure account IDs are appropriately unique.

Ensure transaction IDs are unique.

Ensure payout IDs are unique.

Ensure websocket event ingestion is idempotent.

---

# 53. RECONCILIATION JOB

Determine whether the project has a periodic full reconciliation process.

If not, identify whether it should.

A strong architecture should have:

```text
Realtime updates
+
periodic REST reconciliation
```

rather than trusting WebSocket state forever.

---

# 54. PERFORMANCE TESTING

Test:

```text
1 account
10 accounts
50 accounts
100 accounts
500 positions
1000 orders
```

Measure:

```text
initial render
API latency
normalization time
calculation time
WS event processing time
memory
CPU
database operations
```

Identify bottlenecks.

---

# 55. FAILURE-SAFETY REQUIREMENT

If uncertain, stale, or inconsistent data exists, the product must prefer:

```text
UNKNOWN
STALE
SYNC ERROR
```

over confidently displaying an incorrect financial number.

This is a financial monitoring application.

Incorrect certainty is worse than temporary unavailability.

---

# 56. REQUIRED OUTPUT

After auditing, create:

```text
AUDIT.md
```

with this exact structure:

# Executive Summary

# Repository Architecture

# Build/Test Baseline

# Critical Findings

# High Severity Findings

# Medium Severity Findings

# Low Severity Findings

# Security Findings

# Propr API Contract Findings

# Data Integrity Findings

# Financial Calculation Findings

# Realtime/WebSocket Findings

# Account Lifecycle Findings

# Payout Findings

# Frontend Findings

# Backend Findings

# Database Findings

# Deployment/Vercel Findings

# Performance Findings

# Accessibility Findings

# Test Coverage Gaps

# Missing Tests

# Recommended Fixes

# Prioritized Remediation Plan

# Residual Risks

# Final Production Readiness Verdict

For every finding include:

```text
ID:
Severity:
Category:
File:
Line:
Observed behavior:
Expected behavior:
Why it matters:
Reproduction:
Evidence:
Recommended fix:
Test that prevents regression:
```

Do NOT report vague findings.

Bad:

"WebSocket may have issues."

Good:

"`src/lib/ws.ts:142` does not remove the previous message listener during reconnect, resulting in duplicate event handling after each reconnect. Reproduction: force three reconnects and observe `account.updated` being processed four times. Impact: account state and PnL can be double-applied."

---

# 57. REQUIRED TEST ARTIFACTS

Create or update:

```text
tests/
unit/
integration/
e2e/
fixtures/
mocks/
```

where appropriate.

At minimum implement tests for:

```text
account discovery
account lifecycle
evaluation status
funded issuance mapping
position normalization
zero-quantity filtering
uPnL
equity
drawdown
daily loss
profit target
payout aggregation
cash PnL
REST/WS reconciliation
websocket reconnect
duplicate event handling
multi-account isolation
API failure handling
secret exposure
```

---

# 58. DO NOT CHANGE CODE IMMEDIATELY

First perform the audit.

Do not silently modify production code while auditing.

First produce:

```text
findings
test failures
reproduction steps
risk assessment
```

Then, if instructed to remediate, apply fixes one category at a time and rerun the relevant tests.

---

# 59. FINAL SCORECARD

Produce a final matrix:

| Area                 | Status | Severity | Confidence |
| -------------------- | ------ | -------- | ---------- |
| Build                |        |          |            |
| Type safety          |        |          |            |
| API integration      |        |          |            |
| Data correctness     |        |          |            |
| Financial math       |        |          |            |
| Account lifecycle    |        |          |            |
| Realtime             |        |          |            |
| Security             |        |          |            |
| Persistence          |        |          |            |
| Frontend             |        |          |            |
| Performance          |        |          |            |
| Testing              |        |          |            |
| Vercel deployment    |        |          |            |
| Production readiness |        |          |            |

Use:

```text
PASS
PASS WITH WARNINGS
FAIL
BLOCKED
```

---

# 60. FINAL PRODUCTION VERDICT

Give exactly one:

```text
PRODUCTION READY
```

or

```text
PRODUCTION READY WITH CONDITIONS
```

or

```text
NOT PRODUCTION READY
```

Then summarize the **five most important things that must be fixed before trusting this terminal with financial monitoring**.

Most importantly:

Do not judge the application merely by whether it “looks correct”.

Audit whether it is **mathematically correct, source-correct, lifecycle-correct, realtime-correct, secure, recoverable, and testable**.
