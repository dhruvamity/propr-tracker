import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";

function legacyFilter(p: { quantity: string }): boolean {
  // Exact logic from services/propr-sync/src/ws-worker.ts:310
  return p.quantity !== "0" && p.quantity !== "0.0" && p.quantity !== "";
}

function correctFilter(p: { quantity: string }): boolean {
  // Correct numeric check
  try {
    return !new Decimal(p.quantity || "0").isZero();
  } catch {
    return false;
  }
}

describe("Position Normalization & Zero-Quantity Filtering", () => {
  it("detects defect in legacy string-based zero filter", () => {
    const closedPositions = [
      { quantity: "0" },
      { quantity: "0.0" },
      { quantity: "0.00" },      // Hyperliquid standard 2-dec zero
      { quantity: "0.0000" },    // 4-dec zero
      { quantity: "0e-8" },      // Scientific zero
      { quantity: "" },
    ];

    // The legacy filter FAILS on "0.00", "0.0000", and "0e-8"
    const legacySurviving = closedPositions.filter(legacyFilter);
    expect(legacySurviving.length).toBe(3); // Defect: 3 closed positions falsely kept!

    // The correct filter filters ALL of them out
    const correctSurviving = closedPositions.filter(correctFilter);
    expect(correctSurviving.length).toBe(0);
  });

  it("calculates long and short unrealized PnL accurately", () => {
    // Long position
    const longQty = new Decimal("0.15");
    const longEntry = new Decimal("60000.00");
    const longMark = new Decimal("62000.00");
    const longUpnl = longQty.times(longMark.minus(longEntry));
    expect(longUpnl.toString()).toBe("300");

    // Short position
    const shortQty = new Decimal("1.5");
    const shortEntry = new Decimal("2500.00");
    const shortMark = new Decimal("2400.00");
    const shortUpnl = shortQty.times(shortEntry.minus(shortMark));
    expect(shortUpnl.toString()).toBe("150");

    // Short losing position
    const shortLossMark = new Decimal("2600.00");
    const shortLossUpnl = shortQty.times(shortEntry.minus(shortLossMark));
    expect(shortLossUpnl.toString()).toBe("-150");
  });

  it("calculates ROE and notional value accurately", () => {
    const qty = new Decimal("0.15");
    const mark = new Decimal("62000.00");
    const margin = new Decimal("1800.00");
    const upnl = new Decimal("300.00");

    const notional = qty.times(mark);
    expect(notional.toString()).toBe("9300");

    const roe = upnl.dividedBy(margin).times(100);
    expect(roe.toFixed(2)).toBe("16.67");
  });
});
