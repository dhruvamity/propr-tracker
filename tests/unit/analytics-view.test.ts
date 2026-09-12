import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";

describe("Analytics Calculation Invariants", () => {
  it("calculates win rate and win/loss count correctly", () => {
    const closedTrades = [
      { rPnl: "26.95", fee: "2.70" }, // +24.25 (Win)
      { rPnl: "-28.85", fee: "1.77" }, // -30.62 (Loss)
      { rPnl: "0.86", fee: "3.07" }, // -2.21 (Loss)
      { rPnl: "109.01", fee: "4.76" }, // +104.25 (Win)
    ];

    let wins = 0;
    let losses = 0;
    let grossProfit = new Decimal(0);
    let grossLoss = new Decimal(0);

    for (const t of closedTrades) {
      const net = new Decimal(t.rPnl).minus(new Decimal(t.fee));
      if (net.gt(0)) {
        wins++;
        grossProfit = grossProfit.plus(net);
      } else {
        losses++;
        grossLoss = grossLoss.plus(net.abs());
      }
    }

    expect(wins).toBe(2);
    expect(losses).toBe(2);
    const winRatePct = (wins / closedTrades.length) * 100;
    expect(winRatePct).toBe(50);

    // Profit factor = gross profit / gross loss
    const pf = grossProfit.dividedBy(grossLoss);
    expect(pf.toNumber()).toBeGreaterThan(1);
  });

  it("calculates asset breakdown and sort order correctly", () => {
    const trades = [
      { asset: "BTC", netPnl: 116.16 },
      { asset: "GOLD", netPnl: 143.79 },
      { asset: "PONS", netPnl: -58.77 },
      { asset: "BTC", netPnl: 20.00 },
    ];

    const breakdown = new Map<string, { count: number; pnl: number }>();
    for (const t of trades) {
      const cur = breakdown.get(t.asset) || { count: 0, pnl: 0 };
      cur.count++;
      cur.pnl += t.netPnl;
      breakdown.set(t.asset, cur);
    }

    const sorted = Array.from(breakdown.entries()).sort((a, b) => b[1].pnl - a[1].pnl);
    expect(sorted[0][0]).toBe("GOLD");
    expect(sorted[0][1].pnl).toBe(143.79);
    expect(sorted[1][0]).toBe("BTC");
    expect(sorted[1][1].count).toBe(2);
    expect(sorted[2][0]).toBe("PONS");
    expect(sorted[2][1].pnl).toBeLessThan(0);
  });

  it("verifies account categorization for switcher tabs", () => {
    const accounts = [
      { id: "acc1", stage: "EVALUATION" },
      { id: "acc2", stage: "FUNDED" },
      { id: "acc3", stage: "BREACHED" },
      { id: "acc4", stage: "FAILED" },
    ];

    const active = accounts.filter((a) => a.stage === "EVALUATION" || a.stage === "FUNDED");
    const breached = accounts.filter((a) => a.stage === "BREACHED" || a.stage === "FAILED");

    expect(active.length).toBe(2);
    expect(breached.length).toBe(2);
  });
});
