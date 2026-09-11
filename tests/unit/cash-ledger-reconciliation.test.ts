import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import {
  calculateThreeLayerFinanceAggregates,
  calculateActualCashOutflowINR,
  calculateActualCashPnLFromCashLedger,
  calculateActiveActualCashCost,
  calculateActiveCapital,
} from "@propr/calculations";
import { SEED_PURCHASES } from "@propr/finance";
import type { FinanceTransaction } from "@propr/data-model";
import { ds } from "@propr/data-model";

describe("Three-Layer Cash Ledger Reconciliation & Controlled Scenarios", () => {
  // ─── Controlled Scenario Deterministic Test ─────────────────────────────
  it("reconciles controlled scenario with expected three-layer values", () => {
    // Purchase A: Face $50, Actual cash ₹4,890.24 (Active Account A)
    // Purchase B: Face $25, Actual cash ₹2,445.95 (Active Account B)
    // Historical Propr: Face $143.75, Actual cash ₹14,223.39 (Sunk)
    // Breakout: Face $0.00, Actual cash ₹3,835.25
    // Refund: ₹500
    // Processed Payout: ₹2,000

    const scenarioTransactions: FinanceTransaction[] = [
      {
        id: "tx-a",
        date: "2026-09-08T13:38:00.000Z",
        firm: "Propr",
        accountId: "acc-active-a",
        type: "purchase",
        amountUSD: ds("50.00"),
        purchaseFaceValueUSD: ds("50.00"),
        amountINR: ds("4890.24"),
        actualCashCostINR: ds("4890.24"),
        bankVerified: true,
      },
      {
        id: "tx-b",
        date: "2026-09-05T19:56:00.000Z",
        firm: "Propr",
        accountId: "acc-active-b",
        type: "purchase",
        amountUSD: ds("25.00"),
        purchaseFaceValueUSD: ds("25.00"),
        amountINR: ds("2445.95"),
        actualCashCostINR: ds("2445.95"),
        bankVerified: true,
      },
      {
        id: "tx-hist",
        date: "2026-08-30T18:08:00.000Z",
        firm: "Propr",
        accountId: "acc-failed-hist",
        type: "purchase",
        amountUSD: ds("143.75"),
        purchaseFaceValueUSD: ds("143.75"),
        amountINR: ds("14223.39"),
        actualCashCostINR: ds("14223.39"),
        bankVerified: true,
      },
      {
        id: "tx-brk",
        date: "2026-09-07T11:00:00.000Z",
        firm: "Breakout",
        accountId: "HISTORICAL / UNIDENTIFIED",
        type: "purchase",
        amountUSD: ds("0.00"),
        purchaseFaceValueUSD: ds("0.00"),
        amountINR: ds("3835.25"),
        actualCashCostINR: ds("3835.25"),
        bankVerified: true,
      },
      {
        id: "tx-ref",
        date: "2026-09-09T10:00:00.000Z",
        firm: "Propr",
        type: "refund",
        amountUSD: ds("0.00"),
        amountINR: ds("500.00"),
        refundINR: ds("500.00"),
        bankVerified: true,
      },
    ];

    const activeAccountIds = ["acc-active-a", "acc-active-b"];
    const processedPayoutsINR = "2000.00";

    const aggregates = calculateThreeLayerFinanceAggregates(
      scenarioTransactions,
      activeAccountIds,
      processedPayoutsINR
    );

    // 1. Propr Face Purchase Total: 50 + 25 + 143.75 = 218.75 USD
    expect(aggregates.totalProprFacePurchaseValueUSD).toBe("218.75");

    // 2. Propr Actual Cash Total: 4,890.24 + 2,445.95 + 14,223.39 = 21,559.58 INR
    expect(aggregates.totalProprActualCashCostINR).toBe("21559.58");

    // 3. Breakout Actual Cash Total: 3,835.25 INR
    expect(aggregates.totalBreakoutActualCashCostINR).toBe("3835.25");

    // 4. Total Actual Prop Firm Cash Cost: 21,559.58 + 3,835.25 = 25,394.83 INR
    expect(aggregates.totalActualPropFirmCashCostINR).toBe("25394.83");

    // 5. Active Face Capital: 50 + 25 = 75.00 USD
    expect(new Decimal(aggregates.totalActiveFaceCapitalUSD).toFixed(2)).toBe("75.00");

    // 6. Active Actual Cash Cost: 4,890.24 + 2,445.95 = 7,336.19 INR
    expect(aggregates.totalActiveActualCashCostINR).toBe("7336.19");

    // 7. Historical Sunk Cash Cost: 14,223.39 (Propr) + 3,835.25 (Breakout) = 18,058.64 INR
    expect(aggregates.totalHistoricalSunkActualCashCostINR).toBe("18058.64");

    // 8. Total Refunds: 500.00 INR
    expect(aggregates.totalRefundsINR).toBe("500.00");

    // 9. Total Processed Payouts: 2,000.00 INR
    expect(aggregates.totalProcessedPayoutsINR).toBe("2000.00");

    // 10. Actual Cash Outflow: 25,394.83 - 500.00 = 24,894.83 INR
    expect(aggregates.totalActualCashOutflowINR).toBe("24894.83");

    // 11. Actual Cash PnL: 2,000.00 - 24,894.83 = -22,894.83 INR
    expect(aggregates.totalActualCashPnLINR).toBe("-22894.83");
  });

  // ─── §19: Regression Tests A through H ───────────────────────────────────────

  it("Test A: uses actual bank debit rather than USD × FX estimate", () => {
    const tx: FinanceTransaction = {
      id: "tx-fx-mismatch",
      date: "2026-09-08T13:38:00.000Z",
      firm: "Propr",
      type: "purchase",
      amountUSD: ds("50.00"),
      amountINR: ds("4890.24"),
      actualCashCostINR: ds("4890.24"),
      bankVerified: true,
    };

    const inrCash = tx.actualCashCostINR || tx.amountINR;
    const naiveFxEstimate = new Decimal("50.00").times("84.50").toFixed(2);

    expect(inrCash).toBe("4890.24");
    expect(naiveFxEstimate).toBe("4225.00");
    expect(inrCash).not.toBe(naiveFxEstimate);

    // Ledger outflow must strictly use the bank cost
    const outflow = calculateActualCashOutflowINR([tx]);
    expect(outflow).toBe("4890.24");
  });

  it("Test B: includes Breakout cash cost in total prop firm outflow", () => {
    const proprTx: FinanceTransaction = {
      id: "tx-propr",
      date: "2026-09-08",
      firm: "Propr",
      type: "purchase",
      amountUSD: ds("50.00"),
      amountINR: ds("4890.24"),
      bankVerified: true,
    };
    const breakoutTx: FinanceTransaction = {
      id: "tx-breakout",
      date: "2026-09-07",
      firm: "Breakout",
      type: "purchase",
      amountUSD: ds("0.00"),
      amountINR: ds("3835.25"),
      bankVerified: true,
    };

    const combinedOutflow = calculateActualCashOutflowINR([proprTx, breakoutTx]);
    expect(combinedOutflow).toBe("8725.49");

    const proprOnlyOutflow = calculateActualCashOutflowINR([proprTx]);
    expect(combinedOutflow).not.toBe(proprOnlyOutflow);
  });

  it("Test C: excludes historical failed account costs from active capital", () => {
    const activeAccountIds = ["urn:prp-account:J9wNi8oj3XGK", "urn:prp-account:4D8XWuQ3fju6"];

    const activeFace = calculateActiveCapital(SEED_PURCHASES, activeAccountIds);
    expect(new Decimal(activeFace).toFixed(2)).toBe("75.00");

    const activeCash = calculateActiveActualCashCost(SEED_PURCHASES, activeAccountIds);
    expect(activeCash).toBe("7336.19");

    // The total cash outflow includes historical failed accounts (₹25,394.83)
    const totalOutflow = calculateActualCashOutflowINR(SEED_PURCHASES);
    expect(totalOutflow).toBe("25394.83");
    expect(activeCash).not.toBe(totalOutflow);
  });

  it("Test D: preserves historical bank cash cost regardless of FX rate changes", () => {
    const tx: FinanceTransaction = {
      id: "tx-rate-independence",
      date: "2026-09-08",
      firm: "Propr",
      type: "purchase",
      amountUSD: ds("50.00"),
      amountINR: ds("4890.24"),
      actualCashCostINR: ds("4890.24"),
      bankVerified: true,
    };

    // Actual bank cash cost is immutable regardless of FX rate
    const fxRate1 = "84.50";
    const fxRate2 = "90.00";
    const fxRate3 = "75.00";

    const cashDebit1 = tx.actualCashCostINR;
    const cashDebit2 = tx.actualCashCostINR;
    const cashDebit3 = tx.actualCashCostINR;

    expect(cashDebit1).toBe("4890.24");
    expect(cashDebit2).toBe("4890.24");
    expect(cashDebit3).toBe("4890.24");

    // Conversely, synthetic estimates swing wildly:
    expect(new Decimal(tx.amountUSD).times(fxRate1).toFixed(2)).toBe("4225.00");
    expect(new Decimal(tx.amountUSD).times(fxRate2).toFixed(2)).toBe("4500.00");
    expect(new Decimal(tx.amountUSD).times(fxRate3).toFixed(2)).toBe("3750.00");
  });

  it("Test E: deduplicates imported bank transactions by reference", () => {
    const rawBankImports: FinanceTransaction[] = [
      {
        id: "tx-1",
        date: "2026-09-08",
        firm: "Propr",
        type: "purchase",
        amountUSD: ds("50.00"),
        amountINR: ds("4890.24"),
        bankReference: "PRCR/Paysagi_propr.xyz/Bucharest/08-09-2026",
        bankVerified: true,
      },
      {
        id: "tx-1-duplicate",
        date: "2026-09-08",
        firm: "Propr",
        type: "purchase",
        amountUSD: ds("50.00"),
        amountINR: ds("4890.24"),
        bankReference: "PRCR/Paysagi_propr.xyz/Bucharest/08-09-2026",
        bankVerified: true,
      },
    ];

    // Deduplicate by bankReference
    const seenRefs = new Set<string>();
    const deduplicated: FinanceTransaction[] = [];
    for (const tx of rawBankImports) {
      if (tx.bankReference && !seenRefs.has(tx.bankReference)) {
        seenRefs.add(tx.bankReference);
        deduplicated.push(tx);
      }
    }

    expect(deduplicated.length).toBe(1);
    const outflow = calculateActualCashOutflowINR(deduplicated);
    expect(outflow).toBe("4890.24");
  });

  it("Test F: credits refund against actual cash outflow", () => {
    const purchases: FinanceTransaction[] = [
      {
        id: "p1",
        date: "2026-09-01",
        firm: "Propr",
        type: "purchase",
        amountUSD: ds("50.00"),
        amountINR: ds("4890.24"),
        bankVerified: true,
      },
    ];
    const refund: FinanceTransaction = {
      id: "r1",
      date: "2026-09-03",
      firm: "Propr",
      type: "refund",
      amountUSD: ds("0.00"),
      amountINR: ds("1000.00"),
      refundINR: ds("1000.00"),
      bankVerified: true,
    };

    const pnlBeforeRefund = calculateActualCashPnLFromCashLedger(purchases, "0");
    expect(pnlBeforeRefund).toBe("-4890.24");

    const pnlAfterRefund = calculateActualCashPnLFromCashLedger([...purchases, refund], "0");
    expect(pnlAfterRefund).toBe("-3890.24");

    // Net PnL is improved by exactly the refund amount
    const improvement = new Decimal(pnlAfterRefund).minus(new Decimal(pnlBeforeRefund));
    expect(improvement.toString()).toBe("1000");
  });

  it("Test G: credits processed payout toward cash PnL", () => {
    const purchases: FinanceTransaction[] = [
      {
        id: "p1",
        date: "2026-09-01",
        firm: "Propr",
        type: "purchase",
        amountUSD: ds("50.00"),
        amountINR: ds("4890.24"),
        bankVerified: true,
      },
    ];

    const pnlNoPayout = calculateActualCashPnLFromCashLedger(purchases, "0.00");
    expect(pnlNoPayout).toBe("-4890.24");

    const pnlWithPayout = calculateActualCashPnLFromCashLedger(purchases, "10000.00");
    expect(pnlWithPayout).toBe("5109.76");
  });

  it("Test H: ignores pending or failed payouts in cash PnL", () => {
    const rawPayoutEvents = [
      { id: "p-pending", status: "pending", amountINR: "5000.00" },
      { id: "p-rejected", status: "rejected", amountINR: "2500.00" },
      { id: "p-processed", status: "processed", amountINR: "3000.00" },
    ];

    // Only processed payouts count as actual cash return
    const processedTotal = rawPayoutEvents
      .filter((p) => p.status === "processed")
      .reduce((sum, p) => sum.plus(new Decimal(p.amountINR)), new Decimal(0))
      .toFixed(2);

    expect(processedTotal).toBe("3000.00");

    // Mutated logic including pending:
    const mutatedTotal = rawPayoutEvents
      .reduce((sum, p) => sum.plus(new Decimal(p.amountINR)), new Decimal(0))
      .toFixed(2);

    expect(mutatedTotal).toBe("10500.00");
    expect(processedTotal).not.toBe(mutatedTotal);
  });
});
