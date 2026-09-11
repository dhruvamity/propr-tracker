# TASK: Audit & Fix Live Account Risk Metrics, Profit Progress, and Trade History Ingestion

You are tasked with diagnosing, fixing, and writing tests for three core data pipelines in `propr-tracker`:
1. **Live Account Drawdown & Profit Target Progress:** Live accounts fail to render accurate drawdown and profit target progress (stuck at 0% or uncalculated).
2. **Live Account Trade Ingestion:** Verify that trade execution streams (`GET /accounts/{accountId}/trades` and WebSocket `trade.created`) are correctly implemented and wired, even when no manual trades are currently active.
3. **Historical Account Trade Records:** Verify that historical/breached accounts successfully fetch, paginate, and render past trade execution history.

---

## Part 1: Root-Cause Analysis & Fixes

### 1. Live Account Drawdown & Profit Target Calculation Failures
Investigate `packages/calculations/src/risk.ts`, `services/propr-sync/src/store.ts`, and `apps/terminal/src/app/live/page.tsx`:
- **Challenge Metadata Gap:** Check if `profitTargetPercent` and `maxDrawdownPercent` are missing from `GET /challenge-attempts`[cite: 18]. Verify if the client joins data with `GET /challenges` to obtain target and drawdown parameters[cite: 18].
- **Baseline Balances:** Verify whether `phaseStartingBalance`, `startingBalance`, and `initialBalance` are populated[cite: 20]. If `phaseStartingBalance` is `0`, `null`, or undefined, `profitTargetPct` will evaluate to `0%`, `NaN`, or fail silently:
  $$\text{profitTargetPct} = \frac{\text{equity} - \text{phaseStartingBalance}}{\text{phaseStartingBalance}} \times 100$$[cite: 20]
- **Trailing vs. Static Drawdown:** Ensure the store correctly handles `drawdownType`:
  - Static: $\text{ref} = \text{startingBalance}$[cite: 20]
  - Trailing: $\text{ref} = \text{highWaterMark}$ (sourced from `account.updated` or calculated from peak equity)[cite: 20]
  $$\text{drawdownUsedPct} = \frac{\max(\text{ref} - \text{equity}, 0)}{\text{startingBalance}} \times 100$$[cite: 20]
- **Decimal Precision:** Check for type coercion bugs between string payloads from the REST/WS API and `Decimal.js` instances[cite: 19, 20].

### 2. Trade Ingestion Pipeline (`GET /accounts/{accountId}/trades` & WS `trade.created`)
Audit `packages/propr-client/src/client.ts` and `services/propr-sync/src/ws-worker.ts`:
- Ensure `getTrades(accountId, params)` correctly queries `/accounts/{accountId}/trades` using valid query parameters (`tradeId`, `positionId`, `orderId`, `base`, `quote`, `side`, `limit`, `offset`)[cite: 18].
- Ensure incoming WebSocket `trade.created` payloads are normalized and appended to the account's trade journal in `services/propr-sync/src/store.ts` without dropping fields (`realizedPnl`, `fee`, `feeRate`, `positionSizeBefore`, `slippage`)[cite: 18, 20].
- Verify that closed trades update cached account balances and realized PnL in the store[cite: 18, 20].

### 3. Historical Account Trade Archive
Audit trade retrieval for closed/breached accounts:
- Check if `GET /accounts/{accountId}/trades` is executed across all accounts discovered in `GET /challenge-attempts` (statuses: `active`, `passed`, `failed`) and `GET /book-account-issuances`[cite: 18].
- Verify pagination logic (`limit`, `offset`) so accounts with high trade volume do not get truncated at the default page limit[cite: 18].
- Verify that historical trade logs are exposed to the UI (e.g., in a dedicated drawer, modal, or table within `apps/terminal/src/app/history/page.tsx`).

---

## Part 2: Automated Audit & Verification Test Suite

Create a comprehensive test file: `tests/integration/account-metrics-and-trades.test.ts`.

Include the following test cases:
1. **Live Metrics Verification:**
   - Seed an active challenge attempt with `initialBalance = 10000`, `startingBalance = 10000`, `phaseStartingBalance = 10000`, `profitTargetPercent = 10`, `maxDrawdownPercent = 5`[cite: 18, 20].
   - Simulate a mark update that drives equity to `$10,400.00`[cite: 20].
   - **Assert:** `profitTargetPct` equals `4.0%` (40% progress toward the 10% target) and `drawdownUsedPct` equals `0%`[cite: 20].
   - Simulate an equity drop to `$9,700.00`[cite: 20].
   - **Assert:** `drawdownUsedPct` equals `3.0%` ($300 of the $500 limit used, or 60% of allowed DD)[cite: 20].

2. **Trade Ingestion Without Live Execution:**
   - Mock a REST response for `GET /accounts/{accountId}/trades` containing multi-asset fills (BTC, ETH, and HIP-3 assets like `xyz:AAPL`) with maker/taker liquidity and non-zero fees[cite: 15, 18].
   - **Assert:** All fields (`fee`, `realizedPnl`, `liquidityType`, `positionSide`) parse cleanly into `Decimal.js` instances[cite: 18, 19].
   - Dispatch a simulated `trade.created` WebSocket message[cite: 20].
   - **Assert:** The store trade log increments, positions reconcile, and realized PnL matches the payload[cite: 18, 20].

3. **Historical Account Reconciliation:**
   - Iterate over multiple accounts with status `failed` (breached via `max_drawdown_hit` or `max_daily_loss_hit`)[cite: 18].
   - Query mocked historical trade endpoints with pagination offsets[cite: 18].
   - **Assert:** All trades render in chronological sequence, total fees calculate accurately, and net realized PnL equals the difference between starting balance and ending balance[cite: 18, 20].

---

## Part 3: Required Output Format

Provide:
1. **Root-Cause Findings:** The exact code paths causing drawdown and profit target values to read as 0% or uncalculated.
2. **Applied Fixes:** Complete diffs or replacement code for modified store functions, calculations, and UI page components.
3. **Test Results:** Terminal output demonstrating all unit and integration tests passing in `tests/integration/account-metrics-and-trades.test.ts`.