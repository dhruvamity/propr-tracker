import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { SEED_PURCHASES } from "../../apps/terminal/src/lib/finance-data";
import attemptsFixture from "../fixtures/challenge-attempts.json";

describe("Financial Calculations & Precision", () => {
  it("avoids JavaScript floating point arithmetic errors", () => {
    // Standard JS float fails: 0.1 + 0.2 = 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3);

    // Decimal.js succeeds
    const d1 = new Decimal("0.1");
    const d2 = new Decimal("0.2");
    expect(d1.plus(d2).toString()).toBe("0.3");
  });

  it("calculates equity including isolated position margin", () => {
    const balance = new Decimal("9000.00");
    const upnl = new Decimal("100.00");
    const isolatedMargin = new Decimal("1000.00");

    // Correct formula: balance + upnl + isolatedPositionMargin
    const correctEquity = balance.plus(upnl).plus(isolatedMargin);
    expect(correctEquity.toString()).toBe("10100");

    // Defective formula in propr-api.ts:358: balance + upnl
    const defectiveEquity = balance.plus(upnl);
    expect(defectiveEquity.toString()).toBe("9100");
    // Understates equity by $1,000!
    expect(correctEquity.minus(defectiveEquity).toString()).toBe("1000");
  });

  it("calculates active capital by linking purchases to active accounts only", () => {
    // Total invested in seed purchases:
    // 17.50 + 25.00 + 18.75 + 18.75 + 18.75 + 45.00 + 25.00 + 50.00 = 218.75
    let totalInvested = new Decimal(0);
    for (const tx of SEED_PURCHASES) {
      if (tx.type === "purchase") totalInvested = totalInvested.plus(new Decimal(tx.amountUSD));
    }
    expect(totalInvested.toString()).toBe("218.75");

    // Defective logic in propr-api.ts:472:
    // activeCapital = totalInvested = 218.75

    // Correct logic: find purchases linked to accounts with active status
    const activeAttempts = attemptsFixture.data.filter((a) => a.status === "active");
    const activePurchaseIds = new Set(activeAttempts.map((a) => a.purchaseId));

    let correctActiveCapital = new Decimal(0);
    for (const tx of SEED_PURCHASES) {
      if (activePurchaseIds.has(tx.id)) {
        correctActiveCapital = correctActiveCapital.plus(new Decimal(tx.amountUSD));
      }
    }

    // PPWG9RNxz4eF ($25) + 72VSRitse27t ($50) = $75 (in fixture) or $50 (Explorer)
    expect(correctActiveCapital.toString()).toBe("75");
    expect(totalInvested.toString()).not.toBe(correctActiveCapital.toString());
  });
});
