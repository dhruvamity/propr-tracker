# Propr Trading Terminal — Final Release Findings & Risk Register

```text
================================================================================
FINAL PRODUCTION RISK REGISTER & FINDINGS REPORT
================================================================================
AUDIT DATE:       2026-09-11
AUDITED COMMIT:   18eb228 (and release certification HEAD)
BRANCH:           main
STATUS:           ALL CRITICAL & HIGH FINDINGS 100% RESOLVED
REMAINING:        0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 ACCEPTED LOW (OPERATIONAL)
================================================================================
```

---

## 1. Summary of Risk Status

| Severity | Total Identified | Fully Remediated | Remaining Open | Verdict |
| :--- | :---: | :---: | :---: | :---: |
| **CRITICAL** | 4 | 4 | 0 | **CLEARED** |
| **HIGH** | 4 | 4 | 0 | **CLEARED** |
| **MEDIUM** | 5 | 5 | 0 | **CLEARED** |
| **LOW** | 5 | 4 | 1 (Operational) | **ACCEPTED** |
| **INFO** | 2 | 2 | 0 | **DOCUMENTED** |
| **TOTAL** | **20** | **19** | **1** | **PRODUCTION READY WITH CONDITIONS** |

---

## 2. Critical Findings (CRITICAL) — All Resolved

### CRIT-01: Synthetic Mock Data Injected on Upstream API Failure
- **Severity**: CRITICAL
- **File**: `apps/terminal/src/lib/api.ts`
- **Line**: 118–142
- **Observed**: When upstream Propr API responded with HTTP 500, 502, or timeout, the system silently invoked `createMockData()`, populating the dashboard with fabricated accounts, trades, and balances.
- **Expected**: Never generate synthetic financial data. Fail closed with explicit `restStatus: "ERROR"` and render an offline/degraded UI banner.
- **Impact**: User could trade or make risk management decisions based on hallucinated equity and account figures.
- **Reproduction**: Disconnect network or mock HTTP 500 on `/v1/accounts`.
- **Evidence**: `createMockData()` function present in codebase and triggered inside catch blocks.
- **Root Cause**: Premature prototype fallback intended for early UI prototyping was left in production API paths.
- **Recommended Action**: Delete `createMockData()` completely; return typed error responses.
- **Regression Protection**: Automated test in `tests/integration/api-failure-safety.test.ts` and Mutation E in `tests/mutation/mutation.test.ts`.
- **Status**: **RESOLVED**

---

### CRIT-02: Active Capital Overstated by Conflating Sunk Evaluation Costs
- **Severity**: CRITICAL
- **File**: `apps/terminal/src/app/page.tsx`
- **Line**: 64–82
- **Observed**: Overview dashboard summed all 8 historical purchase records ($243.75 total), including 6 failed challenge evaluations ($168.75).
- **Expected**: Active capital must strictly reflect currently live, open evaluation and funded accounts ($75.00: $50 for `J9wNi8oj3XGK` + $25 for `4D8XWuQ3fju6`). Sunk capital from failed attempts must be segregated.
- **Impact**: Active trading capital and risk-at-work metrics overstated by 225%, obscuring true capital at risk.
- **Reproduction**: Inspect overview dashboard metrics with 8 historical accounts loaded.
- **Evidence**: `calculateActiveCapital()` summed all entries in purchase history without checking `account.status === "EVALUATION" | "FUNDED"`.
- **Root Cause**: Lack of status filtering linking purchase transactions to live account lifecycle states.
- **Recommended Action**: Link purchase IDs to account states and strictly sum purchases for active accounts.
- **Regression Protection**: Unit tests in `tests/unit/financial-calculations.test.ts` and Mutation A in `tests/mutation/mutation.test.ts`.
- **Status**: **RESOLVED**

---

### CRIT-03: Deceptive Drawdown Progress Gauge Displaying Raw Balance Drop Instead of Breach Budget Consumed
- **Severity**: CRITICAL
- **File**: `apps/terminal/src/components/RiskMeter.tsx`
- **Line**: 45–68
- **Observed**: Risk meter gauge calculated percentage as `drawdownUsed / currentBalance`, displaying `3.2%` on an account that had already burned 64% of its allowable drawdown limit.
- **Expected**: Risk gauge must display allowable breach budget consumed: `(drawdownUsed / maxDrawdownAmount) * 100`, warning the user when approaching the terminal liquidation threshold.
- **Impact**: Trader falsely assumed 96.8% safety margin when actually 36% away from account termination.
- **Reproduction**: Load an evaluation account with $10,000 initial balance, $500 max DD, currently at $9,680.
- **Evidence**: Gauge rendered green bar with text "3.2% Drawdown" instead of amber bar with text "64.0% Limit Consumed".
- **Root Cause**: Misinterpretation of drawdown limit consumption vs. raw equity percentage drop.
- **Recommended Action**: Update formula to `calculateDrawdownLimitConsumed()` from `@propr/calculations`.
- **Regression Protection**: Unit tests in `tests/unit/drawdown-and-risk.test.ts` and Mutation B in `tests/mutation/mutation.test.ts`.
- **Status**: **RESOLVED**

---

### CRIT-04: Closed Positions with 0.00 Size Displayed in Open Positions Table
- **Severity**: CRITICAL
- **File**: `packages/propr-client/src/normalizers.ts`
- **Line**: 88–104
- **Observed**: Upstream Propr API retains closed positions in memory with `size: "0"` or `"0.00000000"`. The terminal displayed these flat positions as active, cluttering the positions table.
- **Expected**: Flat positions (`Decimal(size).isZero()`) must be filtered out of active open positions.
- **Impact**: Trader sees dozens of ghost positions, creating cognitive overload and confusion during rapid market execution.
- **Reproduction**: Fetch positions for an account with past closed trades.
- **Evidence**: Table showed BTC-PERP with quantity `0.00000000` and `uPnL: 0.00`.
- **Root Cause**: Client normalizer only checked `position.size !== undefined`, without evaluating numeric non-zero value.
- **Recommended Action**: Filter positions using `!new Decimal(p.quantity).isZero()`.
- **Regression Protection**: Unit tests in `tests/unit/position-normalization.test.ts` and Mutation C in `tests/mutation/mutation.test.ts`.
- **Status**: **RESOLVED**

---

## 3. High Findings (HIGH) — All Resolved

### HIGH-01: Native Floating-Point Math in Currency Conversion
- **Severity**: HIGH
- **File**: `apps/terminal/src/app/finance/page.tsx`
- **Line**: 127
- **Observed**: Code executed `Number(tx.amountUSD) * 84.5` directly using IEEE 754 floating-point arithmetic.
- **Expected**: All financial and currency math must strictly use `Decimal.js` via `convertUsdToInr()` from `@propr/calculations`.
- **Impact**: Floating-point precision artifacts (e.g. `4225.000000000001`) in financial ledger representations.
- **Reproduction**: Inspect INR conversion output for fractional USD amounts.
- **Evidence**: `Number(tx.amountUSD) * 84.5` present in line 127 of `finance/page.tsx`.
- **Root Cause**: Developer shortcut bypassing the shared calculations package.
- **Recommended Action**: Replace with `convertUsdToInr(tx.amountUSD, exchangeRate)`.
- **Regression Protection**: Enforced by ESLint and tested in `packages/calculations/src/__tests__/calculations.test.ts`.
- **Status**: **RESOLVED**

---

### HIGH-02: Pending and Triggered Stop Orders Missing From Orders Tab
- **Severity**: HIGH
- **File**: `apps/terminal/src/app/orders/page.tsx`
- **Line**: 52–65
- **Observed**: Orders tab only queried `status === "OPEN"`, failing to display `PENDING`, `STOP_LOSS_TRIGGERED`, or `TAKE_PROFIT` orders.
- **Expected**: All active unexecuted orders (including conditional trigger orders) must be visible.
- **Impact**: Trader unaware of standing stop-loss or take-profit orders in the market.
- **Reproduction**: Place a limit order and a conditional stop-loss; inspect orders tab.
- **Evidence**: Only limit orders appeared; stop-loss order was invisible.
- **Root Cause**: Overly strict filter on order status.
- **Recommended Action**: Expand filter to include `["OPEN", "PENDING", "TRIGGERED"]`.
- **Regression Protection**: Unit test in `tests/e2e/scenarios.test.ts` and Mutation F in `tests/mutation/mutation.test.ts`.
- **Status**: **RESOLVED**

---

### HIGH-03: Daily Loss Base Missing Isolated Position Margin
- **Severity**: HIGH
- **File**: `packages/calculations/src/calculations.ts`
- **Line**: 185–205
- **Observed**: Daily loss base was calculated simply as `dayStartBalance - currentEquity`, neglecting initial margin committed to isolated positions.
- **Expected**: Daily loss base must equal `dayStartBalance + isolatedPositionMargin - currentEquity`.
- **Impact**: Daily loss significantly underreported (up to $2,500 discrepancy on active isolated positions).
- **Reproduction**: Run daily loss calculation on an account with open isolated margin positions.
- **Evidence**: Calculated loss differed by exactly the isolated margin allocation.
- **Root Cause**: Omission of isolated margin addback in daily equity baseline formula.
- **Recommended Action**: Incorporate `isolatedPositionMargin` into daily loss base calculation.
- **Regression Protection**: Dedicated unit test in `tests/unit/daily-loss.test.ts` and Mutation D in `tests/mutation/mutation.test.ts`.
- **Status**: **RESOLVED**

---

### HIGH-04: Payout Webhook Duplication Double-Counting Cash Withdrawals
- **Severity**: HIGH
- **File**: `packages/finance/src/ledger.ts`
- **Line**: 78–95
- **Observed**: Incoming payout records were appended directly without deduplication on `payoutId` or transaction hash.
- **Expected**: Payouts must be idempotent and deduplicated against unique transaction IDs.
- **Impact**: Duplicate webhook deliveries or network retries double-counted cash withdrawals, skewing net cash PnL.
- **Reproduction**: Ingest the same payout payload twice.
- **Evidence**: Payout total increased by 2x.
- **Root Cause**: Append-only list without an indexed Set or Map for deduplication.
- **Recommended Action**: Implement key-based deduplication on `payoutId`.
- **Regression Protection**: Unit test in `tests/unit/payouts-and-cash-pnl.test.ts` and Mutation G in `tests/mutation/mutation.test.ts`.
- **Status**: **RESOLVED**

---

## 4. Medium Findings (MEDIUM) — All Resolved

### MED-01: Turbopack Build Failure Due to Nested Vercel DistDir
- **Severity**: MEDIUM
- **File**: `apps/terminal/package.json`
- **Line**: 6
- **Observed**: Vercel deployment failed with: `The file "/vercel/path0/apps/terminal/apps/terminal/.next/routes-manifest.json" couldn't be found`.
- **Expected**: Next.js build output must be accessible whether Vercel expects it in `.next` or `apps/terminal/.next`.
- **Impact**: Vercel deployment builds failed completely in production CI/CD.
- **Reproduction**: Run `vercel build` with root directory set to `apps/terminal` and output directory defaulted to `apps/terminal/.next`.
- **Evidence**: Vercel deployment build logs.
- **Root Cause**: Discrepancy between Vercel project settings and Next.js Turbopack output directory.
- **Recommended Action**: Dual-path build command: `next build && mkdir -p apps/terminal && cp -r .next apps/terminal/`.
- **Regression Protection**: Tested in production build verification step.
- **Status**: **RESOLVED**

---

### MED-02: Zod Schema Required Fields Causing Runtime Rejections on Live Payloads
- **Severity**: MEDIUM
- **File**: `packages/data-model/src/schemas.ts`
- **Line**: 24–65
- **Observed**: Strict Zod schemas required fields like `userId`, `exchange`, `tradingFeeRate` which were omitted by certain Propr microservices.
- **Expected**: Schemas must enforce core financial fields while making non-critical metadata optional.
- **Impact**: Valid API responses failed validation and were rejected as schema errors.
- **Reproduction**: Validate raw live account response against strict schema.
- **Evidence**: Zod validation thrown on missing `tradingFeeRate`.
- **Root Cause**: Overly rigid contract specifications on optional upstream metadata.
- **Recommended Action**: Make non-essential metadata fields `.optional()`.
- **Regression Protection**: Validated in `tests/contracts/api-contracts.test.ts`.
- **Status**: **RESOLVED**

---

### MED-03: Process Restart Volatility for Trailing High-Water Mark
- **Severity**: MEDIUM
- **File**: `services/propr-sync/src/worker.ts`
- **Line**: 110–135
- **Observed**: High-water mark state was held in memory; restarting the process reset HWM to current balance, lowering the trailing drawdown floor.
- **Expected**: HWM must persist across restarts or be safely reconstructed from historical equity peaks.
- **Impact**: Could allow a trader to bypass trailing drawdown rules after a service restart.
- **Reproduction**: Restart sync worker while account equity is below its historical peak.
- **Evidence**: HWM reset to current balance.
- **Root Cause**: Purely in-memory tracking without local snapshot persistence.
- **Recommended Action**: Snapshot HWM to local JSON cache / Redis with historical high verification.
- **Regression Protection**: Unit test in `tests/unit/drawdown-and-risk.test.ts` and Mutation H in `tests/mutation/mutation.test.ts`.
- **Status**: **RESOLVED**

---

### MED-04: REST Out-of-Order Overwrite of Newer WebSocket Mark Prices
- **Severity**: MEDIUM
- **File**: `apps/terminal/src/hooks/useAccountData.ts`
- **Line**: 88–105
- **Observed**: Slow REST polling responses completing after a newer WebSocket tick had arrived overwrote the newer WebSocket mark price.
- **Expected**: Monotonic timestamp sequencing: only payloads with timestamps strictly greater than current state may update prices.
- **Impact**: Flickering prices and brief temporal regressions in PnL.
- **Reproduction**: Deliver WS tick at $65,000 (t=1000) then resolve in-flight REST fetch at $64,800 (t=950).
- **Evidence**: State reverted to $64,800.
- **Root Cause**: Lack of timestamp comparison before state dispatch.
- **Recommended Action**: Enforce `if (incoming.timestamp <= current.timestamp) return;`.
- **Regression Protection**: Integration test in `tests/integration/rest-ws-reconciliation.test.ts` and Mutation J.
- **Status**: **RESOLVED**

---

### MED-05: Missing ARIA Accessibility Attributes on Risk Progress Bars
- **Severity**: MEDIUM
- **File**: `apps/terminal/src/components/RiskMeter.tsx`
- **Line**: 62–75
- **Observed**: Risk meter rendered a plain `<div>` progress bar without accessibility roles or values.
- **Expected**: Fully accessible progress gauge with `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, and `aria-valuemax="100"`.
- **Impact**: Screen readers and assistive technologies unable to communicate account risk status.
- **Reproduction**: Inspect DOM elements using accessibility audit tools.
- **Evidence**: Missing ARIA attributes in component template.
- **Root Cause**: Component styling prioritized visual aesthetics over semantic HTML.
- **Recommended Action**: Add ARIA roles, labels, and numeric values.
- **Regression Protection**: Unit test in `tests/unit/drawdown-and-risk.test.ts`.
- **Status**: **RESOLVED**

---

## 5. Low Findings (LOW)

### LOW-01: Console Stale Log Warnings During Rapid Route Transitions
- **Severity**: LOW
- **File**: `apps/terminal/src/app/live/page.tsx`
- **Line**: 44
- **Observed**: Rapid switching between navigation tabs triggered benign React unmount warning logs.
- **Resolution**: Added cleanup abort controllers to async subscription hooks.
- **Status**: **RESOLVED**

### LOW-02: Missing Explicit Typecast on Query Param Account IDs
- **Severity**: LOW
- **File**: `apps/terminal/src/app/accounts/page.tsx`
- **Line**: 32
- **Observed**: Account ID from query string was passed as `string | string[] | undefined`.
- **Resolution**: Added strict `typeof id === "string"` guard.
- **Status**: **RESOLVED**

### LOW-03: Static Revalidation Interval (15s) on Serverless Deployment
- **Severity**: LOW (Accepted Operational Condition)
- **File**: `apps/terminal/src/app/page.tsx`
- **Line**: 12
- **Observed**: On Vercel Serverless, pages revalidate every 15 seconds (`revalidate = 15`), which means sub-second price fluctuations reflect within 15 seconds rather than instantly unless client WebSocket is active.
- **Expected / Trade-off**: Serverless architecture cannot maintain persistent server-to-server WebSocket daemons. This is by design for Vercel deployment.
- **Condition**: Sub-second continuous streaming requires running `services/propr-sync` on a persistent container host (Railway, Fly.io) with Redis KV.
- **Status**: **ACCEPTED OPERATIONAL CONDITION**

### LOW-04: Hardcoded Fallback Exchange Rate (84.5 INR/USD) When Environment Variable Omitted
- **Severity**: LOW
- **File**: `apps/terminal/src/lib/config.ts`
- **Line**: 18
- **Observed**: If `USD_TO_INR` environment variable is not defined, rate defaults to `"84.5"`.
- **Resolution**: Documented in `.env.example` and validated on boot.
- **Status**: **RESOLVED**

### LOW-05: Mobile Table Horizontal Scroll Indicator Not Visible on WebKit
- **Severity**: LOW
- **File**: `apps/terminal/src/app/positions/page.tsx`
- **Line**: 98
- **Observed**: On mobile viewports, wide position tables overflowed without a visible gradient scroll hint.
- **Resolution**: Added CSS subtle gradient fade overlay indicating horizontal scrollability.
- **Status**: **RESOLVED**

---

## 6. Information Items (INFO)

- **INFO-01**: Upstream Propr API rate limits are configured for 60 requests/minute per API key. The terminal's 15-second ISR revalidation and client caching consume at most 4–8 requests/minute, operating well within safe boundaries.
- **INFO-02**: The application is strictly read-only. Zero POST, PUT, DELETE, or mutation routes exist in `apps/terminal`, providing mathematical security against unauthorized order placement or fund transfers.
