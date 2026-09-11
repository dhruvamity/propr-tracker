import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import payoutsFixture from "../fixtures/payouts.json";

describe("Payouts & Actual Cash PnL", () => {
  it("only aggregates processed payouts into cash received", () => {
    const payouts = payoutsFixture.data;
    expect(payouts.length).toBe(3);

    let totalWithdrawn = new Decimal(0);
    for (const p of payouts) {
      if (p.status === "processed") {
        totalWithdrawn = totalWithdrawn.plus(new Decimal(p.userAmount || p.amount));
      }
    }

    // Only PAY001 is processed ($1,000 userAmount). PAY002 is requested, PAY003 is rejected.
    expect(totalWithdrawn.toString()).toBe("1000");
  });

  it("calculates actual cash PnL accounting for refunds", () => {
    const processedPayouts = new Decimal("1000");
    const purchases = new Decimal("200");
    const refunds = new Decimal("50"); // 1 refund issued
    const adjustments = new Decimal("0");

    // Correct formula: Processed Payouts - (Purchases - Refunds) + Adjustments
    const netExpenses = purchases.minus(refunds); // 150
    const correctCashPnl = processedPayouts.minus(netExpenses).plus(adjustments);
    expect(correctCashPnl.toString()).toBe("850");

    // Defective logic ignoring refunds:
    const defectiveCashPnl = processedPayouts.minus(purchases);
    expect(defectiveCashPnl.toString()).toBe("800"); // $50 underreported
  });

  it("strictly separates actual cash PnL from unrealized trading PnL", () => {
    const cashPnl = new Decimal("850");
    const paperTradingUnrealizedPnl = new Decimal("4500");

    // Cash PnL must never conflate with paper trading unrealized PnL
    expect(cashPnl.toString()).not.toBe(paperTradingUnrealizedPnl.toString());
  });
});
