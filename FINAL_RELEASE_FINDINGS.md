# Propr Trading Terminal: Final Release Findings & Risk Register

```text
================================================================================
FINAL PRODUCTION RISK REGISTER & FINDINGS REPORT
================================================================================
AUDIT DATE:       2026-09-11
AUDITED COMMIT:   2772b78 (and release certification HEAD)
BRANCH:           main
STATUS:           ALL CRITICAL, HIGH, & MEDIUM FINDINGS 100% RESOLVED
REMAINING:        0 CRITICAL, 0 HIGH, 0 MEDIUM, 0 UNEXPLAINED CASH DISCREPANCIES
ACCEPTED:         1 LOW OPERATIONAL CONDITION (Vercel Serverless Polling Envelope)
================================================================================
```

---

## 1. Summary of Risk Status

| Severity | Total Identified | Fully Remediated | Remaining Open | Verdict |
| :--- | :---: | :---: | :---: | :---: |
| **CRITICAL** | 4 | 4 | 0 | **CLEARED** |
| **HIGH** | 5 | 5 | 0 | **CLEARED** |
| **MEDIUM** | 5 | 5 | 0 | **CLEARED** |
| **LOW** | 5 | 4 | 1 (Operational) | **ACCEPTED** |
| **INFO** | 2 | 2 | 0 | **DOCUMENTED** |
| **TOTAL** | **21** | **20** | **1** | **PRODUCTION READY WITH CONDITIONS** |

---

## 2. Critical Findings (All 4 Resolved)

### CRIT-01: Synthetic Mock Data Injected on Upstream API Failure
- **Severity**: CRITICAL
- **File**: `apps/terminal/src/lib/api.ts`
- **Observed**: When upstream Propr API responded with HTTP 500, 502, or timeout, the system silently invoked `createMockData()`, populating the dashboard with fabricated accounts, trades, and balances.
- **Expected**: Never generate synthetic financial data. Fail closed with explicit `restStatus: "ERROR"` and render an offline/degraded UI banner.
- **Status**: **RESOLVED** (Excised `createMockData()`; tested via `tests/integration/api-failure-safety.test.ts` and Mutation E).

### CRIT-02: Active Capital Overstated by Conflating Sunk Evaluation Costs
- **Severity**: CRITICAL
- **File**: `apps/terminal/src/app/page.tsx`
- **Observed**: Overview dashboard summed all historical purchase records ($243.75 total), including 6 failed challenge evaluations ($168.75).
- **Expected**: Active capital must strictly reflect currently live, open evaluation and funded accounts ($75.00: $50 for `J9wNi8oj3XGK` + $25 for `4D8XWuQ3fju6`). Sunk capital from failed attempts must be segregated.
- **Status**: **RESOLVED** (Linked purchases to active accounts; tested via `tests/unit/financial-calculations.test.ts` and Mutation A).

### CRIT-03: Deceptive Drawdown Progress Gauge Displaying Raw Balance Drop Instead of Breach Budget Consumed
- **Severity**: CRITICAL
- **File**: `apps/terminal/src/components/RiskMeter.tsx`
- **Observed**: Risk meter gauge calculated percentage as `drawdownUsed / currentBalance`, displaying `3.2%` on an account that had already burned 64% of its allowable drawdown limit.
- **Expected**: Risk gauge must display allowable breach budget consumed: `(drawdownUsed / maxDrawdownAmount) * 100`, warning the user when approaching the terminal liquidation threshold.
- **Status**: **RESOLVED** (Scaled to `calculateDrawdownLimitConsumed()`; tested via `tests/unit/drawdown-and-risk.test.ts` and Mutation B).

### CRIT-04: Closed Positions with 0.00 Size Displayed in Open Positions Table
- **Severity**: CRITICAL
- **File**: `packages/propr-client/src/normalizers.ts`
- **Observed**: Upstream Propr API retains closed positions in memory with `size: "0"` or `"0.00000000"`. The terminal displayed these flat positions as active, cluttering the positions table.
- **Expected**: Flat positions (`Decimal(size).isZero()`) must be filtered out of active open positions.
- **Status**: **RESOLVED** (Filtered with `!new Decimal(p.quantity).isZero()`; tested via `tests/unit/position-normalization.test.ts` and Mutation C).

---

## 3. High Findings (All 5 Resolved)

### HIGH-01: Native Floating-Point Math in Currency Conversion
- **Severity**: HIGH
- **File**: `apps/terminal/src/app/finance/page.tsx`
- **Observed**: Code executed `Number(tx.amountUSD) * 84.5` directly using IEEE 754 floating-point arithmetic.
- **Expected**: All financial and currency math must strictly use `Decimal.js` via `convertUsdToInr()` from `@propr/calculations`.
- **Status**: **RESOLVED**

### HIGH-02: Pending and Triggered Stop Orders Missing From Orders Tab
- **Severity**: HIGH
- **File**: `apps/terminal/src/app/orders/page.tsx`
- **Observed**: Orders tab only queried `status === "OPEN"`, failing to display `PENDING`, `STOP_LOSS_TRIGGERED`, or `TAKE_PROFIT` orders.
- **Expected**: All active unexecuted orders (including conditional trigger orders) must be visible.
- **Status**: **RESOLVED**

### HIGH-03: Daily Loss Base Missing Isolated Position Margin
- **Severity**: HIGH
- **File**: `packages/calculations/src/calculations.ts`
- **Observed**: Daily loss base was calculated simply as `dayStartBalance - currentEquity`, neglecting initial margin committed to isolated positions.
- **Expected**: Daily loss base must equal `dayStartBalance + isolatedPositionMargin - currentEquity`.
- **Status**: **RESOLVED** (Tested via `tests/unit/daily-loss.test.ts` and Mutation D).

### HIGH-04: Payout Webhook Duplication Double-Counting Cash Withdrawals
- **Severity**: HIGH
- **File**: `packages/finance/src/ledger.ts`
- **Observed**: Incoming payout records were appended directly without deduplication on `payoutId` or transaction hash.
- **Expected**: Payouts must be idempotent and deduplicated against unique transaction IDs.
- **Status**: **RESOLVED** (Tested via `tests/unit/payouts-and-cash-pnl.test.ts` and Mutation G).

### HIGH-05: Conflation of Face Purchase Value with Actual Bank Cash Cost (Three-Layer Gap)
- **Severity**: HIGH
- **File**: `packages/finance/src/ledger.ts`, `apps/terminal/src/lib/propr-api.ts`
- **Observed**: $75.00 active face value was represented as ₹6,337.50 using synthetic multiplication ($75 × 84.5), ignoring actual bank debits (₹7,336.19). Breakout spending (₹3,835.25) was excluded from total cash flow.
- **Expected**: The system must enforce Three-Layer Accounting: Face Value (Layer 1), Actual Cash from Bank Statements (Layer 2), and Trading Performance (Layer 3). Actual cash metrics must use bank debits, include Breakout, and report both Active Face Capital ($75.00) and Active Actual Cash Cost (₹7,336.19).
- **Status**: **RESOLVED** (Integrated actual bank debits for all 9 transactions; tested via `tests/unit/cash-ledger-reconciliation.test.ts` and Mutations K, L, M, N, O, P).

---

## 4. Medium Findings (All 5 Resolved)

### MED-01: Turbopack Build Failure Due to Nested Vercel DistDir
- **Severity**: MEDIUM
- **File**: `apps/terminal/package.json`
- **Resolution**: Implemented dual-path build output (`.next` and `apps/terminal/.next`).
- **Status**: **RESOLVED**

### MED-02: Zod Schema Required Fields Causing Runtime Rejections on Live Payloads
- **Severity**: MEDIUM
- **File**: `packages/data-model/src/schemas.ts`
- **Resolution**: Made non-essential upstream metadata fields `.optional()`.
- **Status**: **RESOLVED**

### MED-03: Process Restart Volatility for Trailing High-Water Mark
- **Severity**: MEDIUM
- **File**: `services/propr-sync/src/worker.ts`
- **Resolution**: Persisted HWM state and verified historical high recovery.
- **Status**: **RESOLVED**

### MED-04: REST Out-of-Order Overwrite of Newer WebSocket Mark Prices
- **Severity**: MEDIUM
- **File**: `apps/terminal/src/hooks/useAccountData.ts`
- **Resolution**: Enforced monotonic timestamp ordering.
- **Status**: **RESOLVED**

### MED-05: Missing ARIA Accessibility Attributes on Risk Progress Bars
- **Severity**: MEDIUM
- **File**: `apps/terminal/src/components/RiskMeter.tsx`
- **Resolution**: Added `role="progressbar"`, `aria-valuenow`, and semantic range bounds.
- **Status**: **RESOLVED**

---

## 5. Low Findings (LOW)

### LOW-01: Console Stale Log Warnings During Rapid Route Transitions
- **Status**: **RESOLVED** (Added abort controllers to async subscription hooks).

### LOW-02: Missing Explicit Typecast on Query Param Account IDs
- **Status**: **RESOLVED** (Added strict string type guard).

### LOW-03: Serverless Polling Envelope (15s Revalidation on Vercel)
- **Severity**: LOW (Accepted Operational Condition)
- **Context**: Vercel Serverless executes pages on a 15-second ISR cache. Continuous sub-second tick streaming requires running `services/propr-sync` on a container runtime with Redis.
- **Status**: **ACCEPTED OPERATIONAL CONDITION**

### LOW-04: Hardcoded Fallback Exchange Rate (84.5 INR/USD)
- **Status**: **RESOLVED** (Configured as documented fallback; actual bank debits override FX).

### LOW-05: Mobile Table Horizontal Scroll Indicator
- **Status**: **RESOLVED** (Added CSS gradient scroll hints).

---

## 6. Information Items (INFO)

- **INFO-01**: Upstream Propr API rate limits (60 req/min) are comfortably respected by the terminal's 15s cache envelope.
- **INFO-02**: Mathematically read-only architecture provides complete structural security against unauthorized order placement or fund movement.
