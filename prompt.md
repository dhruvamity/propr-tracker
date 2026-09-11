# Propr Trading Terminal — Post-Remediation Production Audit & Verification Prompt

You are performing a **second, independent production audit** of the repository:

`https://github.com/dhruvamity/propr-tracker.git`

A prior 60-section audit identified multiple production issues. A subsequent remediation pass claims that those issues have been fixed and that:

* 67 tests pass across 13 test files
* TypeScript passes with zero errors
* ESLint passes with zero errors/warnings
* Next.js production build passes
* active capital now reflects only active accounts
* trailing drawdown / high-water-mark logic was added
* mock-data fallback was removed from production execution
* zero-quantity positions are filtered correctly
* conditional and partially-filled orders are included
* realtime sync timestamps are now real
* all sidebar routes were created
* monorepo workspaces were connected
* `SEED_PURCHASES` was centralized
* Vercel deployment remains the target environment

The objective of this audit is **NOT to repeat the original audit**.

The objective is to independently determine:

> **Did the remediation actually fix the underlying production defects, or were the tests/build merely made green?**

Do not trust `AUDIT.md`, `walkthrough.md`, comments, test names, commit messages, or claimed results without independently verifying implementation and behavior.

---

# 1. Repository Integrity & Current-State Verification

First establish the exact repository state being audited.

Record:

* current branch
* commit SHA
* latest commit date
* working tree status
* presence of uncommitted changes
* repository version/tag if applicable
* Node version
* npm version
* package-manager version
* lockfile type and consistency
* Next.js version
* React version
* TypeScript version
* Vitest version

Verify that the repository currently contains:

* `AUDIT.md`
* remediation-related source changes
* test suite
* fixtures
* all claimed application routes
* workspace packages
* sync service

Do not rely on previous local audit artifacts.

The audit must clearly state:

```text
AUDITED COMMIT:
AUDITED BRANCH:
AUDIT DATE:
WORKTREE CLEAN:
```

If GitHub cannot be accessed, explicitly state that limitation instead of pretending the current remote state was verified.

---

# 2. Remediation Diff Audit

Reconstruct the actual remediation diff.

Identify every source file modified after the original audit.

For every modified production file determine:

1. What original defect it was intended to fix.
2. What code changed.
3. Whether the change fixes the root cause.
4. Whether it introduces a new defect.
5. Whether the corresponding regression test is meaningful.
6. Whether the implementation works outside the exact fixture values used by the test.

Create a table:

| Finding | Claimed Fix | Actual Implementation | Root Cause Fixed? | Regression Protected? | Status |
| ------- | ----------- | --------------------- | ----------------- | --------------------- | ------ |

---

# 3. Do Not Trust Green Tests

Run the complete existing suite.

Then perform **mutation/adversarial testing**.

For every critical financial calculation:

* alter fixture values
* remove optional fields
* change string decimal precision
* introduce nulls
* introduce unexpected API values
* reverse event ordering
* duplicate events
* introduce stale values
* change account state
* change purchase linkage

A test must fail when the production logic is intentionally broken.

If a test still passes after deliberately reintroducing the old bug, mark:

```text
TEST IS NON-DETECTING
```

This is one of the highest-priority goals of this audit.

---

# 4. Active Capital — Full Verification

Verify that active capital is derived from actual account state and not merely fixture assumptions.

Required logic:

* failed challenges = sunk cost
* closed challenges = historical cost
* active evaluations = active capital
* funded accounts = active capital if actually active
* pending purchases without active accounts must not automatically become active capital
* cancelled/refunded purchases must not count as active capital
* duplicate account records must not double count capital

Verify:

```text
activeCapitalUSD
activeCapitalINR
totalInvestedUSD
historicalCapitalUSD
failedCapitalUSD
```

Independently calculate these values from the source API payloads.

Confirm that `purchaseId` linkage cannot silently fail.

Test:

* missing purchaseId
* unknown purchaseId
* duplicate purchaseId
* reused purchaseId
* failed account linked to valid purchase
* active account linked to missing purchase
* one purchase producing multiple account records

Expected behavior must be explicitly defined.

---

# 5. Account Discovery — REAL API Contract

Verify that account discovery correctly combines:

* `/challenge-attempts`
* `/book-account-issuances`

Verify the application never assumes that every tradable account exists only in challenge attempts.

Test combinations:

```text
evaluation only
funded only
evaluation + funded
passed evaluation awaiting funded account
failed evaluation
closed funded account
review_pending funded account
multiple funded accounts
multiple evaluations
```

Verify deduplication by the correct account identity.

Do not use display name or purchase ID as a substitute for account ID.

---

# 6. Account Lifecycle Verification

Audit every lifecycle transition.

Verify:

```text
PURCHASED
→ EVALUATION
→ PASSED
→ FUNDED
→ CLOSED
```

Also test:

```text
EVALUATION
→ FAILED

EVALUATION
→ CANCELLED

FUNDED
→ REVIEW_PENDING

FUNDED
→ CLOSED

FUNDED
→ PAYOUT REQUESTED

PAYOUT PROCESSING
→ PAYOUT PROCESSED

PAYOUT PROCESSING
→ PAYOUT FAILED
```

Verify lifecycle state is derived from authoritative API fields rather than inferred from balance/PnL alone.

---

# 7. Trailing Drawdown — Mathematical Audit

This is a financial-critical calculation.

Do not merely verify that a variable named `highWaterMark` exists.

Derive the exact intended rules from the official Propr documentation and implementation.

Audit:

* initial balance
* current equity
* current balance
* high-water mark
* max drawdown amount
* max drawdown percentage
* trailing floor
* floor movement
* floor clamping
* whether the floor stops trailing after a specified threshold
* whether realized profit changes the floor
* whether unrealized profit changes the floor
* whether deposits/adjustments can manipulate HWM
* whether HWM updates before or after mark-to-market

Test at minimum:

### Case A

Initial balance = 50,000

HWM = 50,000

Max DD = 5%

Floor = 47,500

### Case B

Equity rises to 55,000

Verify the correct new HWM/floor.

### Case C

Equity subsequently falls.

Verify breach occurs exactly at the intended floor.

### Case D

Price spikes intrabar and reverses.

Verify whether HWM is based on equity marks according to the official Propr contract.

### Case E

API restart.

Verify HWM does not reset.

### Case F

WebSocket disconnect/reconnect.

Verify HWM is reconciled against authoritative state.

Any discrepancy must be reported as:

```text
TRAILING-DD CONTRACT RISK
```

---

# 8. Drawdown Gauge — UI Semantics

Verify that the UI distinguishes:

```text
drawdownUsedPercent
```

from

```text
drawdownLimitConsumedPercent
```

The UI must communicate:

> percentage of allowed drawdown already consumed

not:

> percentage the account balance has lost

Test:

* 0% consumed
* 25%
* 50%
* 75%
* 90%
* 100%
* breached

Verify ARIA:

```text
role="progressbar"
aria-valuenow
aria-valuemin
aria-valuemax
aria-label
```

Ensure `aria-valuenow` is bounded and represents the same quantity visually shown.

---

# 9. Daily Loss — Independent Mathematical Verification

Verify daily loss against the actual Propr rule.

Do not accept:

```text
currentEquity - initialBalance
```

unless the official API contract explicitly requires that.

Test:

* day start equity
* realized loss
* unrealized loss
* fees
* isolated margin
* overnight positions
* midnight rollover
* timezone boundary
* no trades today
* positions open across midnight

Critical test:

```text
23:59:59 IST
→
00:00:00 IST
```

Ensure daily loss resets according to the authoritative account timezone/rules, not the server/browser timezone.

---

# 10. Equity Calculation

Audit every component of equity.

Verify the implementation against the Propr formula.

Test:

```text
balance
+ unrealized PnL
+ / - isolated position treatment where applicable
- fees where appropriate
```

Do not assume the current formula is correct simply because it matches fixtures.

Cross-check against API-returned values when both are available.

For every account:

```text
computed equity
API equity
difference
tolerance
```

Report any unexplained difference.

---

# 11. Unrealized PnL

Verify:

* long positions
* short positions
* quantity precision
* mark price precision
* contract multiplier
* fees
* partial fills
* multiple positions
* zero quantity
* negative quantities if API permits them

Never use binary floating-point arithmetic where financial precision matters.

Search the entire repository for:

```text
Number(
parseFloat(
parseInt(
Math.round(
Math.floor(
Math.ceil(
.toFixed(
```

Classify every occurrence as:

```text
SAFE
UNSAFE FOR MONEY
UI-ONLY
REQUIRES REVIEW
```

---

# 12. Decimal Integrity

Verify that all financial calculations use:

* Decimal
* BigNumber
* integer minor units
* or another deterministic exact representation

Test:

```text
0.1 + 0.2
1.005
999999.999999
very small quantity
very large price
high precision quantity
high precision PnL
```

Confirm serialization does not convert precise decimals into IEEE-754 numbers.

---

# 13. Position Normalization

Verify all position pipelines:

REST → normalized state

WebSocket → normalized state

Persistence/cache → normalized state

UI → displayed state

Test:

```text
"0"
"0.0"
"0.00"
"0.000000"
null
undefined
negative quantity
tiny non-zero quantity
```

A tiny non-zero quantity must never be accidentally discarded merely because it rounds visually to zero.

---

# 14. WebSocket Realtime Architecture

Audit the full WebSocket lifecycle.

Verify:

```text
connect
authenticate
subscribe
heartbeat
receive event
update state
disconnect
reconnect
resubscribe
reconcile REST state
```

Test:

* duplicate event
* out-of-order event
* reconnect
* multiple reconnects
* event arriving during REST reconciliation
* event arriving immediately after reconnect
* malformed event
* unknown event
* stale event
* connection silently hanging

Verify heartbeat behavior against the official Propr WebSocket contract.

---

# 15. REST ↔ WebSocket Reconciliation

Determine authoritative precedence.

For every state field define:

```text
REST authoritative?
WS authoritative?
derived locally?
```

Then test contradictory values.

Example:

```text
REST says equity = 49,950
WS says equity = 50,020
```

Verify deterministic resolution.

Do not allow whichever request happens to finish last to win.

---

# 16. Event Idempotency

For every event with an identifier, verify deduplication.

Test:

```text
same trade event twice
same order event twice
same position event twice
same account update twice
same payout event twice
```

Ensure duplication does not alter:

* PnL
* positions
* trade counts
* fees
* finance totals
* equity
* drawdown
* payout totals

---

# 17. Order Coverage

Verify order retrieval includes every order state required by the application.

At minimum evaluate:

```text
open
pending
partially_filled
filled
cancelled
triggered
```

Verify stop-loss and take-profit conditional orders are not accidentally omitted.

If the UI claims "open orders", define precisely what that label means.

---

# 18. Payout Accounting

Verify payout aggregation only counts payouts that actually represent withdrawn cash.

Test:

```text
requested
processing
processed
rejected
cancelled
failed
```

Only authoritative completed/processed payouts may increase:

```text
totalPayouts
actualCashPnL
```

Test duplicate payout records.

Test payout reversal/failure after a prior request.

---

# 19. Cash PnL — Accounting Audit

Clearly separate:

```text
Trading PnL
Cash PnL
Realized PnL
Unrealized PnL
Purchase Costs
Refunds
Adjustments
Payouts
```

The expected formula must be explicitly documented and tested.

At minimum verify:

```text
cash PnL
= payouts
- purchases
+ refunds
+/- adjustments
```

Do NOT substitute:

```text
equity - starting balance
```

for cash PnL.

---

# 20. Finance Ledger Integrity

Verify every finance transaction has:

* unique identity
* date
* transaction type
* amount
* currency
* account relation where applicable
* provenance/reference
* verification status

Test duplicate purchase imports.

Test identical amounts on different dates.

Test same purchase imported twice.

Test bank-verified vs unverified transactions.

---

# 21. INR Conversion Audit

Determine exactly where USD→INR conversion occurs.

Verify:

* hardcoded conversion
* environment-configured conversion
* live FX
* timestamped FX
* stale FX
* rounding

Financial values must never silently change because an unrelated UI request triggered a recalculation.

Every displayed INR total should have an explainable conversion basis.

---

# 22. Mock / Synthetic Data Audit

Search the full codebase for:

```text
mock
fixture
seed
fallback
demo
sample
fake
synthetic
placeholder
```

Classify every occurrence.

Production execution must never silently substitute synthetic financial data for failed API data.

Simulate:

* missing API key
* API 401
* API 403
* API 429
* API 500
* timeout
* DNS/network failure
* malformed JSON
* partial response

Expected result:

```text
SYNC ERROR
STALE
UNKNOWN
OFFLINE
```

Never invented accounts, PnL, balances or trades.

---

# 23. Failure-Safety Audit

For every failed dependency verify:

```text
Is financial data clearly marked stale?
Is the timestamp shown?
Is the last known good state identified?
Can stale data be mistaken for live data?
Can the user believe a failed account is safe?
```

A trading dashboard should fail visibly, not optimistically.

---

# 24. Freshness / Timestamp Audit

Verify timestamps originate from real system data.

Do not allow:

```text
setInterval(() => timestamp++, ...)
```

or similar UI-generated freshness.

Define:

```text
lastSuccessfulRESTSync
lastWebSocketEvent
lastAccountSync
lastFinanceSync
lastError
```

Show the correct timestamp for each dataset.

---

# 25. API Key Security

Search:

```text
PROPR_API_KEY
X-API-Key
pk_live_
NEXT_PUBLIC_
process.env
client components
browser bundles
source maps
logs
errors
```

Verify secret exposure through:

* React props
* serialized server components
* API responses
* browser network calls
* static HTML
* source maps
* error messages
* console logs

Prove the secret is server-only.

---

# 26. Read-Only Guarantee

The application is intended as a monitoring terminal.

Audit every HTTP client call.

Search for:

```text
POST
PUT
PATCH
DELETE
```

Search for:

```text
/orders
/payouts
/checkout
/challenge
/account
```

Confirm no production UI can accidentally:

* create orders
* cancel orders
* request payouts
* purchase accounts
* modify account settings

A read-only terminal must remain read-only.

---

# 27. API Rate Limiting

Determine:

* REST request frequency
* polling intervals
* retries
* exponential backoff
* cache duration
* multi-account request amplification

Stress-test with many accounts.

Verify the application does not approach the documented Propr rate limit merely because several UI components independently request the same data.

---

# 28. Vercel Architecture Audit

This is critical.

Determine exactly how the following run on Vercel:

```text
Next.js application
API routes
WebSocket worker
persistent process
polling
caching
scheduled reconciliation
```

A serverless environment must not be treated as a permanently running WebSocket server unless the deployment platform/runtime explicitly supports that architecture.

Verify:

* whether `services/propr-sync` actually runs in production
* whether it is deployed
* whether its state persists
* whether its process survives instance recycling
* where realtime state is stored
* whether cold starts lose state
* whether duplicate workers can exist
* whether multiple Vercel instances race

Produce an architecture diagram.

---

# 29. Persistent State Audit

Identify all stateful stores.

For each state:

```text
location
lifetime
owner
update mechanism
persistence guarantees
recovery mechanism
```

Specifically verify persistence of:

* high-water mark
* positions
* last sync state
* event IDs
* payout state
* account state
* finance ledger

If memory-only, classify appropriately.

---

# 30. Race Conditions

Test:

```text
REST refresh + WS event
WS reconnect + REST refresh
two browser tabs
two server instances
simultaneous account updates
simultaneous payout updates
simultaneous finance refresh
```

The same account must never show internally contradictory state.

---

# 31. Multi-Account Isolation

For every mutable state structure verify account ID is part of the key.

Example:

```text
state[accountId]
```

is acceptable.

Global mutable variables such as:

```text
currentPosition
currentEquity
highWaterMark
```

must be treated as suspicious.

Test two accounts changing simultaneously and verify zero cross-talk.

---

# 32. Timezone Audit

Audit all date/time handling.

The application operates for an Indian user, but Propr timestamps may originate in UTC or account-specific contexts.

Verify:

* UTC storage
* IST display
* daily-loss boundary
* purchase dates
* payout dates
* trading dates
* relative freshness
* daylight/timezone conversion

Never derive a financial day boundary from browser locale.

---

# 33. Frontend Truthfulness Audit

Inspect every dashboard metric and ask:

> Could this number be technically correct but semantically misleading?

Audit:

* active capital
* total invested
* equity
* PnL
* drawdown
* drawdown consumed
* daily loss
* payout
* cash PnL
* account status
* sync health

Each metric must have:

```text
definition
source
calculation
timestamp
failure behavior
```

---

# 34. Route & Navigation Audit

Verify every navigation route returns a valid page.

Test:

```text
/accounts
/positions
/orders
/finance
/history
/live
/system
```

Verify:

* no 404
* no hydration errors
* no server/client boundary violations
* no unnecessary duplicate API calls
* route-level error handling
* loading state
* stale state

---

# 35. Accessibility Audit

Run automated and manual accessibility checks.

Verify:

* semantic tables
* headings
* labels
* keyboard navigation
* progressbar ARIA
* contrast
* focus indicators
* screen-reader labels
* accessible status indicators

Critical financial status must never depend exclusively on color.

Example:

```text
SAFE
WARNING
HIGH RISK
BREACHED
SYNC ERROR
```

must be textually distinguishable.

---

# 36. Mobile / Responsive Audit

Test:

* desktop
* tablet
* mobile
* narrow terminal widths

Verify no important financial metric disappears or becomes ambiguous.

Risk bars and status indicators must remain understandable on mobile.

---

# 37. Performance Audit

Measure:

* initial load
* server response
* API aggregation
* REST fetch latency
* WS update processing
* rerender frequency
* memory usage

Test with:

```text
1 account
5 accounts
20 accounts
50 accounts
100 accounts
```

Identify O(N²) or repeated account-wide processing.

---

# 38. Dependency & Supply Chain Audit

Run:

```bash
npm audit
npm outdated
```

Inspect:

* critical vulnerabilities
* transitive vulnerabilities
* abandoned packages
* duplicate dependency versions
* unnecessary packages

Do not automatically upgrade packages without checking compatibility with:

* Next.js
* React
* Turbopack
* TypeScript
* Vitest

---

# 39. Build Reproducibility

Clone the repository into a clean directory.

Run:

```bash
npm install
npm test
npm run type-check
npm run lint
npm run build
```

No hidden local files may be required.

Verify no dependence on:

```text
/Users/dhruv/...
local .env
untracked fixtures
IDE-generated files
ignored source
```

This is especially important because the previous audit references local development artifacts.

---

# 40. Production Environment Audit

Verify every environment variable.

Classify:

```text
required
optional
development-only
production-only
public-safe
secret
```

The app must fail clearly when required production secrets are missing.

It must not silently switch to demo data.

---

# 41. Test Quality Audit

For each of the claimed 67 tests:

* determine what production code path it exercises
* determine whether it is a true regression test
* identify mocks
* identify unreachable branches
* identify assertions that only check object shape
* identify tests that never verify numeric correctness

Calculate:

```text
critical financial paths covered
critical API paths covered
critical failure paths covered
```

Do not equate test count with coverage quality.

---

# 42. Mutation Testing

Intentionally introduce these defects and verify that the suite catches them:

1. active capital includes failed purchases
2. drawdown gauge uses balance loss
3. trailing DD disabled
4. HWM reset on restart
5. zero quantities accepted
6. mock data returned on API error
7. processed payout filter removed
8. duplicate WS events counted twice
9. daily loss uses initial balance
10. API key returned to client
11. pending orders omitted
12. INR conversion changed
13. account IDs mixed between accounts
14. REST overwrites newer WS state
15. WS overwrites authoritative REST state

A mutation that survives is a serious test-suite defect.

---

# 43. Real Propr API Verification

Using the official Propr documentation and, where safely possible, a read-only API credential:

Verify actual payloads for:

```text
challenge-attempts
book-account-issuances
positions
orders
payouts
account state
WebSocket events
```

Compare actual payload shape with:

* Zod schemas
* TypeScript interfaces
* normalization functions
* calculation functions
* UI assumptions

Flag undocumented fields being relied on.

---

# 44. Contract Drift Protection

For every external API field used by production:

Document:

```text
endpoint
field
type
nullable?
optional?
meaning
fallback
```

Add contract tests that fail when the payload shape materially changes.

Do not overfit schemas to the current fixture.

---

# 45. Financial Invariants

The following invariants must always hold unless explicitly documented otherwise:

```text
processed payouts >= 0

active capital >= 0

drawdown consumed >= 0

drawdown consumed <= 100% before breach

equity = balance + applicable unrealized components

zero-quantity positions do not contribute PnL

failed account cannot be classified as active

closed account cannot be classified as active

duplicate trade event cannot change totals

duplicate payout event cannot change totals

API failure cannot create financial data
```

Add any additional invariants discovered during audit.

---

# 46. Reconciliation Against Known Real Data

Use the known real account set and verified purchase history.

Reconcile:

* account IDs
* account stages
* purchase IDs
* purchase amounts
* active account count
* active capital
* failed account capital
* historical capital
* realized PnL
* fees
* payouts
* cash PnL

Every discrepancy must have a documented reason.

---

# 47. UI ↔ Backend Reconciliation

For every major dashboard number produce:

| UI Metric | Backend Source | Raw Field(s) | Calculation | Expected | Displayed | Match |
| --------- | -------------- | ------------ | ----------- | -------: | --------: | ----- |

No UI number should exist without a traceable source.

---

# 48. Security Audit Beyond API Key

Check:

* dependency vulnerabilities
* SSR injection
* unsafe HTML
* open redirects
* exposed diagnostics
* stack traces
* source maps
* debug endpoints
* health endpoint information disclosure
* environment leakage
* client/server boundary mistakes

---

# 49. `/api/health` Security

Determine exactly what `/api/health` exposes.

It may expose operational status, but must not expose:

* API key
* raw Propr responses
* sensitive account details
* private financial data
* internal filesystem details
* stack traces
* secrets

---

# 50. Error-State UX

For every failure state ensure the user sees enough information to make a safe decision.

Required distinction:

```text
LIVE
STALE
SYNC ERROR
OFFLINE
UNKNOWN
BREACHED
SAFE
WARNING
```

Do not represent:

```text
API ERROR
```

as:

```text
0
```

Do not represent:

```text
UNKNOWN
```

as:

```text
SAFE
```

---

# 51. Logging Audit

Search for:

```text
console.log
console.error
logger.*
JSON.stringify(...)
```

Ensure production logs do not contain:

* API keys
* authorization headers
* raw sensitive account payloads
* payment information

Log enough information for debugging without exposing secrets.

---

# 52. Dead Code / Fake Completeness Audit

Identify:

* unused routes
* placeholder pages
* components that display hardcoded values
* dead calculations
* unused APIs
* unreachable branches
* TODOs related to financial correctness
* comments claiming behavior that code does not implement

A route existing is not sufficient.

Verify each route actually uses real application state.

---

# 53. Claims-vs-Code Audit

Compare all statements in:

```text
README.md
AUDIT.md
walkthrough.md
prompt.md
comments
package.json
```

against the actual source.

Every claim must be classified:

```text
TRUE
PARTIALLY TRUE
FALSE
UNVERIFIABLE
```

Pay particular attention to:

* "real-time"
* "trailing drawdown"
* "failure safe"
* "production ready"
* "read only"
* "67 tests"
* "all routes"
* "zero lint errors"
* "active capital corrected"

---

# 54. Deployment Rehearsal

Perform a clean production deployment simulation.

Verify:

```bash
npm install
npm test
npm run type-check
npm run lint
npm run build
```

Then run the production server.

Test:

* initial load
* all routes
* API failures
* missing env
* multiple accounts
* reconnect
* stale state

Do not declare production readiness based only on build success.

---

# 55. Vercel-Specific Failure Simulation

Simulate:

```text
cold start
instance restart
multiple instances
request timeout
API timeout
API rate limit
function termination
concurrent requests
cache miss
cache revalidation
```

Determine whether any in-memory state can disappear without recovery.

This section is mandatory.

---

# 56. Final Finding Classification

Create findings using:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

Each finding must contain:

```text
ID
Severity
File
Line
Observed behavior
Expected behavior
Business impact
Reproduction
Evidence
Root cause
Recommended fix
Regression test
```

---

# 57. Final Production Scorecard

Produce:

| Area                 | PASS / CONDITIONAL / FAIL | Severity | Evidence |
| -------------------- | ------------------------- | -------- | -------- |
| Repository integrity |                           |          |          |
| Build                |                           |          |          |
| Type safety          |                           |          |          |
| API contract         |                           |          |          |
| Account discovery    |                           |          |          |
| Lifecycle            |                           |          |          |
| Financial math       |                           |          |          |
| Drawdown             |                           |          |          |
| Daily loss           |                           |          |          |
| PnL                  |                           |          |          |
| Finance ledger       |                           |          |          |
| Payouts              |                           |          |          |
| Realtime             |                           |          |          |
| WS reconciliation    |                           |          |          |
| Failure safety       |                           |          |          |
| Security             |                           |          |          |
| Read-only guarantee  |                           |          |          |
| Frontend             |                           |          |          |
| Accessibility        |                           |          |          |
| Performance          |                           |          |          |
| Testing              |                           |          |          |
| Vercel architecture  |                           |          |          |
| Deployment           |                           |          |          |

---

# 58. Production Readiness Gate

Do NOT declare production ready unless all of the following are true:

* no CRITICAL findings
* no unresolved HIGH financial correctness findings
* active capital is correct against real account data
* drawdown math matches the authoritative Propr contract
* trailing drawdown is correct if applicable
* daily loss is correct
* payout accounting is correct
* API failure cannot generate synthetic financial data
* API key cannot reach the client
* read-only guarantee is proven
* WS reconnect is safe
* REST/WS reconciliation is deterministic
* multi-account isolation is proven
* production build works from a clean checkout
* deployment architecture is actually viable on Vercel
* mutation tests prove the critical regression suite is meaningful

If any condition fails:

```text
NOT PRODUCTION READY
```

---

# 59. Required Final Deliverables

Create:

```text
POST_REMEDIATION_AUDIT.md
POST_REMEDIATION_TEST_REPORT.md
POST_REMEDIATION_FINDINGS.md
```

Also create, where useful:

```text
tests/adversarial/
tests/mutation/
tests/contracts/
fixtures/real-api/
```

Do not modify production code unless explicitly instructed.

This audit is a **verification phase first**.

---

# 60. Final Answer Format

End the audit with exactly:

```text
POST-REMEDIATION VERDICT
========================

Repository:
Commit:
Audit date:

Original audit verdict:
Current verified verdict:

Critical findings:
High findings:
Medium findings:
Low findings:

Tests:
Typecheck:
Lint:
Build:
Mutation testing:
API contract verification:
Vercel architecture verification:

PRODUCTION STATUS:
[PRODUCTION READY]
[PRODUCTION READY WITH CONDITIONS]
[NOT PRODUCTION READY]
```

Then provide:

## Top 5 Remaining Risks

## Top 5 Required Actions

## Evidence That Previous Fixes Actually Work

## Evidence That Could Not Be Verified

## Recommended Next Audit Trigger

Do not inflate confidence because the repository reports "67 tests passing".

The central question is:

> **Can this terminal now be trusted with real trading-finance monitoring when the external API, realtime stream, deployment environment, and account state behave unpredictably?**
