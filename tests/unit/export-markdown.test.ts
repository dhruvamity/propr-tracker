import { describe, it, expect } from "vitest";
import { generateMarkdownExport } from "../../apps/terminal/src/lib/export-markdown";
import type { DashboardData, AccountSnapshot, TradeData } from "../../apps/terminal/src/lib/propr-api";

describe("Markdown System Dossier & Trade Export Generator", () => {
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
      challengeName: "Starter Turbo $10k",
      stage: "EVALUATION",
      source: "challenge_attempt",
      balance: 10250,
      equity: 10320,
      initialBalance: 10000,
      highWaterMark: 10400,
      dailyLossRemaining: 280,
      drawdownRemaining: 720,
      dailyLossUsedAmount: 120,
      dailyLossUsedPercent: 30,
      dailyLossFloor: 9920,
      breachFloor: 9600,
      profitTargetPct: 3.2,
      profitTargetPercent: 9,
      maxDailyLossPercent: 4,
      maxDrawdownPercent: 8,
      realizedPnl: 320,
      fees: 18.5,
      trades: [],
    },
    {
      accountId: "urn:prp-account:acc-breached-63NC",
      challengeName: "Starter Turbo $10k",
      stage: "BREACHED",
      source: "challenge_attempt",
      balance: 9350,
      equity: 9350,
      initialBalance: 10000,
      highWaterMark: 10050,
      dailyLossRemaining: 0,
      drawdownRemaining: 0,
      dailyLossFloor: 9550,
      breachFloor: 9400,
      profitTargetPct: 0,
      profitTargetPercent: 9,
      maxDailyLossPercent: 4,
      maxDrawdownPercent: 6,
      failureReason: "max_trailing_drawdown_exceeded",
      failureDetails: {
        equityAtBreach: 9350,
        breachFloor: 9400,
      },
      realizedPnl: -650,
      fees: 24.2,
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
      totalInvestedINR: "43512.00",
      totalActualCashCostINR: "43512.00",
      activeCapitalUSD: "138.00",
      activeCapitalINR: "11600.00",
      activeActualCashCostINR: "11600.00",
      historicalSunkCashCostINR: "31912.00",
      proprActualCashCostINR: "37512.00",
      breakoutActualCashCostINR: "6000.00",
      totalPayoutsUSD: "0.00",
      totalPayoutsINR: "0.00",
      actualCashPnLUSD: "518.00",
      actualCashPnLINR: "-43512.00",
      ledger: [
        {
          id: "seed-1",
          date: "2026-02-15",
          firm: "Propr",
          challengeName: "Starter Turbo $10k",
          accountId: "urn:prp-account:acc-breached-63NC",
          amountUSD: 69,
          amountINR: 5800,
          purchaseFaceValueUSD: 69,
          actualCashCostINR: 5800,
          bankReference: "HDFC-DEBIT-7782",
          invoiceNumber: "INV-PRP-001",
          bankVerified: true,
        },
      ],
    },
    health: {
      restStatus: "ONLINE",
      wsStatus: "CONNECTED",
      lastSyncAt: "2026-03-03T12:00:00Z",
      accountsCount: 2,
    },
  };

  it("generates markdown containing all system sections", () => {
    const md = generateMarkdownExport(mockData);

    expect(md).toContain("# Propr Trading Terminal — Complete System Dossier & Trade Export");
    expect(md).toContain("## 1. Executive Cash Position & Capital Allocation");
    expect(md).toContain("## 2. Active Risk Proximity & Monitored Accounts");
    expect(md).toContain("## 3. Market Exposures & Resting Orders");
    expect(md).toContain("## 4. Master Accounts Directory & Lifecycle Audit");
    expect(md).toContain("## 5. Account-by-Account Granular Dossiers & Trade Histories");
    expect(md).toContain("## 6. Financial Ledger & Bank Settlement Audit");
    expect(md).toContain("## 7. System Architecture & Event Stream");
  });

  it("includes executive financial numbers with INR and USD reconciliation", () => {
    const md = generateMarkdownExport(mockData);

    expect(md).toContain("Total Actual Cash Spent");
    expect(md).toContain("Active Capital at Risk");
    expect(md).toContain("Historical Sunk Capital");
    expect(md).toContain("**Propr** (`app.propr.xyz`)");
    expect(md).toContain("**Breakout** (`breakoutprop.com`)");
  });

  it("includes both active and breached accounts in directory", () => {
    const md = generateMarkdownExport(mockData);

    expect(md).toContain("`#3XGK`");
    expect(md).toContain("`#63NC`");
    expect(md).toContain("max_trailing_drawdown_exceeded");
  });

  it("includes complete trade execution tables for breached accounts with individual trade metrics", () => {
    const md = generateMarkdownExport(mockData);

    expect(md).toContain("Complete Trade Execution History (2 Orders / Fills)");
    expect(md).toContain("**SOL**");
    expect(md).toContain("`BUY`");
    expect(md).toContain("**BTC**");
    expect(md).toContain("`SELL`");
    expect(md).toContain("`WIN`");
    expect(md).toContain("`LOSS`");
    expect(md).toContain("`tr-002-xyz`");
  });

  it("includes bank-settled ledger rows with reference IDs", () => {
    const md = generateMarkdownExport(mockData);

    expect(md).toContain("HDFC-DEBIT-7782");
    expect(md).toContain("INV-PRP-001");
    expect(md).toContain("VERIFIED");
  });

  it("handles empty positions, orders, and 0-trade accounts cleanly without crashing", () => {
    const emptyData: DashboardData = {
      ...mockData,
      allPositions: [],
      allOrders: [],
      accounts: [
        {
          ...mockAccounts[0],
          trades: [],
        },
      ],
    };

    const md = generateMarkdownExport(emptyData);

    expect(md).toContain("No open positions currently held");
    expect(md).toContain("No pending resting limit or stop-loss orders");
    expect(md).toContain("No trade executions recorded for this account");
  });
});
