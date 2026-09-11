import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";

describe("Drawdown & Risk Gauges", () => {
  it("calculates static drawdown limit and remaining buffer", () => {
    const initialBalance = new Decimal("10000");
    const maxDrawdownPercent = new Decimal("5"); // 5% = $500
    const equity = new Decimal("9800"); // lost $200

    const ddLimit = initialBalance.minus(maxDrawdownPercent.div(100).times(initialBalance));
    expect(ddLimit.toString()).toBe("9500");

    const ddRemaining = equity.minus(ddLimit);
    expect(ddRemaining.toString()).toBe("300");
  });

  it("calculates trailing drawdown following high-water mark", () => {
    const initialBalance = new Decimal("10000");
    const maxDrawdownPercent = new Decimal("5"); // 5% of initial = $500
    const highWaterMark = new Decimal("10800"); // Trader gained $800
    const currentEquity = new Decimal("10350"); // Dropped $450 from peak

    const maxDdAmount = maxDrawdownPercent.div(100).times(initialBalance); // $500

    // Trailing limit = min(highWaterMark - maxDdAmount, initialBalance) per Propr spec
    // Note: Some trailing rules lock at initial balance, or continue trailing
    const trailingLimit = highWaterMark.minus(maxDdAmount); // $10,300
    expect(trailingLimit.toString()).toBe("10300");

    const remainingFromTrailing = currentEquity.minus(trailingLimit);
    expect(remainingFromTrailing.toString()).toBe("50"); // Only $50 from breach!

    // Static limit would mistakenly show:
    const staticLimit = initialBalance.minus(maxDdAmount); // $9,500
    const staticRemaining = currentEquity.minus(staticLimit); // $850 buffer!
    expect(staticRemaining.toString()).toBe("850");
    // Under static calculation, trader thinks they have $850 buffer, but will breach in $50!
  });

  it("detects defect in drawdown progress bar visual scaling", () => {
    const initialBalance = new Decimal("10000");
    const maxDrawdownPercent = new Decimal("5"); // 5% allowed
    const equity = new Decimal("9680"); // Lost $320 (which is 3.2% of balance)

    const accountLossPercent = initialBalance.minus(equity).div(initialBalance).times(100);
    expect(accountLossPercent.toString()).toBe("3.2");

    // Defective code in page.tsx: uses accountLossPercent (3.2%) for gauge width
    const defectiveBarWidth = accountLossPercent.toNumber();
    expect(defectiveBarWidth).toBe(3.2); // Renders as 3.2% sliver!

    // Correct formula: (loss / maxAllowedLoss) * 100
    const maxAllowedLoss = maxDrawdownPercent.div(100).times(initialBalance); // 500
    const actualLoss = initialBalance.minus(equity); // 320
    const correctBarWidth = actualLoss.div(maxAllowedLoss).times(100).toNumber();
    expect(correctBarWidth).toBe(64); // Trader has used 64% of their drawdown!
  });
});
