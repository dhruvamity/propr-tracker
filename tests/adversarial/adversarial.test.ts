// ─── Adversarial Test Suite ───────────────────────────────────────────────────
// Injects adversarial data: extreme prices, malformed JSON, out-of-order events,
// negative/tiny quantities, and abnormal inputs to verify failure safety.

import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import {
  toDecimal,
  fromDecimal,
  ds,
  ProprPositionSchema,
} from "@propr/data-model";
import {
  calculateEquity,
  calculateDrawdownLimit,
  calculateDrawdownUsedPercent,
  calculateUnrealizedPnl,
} from "@propr/calculations";

describe("Adversarial Testing: Edge Cases & Failure Safety", () => {
  it("handles extreme market price spikes without numerical overflow or NaN", () => {
    // Bitcoin flash-spike to $10,000,000
    const entryPrice = "60000.00";
    const extremeMark = "10000000.00";
    const quantity = "0.5";

    const pnl = calculateUnrealizedPnl("long", quantity, entryPrice, extremeMark);

    expect(Number.isNaN(Number(pnl))).toBe(false);
    expect(Number.isFinite(Number(pnl))).toBe(true);
    expect(toDecimal(pnl).toString()).toBe("4970000"); // (10,000,000 - 60,000) * 0.5
  });

  it("handles extreme micro-quantities (scientific notation strings)", () => {
    const tinyQty = "0.00000001";
    const entryPrice = "100000.00";
    const markPrice = "110000.00";

    const pnl = calculateUnrealizedPnl("long", tinyQty, entryPrice, markPrice);

    expect(toDecimal(pnl).toString()).toBe("0.0001");
    expect(toDecimal(tinyQty).isZero()).toBe(false);
  });

  it("rejects invalid position schemas with missing required fields", () => {
    const invalidPosition = {
      positionId: "pos-1",
      // missing userId, accountId, side, quantity, etc.
    };

    const result = ProprPositionSchema.safeParse(invalidPosition);
    expect(result.success).toBe(false);
  });

  it("safely handles zero-division protection in drawdown used percentage", () => {
    // If startingBalance is 0, calculateDrawdownUsedPercent must not crash or return Infinity
    const result = calculateDrawdownUsedPercent("1000", {
      drawdownType: "static",
      initialBalance: "10000",
      startingBalance: "0",
      maxDrawdownPercent: "5",
    });
    expect(toDecimal(result).toString()).toBe("0");
  });

  it("handles negative equity safely without throwing unhandled exceptions", () => {
    const balance = "1000.00";
    const hugeLoss = "-5000.00"; // catastrophic loss beyond balance
    const isolatedMargin = "0.00";

    const equity = calculateEquity(balance, hugeLoss, isolatedMargin);

    expect(toDecimal(equity).toString()).toBe("-4000");
    expect(toDecimal(equity).isNegative()).toBe(true);
  });

  it("safely calculates drawdown floor when trailing drawdown exceeds initial balance", () => {
    // When account gains 50% profit, trailing floor moves up but caps at initial balance per Propr rule
    const initialBalance = "50000.00";
    const hwm = "75000.00";
    const maxDrawdownPercent = "5"; // 5% trailing from initial = 2,500 allowable loss

    const floor = calculateDrawdownLimit({
      drawdownType: "trailing",
      initialBalance,
      highWaterMark: hwm,
      maxDrawdownPercent,
    });

    // Propr trailing rule: floor = min(HWM - ddAmount, initialBalance)
    // 75,000 - 2,500 = 72,500, capped at initialBalance (50,000)
    expect(toDecimal(floor).toString()).toBe("50000");
  });
});
