// ─── Automated Propr API Audit & Contract Verification Test Suite ───────────
// Validates official Propr API contracts, builder attribution, HTTP 201 cancel handling,
// HIP-3 asset ticker normalization, ghost position elimination, batch mark preservation,
// and high-precision financial/risk calculation parity with Decimal.js.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProprClient } from "@propr/client";
import {
  normalizeAssetTicker,
  toDecimal,
  ds,
  type DecimalString,
  type PositionSnapshot,
} from "@propr/data-model";
import {
  calculateUnrealizedPnl,
  calculateEquity,
  calculateDrawdownLimit,
  calculateDrawdownUsedPercent,
  calculateDailyLossLimit,
  calculateDailyLossUsedPercent,
  calculateIsolatedLiquidationPrice,
  calculateCrossLiquidationPrice,
  recalculatePosition,
  MMR,
} from "@propr/calculations";
import Decimal from "decimal.js";

describe("Audit Suite A: REST Client Authentication & Headers", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sends X-API-Key with every authenticated request", async () => {
    let capturedHeaders: Record<string, string> = {};

    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: "OK" }),
      };
    });

    const client = new ProprClient({ apiKey: "pk_live_audit_test_key" });
    await client.getHealth();

    expect(capturedHeaders["X-API-Key"]).toBe("pk_live_audit_test_key");
    expect(capturedHeaders["X-Builder-Code"]).toBeUndefined();
  });

  it("sends X-Builder-Code when configured", async () => {
    let capturedHeaders: Record<string, string> = {};

    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: "OK" }),
      };
    });

    const client = new ProprClient({
      apiKey: "pk_live_audit_test_key",
      builderCode: "builder_alphatrading",
    });
    await client.getHealth();

    expect(capturedHeaders["X-API-Key"]).toBe("pk_live_audit_test_key");
    expect(capturedHeaders["X-Builder-Code"]).toBe("builder_alphatrading");
  });
});

describe("Audit Suite B: Response Handling Invariants", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("handles HTTP 201 as a successful order cancellation", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        status: 201,
        json: async () => ({ orderId: "ord_12345", status: "cancelled" }),
      };
    });

    const client = new ProprClient({ apiKey: "pk_live_audit_test_key" });
    const result = await client.cancelOrder("acc_999", "ord_12345");

    expect(result.success).toBe(true);
    expect(result.status).toBe(201);
    expect(result.orderId).toBe("ord_12345");
  });

  it("handles HTTP 200 as a successful order cancellation", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({ orderId: "ord_67890", status: "cancelled" }),
      };
    });

    const client = new ProprClient({ apiKey: "pk_live_audit_test_key" });
    const result = await client.cancelOrder("acc_999", "ord_67890");

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.orderId).toBe("ord_67890");
  });

  it("queries open orders using exact valid status enums and avoids 'active' or 'triggered'", async () => {
    const capturedUrls: string[] = [];

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      capturedUrls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: [], total: 0 }),
      };
    });

    const client = new ProprClient({ apiKey: "pk_live_audit_test_key" });
    await client.getOpenOrders("acc_test_1");

    expect(capturedUrls.length).toBe(3);
    expect(capturedUrls.some((u) => u.includes("status=pending"))).toBe(true);
    expect(capturedUrls.some((u) => u.includes("status=open"))).toBe(true);
    expect(capturedUrls.some((u) => u.includes("status=partially_filled"))).toBe(true);
    expect(capturedUrls.some((u) => u.includes("status=active"))).toBe(false);
    expect(capturedUrls.some((u) => u.includes("status=triggered"))).toBe(false);
  });

  it("enforces xyz: prefix on HIP-3 equity and commodity asset tickers", () => {
    expect(normalizeAssetTicker("AAPL")).toBe("xyz:AAPL");
    expect(normalizeAssetTicker("aapl")).toBe("xyz:AAPL");
    expect(normalizeAssetTicker("TSLA")).toBe("xyz:TSLA");
    expect(normalizeAssetTicker("GOLD")).toBe("xyz:GOLD");
    expect(normalizeAssetTicker("silver")).toBe("xyz:SILVER");
    expect(normalizeAssetTicker("CL")).toBe("xyz:CL");
    expect(normalizeAssetTicker("xyz:AAPL")).toBe("xyz:AAPL");
    expect(normalizeAssetTicker("BTC-USD")).toBe("BTC-USD");
    expect(normalizeAssetTicker("ETH")).toBe("ETH");
  });
});

describe("Audit Suite C: State Invariants & Zero-Quantity Ghost Position Elimination", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("filters out zero-quantity positions from getPositions", async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              positionId: "pos_1",
              accountId: "acc_1",
              asset: "BTC",
              positionSide: "long",
              quantity: "0.5",
              entryPrice: "60000.00",
              markPrice: "62000.00",
            },
            {
              positionId: "pos_ghost_1",
              accountId: "acc_1",
              asset: "ETH",
              positionSide: "short",
              quantity: "0", // Closed/flat ghost position
              entryPrice: "3000.00",
              markPrice: "3000.00",
            },
            {
              positionId: "pos_ghost_2",
              accountId: "acc_1",
              asset: "SOL",
              positionSide: "long",
              quantity: "0.0", // Another ghost format
              entryPrice: "150.00",
              markPrice: "150.00",
            },
          ],
          total: 3,
        }),
      };
    });

    const client = new ProprClient({ apiKey: "pk_live_audit_test_key" });
    const openPositions = await client.getPositions("acc_1", "open");

    expect(openPositions.length).toBe(1);
    expect(openPositions[0].positionId).toBe("pos_1");
    expect(openPositions.some((p) => p.quantity === "0")).toBe(false);
  });
});

describe("Audit Suite D: Financial & Risk Calculations Parity with Decimal.js", () => {
  it("calculates exact unrealized PnL without IEEE-754 precision loss", () => {
    // 0.1 BTC Long: Entry 60000.15, Mark 60000.45 -> Diff = 0.30 -> PnL = 0.03
    const longPnl = calculateUnrealizedPnl("long", "0.1", "60000.15", "60000.45");
    expect(longPnl).toBe("0.03");

    // 0.1 BTC Short: Entry 60000.45, Mark 60000.15 -> Diff = -0.30 -> PnL = +0.03
    const shortPnl = calculateUnrealizedPnl("short", "0.1", "60000.45", "60000.15");
    expect(shortPnl).toBe("0.03");

    // Fractional micro fee and position test
    const microPnl = calculateUnrealizedPnl("long", "0.00001234", "100.00", "110.00");
    // 0.00001234 * 10 = 0.0001234
    expect(microPnl).toBe("0.0001234");
  });

  it("calculates account equity accurately", () => {
    // balance + totalUpnl + isolatedPositionMargin
    const equity = calculateEquity("10000.00", "-250.75", "500.00");
    expect(equity).toBe("10249.25");
  });

  it("verifies static drawdown calculation parity", () => {
    const config = {
      drawdownType: "static" as const,
      initialBalance: "10000.00",
      maxDrawdownPercent: "10.00", // $1000 max drawdown
    };

    // ddLimit = 10000 - (10% * 10000) = 9000
    const limit = calculateDrawdownLimit(config);
    expect(limit).toBe("9000");

    // Equity at 9500 -> Drawdown used = (10000 - 9500) / 10000 = 5%
    const usedPct = calculateDrawdownUsedPercent("9500.00", config);
    expect(usedPct).toBe("5");

    // Equity above initial -> Drawdown used = 0%
    const zeroUsed = calculateDrawdownUsedPercent("10500.00", config);
    expect(zeroUsed).toBe("0");
  });

  it("verifies trailing drawdown calculation parity against high water mark", () => {
    const config = {
      drawdownType: "trailing" as const,
      initialBalance: "10000.00",
      maxDrawdownPercent: "10.00", // $1000 max drawdown
      highWaterMark: "10800.00",
    };

    // ddLimit = min(10800 - 1000, 10000) = min(9800, 10000) = 9800
    const limit = calculateDrawdownLimit(config);
    expect(limit).toBe("9800");

    // Equity at 10200 -> Drawdown used = (10800 - 10200) / 10000 * 100 = 600 / 100 = 6%
    const usedPct = calculateDrawdownUsedPercent("10200.00", config);
    expect(usedPct).toBe("6");
  });

  it("verifies daily loss base and limit formulas", () => {
    const config = {
      dailyLossBase: "10500.00", // startingBalance (10000) + startingIsolatedPositionMargin (500)
      maxDailyLossPercent: "5.00", // 5% of base = 525
    };

    // dailyLimit = 10500 - 525 = 9975
    const limit = calculateDailyLossLimit(config);
    expect(limit).toBe("9975");

    // Equity at 10100 -> Loss = 400 / 10500 * 100
    const usedPct = calculateDailyLossUsedPercent("10100.00", config);
    expect(new Decimal(usedPct).toFixed(4)).toBe("3.8095");
  });

  it("verifies isolated liquidation price formula under boundary leverage conditions", () => {
    // MMR is 0.005 (0.5%)
    // Long: entryPrice * (1 - 1/leverage + MMR)
    // 50x leverage: inv = 0.02. factor = 1 - 0.02 + 0.005 = 0.985
    // entryPrice 50000 -> 50000 * 0.985 = 49250
    const liqLong50 = calculateIsolatedLiquidationPrice("50000.00", "50", "long");
    expect(liqLong50).toBe("49250");

    // Short: entryPrice * (1 + 1/leverage - MMR)
    // 50x leverage: factor = 1 + 0.02 - 0.005 = 1.015
    // entryPrice 50000 -> 50000 * 1.015 = 50750
    const liqShort50 = calculateIsolatedLiquidationPrice("50000.00", "50", "short");
    expect(liqShort50).toBe("50750");

    // 1x leverage Long: 1 - 1 + 0.005 = 0.005 -> entryPrice * 0.005
    const liqLong1 = calculateIsolatedLiquidationPrice("1000.00", "1", "long");
    expect(liqLong1).toBe("5");
  });

  it("verifies cross margin liquidation price parity", () => {
    const liqCrossLong = calculateCrossLiquidationPrice(
      "100.00", // entryPrice
      "10",     // quantity
      "long",
      "500.00", // crossWallet
      "0.00",   // unrealizedPnl
      "5.00",   // totalMaintMargin
      "1000.00" // notionalValue
    );
    expect(new Decimal(liqCrossLong).greaterThan(0)).toBe(true);
  });
});
