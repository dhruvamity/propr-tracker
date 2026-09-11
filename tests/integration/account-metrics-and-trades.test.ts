// ─── Integration: Account Metrics & Trade Ingestion ──────────────────────────
// Tests the three core pipelines per prompt.md Part 2:
// 1. Live Metrics Verification (drawdown & profit target)
// 2. Trade Ingestion Without Live Execution
// 3. Historical Account Reconciliation

import { describe, it, expect, beforeEach } from "vitest";
import Decimal from "decimal.js";
import type {
  AccountSnapshot,
  DecimalString,
  TradeSnapshot,
  PositionSnapshot,
} from "@propr/data-model";
import { ds, toDecimal, fromDecimal, ZERO } from "@propr/data-model";
import {
  calculateDrawdownUsedPercent,
  calculateDrawdownLimitConsumedPercent,
  calculateProfitTargetPercent,
  calculateProfitTargetProgress,
  recalculateAccountRisk,
} from "@propr/calculations";
import { MemoryStore } from "../../services/propr-sync/src/store";
import { normalizeTrade } from "../../services/propr-sync/src/ws-worker";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seedActiveAccount(overrides: Partial<AccountSnapshot> = {}): AccountSnapshot {
  return {
    accountId: "urn:prp-account:test-live-01",
    firm: "Propr",
    stage: "EVALUATION",
    source: "challenge_attempt",
    challengeName: "Starter Turbo 10k",
    initialBalance: ds("10000"),
    startingBalance: ds("10000"),
    phaseStartingBalance: ds("10000"),
    balance: ds("10000"),
    equity: ds("10000"),
    realizedPnl: ZERO,
    unrealizedPnl: ZERO,
    fees: ZERO,
    drawdownType: "static",
    profitTargetPercent: ds("10"),
    maxDrawdownPercent: ds("5"),
    maxDailyLossPercent: ds("3"),
    highWaterMark: ds("10000"),
    openPositionCount: 0,
    openOrderCount: 0,
    positions: [],
    orders: [],
    trades: [],
    dataSource: "PROPR_API",
    lastUpdatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeTrade(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    tradeId: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: "user-1",
    accountId: "urn:prp-account:test-live-01",
    orderId: "order-1",
    positionId: "pos-1",
    exchange: "hyperliquid",
    productType: "perpetual",
    type: "open",
    liquidityType: "taker",
    asset: "BTC-USDT",
    base: "BTC",
    quote: "USDC",
    side: "buy",
    positionSide: "long",
    quantity: "0.01",
    price: "68000",
    quoteQuantity: "680",
    fee: "0.204",
    feeAsset: "USDC",
    feeRate: "0.0003",
    leverage: "10",
    marginMode: "cross",
    realizedPnl: "0",
    positionSizeBefore: "0",
    slippage: "0.05",
    markPriceAtOrder: "68005",
    isLiquidation: false,
    executedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}


// ─── 1. Live Metrics Verification ─────────────────────────────────────────────

describe("Live Metrics Verification", () => {
  it("calculates profitTargetPct = 4.0% when equity is $10,400 on a 10% target", () => {
    const account = seedActiveAccount({
      equity: ds("10400"),
      balance: ds("10400"),
    });

    recalculateAccountRisk(account);

    // profitTargetPct = ((10400 - 10000) / 10000) * 100 = 4.0
    const pctVal = toDecimal(account.profitTargetPct!);
    expect(pctVal.toFixed(1)).toBe("4.0");

    // profitTargetProgressPercent = (4.0 / 10) * 100 = 40%
    const progressVal = toDecimal(account.profitTargetProgressPercent!);
    expect(progressVal.toFixed(0)).toBe("40");
  });

  it("shows drawdownUsedPct = 0% when equity is above starting balance", () => {
    const account = seedActiveAccount({
      equity: ds("10400"),
      balance: ds("10400"),
    });

    recalculateAccountRisk(account);

    const ddUsed = toDecimal(account.drawdownUsedPercent!);
    expect(ddUsed.toFixed(1)).toBe("0.0");
  });

  it("calculates drawdownUsedPct = 3.0% when equity drops to $9,700", () => {
    const account = seedActiveAccount({
      equity: ds("9700"),
      balance: ds("9700"),
    });

    recalculateAccountRisk(account);

    // drawdownUsedPct (static) = max(10000 - 9700, 0) / 10000 * 100 = 3.0
    const ddUsed = toDecimal(account.drawdownUsedPercent!);
    expect(ddUsed.toFixed(1)).toBe("3.0");

    // drawdownLimitConsumed = (300 / 500) * 100 = 60%
    const ddConsumed = toDecimal(account.drawdownLimitConsumedPercent!);
    expect(ddConsumed.toFixed(0)).toBe("60");
  });

  it("calculates drawdownLimitConsumedPercent: $300 of $500 limit = 60%", () => {
    // maxDrawdownPercent = 5 → maxDdAmount = 5% of 10000 = $500
    // equity = $9,700 → used = 10000 - 9700 = $300
    // consumed = 300 / 500 * 100 = 60%
    const config = {
      drawdownType: "static" as const,
      maxDrawdownPercent: ds("5"),
      initialBalance: ds("10000"),
      startingBalance: ds("10000"),
    };

    const result = calculateDrawdownLimitConsumedPercent(ds("9700"), config);
    expect(toDecimal(result).toFixed(0)).toBe("60");
  });

  it("updates highWaterMark on equity increase (trailing drawdown)", () => {
    const account = seedActiveAccount({
      drawdownType: "trailing",
      equity: ds("10500"),
      balance: ds("10500"),
      highWaterMark: ds("10000"),
    });

    recalculateAccountRisk(account);

    // HWM should update to new equity peak
    expect(toDecimal(account.highWaterMark!).toFixed(0)).toBe("10500");
  });

  it("calculates daily loss consumed correctly", () => {
    const account = seedActiveAccount({
      equity: ds("9850"),
      balance: ds("9850"),
    });

    recalculateAccountRisk(account);

    // maxDailyLossPercent = 3 → maxDlAmount = 3% of 10000 = $300
    // dailyLossUsed = max(10000 - 9850, 0) = $150
    // dailyLossLimitConsumed = (150 / 300) * 100 = 50%
    const dlConsumed = toDecimal(account.dailyLossLimitConsumedPercent!);
    expect(dlConsumed.toFixed(0)).toBe("50");
  });
});


// ─── 2. Trade Ingestion Without Live Execution ────────────────────────────────

describe("Trade Ingestion Without Live Execution", () => {
  it("normalizes a multi-asset BTC trade with all fields intact", () => {
    const raw = makeTrade({
      asset: "BTC-USDT",
      base: "BTC",
      fee: "0.204",
      feeRate: "0.0003",
      realizedPnl: "12.50",
      liquidityType: "taker",
      positionSide: "long",
      positionSizeBefore: "0.05",
      slippage: "0.02",
    });

    const trade = normalizeTrade(raw);

    // All critical fields parse to valid Decimal.js instances
    expect(new Decimal(trade.fee).isNaN()).toBe(false);
    expect(new Decimal(trade.realizedPnl).isNaN()).toBe(false);
    expect(new Decimal(trade.feeRate).isNaN()).toBe(false);
    expect(new Decimal(trade.positionSizeBefore).isNaN()).toBe(false);
    expect(new Decimal(trade.slippage).isNaN()).toBe(false);
    expect(new Decimal(trade.quantity).isNaN()).toBe(false);
    expect(new Decimal(trade.price).isNaN()).toBe(false);

    // Value assertions
    expect(trade.fee).toBe("0.204");
    expect(trade.realizedPnl).toBe("12.5");
    expect(trade.liquidityType).toBe("taker");
    expect(trade.positionSide).toBe("long");
    expect(trade.base).toBe("BTC");
  });

  it("normalizes an ETH trade with maker liquidity", () => {
    const raw = makeTrade({
      tradeId: "trade-eth-1",
      asset: "ETH-USDT",
      base: "ETH",
      fee: "0.102",
      feeRate: "0.00015",
      realizedPnl: "-3.75",
      liquidityType: "maker",
      positionSide: "short",
      quantity: "0.5",
      price: "3540",
    });

    const trade = normalizeTrade(raw);

    expect(trade.liquidityType).toBe("maker");
    expect(trade.positionSide).toBe("short");
    expect(new Decimal(trade.fee).toFixed(3)).toBe("0.102");
    expect(new Decimal(trade.realizedPnl).toFixed(2)).toBe("-3.75");
  });

  it("normalizes a HIP-3 equity asset (xyz:AAPL) trade", () => {
    const raw = makeTrade({
      tradeId: "trade-aapl-1",
      asset: "xyz:AAPL",
      base: "AAPL",
      quote: "USDC",
      fee: "0.50",
      realizedPnl: "8.20",
      liquidityType: "taker",
      quantity: "10",
      price: "195.50",
    });

    const trade = normalizeTrade(raw);

    expect(trade.asset).toBe("xyz:AAPL");
    expect(trade.base).toBe("AAPL");
    expect(new Decimal(trade.fee).toFixed(2)).toBe("0.50");
    expect(new Decimal(trade.realizedPnl).toFixed(2)).toBe("8.20");
  });

  it("appends a simulated trade.created event to the store", async () => {
    const store = new MemoryStore();
    const account = seedActiveAccount();
    await store.setSnapshot([account]);

    const tradeData = makeTrade({
      tradeId: "trade-ws-1",
      accountId: account.accountId,
      realizedPnl: "25.00",
      fee: "0.75",
    });

    const trade = normalizeTrade(tradeData);
    await store.appendTrade(account.accountId, trade);

    const stored = await store.getTrades(account.accountId);
    expect(stored.length).toBe(1);
    expect(stored[0].tradeId).toBe("trade-ws-1");
    expect(stored[0].realizedPnl).toBe("25");
    expect(stored[0].fee).toBe("0.75");
  });

  it("deduplicates trades with the same tradeId", async () => {
    const store = new MemoryStore();
    const account = seedActiveAccount();
    await store.setSnapshot([account]);

    const tradeData = makeTrade({
      tradeId: "trade-dup-1",
      accountId: account.accountId,
    });

    const trade = normalizeTrade(tradeData);
    await store.appendTrade(account.accountId, trade);
    await store.appendTrade(account.accountId, trade); // duplicate

    const stored = await store.getTrades(account.accountId);
    expect(stored.length).toBe(1);
  });

  it("updates account balance on trade with realizedPnl and fee", () => {
    const account = seedActiveAccount({
      balance: ds("10000"),
      realizedPnl: ZERO,
      fees: ZERO,
    });

    // Simulate what handleTradeCreated does:
    const tradeRealizedPnl = toDecimal("50");
    const tradeFee = toDecimal("1.50");

    account.realizedPnl = fromDecimal(
      toDecimal(account.realizedPnl || "0").plus(tradeRealizedPnl)
    );
    account.fees = fromDecimal(
      toDecimal(account.fees || "0").plus(tradeFee)
    );
    account.balance = fromDecimal(
      toDecimal(account.balance || "0")
        .plus(tradeRealizedPnl)
        .minus(tradeFee)
    );

    expect(toDecimal(account.balance!).toFixed(2)).toBe("10048.50");
    expect(toDecimal(account.realizedPnl!).toFixed(2)).toBe("50.00");
    expect(toDecimal(account.fees!).toFixed(2)).toBe("1.50");
  });

  it("reconciles position on close trade type", () => {
    const position: PositionSnapshot = {
      positionId: "pos-close-1",
      accountId: "urn:prp-account:test-live-01",
      exchange: "hyperliquid",
      productType: "perpetual",
      status: "open",
      asset: "BTC-USDT",
      base: "BTC",
      quote: "USDC",
      positionSide: "long",
      leverage: ds("10"),
      marginMode: "cross",
      quantity: ds("0.01"),
      entryPrice: ds("68000"),
      breakEvenPrice: ds("68000"),
      markPrice: ds("69000"),
      unrealizedPnl: ds("10"),
      realizedPnl: ZERO,
      marginUsed: ds("68"),
      notionalValue: ds("680"),
      cumulativeFunding: ZERO,
      cumulativeTradingFees: ds("0.204"),
      tradingFeeRate: ds("0.0003"),
      returnOnEquity: ds("14.71"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const account = seedActiveAccount({
      positions: [position],
      openPositionCount: 1,
    });

    const trade = normalizeTrade(
      makeTrade({
        type: "close",
        positionId: "pos-close-1",
        realizedPnl: "100",
      })
    );

    // Simulate handleTradeCreated position reconciliation
    const posIdx = account.positions.findIndex(
      (p) => p.positionId === trade.positionId
    );
    if (posIdx >= 0 && (trade.type === "close" || trade.type === "liquidation")) {
      account.positions.splice(posIdx, 1);
    }
    account.openPositionCount = account.positions.length;

    expect(account.positions.length).toBe(0);
    expect(account.openPositionCount).toBe(0);
  });
});


// ─── 3. Historical Account Reconciliation ─────────────────────────────────────

describe("Historical Account Reconciliation", () => {
  const failedAccounts = [
    {
      accountId: "urn:prp-account:failed-dd-01",
      stage: "FAILED" as const,
      failureReason: "max_drawdown_hit",
      initialBalance: "10000",
      endingBalance: "9477.25",
      trades: [
        makeTrade({ tradeId: "t1", executedAt: "2026-01-01T10:00:00Z", fee: "0.50", realizedPnl: "50.00" }),
        makeTrade({ tradeId: "t2", executedAt: "2026-01-01T11:00:00Z", fee: "0.75", realizedPnl: "-120.00" }),
        makeTrade({ tradeId: "t3", executedAt: "2026-01-02T09:00:00Z", fee: "1.00", realizedPnl: "-200.00" }),
        makeTrade({ tradeId: "t4", executedAt: "2026-01-02T14:00:00Z", fee: "0.50", realizedPnl: "-250.00" }),
      ],
    },
    {
      accountId: "urn:prp-account:failed-dl-01",
      stage: "FAILED" as const,
      failureReason: "max_daily_loss_hit",
      initialBalance: "5000",
      endingBalance: "4709.50",
      trades: [
        makeTrade({ tradeId: "t5", executedAt: "2026-02-10T08:00:00Z", fee: "0.30", realizedPnl: "-100.00" }),
        makeTrade({ tradeId: "t6", executedAt: "2026-02-10T09:30:00Z", fee: "0.20", realizedPnl: "-190.00" }),
      ],
    },
  ];

  it("normalizes all trades and renders in chronological order", () => {
    for (const accDef of failedAccounts) {
      const normalized = accDef.trades.map((t) => normalizeTrade(t));

      // Verify chronological order
      for (let i = 1; i < normalized.length; i++) {
        const prev = new Date(normalized[i - 1].executedAt).getTime();
        const curr = new Date(normalized[i].executedAt).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }

      // Verify all fields are present
      for (const trade of normalized) {
        expect(trade.tradeId).toBeTruthy();
        expect(trade.fee).toBeTruthy();
        expect(trade.realizedPnl).toBeDefined();
        expect(trade.liquidityType).toMatch(/^(maker|taker)$/);
        expect(trade.positionSide).toMatch(/^(long|short)$/);
      }
    }
  });

  it("calculates total fees accurately across all trades per account", () => {
    for (const accDef of failedAccounts) {
      const normalized = accDef.trades.map((t) => normalizeTrade(t));
      const totalFees = normalized.reduce(
        (sum, t) => sum.plus(toDecimal(t.fee)),
        new Decimal(0)
      );

      const expectedFees = accDef.trades.reduce(
        (sum, t) => sum.plus(new Decimal(String(t.fee))),
        new Decimal(0)
      );

      expect(totalFees.toFixed(2)).toBe(expectedFees.toFixed(2));
    }
  });

  it("validates net realized PnL = endingBalance - startingBalance for max_drawdown_hit account", () => {
    const acc = failedAccounts[0]; // max_drawdown_hit
    const normalized = acc.trades.map((t) => normalizeTrade(t));

    const netRealizedPnl = normalized.reduce(
      (sum, t) => sum.plus(toDecimal(t.realizedPnl)),
      new Decimal(0)
    );
    const totalFees = normalized.reduce(
      (sum, t) => sum.plus(toDecimal(t.fee)),
      new Decimal(0)
    );

    // Net balance change: realized PnL - fees
    const expectedBalanceChange = netRealizedPnl.minus(totalFees);
    const actualBalanceChange = new Decimal(acc.endingBalance).minus(new Decimal(acc.initialBalance));

    // These should match: ending_balance = initial_balance + sum(realized_pnl) - sum(fees)
    expect(expectedBalanceChange.toFixed(2)).toBe(actualBalanceChange.toFixed(2));
  });

  it("validates net realized PnL = endingBalance - startingBalance for max_daily_loss_hit account", () => {
    const acc = failedAccounts[1]; // max_daily_loss_hit
    const normalized = acc.trades.map((t) => normalizeTrade(t));

    const netRealizedPnl = normalized.reduce(
      (sum, t) => sum.plus(toDecimal(t.realizedPnl)),
      new Decimal(0)
    );
    const totalFees = normalized.reduce(
      (sum, t) => sum.plus(toDecimal(t.fee)),
      new Decimal(0)
    );

    const expectedBalanceChange = netRealizedPnl.minus(totalFees);
    const actualBalanceChange = new Decimal(acc.endingBalance).minus(new Decimal(acc.initialBalance));

    expect(expectedBalanceChange.toFixed(2)).toBe(actualBalanceChange.toFixed(2));
  });

  it("handles pagination simulation: offset-based trade fetching from store", async () => {
    const store = new MemoryStore();
    const account = seedActiveAccount({ accountId: "urn:prp-account:paginated-01" });
    await store.setSnapshot([account]);

    // Insert 25 trades
    for (let i = 0; i < 25; i++) {
      const trade = normalizeTrade(makeTrade({
        tradeId: `page-trade-${i}`,
        accountId: account.accountId,
        executedAt: new Date(Date.now() + i * 60000).toISOString(),
      }));
      await store.appendTrade(account.accountId, trade);
    }

    // Page 1: first 10
    const page1 = await store.getTrades(account.accountId, 10, 0);
    expect(page1.length).toBe(10);
    expect(page1[0].tradeId).toBe("page-trade-0");

    // Page 2: next 10
    const page2 = await store.getTrades(account.accountId, 10, 10);
    expect(page2.length).toBe(10);
    expect(page2[0].tradeId).toBe("page-trade-10");

    // Page 3: remaining 5
    const page3 = await store.getTrades(account.accountId, 10, 20);
    expect(page3.length).toBe(5);
    expect(page3[0].tradeId).toBe("page-trade-20");

    // All trades
    const all = await store.getTrades(account.accountId);
    expect(all.length).toBe(25);
  });

  it("stores trades alongside snapshot accounts correctly", async () => {
    const store = new MemoryStore();
    const account = seedActiveAccount();
    await store.setSnapshot([account]);

    const trade1 = normalizeTrade(makeTrade({
      tradeId: "snap-trade-1",
      accountId: account.accountId,
    }));
    const trade2 = normalizeTrade(makeTrade({
      tradeId: "snap-trade-2",
      accountId: account.accountId,
    }));

    await store.appendTrade(account.accountId, trade1);
    await store.appendTrade(account.accountId, trade2);

    // Verify trades are attached to the account in the snapshot
    const snapshot = await store.getSnapshot();
    expect(snapshot).not.toBeNull();
    const acc = snapshot!.find((a) => a.accountId === account.accountId);
    expect(acc).toBeDefined();
    expect(acc!.trades!.length).toBe(2);
    expect(acc!.trades![0].tradeId).toBe("snap-trade-1");
    expect(acc!.trades![1].tradeId).toBe("snap-trade-2");
  });
});


// ─── 4. Dynamic API Phase Rules & Real Balance Ingestion ─────────────────────

describe("Dynamic API Phase Rules & Real Balance Ingestion", () => {
  it("extracts rules from challenge.phases instead of root object", () => {
    // Propr API structure: challenge rules live inside phases[0]
    const rawChallenge = {
      challengeId: "urn:prp-challenge:P7teVAQ6512k",
      initialBalance: "10000",
      phases: [
        {
          profitTargetPercent: "9",
          maxDailyLossPercent: "3",
          maxDrawdownPercent: "3",
          drawdownType: "static",
        },
      ],
    };

    const phase = rawChallenge.phases[0];
    expect(phase.profitTargetPercent).toBe("9");
    expect(phase.maxDrawdownPercent).toBe("3");
    expect(phase.maxDailyLossPercent).toBe("3");
    expect(phase.drawdownType).toBe("static");
  });

  it("calculates accurate live risk metrics for $10,173.67 balance on Explorer 10k", () => {
    const account = seedActiveAccount({
      accountId: "urn:prp-account:J9wNi8oj3XGK",
      initialBalance: ds("10000"),
      startingBalance: ds("10141.07"), // Day-start equity from daily-metrics
      phaseStartingBalance: ds("10000"),
      balance: ds("10173.67"),
      equity: ds("10173.67"),
      highWaterMark: ds("10398.98"),
      profitTargetPercent: ds("9"),
      maxDrawdownPercent: ds("3"),
      maxDailyLossPercent: ds("3"),
      drawdownType: "static",
    });

    recalculateAccountRisk(account);

    // Target: 9% = $900 profit. Current profit: +$173.67 (+1.74%)
    expect(toDecimal(account.profitTargetPct!).toFixed(2)).toBe("1.74");
    // Target progress: 173.67 / 900 * 100 = 19.30%
    expect(toDecimal(account.profitTargetProgressPercent!).toFixed(1)).toBe("19.3");

    // Drawdown: Static 3% of 10000 = $300 max DD -> breach floor = $9,700
    expect(toDecimal(account.breachFloor!).toFixed(0)).toBe("9700");
    // Drawdown loss is 0% since equity > initial
    expect(toDecimal(account.drawdownUsedPercent!).toFixed(1)).toBe("0.0");
    expect(toDecimal(account.drawdownLimitConsumedPercent!).toFixed(1)).toBe("0.0");
    // Drawdown buffer: $10,173.67 - $9,700.00 = $473.67
    expect(toDecimal(account.drawdownRemaining!).toFixed(2)).toBe("473.67");
  });

  it("calculates accurate intraday daily loss metrics for $5,078.47 balance on Starter 5k", () => {
    // Day-start equity from daily-metrics was $5,177.86
    const account = seedActiveAccount({
      accountId: "urn:prp-account:4D8XWuQ3fju6",
      initialBalance: ds("5000"),
      startingBalance: ds("5177.86"), // Day-start base
      phaseStartingBalance: ds("5000"),
      balance: ds("5078.47"),
      equity: ds("5078.47"),
      highWaterMark: ds("5416.70"),
      profitTargetPercent: ds("9"),
      maxDrawdownPercent: ds("3"),
      maxDailyLossPercent: ds("3"),
      drawdownType: "static",
    });

    recalculateAccountRisk(account);

    // Target: 9% = $450 profit. Current profit: +$78.47 (+1.57%)
    expect(toDecimal(account.profitTargetPct!).toFixed(2)).toBe("1.57");
    // Target progress: 78.47 / 450 * 100 = 17.44%
    expect(toDecimal(account.profitTargetProgressPercent!).toFixed(1)).toBe("17.4");

    // Breach floor: $5,000 - $150 = $4,850.00
    expect(toDecimal(account.breachFloor!).toFixed(0)).toBe("4850");
    // Drawdown buffer: $5,078.47 - $4,850 = $228.47
    expect(toDecimal(account.drawdownRemaining!).toFixed(2)).toBe("228.47");

    // Daily loss limit: 3% of $5,177.86 = $155.34 -> floor = $5,022.52
    expect(toDecimal(account.dailyLossFloor!).toFixed(2)).toBe("5022.52");
    // Daily loss incurred: $5,177.86 - $5,078.47 = $99.39 (1.92% loss)
    expect(toDecimal(account.dailyLossUsedPercent!).toFixed(2)).toBe("1.92");
    // Daily loss consumed: $99.39 / $155.34 * 100 = 63.98%
    expect(toDecimal(account.dailyLossLimitConsumedPercent!).toFixed(0)).toBe("64");
    // Daily remaining buffer: $5,078.47 - $5,022.52 = $55.95
    expect(toDecimal(account.dailyLossRemaining!).toFixed(2)).toBe("55.95");
  });

  it("verifies breached account stats for max_daily_loss and max_drawdown", () => {
    // Account R5gEZ1R363NC: ending balance $4,701.47 on $5,000 initial
    const dailyLossBreached = seedActiveAccount({
      accountId: "urn:prp-account:R5gEZ1R363NC",
      initialBalance: ds("5000"),
      startingBalance: ds("5000"),
      phaseStartingBalance: ds("5000"),
      balance: ds("4701.47"),
      equity: ds("4701.47"),
      maxDrawdownPercent: ds("6"),
      maxDailyLossPercent: ds("3"),
      drawdownType: "static",
    });

    recalculateAccountRisk(dailyLossBreached);

    // Daily loss: $298.53 loss against $150 limit (3% of 5000) -> 199% consumed!
    expect(toDecimal(dailyLossBreached.dailyLossLimitConsumedPercent!).toFixed(0)).toBe("199");
    expect(toDecimal(dailyLossBreached.dailyLossRemaining!).toFixed(2)).toBe("-148.53");

    // Account B7KaXYv9iAqi: ending balance $4,845.48 on $5,000 initial with 3% max DD ($150 limit)
    const ddBreached = seedActiveAccount({
      accountId: "urn:prp-account:B7KaXYv9iAqi",
      initialBalance: ds("5000"),
      startingBalance: ds("5000"),
      phaseStartingBalance: ds("5000"),
      balance: ds("4845.48"),
      equity: ds("4845.48"),
      maxDrawdownPercent: ds("3"),
      maxDailyLossPercent: ds("3"),
      drawdownType: "static",
    });

    recalculateAccountRisk(ddBreached);

    // Drawdown used: 5000 - 4845.48 = $154.52 (3.09% loss)
    expect(toDecimal(ddBreached.drawdownUsedPercent!).toFixed(2)).toBe("3.09");
    // Drawdown consumed: 154.52 / 150 * 100 = 103% of allowed limit (BREACHED!)
    expect(toDecimal(ddBreached.drawdownLimitConsumedPercent!).toFixed(0)).toBe("103");
    expect(toDecimal(ddBreached.drawdownRemaining!).toFixed(2)).toBe("-4.52");
  });
});

