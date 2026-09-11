# Post-Remediation Test Report

```text
SUITE RUNNER: Vitest v3.2.7
TOTAL TEST FILES: 16
TOTAL TESTS: 83
PASSED: 83 (100%)
FAILED: 0
DURATION: 622ms
EXECUTION DATE: 2026-09-11
```

---

## 1. Test Suite Architecture & Coverage Matrix

The test suite is partitioned into 7 distinct testing disciplines under `tests/` and `packages/`:

| Discipline | Suite File | Tests | Focus / Covered Invariants |
| :--- | :--- | :---: | :--- |
| **Unit** | `tests/unit/account-discovery.test.ts` | 4 | Canonical account discovery, multi-account isolation, deduplication. |
| **Unit** | `tests/unit/account-lifecycle.test.ts` | 3 | State transitions (`PURCHASED` → `EVALUATION` → `PASSED` → `FUNDED` → `CLOSED`). |
| **Unit** | `tests/unit/position-normalization.test.ts` | 3 | Decimal parsing, zero-quantity string filtering (`"0"`, `"0.0"`, `"0.00"`). |
| **Unit** | `tests/unit/drawdown-and-risk.test.ts` | 3 | Static & trailing drawdown, high-water mark tracking, profit target. |
| **Unit** | `tests/unit/daily-loss.test.ts` | 1 | Day-start balance base + isolated position margin. |
| **Unit** | `tests/unit/financial-calculations.test.ts` | 3 | Active capital calculation linking `purchaseId`, net cash PnL, INR conversion. |
| **Unit** | `tests/unit/payouts-and-cash-pnl.test.ts` | 3 | Processed vs pending payouts, refunds and adjustments accounting. |
| **Unit** | `tests/unit/secret-exposure.test.ts` | 2 | Secret security asserting `PROPR_API_KEY` never reaches client bundles. |
| **Integration**| `tests/integration/rest-ws-reconciliation.test.ts`| 3 | WebSocket reconnect, deduplication of trade events, REST reconciliation authority. |
| **Integration**| `tests/integration/multi-account-isolation.test.ts`| 1 | Independent account state mutations ensuring zero cross-talk. |
| **Integration**| `tests/integration/api-failure-safety.test.ts` | 2 | Explicit failure-safe states (`SYNC ERROR`, `OFFLINE`) with zero mock data. |
| **E2E** | `tests/e2e/scenarios.test.ts` | 6 | Scenarios A through F (evaluations, live trading, passing, failing, payouts, WS reconnect). |
| **Packages** | `packages/calculations/src/__tests__/calculations.test.ts`| 33 | Pure mathematical engine (MMR, PnL, leverage, ROE, breach price, liquidation). |
| **Adversarial**| `tests/adversarial/adversarial.test.ts` | 6 | Extreme price spikes ($10M BTC), micro-quantities, negative equity, division-by-zero. |
| **Mutation** | `tests/mutation/mutation.test.ts` | 4 | Proves test suite detects re-introduced historical bugs (Active capital, Drawdown gauge, Zero qty, Daily loss). |
| **Contracts** | `tests/contracts/api-contracts.test.ts` | 6 | Zod schema validation against Propr API responses (attempts, issuances, positions, orders, payouts). |
| **TOTAL** | **16 Test Files** | **83** | **83 Passed / 0 Failed (100% Success)** |

---

## 2. Mutation Testing Verification (§3)

To ensure that the test suite does not produce "false-green" results, `tests/mutation/mutation.test.ts` deliberately introduces the historical code defects to verify detection:

### Mutation 1: Active Capital Sunk Cost Bug
- **Mutated Logic**: Sums all historical purchase costs regardless of whether accounts failed ($218.75).
- **Correct Logic**: Filters for active evaluation/funded status ($75.00).
- **Result**: **DETECTED**. Mutated calculation yields $218.75, which fails the $75.00 assertion.

### Mutation 2: Drawdown Progress Bar Inversion
- **Mutated Logic**: Scales gauge by percentage of total account balance lost (3.2%).
- **Correct Logic**: Scales gauge by percentage of allowable drawdown buffer consumed (64.0%).
- **Result**: **DETECTED**. Mutated percentage (3.2%) fails the 64.0% consumed assertion.

### Mutation 3: Zero-Quantity String Normalization Bug
- **Mutated Logic**: Uses string equality `p.quantity !== "0" && p.quantity !== "0.0"`.
- **Correct Logic**: Uses Decimal zero check `!toDecimal(p.quantity || "0").isZero()`.
- **Result**: **DETECTED**. When encountering `"0.00"`, the mutated filter retains 2 positions instead of 1, failing the count assertion.

### Mutation 4: Daily Loss Base Flaw
- **Mutated Logic**: Daily loss base equals initial balance alone.
- **Correct Logic**: Daily loss base equals day-start balance plus isolated position margin.
- **Result**: **DETECTED**. Mutated calculation underreports daily loss by $2,500.00, failing the invariant test.

---

## 3. Adversarial Testing Verification (§47)

`tests/adversarial/adversarial.test.ts` stress-tests the mathematical and data models under extreme boundary conditions:

1. **Market Spike Protection**: Injected a 16,500% price spike (BTC from $60k to $10M). Unrealized PnL computed cleanly to $4,970,000 without IEEE-754 overflow, NaN, or Infinity.
2. **Micro-Quantities**: Injected $0.00000001 BTC position. Calculations maintained exact Decimal precision without rounding to zero.
3. **Negative Equity Handling**: Injected catastrophic position losses exceeding account balance. Equity safely evaluated to -$4,000 without crashing.
4. **Division-by-Zero Protection**: Injected starting balance = 0 in drawdown calculations; functions safely clamped to 0 without returning `Infinity` or throwing.
5. **Trailing Floor Clamping**: Verified that when profits increase equity significantly, the trailing drawdown floor accurately caps at initial balance per Propr challenge rules.

---

## 4. API Contract Conformance (§48)

`tests/contracts/api-contracts.test.ts` verifies runtime Zod schemas against real and synthetic Propr payloads:
- Validated all 8 challenge attempts in `tests/fixtures/challenge-attempts.json`.
- Validated funded issuances in `tests/fixtures/book-account-issuances.json`.
- Validated position and order payloads in `tests/fixtures/positions.json` and `tests/fixtures/orders.json`.
- Validated payout history in `tests/fixtures/payouts.json`.
- Confirmed that corrupting required fields (e.g. stripping `attemptId`) immediately triggers a loud schema validation failure.

---

## 5. How to Run the Test Suite

```bash
# Run entire test suite (all 16 files, 83 tests)
npm test

# Run specific mutation tests
npx vitest run tests/mutation/

# Run adversarial tests
npx vitest run tests/adversarial/

# Run API contract schema tests
npx vitest run tests/contracts/
```
