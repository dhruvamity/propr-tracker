import { describe, it, expect } from "vitest";
import { generateMarkdownExport } from "../../apps/terminal/src/lib/export-markdown";
import type { DashboardData, AccountSnapshot, TradeData } from "../../apps/terminal/src/lib/propr-api";

describe("Trader Memory & Capital Audit Markdown Export Generator", () => {
  const mockTrades: TradeData[] = [
    {
      tradeId: "urn:prp-trade:tr-001-abc",
      accountId: "urn:prp-account:acc-breached-63NC",
      asset: "SOL",
      side: "buy",
      positionSide: "long",
      price: 180.5,
      quantity: 10,
      quoteQuantity: 1805,
      realizedPnl: -45.2,
      fee: 1.44,
      executedAt: "2026-03-01T14:20:00Z",
      fillsCount: 2,
    },
    {
      tradeId: "urn:prp-trade:tr-002-xyz",
      accountId: "urn:prp-account:acc-breached-63NC",
      asset: "BTC",
      side: "sell",
      positionSide: "short",
      price: 65200,
      quantity: 0.1,
      quoteQuantity: 6520,
      realizedPnl: 120.0,
      fee: 3.26,
      executedAt: "2026-03-02T10:15:00Z",
      fillsCount: 1,
    },
  ];

  const mockAccounts: AccountSnapshot[] = [
    {
      accountId: "urn:prp-account:J9wNi8oj3XGK",
      challengeName: "Explorer 1-Step Turbo",
      stage: "EVALUATION",
      source: "challenge_attempt",
      balance: 10173.67,
      equity: 10173.67,
      initialBalance: 10000,
      highWaterMark: 10250,
      dailyLossRemaining: 280,
      drawdownRemaining: 720,
      dailyLossUsedAmount: 120,
      dailyLossUsedPercent: 30,
      dailyLossFloor: 9766,
      breachFloor: 9600,
      profitTargetPct: 1.74,
      profitTargetPercent: 8,
      maxDailyLossPercent: 4,
      maxDrawdownPercent: 8,
      realizedPnl: 173.67,
      fees: 98.75,
      trades: [],
    },
    {
      accountId: "urn:prp-account:qeBHuFFg5gMw",
      challengeName: "Starter 1-Step Turbo",
      stage: "BREACHED",
      source: "challenge_attempt",
      balance: 5107.99,
      equity: 5107.99,
      initialBalance: 5000,
      highWaterMark: 5266.62,
      dailyLossRemaining: 0,
      drawdownRemaining: 257.99,
      dailyLossFloor: 4850,
      breachFloor: 4850,
      profitTargetPct: 5.33,
      profitTargetPercent: 8,
      maxDailyLossPercent: 3,
      maxDrawdownPercent: 3,
      failureReason: "max_daily_loss_exceeded",
      failureDetails: {
        dailyLoss: "158.637139",
        limit: "3",
        currentEquity: "5107.990922",
      },
      realizedPnl: 104.08,
      fees: 174.41,
      trades: mockTrades,
    },
  ];

  const mockData: DashboardData = {
    accounts: mockAccounts,
    allPositions: [
      {
        accountId: "urn:prp-account:J9wNi8oj3XGK",
        asset: "ETH",
        positionSide: "long",
        quantity: 1.5,
        entryPrice: 3500,
        markPrice: 3545,
        liquidationPrice: 3100,
        marginUsed: 525,
        unrealizedPnl: 67.5,
        returnOnEquity: 12.85,
      },
    ],
    allOrders: [
      {
        orderId: "ord-1",
        accountId: "urn:prp-account:J9wNi8oj3XGK",
        asset: "ETH",
        side: "sell",
        type: "TAKE_PROFIT_MARKET",
        quantity: 1.5,
        price: 3600,
        status: "NEW",
      },
    ],
    finance: {
      totalInvestedUSD: "518.00",
      totalInvestedINR: "25394.83",
      totalActualCashCostINR: "25394.83",
      activeCapitalUSD: "75.00",
      activeCapitalINR: "7336.19",
      activeActualCashCostINR: "7336.19",
      historicalSunkCashCostINR: "18058.64",
      proprActualCashCostINR: "21559.58",
      breakoutActualCashCostINR: "3835.25",
      totalPayoutsUSD: "0.00",
      totalPayoutsINR: "0.00",
      actualCashPnLUSD: "-265.00",
      actualCashPnLINR: "-25394.83",
      ledger: [
        {
          id: "seed-1",
          date: "2026-08-29",
          firm: "Propr",
          challengeName: "Starter 1-Step Turbo",
          accountId: "urn:prp-account:qeBHuFFg5gMw",
          amountUSD: 18.75,
          amountINR: 1854.83,
          purchaseFaceValueUSD: 18.75,
          actualCashCostINR: 1854.83,
          bankReference: "PRCR/Paysagi_propr.xyz/Bucharest/30-08-2026-1",
          invoiceNumber: "INV-kFEec3h7ALkd",
          bankVerified: true,
        },
      ],
    },
    health: {
      restStatus: "ONLINE",
      wsStatus: "CONNECTED",
      lastSyncAt: "2026-09-12T12:00:00Z",
      accountsCount: 2,
    },
  };

  it("generates markdown containing trader-centric analysis sections", () => {
    const md = generateMarkdownExport(mockData);

    expect(md).toContain("# Prop Firm Trading Portfolio — Comprehensive Performance & Capital Audit Dossier");
    expect(md).toContain("## 1. Capital Budget, Runway & Prop Firm Allocation");
    expect(md).toContain("## 2. Progression & Learning Curve Analysis");
    expect(md).toContain("## 3. Active Accounts Live Status & Target Proximity");
    expect(md).toContain("## 4. Realistic Funded Account Withdrawal & Payout Projections");
    expect(md).toContain("## 5. Strategic Capital Allocation & 20% Discount Recommendation");
    expect(md).toContain("## 6. Current Market Exposures & Resting Orders");
    expect(md).toContain("## 7. Master Accounts Directory & Performance Summary");
    expect(md).toContain("## 8. Account-by-Account Granular Dossiers & Trade Histories");
    expect(md).toContain("## 9. Bank-Verified Purchase Ledger & Invoice Audit");
  });

  it("does not include terminal software jargon or mock diagnostic event streams", () => {
    const md = generateMarkdownExport(mockData);

    expect(md).not.toContain("Recent Diagnostic Events");
    expect(md).not.toContain("Heartbeat 14ms pong acknowledged");
    expect(md).not.toContain("System Architecture & Event Stream");
  });

  it("includes capital runway and 20% discount analysis", () => {
    const md = generateMarkdownExport(mockData);

    expect(md).toContain("Total Allocated Capital Budget");
    expect(md).toContain("Remaining Dry Powder / Runway");
    expect(md).toContain("Evaluation Unit Economics & 20% Discount Opportunity");
    expect(md).toContain("Starter 1-Step Turbo");
    expect(md).toContain("Explorer 1-Step Turbo");
    expect(md).toContain("**$20.00**");
    expect(md).toContain("**$40.00**");
  });

  it("documents near-pass performance and breach cause on #5gMw", () => {
    const md = generateMarkdownExport(mockData);

    expect(md).toContain("Near-Pass Account (`#5gMw`)");
    expect(md).toContain("$5,266.62 (+5.33% net gain)");
    expect(md).toContain("0.67% to 2.67% max");
    expect(md).toContain("max_daily_loss_exceeded");
  });

  it("includes realistic withdrawal projection calculations", () => {
    const md = generateMarkdownExport(mockData);

    expect(md).toContain("Payout Modeling (80% Trader Profit Split)");
    expect(md).toContain("Combined $15,000 Allocation");
    expect(md).toContain("Payback of Total Spent");
  });

  it("includes complete trade execution history and bank settlement audit", () => {
    const md = generateMarkdownExport(mockData);

    expect(md).toContain("Complete Trade Execution History (2 Orders / Fills)");
    expect(md).toContain("**SOL**");
    expect(md).toContain("`BUY`");
    expect(md).toContain("`WIN`");
    expect(md).toContain("`LOSS`");
    expect(md).toContain("`tr-002-xyz`");
    expect(md).toContain("PRCR/Paysagi_propr.xyz/Bucharest/30-08-2026-1");
    expect(md).toContain("INV-kFEec3h7ALkd");
  });
});
