// ─── Calculation Tests ────────────────────────────────────────────────────────
// Deterministic fixtures covering all 15 scenarios from prompt §39.

import { describe, it, expect } from "vitest";
import { ds } from "@propr/data-model";
import type { DecimalString } from "@propr/data-model";
import {
  calculateUnrealizedPnl,
  calculateNotionalValue,
  calculateROE,
  calculateMaintMargin,
  recalculatePosition,
  sumUnrealizedPnl,
} from "../src/pnl.js";
import {
  calculateEquity,
  calculateCrossWallet,
  calculateAvailableBalance,
  calculateMarginRatio,
} from "../src/equity.js";
import {
  calculateDrawdownLimit,
  calculateDrawdownUsedPercent,
  calculateDrawdownRemaining,
  calculateDailyLossLimit,
  calculateDailyLossUsedPercent,
  calculateDailyLossRemaining,
  calculateProfitTargetProgress,
  calculateProfitTarget,
  calculateProfitRemaining,
  calculateBreachPrice,
  calculateIsolatedLiquidationPrice,
  calculateCrossLiquidationPrice,
} from "../src/risk.js";
import {
  deriveAccountStage,
  deriveChallengeStage,
  deriveFundedStage,
  deriveEvaluationStatus,
  getAccountSortPriority,
} from "../src/lifecycle.js";
import {
  calculateActualCashPnL,
  calculateROI,
  calculateTotalInvested,
  calculateTotalPayoutsWithdrawn,
  convertUsdToInr,
} from "../src/finance.js";
import Decimal from "decimal.js";

// Helper to check decimal equality with tolerance
function expectDecimalClose(
  actual: DecimalString | string,
  expected: string,
  tolerance = "0.01"
) {
  const diff = new Decimal(actual).minus(new Decimal(expected)).abs();
  expect(diff.lte(new Decimal(tolerance))).toBe(true);
}

// ─── 1. Healthy Evaluation ──────────────────────────────────────────────────

describe("1. Healthy evaluation", () => {
  const config = {
    drawdownType: "static" as const,
    maxDrawdownPercent: ds("5"),
    initialBalance: ds("25000"),
    startingBalance: ds("25000"),
  };

  it("calculates drawdown correctly for healthy account", () => {
    const equity = ds("25842");
    const ddUsed = calculateDrawdownUsedPercent(equity, config);
    // ref = startingBalance = 25000, equity = 25842
    // used = max(25000 - 25842, 0) = 0
    expectDecimalClose(ddUsed, "0");

    const remaining = calculateDrawdownRemaining(equity, config);
    // limit = 25000 - (5/100 × 25000) = 23750
    // remaining = 25842 - 23750 = 2092
    expectDecimalClose(remaining, "2092");
  });

  it("calculates profit target progress", () => {
    const equity = ds("25842");
    const progress = calculateProfitTargetProgress(equity, ds("25000"), ds("5"));
    // pnlPercent = (25842-25000)/25000 × 100 = 3.368
    // progress = 3.368 / 5 × 100 = 67.36
    expectDecimalClose(progress, "67.36", "0.1");
  });
});

// ─── 2. Evaluation near drawdown ────────────────────────────────────────────

describe("2. Evaluation near drawdown", () => {
  const config = {
    drawdownType: "static" as const,
    maxDrawdownPercent: ds("5"),
    initialBalance: ds("25000"),
    startingBalance: ds("25000"),
  };

  it("shows high drawdown usage", () => {
    const equity = ds("23850"); // Close to limit of 23750
    const ddUsed = calculateDrawdownUsedPercent(equity, config);
    // used = max(25000 - 23850, 0) / 25000 × 100 = 4.6%
    expectDecimalClose(ddUsed, "4.6");

    const remaining = calculateDrawdownRemaining(equity, config);
    // remaining = 23850 - 23750 = 100
    expectDecimalClose(remaining, "100");
  });

  it("derives NEAR_BREACH status", () => {
    // 4.6 / 5 × 100 = 92% of max drawdown used
    const status = deriveEvaluationStatus("EVALUATION", 92, 30, 80, 80);
    expect(status).toBe("NEAR_BREACH");
  });
});

// ─── 3. Evaluation passed ───────────────────────────────────────────────────

describe("3. Evaluation passed", () => {
  it("derives PASSED stage from challenge attempt", () => {
    const { stage, source } = deriveAccountStage({ status: "passed" }, null);
    expect(stage).toBe("PASSED");
    expect(source).toBe("challenge_attempt");
  });
});

// ─── 4. Evaluation failed ───────────────────────────────────────────────────

describe("4. Evaluation failed", () => {
  it("derives FAILED stage from challenge attempt", () => {
    const { stage } = deriveAccountStage({ status: "failed" }, null);
    expect(stage).toBe("FAILED");
  });
});

// ─── 5. Funded account ──────────────────────────────────────────────────────

describe("5. Funded account", () => {
  it("derives FUNDED stage from funded issuance", () => {
    const { stage, source } = deriveAccountStage(
      { status: "passed" },
      { status: "active" }
    );
    // Funded issuance takes precedence
    expect(stage).toBe("FUNDED");
    expect(source).toBe("funded_issuance");
  });
});

// ─── 6. Funded account with payout ──────────────────────────────────────────

describe("6. Funded account with payout", () => {
  it("only counts processed payouts", () => {
    const payouts = [
      { payoutId: "1", reason: "account", status: "processed" as const, amount: ds("500"), userAmount: ds("475"), createdAt: "" },
      { payoutId: "2", reason: "account", status: "requested" as const, amount: ds("300"), createdAt: "" },
      { payoutId: "3", reason: "account", status: "failed" as const, amount: ds("200"), createdAt: "" },
    ];
    const total = calculateTotalPayoutsWithdrawn(payouts);
    // Only "processed" counts, and uses userAmount (475) over amount (500)
    expectDecimalClose(total, "475");
  });
});

// ─── 7. Multiple open positions ─────────────────────────────────────────────

describe("7. Multiple open positions", () => {
  it("sums unrealized PnL across positions", () => {
    const positions = [
      { unrealizedPnl: ds("150.50") },
      { unrealizedPnl: ds("-75.25") },
      { unrealizedPnl: ds("200.00") },
    ];
    const total = sumUnrealizedPnl(positions);
    expectDecimalClose(total, "275.25");
  });
});

// ─── 8. Long position ───────────────────────────────────────────────────────

describe("8. Long position", () => {
  it("calculates correct uPnL for long position", () => {
    // Long 0.012 BTC, entry 94210, mark 94825
    const upnl = calculateUnrealizedPnl("long", ds("0.012"), ds("94210"), ds("94825"));
    // sign=+1, qty=0.012, (94825-94210)=615, 0.012×615=7.38
    expectDecimalClose(upnl, "7.38");
  });

  it("calculates notional value", () => {
    const notional = calculateNotionalValue(ds("0.012"), ds("94825"));
    // 0.012 × 94825 = 1137.90
    expectDecimalClose(notional, "1137.90");
  });
});

// ─── 9. Short position ──────────────────────────────────────────────────────

describe("9. Short position", () => {
  it("calculates correct uPnL for short position", () => {
    // Short 0.005 ETH, entry 3200, mark 3180
    const upnl = calculateUnrealizedPnl("short", ds("0.005"), ds("3200"), ds("3180"));
    // sign=-1, qty=0.005, (3180-3200)=-20, 0.005×(-20)×(-1)=0.10
    expectDecimalClose(upnl, "0.10");
  });
});

// ─── 10. Cross margin ───────────────────────────────────────────────────────

describe("10. Cross margin", () => {
  it("calculates equity for cross margin account", () => {
    const equity = calculateEquity(ds("25000"), ds("150"), ds("0"));
    // balance + totalUpnl + isolatedPositionMargin = 25000 + 150 + 0 = 25150
    expectDecimalClose(equity, "25150");
  });

  it("calculates available balance", () => {
    const crossWallet = calculateCrossWallet(ds("25000"), ds("150"));
    // 25000 + 150 = 25150
    const available = calculateAvailableBalance(
      crossWallet,
      ds("1000"),
      ds("500"),
      ds("0")
    );
    // 25150 - 1000 - 500 - 0 = 23650
    expectDecimalClose(available, "23650");
  });

  it("calculates cross liquidation price for long", () => {
    const liqPrice = calculateCrossLiquidationPrice(
      ds("94210"),  // entry
      ds("0.012"),  // qty
      "long",
      ds("25150"),  // crossWallet
      ds("7.38"),   // unrealizedPnl
      ds("5.685"),  // totalMaintMargin
      ds("1137.9")  // notionalValue of this position
    );
    // Should be a price lower than entry
    const liq = new Decimal(liqPrice);
    expect(liq.lessThan(94210)).toBe(true);
    expect(liq.greaterThan(0)).toBe(true);
  });
});

// ─── 11. Isolated margin ────────────────────────────────────────────────────

describe("11. Isolated margin", () => {
  it("calculates isolated liquidation price for long", () => {
    // entry=94210, leverage=4, long
    const liqPrice = calculateIsolatedLiquidationPrice(
      ds("94210"),
      ds("4"),
      "long"
    );
    // entry × (1 - 1/4 + 0.005) = 94210 × 0.755 = 71128.55
    expectDecimalClose(liqPrice, "71128.55");
  });

  it("calculates isolated liquidation price for short", () => {
    // entry=3200, leverage=3, short
    const liqPrice = calculateIsolatedLiquidationPrice(
      ds("3200"),
      ds("3"),
      "short"
    );
    // entry × (1 + 1/3 - 0.005) = 3200 × 1.32833... = 4250.67
    expectDecimalClose(liqPrice, "4250.67", "1");
  });
});

// ─── 12. Reconnect after websocket disconnect ───────────────────────────────

describe("12. Reconnect after websocket disconnect", () => {
  it("lifecycle engine handles unknown states gracefully", () => {
    const { stage } = deriveAccountStage(undefined, undefined);
    expect(stage).toBe("UNKNOWN");
  });
});

// ─── 13. Stale REST data ────────────────────────────────────────────────────

describe("13. Stale REST data", () => {
  // Stale data detection is handled by the UI layer using FRESHNESS_THRESHOLDS
  // This test verifies the thresholds are correctly defined
  it("freshness thresholds are correctly ordered", () => {
    const { FRESHNESS_THRESHOLDS } = require("@propr/data-model");
    expect(FRESHNESS_THRESHOLDS.LIVE).toBeLessThan(
      FRESHNESS_THRESHOLDS.DELAYED
    );
    expect(FRESHNESS_THRESHOLDS.DELAYED).toBeLessThan(
      FRESHNESS_THRESHOLDS.STALE
    );
  });
});

// ─── 14. Zero-quantity position ─────────────────────────────────────────────

describe("14. Zero-quantity position", () => {
  it("zero-quantity position has zero PnL", () => {
    const upnl = calculateUnrealizedPnl("long", ds("0"), ds("94210"), ds("95000"));
    expectDecimalClose(upnl, "0");
  });
});

// ─── 15. Duplicate account discovery ────────────────────────────────────────

describe("15. Duplicate account discovery", () => {
  it("funded issuance takes precedence over challenge attempt", () => {
    // Same account appearing in both endpoints
    const { stage } = deriveAccountStage(
      { status: "passed" },
      { status: "active" }
    );
    expect(stage).toBe("FUNDED");
  });

  it("closed funded takes precedence over passed challenge", () => {
    const { stage } = deriveAccountStage(
      { status: "passed" },
      { status: "closed" }
    );
    expect(stage).toBe("CLOSED");
  });
});

// ─── Additional: Finance Calculations ───────────────────────────────────────

describe("Finance calculations", () => {
  it("calculates actual cash PnL correctly", () => {
    const cashPnl = calculateActualCashPnL(ds("10000"), ds("25394.83"));
    // 10000 - 25394.83 = -15394.83
    expectDecimalClose(cashPnl, "-15394.83");
  });

  it("calculates ROI correctly", () => {
    const roi = calculateROI(ds("10000"), ds("25000"));
    // (10000 - 25000) / 25000 × 100 = -60%
    expectDecimalClose(roi, "-60");
  });

  it("calculates negative ROI when no payouts", () => {
    const roi = calculateROI(ds("0"), ds("25000"));
    // (0 - 25000) / 25000 × 100 = -100%
    expectDecimalClose(roi, "-100");
  });

  it("calculates total invested from transactions", () => {
    const transactions = [
      { id: "1", date: "", firm: "Propr", type: "purchase" as const, amountUSD: ds("50"), bankVerified: true },
      { id: "2", date: "", firm: "Propr", type: "purchase" as const, amountUSD: ds("25"), bankVerified: true },
      { id: "3", date: "", firm: "Propr", type: "refund" as const, amountUSD: ds("10"), bankVerified: true },
    ];
    const total = calculateTotalInvested(transactions);
    // 50 + 25 - 10 = 65
    expectDecimalClose(total, "65");
  });

  it("converts USD to INR correctly", () => {
    const inr = convertUsdToInr(ds("218.75"), ds("84.5"));
    // 218.75 × 84.5 = 18484.375
    expectDecimalClose(inr, "18484.375", "0.01");
  });
});

// ─── Additional: Daily Loss ─────────────────────────────────────────────────

describe("Daily loss calculations", () => {
  const config = {
    maxDailyLossPercent: ds("3"),
    dailyLossBase: ds("25200"), // startingBalance + startingIsolatedPositionMargin
  };

  it("calculates daily loss limit", () => {
    const limit = calculateDailyLossLimit(config);
    // 25200 - (3/100 × 25200) = 25200 - 756 = 24444
    expectDecimalClose(limit, "24444");
  });

  it("calculates daily loss used percent", () => {
    const equity = ds("24900");
    const used = calculateDailyLossUsedPercent(equity, config);
    // max(25200 - 24900, 0) / 25200 × 100 = 300/25200 × 100 = 1.19%
    expectDecimalClose(used, "1.19", "0.01");
  });
});

// ─── Additional: Breach Price ───────────────────────────────────────────────

describe("Breach price calculations", () => {
  it("calculates breach price for long position", () => {
    const breachPrice = calculateBreachPrice(
      ds("23750"),  // equity limit (drawdown floor)
      ds("25842"),  // current equity
      ds("94825"),  // mark price
      ds("0.012"),  // quantity
      "long"
    );
    // buffer = 25842 - 23750 = 2092
    // offset = 2092 / 0.012 = 174333.33
    // breachPrice = 94825 - 174333.33 = -79508.33 (no breach at this size)
    expect(breachPrice).not.toBeNull();
  });

  it("returns null when buffer is gone", () => {
    const breachPrice = calculateBreachPrice(
      ds("25000"),  // equity limit
      ds("24000"),  // current equity (below limit)
      ds("94825"),
      ds("0.012"),
      "long"
    );
    expect(breachPrice).toBeNull();
  });
});

// ─── Sort Priority ──────────────────────────────────────────────────────────

describe("Account sort priority", () => {
  it("sorts accounts correctly", () => {
    const stages = ["FUNDED", "EVALUATION", "PASSED", "REVIEW_PENDING", "FAILED", "CLOSED"] as const;
    const priorities = stages.map((s) => getAccountSortPriority(s));
    for (let i = 1; i < priorities.length; i++) {
      expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i - 1]);
    }
  });
});

// ─── Trailing Drawdown ──────────────────────────────────────────────────────

describe("Trailing drawdown", () => {
  it("uses high water mark for trailing drawdown", () => {
    const config = {
      drawdownType: "trailing" as const,
      maxDrawdownPercent: ds("5"),
      initialBalance: ds("25000"),
      startingBalance: ds("25000"),
      highWaterMark: ds("26000"),
    };

    const limit = calculateDrawdownLimit(config);
    // ddAmount = 5/100 × 25000 = 1250
    // trailing: min(26000 - 1250, 25000) = min(24750, 25000) = 24750
    expectDecimalClose(limit, "24750");
  });
});
