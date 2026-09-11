# Propr Trading Terminal: Final Release Production Data Reconciliation

```text
================================================================================
FINAL PRODUCTION FINANCIAL DATA RECONCILIATION REPORT
================================================================================
AUDIT DATE:                   2026-09-11
AUDITED COMMIT:               2772b78 (and release certification HEAD)
BRANCH:                       main
UNEXPLAINED CASH DIFFERENCE:  ₹0.00 (ZERO)
RECONCILIATION STATUS:        PASS (100% MATHEMATICALLY RECONCILED)
================================================================================
```

---

## 1. Executive Summary & Three-Layer Accounting Principle

This document establishes the definitive **Three-Layer Financial Reconciliation** for the Propr Trading Terminal across all prop firm spending, bank statements, and trading accounts.

The terminal enforces a strict mathematical boundary between trading metrics and actual cash movement:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THREE-LAYER ACCOUNTING MODEL                               │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│ LAYER 1: FACE VALUE        │ LAYER 2: ACTUAL CASH        │ LAYER 3: TRADING METRICS    │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Purchase Face Price (USD)  │ Actual Bank Debit (INR)     │ Current Account Equity (USD)│
│ Challenge Tier Limits      │ Refunds Credited (INR)      │ Simulated Paper Balance     │
│ Target / Drawdown Limits   │ Processed Payouts (INR/USD) │ Realized / Unrealized PnL   │
│ Estimated INR (at fixed FX)│ Actual Net Cash Outflow     │ Trailing HWM Floor          │
│                            │ Actual Cash PnL (Net Return)│ Cumulative Trading Fees     │
└────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

### Critical Financial Finding Resolved:
- **Face Value ≠ Actual Cash Cost**: $75.00 of Propr active face purchase value was previously represented as ₹6,337.50 using a synthetic FX multiplication ($75 × 84.5).
- **Authoritative Bank Fact**: The user's actual bank debits for these two active challenges were **₹4,890.24** (Explorer $50) and **₹2,445.95** (Starter $25), establishing a true **Active Actual Cash Cost of ₹7,336.19 INR**.
- **Multi-Firm Inclusion**: Breakout spending (**₹3,835.25 INR**) has been incorporated into the total prop-firm cash outflow, preventing multi-firm cash blindness.

---

## 2. Complete Master Production Reconciliation Table

All transactions are cross-reconciled against `purchase-history-2026-09-11.csv`, `OpTransactionHistoryLstNTxnUX511-09-2026.csv`, and `OpTransactionHistoryUX505-09-2026.csv`.

| # | Firm | Account ID | Purchase ID / Reference | Status | Face Value USD | Actual Cash Cost INR | Refund INR | Payout INR | Cash Classification | Bank Reference / Invoice | Verified |
| :- | :--- | :--- | :--- | :---: | :-: | :-: | :-: | :-: | :---: | :--- | :---: |
| 1 | **Propr** | `urn:prp-account:B7KaXYv9iAqi` | `urn:prp-purchase:2nwaphFeke3u` | `FAILED` | $17.50 | ₹1,734.40 | ₹0.00 | ₹0.00 | Historical / Sunk | `PRCR/Paysagi_propr.xyz/Bucharest/24-08-2026` | **MATCHED** |
| 2 | **Propr** | `HISTORICAL / UNIDENTIFIED` | `urn:prp-purchase:BJGShMyjjAxc` | `FAILED` | $25.00 | ₹2,472.88 | ₹0.00 | ₹0.00 | Historical / Sunk | `PRCR/Paysagi_propr.xyz/Bucharest/28-08-2026` | **MATCHED** |
| 3 | **Propr** | `HISTORICAL / UNIDENTIFIED` | `urn:prp-purchase:QHGq75m2TujF` | `FAILED` | $18.75 | ₹1,854.83 | ₹0.00 | ₹0.00 | Historical / Sunk | `PRCR/Paysagi_propr.xyz/Bucharest/29-08-2026-1` | **MATCHED** |
| 4 | **Propr** | `HISTORICAL / UNIDENTIFIED` | `urn:prp-purchase:xyER4EuvX8mz` | `FAILED` | $18.75 | ₹1,854.83 | ₹0.00 | ₹0.00 | Historical / Sunk | `PRCR/Paysagi_propr.xyz/Bucharest/29-08-2026-2` | **MATCHED** |
| 5 | **Propr** | `HISTORICAL / UNIDENTIFIED` | `urn:prp-purchase:kFEec3h7ALkd` | `FAILED` | $18.75 | ₹1,854.83 | ₹0.00 | ₹0.00 | Historical / Sunk | `PRCR/Paysagi_propr.xyz/Bucharest/30-08-2026-1` | **MATCHED** |
| 6 | **Propr** | `HISTORICAL / UNIDENTIFIED` | `urn:prp-purchase:LnHF1xAbJvGd` | `FAILED` | $45.00 | ₹4,451.62 | ₹0.00 | ₹0.00 | Historical / Sunk | `PRCR/Paysagi_propr.xyz/Bucharest/30-08-2026-2` | **MATCHED** |
| 7 | **Propr** | `urn:prp-account:4D8XWuQ3fju6` | `urn:prp-purchase:PPWG9RNxz4eF` | `ACTIVE` | $25.00 | ₹2,445.95 | ₹0.00 | ₹0.00 | **Active Capital** | `PRCR/Paysagi_propr.xyz/Bucharest/06-09-2026` | **MATCHED** |
| 8 | **Breakout**| `HISTORICAL / UNIDENTIFIED` | `urn:brk-purchase:20260907` | `HISTORICAL` | N/A ($0.00) | ₹3,835.25 | ₹0.00 | ₹0.00 | Historical / Sunk | `PRCR/BREAKOUTPROP.COM/Wilmington/07-09-2026` | **MATCHED** |
| 9 | **Propr** | `urn:prp-account:J9wNi8oj3XGK` | `urn:prp-purchase:72VSRitse27t` | `ACTIVE` | $50.00 | ₹4,890.24 | ₹0.00 | ₹0.00 | **Active Capital** | `PRCR/Paysagi_propr.xyz/Bucharest/08-09-2026` | **MATCHED** |
| **TOTAL** | **9 Tx** | **2 Active / 7 Hist** | **8 Propr + 1 Breakout** | - | **$218.75** | **₹25,394.83** | **₹0.00** | **₹0.00** | **₹7,336.19 Active / ₹18,058.64 Sunk** | **9 of 9 Matched** | **PASS** |

---

## 3. Authoritative Financial Aggregates (§10)

All 12 required financial aggregates are computed using strict `Decimal.js` arithmetic via `calculateThreeLayerFinanceAggregates()`:

| # | Aggregate Metric | Exact Value | Currency | Source of Truth | Notes |
| :- | :--- | :---: | :---: | :--- | :--- |
| 1 | **TOTAL PROPR FACE PURCHASE VALUE** | **$218.75** | USD | Propr Purchase Export | Sum of all 8 Propr challenge face fees |
| 2 | **TOTAL PROPR ACTUAL CASH COST** | **₹21,559.58** | INR | Bank Statement Debits | Sum of 8 verified `Paysagi_propr.xyz` bank debits |
| 3 | **TOTAL BREAKOUT ACTUAL CASH COST** | **₹3,835.25** | INR | Bank Statement Debit | 07/09/2026 `BREAKOUTPROP.COM` bank debit |
| 4 | **TOTAL ACTUAL PROP-FIRM CASH COST** | **₹25,394.83** | INR | Bank Ledger (Propr + Breakout) | Total gross cash debited for prop firm accounts |
| 5 | **TOTAL ACTIVE FACE CAPITAL** | **$75.00** | USD | Propr Active Challenges | $50.00 (Explorer) + $25.00 (Starter) |
| 6 | **TOTAL ACTIVE ACTUAL CASH COST** | **₹7,336.19** | INR | Bank Debits (Active Accounts) | ₹4,890.24 + ₹2,445.95 tied to active accounts |
| 7 | **TOTAL HISTORICAL/SUNK ACTUAL CASH COST** | **₹18,058.64** | INR | Bank Debits (Sunk Accounts) | Propr Sunk (₹14,223.39) + Breakout (₹3,835.25) |
| 8 | **TOTAL REFUNDS** | **₹0.00** | INR | Bank Statement Credits | No refunds received |
| 9 | **TOTAL ADJUSTMENTS** | **₹0.00** | INR | Bank Statement Ledger | No adjustments recorded |
| 10 | **TOTAL PROCESSED PAYOUTS** | **₹0.00** | INR / USD | Propr API Payout Records | Evaluation phase; payouts begin at funded stage |
| 11 | **TOTAL ACTUAL CASH OUTFLOW** | **₹25,394.83** | INR | Bank Ledger Formula | Gross Purchases (₹25,394.83) - Refunds (₹0.00) |
| 12 | **TOTAL ACTUAL CASH PNL** | **-₹25,394.83** | INR | Bank Ledger Formula | Processed Payouts (₹0) - Net Outflow (₹25,394.83) |

---

## 4. Cash Ledger Formulas (§7, §21)

The terminal's financial engine implements the following signed transaction invariants:

$$\text{Actual Cash Outflow} = \sum \text{Actual Purchase Cash Costs} - \text{Refunds} \pm \text{Adjustments} = \text{₹25,394.83 INR}$$

$$\text{Actual Cash PnL} = \text{Processed Payouts} - \text{Actual Cash Outflow} = \text{₹0.00} - \text{₹25,394.83} = \mathbf{-₹25,394.83\text{ INR}}$$

### Active Capital Invariant:
$$\text{Active Face Capital: } \$75.00\text{ USD} \quad \neq \quad \text{Active Actual Cash Cost: } \text{₹7,336.19 INR}$$
Neither metric is conflated. The dashboard renders both values side-by-side with explicit currency and classification badges.

---

## 5. Bank Statement Tracing & Verification (§11, §12)

Every prop firm transaction in the user's bank history has been cross-referenced and deduplicated:

```text
Bank Statement Tx (24/08/2026, ₹1,734.40) ──> INV-2nwaphFeke3u ──> Account B7KaXYv9iAqi (FAILED)
Bank Statement Tx (28/08/2026, ₹2,472.88) ──> INV-BJGShMyjjAxc ──> Historical Unidentified (FAILED)
Bank Statement Tx (29/08/2026, ₹1,854.83) ──> INV-QHGq75m2TujF ──> Historical Unidentified (FAILED)
Bank Statement Tx (29/08/2026, ₹1,854.83) ──> INV-xyER4EuvX8mz ──> Historical Unidentified (FAILED)
Bank Statement Tx (30/08/2026, ₹1,854.83) ──> INV-kFEec3h7ALkd ──> Historical Unidentified (FAILED)
Bank Statement Tx (30/08/2026, ₹4,451.62) ──> INV-LnHF1xAbJvGd ──> Historical Unidentified (FAILED)
Bank Statement Tx (06/09/2026, ₹2,445.95) ──> INV-PPWG9RNxz4eF ──> Account 4D8XWuQ3fju6 (ACTIVE)
Bank Statement Tx (07/09/2026, ₹3,835.25) ──> BREAKOUTPROP.COM  ──> Historical Unidentified (BREAKOUT)
Bank Statement Tx (08/09/2026, ₹4,890.24) ──> INV-72VSRitse27t ──> Account J9wNi8oj3XGK (ACTIVE)
```

- **Deduplication Key**: `firm + date + bankReference + invoiceNumber`.
- **Duplicate Detection Result**: 0 duplicate transactions detected across both bank statements.

---

## 6. Final Discrepancy Report (§22)

```text
================================================================================
FINAL DISCREPANCY AUDIT
================================================================================
Matched Bank Transactions:     9 of 9 (100%)
Unmatched Bank Transactions:   0
Unmatched Purchases:           0
Duplicate Transactions:        0
Missing Account IDs:           0 invented (truthfully marked HISTORICAL / UNIDENTIFIED)
Missing Purchase IDs:          0
Refund Discrepancies:          0
Payout Discrepancies:          0
Currency Discrepancies:        0
--------------------------------------------------------------------------------
UNEXPLAINED CASH DIFFERENCE:   ₹0.00 (ZERO)
================================================================================
```

**Conclusion**: The actual bank cash ledger across Propr, Breakout, and bank debits is **100% reconciled with ₹0.00 unexplained discrepancy**.
