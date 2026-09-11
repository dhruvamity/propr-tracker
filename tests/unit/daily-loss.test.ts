import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";

describe("Daily Loss Rules & Day Rollover", () => {
  it("calculates daily loss against day-start base, not initial balance", () => {
    const initialBalance = new Decimal("10000");
    const dayStartBalance = new Decimal("10600"); // Trader had $600 profit yesterday
    const startingIsolatedMargin = new Decimal("200");
    const maxDailyLossPercent = new Decimal("3"); // 3% allowed daily loss

    // Daily loss base per Propr docs: startingBalance + startingIsolatedPositionMargin
    const dailyLossBase = dayStartBalance.plus(startingIsolatedMargin); // 10800
    expect(dailyLossBase.toString()).toBe("10800");

    const maxDailyAllowedLoss = maxDailyLossPercent.div(100).times(dailyLossBase); // 324
    expect(maxDailyAllowedLoss.toString()).toBe("324");

    const dailyLossLimit = dailyLossBase.minus(maxDailyAllowedLoss); // 10476
    expect(dailyLossLimit.toString()).toBe("10476");

    const currentEquity = new Decimal("10450"); // Dropped to 10450 today
    // Real breach check: currentEquity < dailyLossLimit
    expect(currentEquity.lt(dailyLossLimit)).toBe(true); // Account is BREACHED by $26!

    // Defective calculation in propr-api.ts:367-372 (uses initialBalance 10000):
    const defectiveDailyLimit = initialBalance.minus(maxDailyLossPercent.div(100).times(initialBalance)); // 9700
    expect(defectiveDailyLimit.toString()).toBe("9700");
    // Under defective logic:
    expect(currentEquity.gt(defectiveDailyLimit)).toBe(true); // Falsely shows SAFE with $750 remaining!
  });
});
