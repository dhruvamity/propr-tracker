import { describe, it, expect } from "vitest";
import { formatBankRef } from "../../apps/terminal/src/components/bank-ref-badge";
import Decimal from "decimal.js";

describe("UI Formatting & Truncation Invariants", () => {
  it("truncates verbose bank reference strings to PRCR/.../24-08-2026 format", () => {
    const rawRef1 = "PRCR/Paysagi_propr.xyz/Bucharest/24-08-2026-1";
    expect(formatBankRef(rawRef1)).toBe("PRCR/.../24-08-2026");

    const rawRef2 = "PRCR/BREAKOUTPROP.COM/Wilmington/07-09-2026";
    expect(formatBankRef(rawRef2)).toBe("PRCR/.../07-09-2026");

    const rawRef3 = "PRCR/Paysagi_propr.xyz/Bucharest/30-08-2026-2";
    expect(formatBankRef(rawRef3)).toBe("PRCR/.../30-08-2026");
  });

  it("handles missing or short bank references gracefully", () => {
    expect(formatBankRef("")).toBe("-");
    expect(formatBankRef("-")).toBe("-");
    expect(formatBankRef("INV-102")).toBe("INV-102");
  });

  it("calculates exact dollar breach floor and remaining buffers", () => {
    const startingBalance = new Decimal("10000.00");
    const maxDrawdownPercent = new Decimal("5.00");
    const maxDailyLossPercent = new Decimal("4.00");

    // Static Drawdown
    const maxDdAmount = maxDrawdownPercent.div(100).times(startingBalance); // 500.00
    const breachFloor = startingBalance.minus(maxDdAmount); // 9500.00
    expect(breachFloor.toString()).toBe("9500");

    // Equity at $9,800.00
    const currentEquity = new Decimal("9800.00");
    const drawdownBuffer = currentEquity.minus(breachFloor); // 300.00
    expect(drawdownBuffer.toString()).toBe("300");

    // Daily loss base at $10,000.00
    const dailyLossBase = startingBalance;
    const maxDailyLossAmount = maxDailyLossPercent.div(100).times(dailyLossBase); // 400.00
    const dailyLossFloor = dailyLossBase.minus(maxDailyLossAmount); // 9600.00
    const dailyLossAllowance = currentEquity.minus(dailyLossFloor); // 200.00
    expect(dailyLossAllowance.toString()).toBe("200");
  });
});
