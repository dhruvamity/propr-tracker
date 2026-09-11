# TASK: Complete Audit & Verification of Propr API Integrations

You are an expert systems auditor and QA engineer. Your objective is to audit every Propr API integration, data transformer, calculation package, and UI data feed across this repository (`propr-tracker`). 

Ensure every endpoint, WebSocket subscriber, and calculation accurately reflects the official Propr API specification. Verify that zero production pathways rely on hardcoded data, mock fallbacks, or lossy IEEE-754 floating-point arithmetic.

---

## 1. Audit Scope & File Targets

Audit the following core directories:
- `packages/propr-client/src/` (HTTP Client, headers, error handling)
- `services/propr-sync/src/` (WebSocket worker, event normalizer, state store)
- `packages/calculations/src/` (Equity, PnL, risk, drawdown, and lifecycle engines)
- `packages/data-model/src/` (Zod schemas, Decimal types, and enum validations)
- `packages/finance/src/` (Ledger, currency conversions, and purchase records)
- `apps/terminal/src/` (UI data bindings, server actions, route handlers, and state hooks)

---

## 2. Verification Checklist by System Component

### A. Propr REST Client (`packages/propr-client`)
Audit every REST request against official contracts:
1. **Authentication & Headers:**
   - Verify all authenticated endpoints send `X-API-Key: pk_live_*`[cite: 9].
   - Verify builder attribution sends `X-Builder-Code: builder_*` when configured[cite: 5].
   - Ensure the API key is never bundled into client-side JS (`NEXT_PUBLIC_` leak check)[cite: 9].
2. **Endpoint Implementations:**
   - `GET /health` and `GET /health/services`[cite: 9]
   - `GET /users/me`[cite: 9]
   - `GET /challenges`[cite: 6]
   - `GET /challenge-attempts` and `GET /challenge-attempts/{attemptId}` (Paper accounts)[cite: 6]
   - `GET /book-account-issuances` and `GET /book-account-issuances/{issuanceId}` (b-book / a-book funded accounts)[cite: 6]
   - `GET /accounts/{accountId}/positions`[cite: 6]
   - `GET /accounts/{accountId}/orders` and `POST /accounts/{accountId}/orders`[cite: 6]
   - `POST /accounts/{accountId}/orders/{orderId}/cancel` (Must accept status `201` as success)[cite: 6]
   - `GET /accounts/{accountId}/trades`[cite: 6]
   - `GET /accounts/{accountId}/margin-config/{asset}` and `PUT /accounts/{accountId}/margin-config/{configId}`[cite: 3]
   - `GET /leverage-limits/effective`[cite: 3]
   - `GET /wallet/credentials` and `GET /payouts/history`[cite: 10]
3. **Response Handling Invariants:**
   - Ensure `POST /orders/{orderId}/cancel` treats HTTP 201 and 200 as successful cancellations[cite: 6].
   - Confirm query params for `/orders` use exact enums (`status=open`, `status=pending`), never invalid values like `status=active` or `status=triggered`[cite: 6].
   - Ensure asset tickers for HIP-3 assets enforce the `xyz:` prefix (e.g., `xyz:AAPL`, `xyz:GOLD`)[cite: 3].

### B. WebSocket Pipeline (`services/propr-sync`)
1. **Connection & Lifecycle:**
   - Endpoint: `wss://api.propr.xyz/ws` with `X-API-Key`[cite: 8].
   - Handles the initial `{ type: "connected", data: { userId } }` frame[cite: 8].
   - Maintains a 20-second ping/heartbeat monitor with automatic reconnect[cite: 8].
2. **Event Normalization (All 15 Events):**
   - Verify distinct handlers for: `mark.updated`, `account.updated`, `order.created`, `order.updated`, `order.cancelled`, `order.triggered`, `order.filled`, `order.partially_filled`, `position.opened`, `position.updated`, `position.closed`, `position.liquidated`, `position.take_profit.hit`, `position.stop_loss.hit`, `trade.created`[cite: 8].
3. **State Invariants:**
   - **Zero-Quantity Ghost Positions:** When `position.closed` or `GET /positions` returns `quantity: "0"`, confirm it is filtered out of active views[cite: 6, 7].
   - **Batch Mark Updates:** Verify `mark.updated` correctly updates state for multiple assets across exchanges without dropping unmentioned assets[cite: 8].

### C. Financial & Risk Calculations (`packages/calculations`)
Verify that every equation uses `Decimal.js` or exact BigNumber equivalents:
1. **Unrealized PnL:**
   - Formula: $\text{sign} \times \text{quantity} \times (\text{markPrice} - \text{entryPrice})$, where Long $= 1$ and Short $= -1$[cite: 8].
2. **Equity:**
   - Formula: $\text{balance} + \text{totalUpnl} + \text{isolatedPositionMargin}$[cite: 8].
3. **Drawdown Calculation:**
   - **Static:** $\text{ddLimit} = \text{initialBalance} - (\frac{\text{maxDrawdownPercent}}{100} \times \text{initialBalance})$[cite: 8].
   - **Trailing:** $\text{ddLimit} = \min(\text{highWaterMark} - \text{ddAmount}, \text{initialBalance})$[cite: 8].
   - Drawdown used %: $\frac{\max(\text{ref} - \text{equity}, 0)}{\text{startingBalance}} \times 100$[cite: 8].
4. **Daily Loss Base:**
   - Base $= \text{startingBalance} + \text{startingIsolatedPositionMargin}$[cite: 8].
   - Daily limit $= \text{dailyLossBase} - (\frac{\text{maxDailyLossPercent}}{100} \times \text{dailyLossBase})$[cite: 8].
5. **Liquidation Prices:**
   - MMR $= 0.005$ ($0.5\%$)[cite: 8].
   - Verify isolated vs. cross margin liquidation formulas match the Propr specification exactly[cite: 8].

### D. Hardcoded Data & Mock Leak Audit
Search the repository for any fake data, dummy values, or test fixture leaks in production paths:
1. Scan for hardcoded account strings, mock balances (e.g., `$10,000.00`, `$5,000.00`), dummy IDs (`urn:prp-account:xyz`, `01KJJ...`), or static dates.
2. Check `apps/terminal/src/lib/` and `src/app/` to ensure page components consume data from the store or client API, not directly from `tests/fixtures/`.
3. Verify that empty states render clean UI rather than fallback mock arrays.

---

## 3. Required Deliverables

1. **Static Code Audit Report:**
   - List any missing endpoints, invalid enum queries, or payload mismatches.
   - List any hardcoded fallbacks or floating-point math leaks found.
2. **Automated Audit Test Suite:**
   - Create or run an integration test script `tests/contracts/api-audit.test.ts` that mocks external responses with edge cases (boundary liquidation values, fractional fees, 0-quantity positions, HTTP 201 cancel responses) and asserts calculation parity.
3. **Remediation Plan:**
   - For every discrepancy found, provide the exact file path, line numbers, and the precise code patch needed to fix it.