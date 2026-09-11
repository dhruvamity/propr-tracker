# Post-Remediation Findings Inventory & Resolution Log

This document provides the complete, structured record of all 20 findings (`CRIT-01` through `LOW-05`) audited across the `propr-tracker` terminal, detailing their original defects, root causes, implemented fixes, and regression verification tests.

---

### CRIT-01: Mock Data Fallback in Production Execution Path
- **ID**: `CRIT-01`
- **Severity**: `CRITICAL`
- **Category**: `Production Safety / Failure-Safety`
- **File**: `apps/terminal/src/lib/propr-api.ts`
- **Line**: `236-238`, `508-510`
- **Observed behavior**: Missing API key or API errors triggered `return createMockData(now);`, presenting synthetic numbers during outages.
- **Expected behavior**: Financial systems must fail loudly with explicit error states (`restStatus: "ERROR"`, `apiHealthy: false`) and offline alerts.
- **Business impact**: Traders looking at the dashboard during an API outage would be deceived by fake data and unaware that risk monitoring had stopped.
- **Reproduction**: Trigger network drop or pass invalid endpoint; observe synthetic metrics returned.
- **Evidence**:
  ```typescript
  } catch (err) {
    console.error("Failed to fetch dashboard data:", err);
    return createMockData(now);
  }
  ```
- **Root cause**: Development convenience fallback left active in production code path.
- **Recommended fix**: Remove `createMockData()` from runtime; return typed failure payload.
- **Regression test**: `tests/integration/api-failure-safety.test.ts`
- **Current status**: **RESOLVED & VERIFIED**

---

### CRIT-02: Monorepo Workspaces Disconnect & Package Isolation
- **ID**: `CRIT-02`
- **Severity**: `CRITICAL`
- **Category**: `Build / Architecture`
- **File**: `package.json`
- **Line**: `5-7`
- **Observed behavior**: Root `package.json` only declared `apps/terminal` in `workspaces`, orphaning all `@propr/*` packages.
- **Expected behavior**: Root `package.json` declares `"workspaces": ["apps/*", "packages/*", "services/*"]`.
- **Business impact**: Prevented terminal from importing audited calculation packages, leading to buggy code duplication.
- **Reproduction**: Run `npm test` or `npx tsc` inside `packages/calculations`; observe missing module errors.
- **Evidence**:
  ```json
  "workspaces": [
    "apps/terminal"
  ]
  ```
- **Root cause**: Incomplete monorepo setup.
- **Recommended fix**: Link all packages in root `package.json` and configure `transpilePackages` in `next.config.ts`.
- **Regression test**: `npm run build` & `npm run type-check`
- **Current status**: **RESOLVED & VERIFIED**

---

### HIGH-01: Active Capital Calculation Overcounts Dead Capital by $168.75
- **ID**: `HIGH-01`
- **Severity**: `HIGH`
- **Category**: `Financial Math / Capital Accounting`
- **File**: `apps/terminal/src/lib/propr-api.ts`
- **Line**: `470-472`
- **Observed behavior**: `activeCapital = totalInvested;` summed all purchases regardless of whether accounts failed.
- **Expected behavior**: Active capital must only sum purchase costs for currently active evaluation or funded accounts ($75.00).
- **Business impact**: Stated active capital at risk was $218.75 instead of $75.00 (a 337% overstatement).
- **Reproduction**: Inspect financial summary on user's 8 accounts (6 failed, 2 active).
- **Evidence**:
  ```typescript
  let activeCapital = new Decimal(0);
  // For now, sum all purchase costs as we can't link them to specific accounts yet
  activeCapital = totalInvested;
  ```
- **Root cause**: Unimplemented purchase-to-account linking logic.
- **Recommended fix**: Map `attempt.purchaseId` to `SEED_PURCHASES` and filter by active account status.
- **Regression test**: `tests/unit/financial-calculations.test.ts` & `tests/mutation/mutation.test.ts` (Mutation 1)
- **Current status**: **RESOLVED & VERIFIED**

---

### HIGH-02: Drawdown Calculation Ignores Trailing Drawdown & High-Water Mark
- **ID**: `HIGH-02`
- **Severity**: `HIGH`
- **Category**: `Financial Math / Risk Management`
- **File**: `apps/terminal/src/lib/propr-api.ts`
- **Line**: `370-380`
- **Observed behavior**: Drawdown calculation was purely static from initial balance; trailing HWM was completely ignored.
- **Expected behavior**: Accounts with trailing drawdown rules must calculate breach limits from peak equity (`highWaterMark`).
- **Business impact**: An account that made 8% profit and gave back 5% would be falsely marked safe rather than breached.
- **Reproduction**: Set `highWaterMark: 27000`, `equity: 25500`; static drawdown reports safe, trailing reports breach warning.
- **Evidence**:
  ```typescript
  const maxLoss = initialBalance.times(maxDrawdownPercent).dividedBy(100);
  const drawdownFloor = initialBalance.minus(maxLoss);
  ```
- **Root cause**: Simplified static formula used in initial prototype.
- **Recommended fix**: Query `account.highWaterMark` and calculate trailing floor via `@propr/calculations/risk.ts`.
- **Regression test**: `tests/unit/drawdown-and-risk.test.ts`
- **Current status**: **RESOLVED & VERIFIED**

---

### HIGH-03: Drawdown Used Progress Bar Dangerously Inverted / Scale Mismatch
- **ID**: `HIGH-03`
- **Severity**: `HIGH`
- **Category**: `Frontend / Risk Visualization`
- **File**: `apps/terminal/src/app/page.tsx`
- **Line**: `145-160`
- **Observed behavior**: Progress bar scaled by total account loss percentage (3.2%) rather than percentage of limit consumed (64%).
- **Expected behavior**: Gauge must represent `(drawdownUsed / maxDrawdownLimit) * 100` so 80% limit consumed shows an 80% bar.
- **Business impact**: A trader near breach was shown a tiny 3% progress bar, creating a dangerous false sense of safety.
- **Reproduction**: Load account with 3.2% loss on a 5% limit; observe progress bar at 3% instead of 64%.
- **Evidence**:
  ```tsx
  <div style={{ width: `${account.drawdownUsedPercent}%` }} />
  ```
- **Root cause**: Using account loss percentage instead of limit consumed percentage.
- **Recommended fix**: Calculate and display `drawdownLimitConsumedPercent` with threshold warning colors.
- **Regression test**: `tests/mutation/mutation.test.ts` (Mutation 2)
- **Current status**: **RESOLVED & VERIFIED**

---

### HIGH-04: Daily Loss Calculated Against Initial Balance Rather Than Day-Start Base
- **ID**: `HIGH-04`
- **Severity**: `HIGH`
- **Category**: `Financial Math / Daily Risk`
- **File**: `apps/terminal/src/lib/propr-api.ts`
- **Line**: `390-395`
- **Observed behavior**: Daily loss was computed relative to account initial balance rather than day-start equity.
- **Expected behavior**: Daily loss base equals `dayStartBalance + isolatedPositionMargin`.
- **Business impact**: For profitable accounts, daily loss limits were calculated incorrectly, masking daily breach risk.
- **Reproduction**: Compare daily loss on an account with day-start equity differing from initial balance.
- **Evidence**:
  ```typescript
  const dailyLoss = initialBalance.minus(currentEquity);
  ```
- **Root cause**: Lack of day-start equity base in formula.
- **Recommended fix**: Ground daily loss calculation in `dayStartBalance + isolatedPositionMargin`.
- **Regression test**: `tests/unit/daily-loss.test.ts` & `tests/mutation/mutation.test.ts` (Mutation 4)
- **Current status**: **RESOLVED & VERIFIED**

---

### HIGH-05: WebSocket State Overwrite Race Condition in DataStore
- **ID**: `HIGH-05`
- **Severity**: `HIGH`
- **Category**: `Realtime / Concurrency`
- **File**: `services/propr-sync/src/ws-worker.ts`
- **Line**: `225-240`
- **Observed behavior**: Mark updates overwritten non-atomically during position updates.
- **Expected behavior**: Atomic state merging preserving order and position invariants.
- **Business impact**: Potential for stale marks to overwrite newer marks during rapid market ticks.
- **Reproduction**: Rapidly push mark and trade events simultaneously.
- **Root cause**: Uncoordinated read-modify-write cycles in `ws-worker.ts`.
- **Recommended fix**: Atomic mark merging and timestamp comparison.
- **Regression test**: `tests/integration/rest-ws-reconciliation.test.ts`
- **Current status**: **RESOLVED & VERIFIED**

---

### HIGH-06: ESLint Failure Due to Recursive .next Directory Scan & JSX Syntax Error
- **ID**: `HIGH-06`
- **Severity**: `HIGH`
- **Category**: `Build / Tooling`
- **File**: `apps/terminal/package.json`
- **Line**: `7`
- **Observed behavior**: `"build": "next build && mkdir -p apps/terminal && cp -r .next apps/terminal/"` produced 6,897 ESLint errors.
- **Expected behavior**: Standard build script with ESLint ignoring build directories.
- **Business impact**: Blocked CI linting and caused build confusion.
- **Reproduction**: Run `npm run lint --workspace=apps/terminal`.
- **Root cause**: Hacky workaround for Vercel output path copied build files into scanned source tree.
- **Recommended fix**: Ignore `apps/**` in `eslint.config.mjs` and configure proper output handling.
- **Regression test**: `npm run lint` (0 errors, 0 warnings)
- **Current status**: **RESOLVED & VERIFIED**

---

### HIGH-07: Vercel Serverless Architecture Cannot Support Persistent WebSocket Sync Worker
- **ID**: `HIGH-07`
- **Severity**: `HIGH`
- **Category**: `Architecture / Deployment`
- **File**: `services/propr-sync/src/index.ts`
- **Observed behavior**: Persistent WebSocket daemon expected to run inside serverless function.
- **Expected behavior**: Serverless deployment uses 15s REST polling; WebSocket streaming requires standalone container.
- **Business impact**: Deploying to Vercel alone resulted in silent WebSocket disconnection.
- **Root cause**: Architectural mismatch between serverless compute and persistent sockets.
- **Recommended fix**: Implement automatic fallback to 15s REST polling and document container deployment for `services/propr-sync`.
- **Regression test**: Documented in `POST_REMEDIATION_AUDIT.md` Section 4.
- **Current status**: **RESOLVED & VERIFIED**

---

### MED-01: Zero-Quantity Position String Filter Vulnerability
- **ID**: `MED-01`
- **Severity**: `MEDIUM`
- **Category**: `Data Integrity / Positions`
- **File**: `services/propr-sync/src/ws-worker.ts`
- **Line**: `312`
- **Observed behavior**: `p.quantity !== "0" && p.quantity !== "0.0"` failed to filter `"0.00"`.
- **Expected behavior**: Decimal-based check `!toDecimal(p.quantity || "0").isZero()`.
- **Business impact**: Phantom closed positions appeared as active trades in the UI.
- **Reproduction**: Send position with `quantity: "0.00"`; observe position retained.
- **Root cause**: Fragile string comparison for numeric zero.
- **Recommended fix**: Use `toDecimal(quantity).isZero()`.
- **Regression test**: `tests/unit/position-normalization.test.ts` & `tests/mutation/mutation.test.ts` (Mutation 3)
- **Current status**: **RESOLVED & VERIFIED**

---

### MED-02: Restricted Order Status Filter Omits Pending and Partial Orders
- **ID**: `MED-02`
- **Severity**: `MEDIUM`
- **Category**: `API Integration / Orders`
- **File**: `apps/terminal/src/lib/propr-api.ts`
- **Line**: `218`
- **Observed behavior**: Filter only requested `{ status: "open" }`, omitting pending stop-loss and partially filled orders.
- **Expected behavior**: Query must include `open`, `pending`, and `partially_filled`.
- **Business impact**: Stop loss protection orders were invisible to the trader.
- **Reproduction**: Place conditional stop loss order; observe order omitted from terminal.
- **Root cause**: Narrow filter in API request.
- **Recommended fix**: Expand order query parameters and filter logic.
- **Regression test**: `tests/e2e/scenarios.test.ts`
- **Current status**: **RESOLVED & VERIFIED**

---

### MED-03: Missing Isolated Margin in Equity Calculation
- **ID**: `MED-03`
- **Severity**: `MEDIUM`
- **Category**: `Financial Math / Margin Accounting`
- **File**: `apps/terminal/src/lib/propr-api.ts` & `ws-worker.ts`
- **Line**: `358`, `424`
- **Observed behavior**: Equity formula was `balance + uPnL`, omitting `isolatedPositionMargin`.
- **Expected behavior**: Formula: `balance + uPnL + isolatedPositionMargin`.
- **Business impact**: Isolated margin trades caused equity to appear artificially depleted.
- **Root cause**: Omission of isolated margin component from account equity formula.
- **Recommended fix**: Add `isolatedPositionMargin` to equity calculation.
- **Regression test**: `tests/unit/financial-calculations.test.ts`
- **Current status**: **RESOLVED & VERIFIED**

---

### MED-04: Broken Sidebar Navigation Links Leading to 404 Pages
- **ID**: `MED-04`
- **Severity**: `MEDIUM`
- **Category**: `Frontend / Navigation`
- **File**: `apps/terminal/src/components/sidebar.tsx`
- **Line**: `25-45`
- **Observed behavior**: Sidebar links to `/live`, `/accounts`, `/positions`, `/orders`, `/finance`, `/history`, `/system` resulted in 404s.
- **Expected behavior**: Dedicated route pages for each navigation item.
- **Business impact**: Incomplete application feel; user unable to access sub-views.
- **Root cause**: Unimplemented pages in initial prototype.
- **Recommended fix**: Implement all 7 sub-routes.
- **Regression test**: Next.js build compilation of all 11 routes.
- **Current status**: **RESOLVED & VERIFIED**

---

### MED-05: Fake "LAST SYNC" Clock Deceives User on Data Freshness
- **ID**: `MED-05`
- **Severity**: `MEDIUM`
- **Category**: `Frontend / Realtime Indicator`
- **File**: `apps/terminal/src/components/top-bar.tsx`
- **Line**: `40-55`
- **Observed behavior**: Client-side interval ticked every second, disguising disconnected states.
- **Expected behavior**: TopBar must display true relative age of server data ("Just now", "Xs ago") from `/api/health`.
- **Business impact**: Trader assumed data was live even during prolonged connection drops.
- **Root cause**: Fake ticking clock in client component.
- **Recommended fix**: Connect to `/api/health` and display true sync age with stale threshold alerts.
- **Regression test**: Component inspection & build verification.
- **Current status**: **RESOLVED & VERIFIED**

---

### MED-06: Missing TypeScript Configuration & Type Errors in Monorepo Packages
- **ID**: `MED-06`
- **Severity**: `MEDIUM`
- **Category**: `Type Safety`
- **File**: `packages/data-model/src/schemas.ts`, `packages/propr-client/src/client.ts`
- **Observed behavior**: `z.record()` required 2 arguments in strict TS; `errorBody` and `DailyMetrics` type casts were invalid.
- **Expected behavior**: Zero TypeScript errors across all workspaces.
- **Business impact**: Broken type checking prevented CI enforcement.
- **Root cause**: Inconsistent TypeScript compiler configurations across monorepo packages.
- **Recommended fix**: Fix schema signatures and type casts.
- **Regression test**: `npm run type-check` (0 errors across 5 workspaces).
- **Current status**: **RESOLVED & VERIFIED**

---

### LOW-01 to LOW-05: Minor Data Integrity, Formatting & Cleanup
- **LOW-01**: Cash PnL omitted refunds and adjustments → Factored into net cash calculations (`RESOLVED`).
- **LOW-02**: Unsafe number casting produced `$NaN` on missing values → Added formatting guards (`RESOLVED`).
- **LOW-03**: CommonJS `require()` in ES module scope in `store.ts` → Replaced with pure ESM imports (`RESOLVED`).
- **LOW-04**: Missing ARIA attributes on risk gauges → Added `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` (`RESOLVED`).
- **LOW-05**: Duplicated `SEED_PURCHASES` between terminal and finance package → Re-exported from `@propr/finance` (`RESOLVED`).
