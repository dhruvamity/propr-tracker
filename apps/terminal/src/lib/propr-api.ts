// ─── Propr API Server-Side Client ─────────────────────────────────────────────
// This module runs ONLY on the server. API key never reaches the browser.

import { SEED_PURCHASES } from "./finance-data";
import Decimal from "decimal.js";

const API_KEY = process.env.PROPR_API_KEY || "";
const BASE_URL = process.env.PROPR_API_URL || "https://api.propr.xyz/v1";
const USD_TO_INR = process.env.USD_TO_INR || "84.5";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccountStage =
  | "EVALUATION"
  | "PASSED"
  | "FUNDED"
  | "BREACHED"
  | "FAILED"
  | "CLOSED"
  | "REVIEW_PENDING"
  | "UNKNOWN";

export interface AccountSnapshot {
  accountId: string;
  firm: "Propr";
  stage: AccountStage;
  source: "challenge_attempt" | "funded_issuance";
  challengeName?: string;
  challengeId?: string;
  attemptId?: string;
  issuanceId?: string;
  currentPhase?: number;
  accountType?: string;
  failureReason?: string;
  closureReason?: string;
  initialBalance: string;
  startingBalance: string;
  phaseStartingBalance: string;
  balance: string;
  equity: string;
  realizedPnl: string;
  unrealizedPnl: string;
  fees: string;
  totalPnl: string;
  drawdownType?: string;
  profitTargetPercent: string;
  profitTargetPct?: string;
  profitTargetProgressPercent: string;
  toTargetAmount?: string;
  maxDrawdownPercent: string;
  maxDrawdownAmount?: string;
  drawdownUsedPercent: string;
  drawdownUsedAmount?: string;
  drawdownLimitConsumedPercent: string;
  drawdownRemaining: string;
  breachFloor?: string;
  maxDailyLossPercent: string;
  dailyLossLimitAmount?: string;
  dailyLossUsedAmount?: string;
  dailyLossUsedPercent: string;
  dailyLossLimitConsumedPercent: string;
  dailyLossRemaining: string;
  dailyLossFloor?: string;
  failureDetails?: Record<string, unknown>;
  highWaterMark?: string;
  tradingDays?: number;
  requiredTradingDays?: number;
  winRate?: string;
  winLossRatio?: string;
  worstTradeUSD?: string;
  bestTradeUSD?: string;
  closedTradesCount?: number;
  rawFillsCount?: number;
  openPositionCount: number;
  openOrderCount: number;
  positions: PositionData[];
  orders: OrderData[];
  trades?: TradeData[];
  purchaseId?: string;
  purchaseCostUSD: string;
  payoutsWithdrawnUSD: string;
  actualCashPnLUSD: string;
  lastUpdatedAt: string;
}

export interface PositionData {
  positionId: string;
  accountId: string;
  asset: string;
  base: string;
  quote: string;
  positionSide: "long" | "short";
  leverage: string;
  marginMode: "cross" | "isolated";
  quantity: string;
  entryPrice: string;
  markPrice: string;
  liquidationPrice?: string;
  unrealizedPnl: string;
  realizedPnl: string;
  marginUsed: string;
  notionalValue: string;
  returnOnEquity: string;
  cumulativeTradingFees: string;
}

export interface OrderData {
  orderId: string;
  accountId: string;
  asset: string;
  base: string;
  type: string;
  side: "buy" | "sell";
  positionSide: "long" | "short";
  status: string;
  quantity: string;
  price?: string;
  triggerPrice?: string;
  cumulativeQuantity: string;
  createdAt: string;
}

export interface TradeData {
  tradeId: string;
  userId?: string;
  accountId: string;
  orderId?: string;
  positionId?: string;
  exchange?: string;
  type: string;
  liquidityType: "maker" | "taker";
  asset: string;
  base: string;
  quote: string;
  side: "buy" | "sell";
  positionSide: "long" | "short";
  quantity: string;
  price: string;
  quoteQuantity: string;
  fee: string;
  feeAsset?: string;
  feeRate?: string;
  realizedPnl: string;
  slippage?: string;
  executedAt: string;
  createdAt: string;
  fillsCount?: number;
}

export interface PayoutData {
  payoutId: string;
  reason: string;
  status: string;
  amount: string;
  userAmount?: string;
  txHash?: string;
  processedAt?: string;
  createdAt: string;
  accountId?: string;
}

export interface SystemHealth {
  restStatus: "HEALTHY" | "ERROR" | "UNKNOWN";
  wsStatus: "CONNECTED" | "DISCONNECTED" | "ERROR";
  lastSyncAt: string;
  accountCount: number;
  apiHealthy: boolean;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  cashTransactionDate?: string;
  firm: string;
  challengeName?: string;
  type: "purchase" | "payout" | "refund" | "adjustment";
  transactionType?: "purchase" | "payout" | "refund" | "adjustment";
  amountUSD: string;
  amountINR?: string;
  purchaseFaceValueUSD?: string;
  actualCashCostINR?: string;
  bankVerified: boolean;
  bankReference?: string;
  invoiceNumber?: string;
  purchaseId?: string;
  accountId?: string;
  notes?: string;
}

export interface DashboardData {
  accounts: AccountSnapshot[];
  allPositions: PositionData[];
  allOrders: OrderData[];
  payouts: PayoutData[];
  health: SystemHealth;
  finance: {
    totalInvestedUSD: string;
    totalInvestedINR: string;
    proprActualCashCostINR: string;
    breakoutActualCashCostINR: string;
    totalActualCashCostINR: string;
    totalPayoutsUSD: string;
    totalPayoutsINR: string;
    actualCashPnLUSD: string;
    actualCashPnLINR: string;
    activeCapitalUSD: string;
    activeCapitalINR: string;
    activeActualCashCostINR: string;
    historicalSunkCashCostINR: string;
    totalRefundsINR: string;
    totalAdjustmentsINR: string;
    ledger: FinanceTransaction[];
  };
  summary: {
    activeEvals: number;
    funded: number;
    passed: number;
    failedBreached: number;
    totalAccounts: number;
  };
}

// ─── API Fetch Helpers ────────────────────────────────────────────────────────

async function proprGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
    next: { revalidate: 30 }, // ISR: revalidate every 30 seconds
    signal: AbortSignal.timeout(6000), // 6-second timeout prevents Vercel build worker hanging
  });
  if (!res.ok) {
    throw new Error(`Propr API ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchAllPages<T>(path: string, params?: Record<string, string>): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  const limit = 100;
  let pageCount = 0;
  while (pageCount < 10) {
    pageCount++;
    try {
      const res = await proprGet<{ data: T[]; total: number }>(path, {
        ...params,
        limit: String(limit),
        offset: String(offset),
      });
      if (!res || !Array.isArray(res.data) || res.data.length === 0) break;
      all.push(...res.data);
      if (all.length >= (res.total || 0) || res.data.length < limit) break;
      offset += res.data.length;
    } catch {
      break;
    }
  }
  return all;
}

// ─── Lifecycle Engine ─────────────────────────────────────────────────────────

function deriveStage(
  attemptStatus?: string,
  issuanceStatus?: string
): { stage: AccountStage; source: "challenge_attempt" | "funded_issuance" } {
  if (issuanceStatus) {
    const stage: AccountStage =
      issuanceStatus === "active" ? "FUNDED" :
      issuanceStatus === "closed" ? "CLOSED" :
      issuanceStatus === "review_pending" ? "REVIEW_PENDING" : "UNKNOWN";
    return { stage, source: "funded_issuance" };
  }
  if (attemptStatus) {
    const stage: AccountStage =
      attemptStatus === "active" ? "EVALUATION" :
      attemptStatus === "passed" ? "PASSED" :
      attemptStatus === "failed" ? "FAILED" : "UNKNOWN";
    return { stage, source: "challenge_attempt" };
  }
  return { stage: "UNKNOWN", source: "challenge_attempt" };
}

// ─── Decimal Helpers ──────────────────────────────────────────────────────────

function d(v: string | number | undefined | null): Decimal {
  if (v === undefined || v === null || v === "") return new Decimal(0);
  return new Decimal(v);
}
function ds(v: Decimal): string { return v.toString(); }
function dsFixed(v: Decimal, decimals = 2): string { return v.toFixed(decimals); }


// ─── Main Data Fetcher ────────────────────────────────────────────────────────

let inFlightDashboardPromise: Promise<DashboardData> | null = null;
let cachedDashboardResult: { data: DashboardData; timestamp: number } | null = null;

export async function fetchDashboardData(): Promise<DashboardData> {
  const now = Date.now();
  // Cache for 10 seconds during server-side static rendering & rapid page generation
  if (cachedDashboardResult && now - cachedDashboardResult.timestamp < 10000) {
    return cachedDashboardResult.data;
  }

  if (inFlightDashboardPromise) {
    return inFlightDashboardPromise;
  }

  inFlightDashboardPromise = _fetchDashboardDataInternal()
    .then((data) => {
      cachedDashboardResult = { data, timestamp: Date.now() };
      inFlightDashboardPromise = null;
      return data;
    })
    .catch((err) => {
      inFlightDashboardPromise = null;
      throw err;
    });

  return inFlightDashboardPromise;
}

async function _fetchDashboardDataInternal(): Promise<DashboardData> {
  const now = new Date().toISOString();

  if (!API_KEY) {
    return {
      accounts: [],
      allPositions: [],
      allOrders: [],
      payouts: [],
      health: {
        restStatus: "UNKNOWN",
        wsStatus: "DISCONNECTED",
        lastSyncAt: now,
        accountCount: 0,
        apiHealthy: false,
      },
      finance: {
        totalInvestedUSD: "0",
        totalInvestedINR: "0",
        proprActualCashCostINR: "0",
        breakoutActualCashCostINR: "0",
        totalActualCashCostINR: "0",
        totalPayoutsUSD: "0",
        totalPayoutsINR: "0",
        actualCashPnLUSD: "0",
        actualCashPnLINR: "0",
        activeCapitalUSD: "0",
        activeCapitalINR: "0",
        activeActualCashCostINR: "0",
        historicalSunkCashCostINR: "0",
        totalRefundsINR: "0",
        totalAdjustmentsINR: "0",
        ledger: SEED_PURCHASES,
      },
      summary: { activeEvals: 0, funded: 0, passed: 0, failedBreached: 0, totalAccounts: 0 },
    };
  }

  try {
    const [
      allAttemptsRaw,
      allIssuancesRaw,
      payoutsRaw,
      challengesRaw,
    ] = await Promise.all([
      fetchAllPages<Record<string, unknown>>("/challenge-attempts").catch(() => []),
      fetchAllPages<Record<string, unknown>>("/book-account-issuances").catch(() => []),
      fetchAllPages<Record<string, unknown>>("/payouts/history").catch(() => []),
      fetchAllPages<Record<string, unknown>>("/challenges").catch(() => []),
    ]);

    const challengeMap = new Map<string, Record<string, unknown>>();
    for (const ch of challengesRaw) {
      const id = (ch.challengeId || ch.id) as string;
      if (id) challengeMap.set(id, ch);
    }

    const allAttempts = allAttemptsRaw;
    const allIssuances = allIssuancesRaw;

    const accountMap = new Map<string, { attempt?: Record<string, unknown>; issuance?: Record<string, unknown> }>();
    for (const a of allAttempts) {
      const id = a.accountId as string;
      accountMap.set(id, { ...accountMap.get(id), attempt: a });
    }
    for (const i of allIssuances) {
      const id = i.accountId as string;
      accountMap.set(id, { ...accountMap.get(id), issuance: i });
    }

    const accounts: AccountSnapshot[] = [];
    const allPositions: PositionData[] = [];
    const allOrders: OrderData[] = [];

    const accountEntries = Array.from(accountMap.entries());
    const accountResults = await Promise.all(
      accountEntries.map(async ([accountId, { attempt, issuance }]) => {
        try {
          const { stage, source } = deriveStage(
            attempt?.status as string,
            issuance?.status as string
          );

        // Fetch positions & orders for active accounts
        let positions: PositionData[] = [];
        let orders: OrderData[] = [];

        if (stage === "EVALUATION" || stage === "FUNDED") {
          const [posRaw, ordRaw] = await Promise.all([
            fetchAllPages<Record<string, unknown>>(`/accounts/${accountId}/positions`, { status: "open" }).catch(() => []),
            fetchAllPages<Record<string, unknown>>(`/accounts/${accountId}/orders`).catch(() => []),
          ]);

          positions = posRaw
            .filter((p) => d(p.quantity as string).abs().gt(0))
            .map((p) => ({
              positionId: p.positionId as string,
              accountId: p.accountId as string,
              asset: p.asset as string,
              base: p.base as string,
              quote: p.quote as string,
              positionSide: p.positionSide as "long" | "short",
              leverage: (p.leverage as string) || "1",
              marginMode: (p.marginMode as "cross" | "isolated") || "cross",
              quantity: p.quantity as string,
              entryPrice: p.entryPrice as string,
              markPrice: p.markPrice as string,
              liquidationPrice: p.liquidationPrice as string,
              unrealizedPnl: p.unrealizedPnl as string,
              realizedPnl: p.realizedPnl as string,
              marginUsed: p.marginUsed as string,
              notionalValue: p.notionalValue as string,
              returnOnEquity: p.returnOnEquity as string,
              cumulativeTradingFees: p.cumulativeTradingFees as string,
            }));

          orders = ordRaw
            .filter((o) => o.status === "open" || o.status === "pending" || o.status === "partially_filled")
            .map((o) => ({
              orderId: o.orderId as string,
              accountId: o.accountId as string,
              asset: o.asset as string,
              base: o.base as string,
              type: o.type as string,
              side: o.side as "buy" | "sell",
              positionSide: o.positionSide as "long" | "short",
              status: o.status as string,
              quantity: o.quantity as string,
              price: o.price as string,
              triggerPrice: o.triggerPrice as string,
              cumulativeQuantity: o.cumulativeQuantity as string,
              createdAt: o.createdAt as string,
            }));
        }

        const fallbackChallenge = attempt?.challengeId ? challengeMap.get(attempt.challengeId as string) : undefined;
        const challenge = {
          ...fallbackChallenge,
          ...(attempt?.challenge as Record<string, unknown> | undefined),
        };
        let rawAcc = (attempt?.account || issuance?.account) as Record<string, unknown> | undefined;
        if (!rawAcc || !rawAcc.balance) {
          rawAcc = await proprGet<Record<string, unknown>>(`/accounts/${accountId}`).catch(() => rawAcc);
        }
        const purchaseId = (attempt?.purchaseId || issuance?.purchaseId) as string | undefined;

        const tradesRaw = await fetchAllPages<Record<string, unknown>>(`/accounts/${accountId}/trades`).catch(() => []);

        // Aggregate raw fills by orderId to reconstruct true order executions
        const orderMap = new Map<string, {
          tradeId: string;
          userId?: string;
          accountId: string;
          orderId?: string;
          positionId?: string;
          exchange: string;
          type: string;
          liquidityType: "maker" | "taker";
          asset: string;
          base: string;
          quote: string;
          side: "buy" | "sell";
          positionSide: "long" | "short";
          totalQty: Decimal;
          totalQuoteQty: Decimal;
          totalFee: Decimal;
          totalRpnl: Decimal;
          fillsCount: number;
          executedAt: string;
          createdAt: string;
        }>();

        for (const t of tradesRaw) {
          const key = (t.orderId || t.tradeId) as string;
          if (!orderMap.has(key)) {
            orderMap.set(key, {
              tradeId: t.tradeId as string,
              userId: t.userId as string | undefined,
              accountId: t.accountId as string,
              orderId: t.orderId as string | undefined,
              positionId: t.positionId as string | undefined,
              exchange: (t.exchange as string) || "hyperliquid",
              type: (t.type as string) || "open",
              liquidityType: (t.liquidityType as "maker" | "taker") || "taker",
              asset: t.asset as string,
              base: t.base as string,
              quote: (t.quote as string) || "USDC",
              side: t.side as "buy" | "sell",
              positionSide: (t.positionSide as "long" | "short") || "long",
              totalQty: new Decimal(0),
              totalQuoteQty: new Decimal(0),
              totalFee: new Decimal(0),
              totalRpnl: new Decimal(0),
              fillsCount: 0,
              executedAt: (t.executedAt as string) || (t.createdAt as string) || now,
              createdAt: (t.createdAt as string) || now,
            });
          }

          const o = orderMap.get(key)!;
          const qty = d(t.quantity as string);
          const px = d(t.price as string);
          o.totalQty = o.totalQty.plus(qty);
          o.totalQuoteQty = o.totalQuoteQty.plus(qty.times(px));
          o.totalFee = o.totalFee.plus(d(t.fee as string));
          o.totalRpnl = o.totalRpnl.plus(d(t.realizedPnl as string));
          o.fillsCount++;
          if (new Date((t.executedAt as string) || 0).getTime() > new Date(o.executedAt).getTime()) {
            o.executedAt = (t.executedAt as string) || o.executedAt;
          }
        }

        const aggregatedOrders: TradeData[] = Array.from(orderMap.values()).map((o) => ({
          tradeId: o.tradeId,
          userId: o.userId,
          accountId: o.accountId,
          orderId: o.orderId,
          positionId: o.positionId,
          exchange: o.exchange,
          type: o.type,
          liquidityType: o.liquidityType,
          asset: o.asset,
          base: o.base,
          quote: o.quote,
          side: o.side,
          positionSide: o.positionSide,
          quantity: ds(o.totalQty),
          price: o.totalQty.gt(0) ? dsFixed(o.totalQuoteQty.dividedBy(o.totalQty), 4) : "0",
          quoteQuantity: dsFixed(o.totalQuoteQty, 2),
          fee: dsFixed(o.totalFee, 4),
          feeAsset: "USDC",
          realizedPnl: dsFixed(o.totalRpnl, 4),
          executedAt: o.executedAt,
          createdAt: o.createdAt,
          fillsCount: o.fillsCount,
        }));

        // Closed trades are orders that closed/reduced a position with non-zero realized PnL
        const closedTrades = aggregatedOrders
          .filter((t) => !d(t.realizedPnl).isZero())
          .sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime());

        // Use closed trades for account performance tracking (matches PROPR Performance tab 1:1)
        const trades: TradeData[] = closedTrades.length > 0 ? closedTrades : aggregatedOrders;

        // Dynamically extract rules from challenge phases
        const currentPhaseIdx = typeof attempt?.currentPhase === "number" ? (attempt.currentPhase - 1) : 0;
        const phases = ((challenge?.phases || attempt?.phases) as Array<Record<string, unknown>>) || [];
        const phase = phases[currentPhaseIdx] || phases[0] || {};

        const initialBalance = (issuance?.initialBalance || phase?.startingBalance || challenge?.initialBalance || rawAcc?.balance || "0") as string;
        const maxDrawdownPercent = (issuance?.maxDrawdownPercent || phase?.maxDrawdownPercent || challenge?.maxDrawdownPercent || "0") as string;
        const maxDailyLossPercent = (issuance?.maxDailyLossPercent || phase?.maxDailyLossPercent || challenge?.maxDailyLossPercent || "0") as string;
        const profitTargetPercent = (phase?.profitTargetPercent || challenge?.profitTargetPercent || "0") as string;
        const drawdownType = (phase?.drawdownType || challenge?.drawdownType || issuance?.drawdownType || "static") as string;

        // Query daily metrics for live daily loss tracking
        const dailyMetrics = await proprGet<Record<string, unknown>>(`/accounts/${accountId}/daily-metrics`).catch(() => null);

        const dayStartEquity = dailyMetrics?.startingEquity as string | undefined;
        const dayStartBalance = (dailyMetrics?.startingBalance || (attempt?.failureDetails as Record<string, unknown>)?.dayStartBalance) as string | undefined;
        const startingBalance = dayStartEquity || dayStartBalance || initialBalance;
        const phaseStartingBalance = (phase?.startingBalance as string) || initialBalance;

        // Real cash balance directly from account object
        const rawBalance = (rawAcc?.balance || rawAcc?.marginBalance || rawAcc?.crossWalletBalance) as string | undefined;
        const balance = rawBalance
          ? d(rawBalance)
          : attempt?.totalPnl
          ? d(initialBalance).plus(d(attempt.totalPnl as string))
          : d(initialBalance);

        const isolatedMargin = d((rawAcc?.isolatedPositionMargin as string) || "0");

        let totalUpnl = new Decimal(0);
        let totalRpnl = new Decimal(0);
        let totalFees = new Decimal(0);
        for (const pos of positions) {
          totalUpnl = totalUpnl.plus(d(pos.unrealizedPnl));
          totalRpnl = totalRpnl.plus(d(pos.realizedPnl));
          totalFees = totalFees.plus(d(pos.cumulativeTradingFees));
        }

        const equity = balance.plus(totalUpnl).plus(isolatedMargin);
        const highWaterMark = (rawAcc?.highWaterMark || issuance?.highWaterMark || (equity.gt(d(initialBalance)) ? ds(equity) : initialBalance)) as string;

        // Drawdown calculation (static vs trailing)
        const maxDdPct = d(maxDrawdownPercent);
        const maxDdAmount = maxDdPct.div(100).times(d(initialBalance));
        const ddRef = drawdownType === "trailing" ? d(highWaterMark || initialBalance) : d(initialBalance);
        const ddLimit = ddRef.minus(maxDdAmount);
        const ddUsedAmount = Decimal.max(ddRef.minus(equity), 0);
        const ddRemaining = Decimal.max(equity.minus(ddLimit), 0);
        const ddUsedPct = d(initialBalance).gt(0)
          ? ddUsedAmount.div(d(initialBalance)).times(100)
          : new Decimal(0);
        const ddLimitConsumed =
          attempt?.failureReason === "max_drawdown_exceeded"
            ? new Decimal(100)
            : maxDdAmount.gt(0)
            ? ddUsedAmount.div(maxDdAmount).times(100)
            : new Decimal(0);

        // Daily loss calculation against day-start base per Propr Docs:
        // dailyLossBase = startingBalance + startingIsolatedPositionMargin
        const maxDlPct = d(maxDailyLossPercent);
        let dailyLossBase: Decimal;
        let dlLimitAmount: Decimal;
        let dlLimit: Decimal;
        let dlUsedAmount: Decimal;
        let dlRemaining: Decimal;
        let dlUsedPct: Decimal;
        let dlLimitConsumed: Decimal;

        const failureDetails = attempt?.failureDetails as Record<string, unknown> | undefined;

        if (dailyMetrics && dailyMetrics.startingBalance) {
          const dmStartBal = d(dailyMetrics.startingBalance as string);
          const dmStartIso = d((dailyMetrics.startingIsolatedPositionMargin as string) || "0");
          dailyLossBase = dmStartBal.plus(dmStartIso);
          dlLimitAmount = maxDlPct.div(100).times(dailyLossBase);
          dlLimit = dailyLossBase.minus(dlLimitAmount);
          dlUsedAmount = Decimal.max(dailyLossBase.minus(equity), 0);
          dlRemaining = Decimal.max(equity.minus(dlLimit), 0);
          dlUsedPct = dailyLossBase.gt(0) ? dlUsedAmount.div(dailyLossBase).times(100) : new Decimal(0);
          dlLimitConsumed = dlLimitAmount.gt(0) ? dlUsedAmount.div(dlLimitAmount).times(100) : new Decimal(0);
        } else if (failureDetails) {
          // Breached account: retrieve frozen breach snapshot
          const fdStartBal = d((failureDetails.dayStartBalance as string) || initialBalance);
          dailyLossBase = fdStartBal;
          dlLimitAmount = maxDlPct.div(100).times(dailyLossBase);
          dlLimit = d((failureDetails.equityLimit as string) || dailyLossBase.minus(dlLimitAmount).toString());
          dlUsedAmount = d((failureDetails.dailyLoss as string) || "0");
          dlRemaining = new Decimal(0);
          dlUsedPct = d((failureDetails.dailyLossPercent as string) || "0");
          dlLimitConsumed =
            attempt?.failureReason === "max_daily_loss_exceeded"
              ? new Decimal(100)
              : dlLimitAmount.gt(0)
              ? dlUsedAmount.div(dlLimitAmount).times(100)
              : new Decimal(0);
        } else {
          dailyLossBase = d(startingBalance).plus(isolatedMargin);
          dlLimitAmount = maxDlPct.div(100).times(dailyLossBase);
          dlLimit = dailyLossBase.minus(dlLimitAmount);
          dlUsedAmount = Decimal.max(dailyLossBase.minus(equity), 0);
          dlRemaining = Decimal.max(equity.minus(dlLimit), 0);
          dlUsedPct = dailyLossBase.gt(0) ? dlUsedAmount.div(dailyLossBase).times(100) : new Decimal(0);
          dlLimitConsumed = dlLimitAmount.gt(0) ? dlUsedAmount.div(dlLimitAmount).times(100) : new Decimal(0);
        }

        // Profit target calculations
        const profitAmount = equity.minus(d(phaseStartingBalance));
        const profitTargetPct = d(phaseStartingBalance).gt(0)
          ? profitAmount.div(d(phaseStartingBalance)).times(100)
          : new Decimal(0);

        const ptTargetAmount = d(phaseStartingBalance).times(d(profitTargetPercent)).div(100);
        const toTargetAmount = Decimal.max(ptTargetAmount.minus(profitAmount), 0);
        const ptProgress = ptTargetAmount.gt(0)
          ? profitAmount.div(ptTargetAmount).times(100)
          : new Decimal(0);

        // Trade aggregates (dynamic from all historical trades)
        let totalTradeRpnl = new Decimal(0);
        let totalTradeFees = new Decimal(0);
        for (const o of aggregatedOrders) {
          totalTradeRpnl = totalTradeRpnl.plus(d(o.realizedPnl));
          totalTradeFees = totalTradeFees.plus(d(o.fee));
        }

        let winningTradesCount = 0;
        let losingTradesCount = 0;
        let worstTradeNet = new Decimal(0);
        let bestTradeNet = new Decimal(-Infinity);

        for (const t of closedTrades) {
          const net = d(t.realizedPnl).minus(d(t.fee));
          if (net.gt(0)) winningTradesCount++;
          if (net.lt(0)) losingTradesCount++;
          if (net.lt(worstTradeNet)) worstTradeNet = net;
          if (net.gt(bestTradeNet)) bestTradeNet = net;
        }

        const closedTradesCount = closedTrades.length;
        const dynamicWinRate =
          closedTradesCount > 0
            ? `${((winningTradesCount / closedTradesCount) * 100).toFixed(1)}%`
            : (attempt?.winRate as string) || "0.0%";

        const winLossRatio = `${winningTradesCount}W / ${losingTradesCount}L`;
        const worstTradeUSD = closedTradesCount > 0 ? dsFixed(worstTradeNet, 2) : "0.00";
        const bestTradeUSD = closedTradesCount > 0 && !bestTradeNet.equals(-Infinity) ? dsFixed(bestTradeNet, 2) : "0.00";

        const tradingDaysSet = new Set<string>();
        for (const t of aggregatedOrders) {
          if (t.executedAt) {
            tradingDaysSet.add(t.executedAt.slice(0, 10));
          }
        }

        const dynamicTradingDays =
          tradingDaysSet.size > 0
            ? tradingDaysSet.size
            : (attempt?.tradingDays as number) || 1;

        const requiredTradingDays =
          Number(phase?.minTradingDays ?? challenge?.requiredTradingDays ?? 0);

        const rawName = challenge?.name;
        const challengeName = typeof rawName === "object" && rawName !== null
          ? (rawName as Record<string, string>).en || Object.values(rawName as Record<string, string>)[0] || (attempt?.challengeId as string) || "Starter Turbo"
          : (rawName as string) || (attempt?.challengeId as string) || "Starter Turbo";

        const attemptPnl = attempt?.totalPnl ? d(attempt.totalPnl as string) : undefined;
        const totalPnl = attemptPnl ?? (equity.minus(d(initialBalance)));

        return {
          account: {
            accountId,
            firm: "Propr" as const,
            stage,
            source,
            challengeName,
            challengeId: attempt?.challengeId as string,
            attemptId: attempt?.attemptId as string,
            issuanceId: issuance?.issuanceId as string,
            currentPhase: attempt?.currentPhase as number,
            accountType: issuance?.accountType as string,
            failureReason: attempt?.failureReason as string,
            failureDetails,
            closureReason: issuance?.closureReason as string,
            initialBalance,
            startingBalance: ds(dailyLossBase),
            phaseStartingBalance,
            balance: ds(balance),
            equity: ds(equity),
            realizedPnl: ds(totalTradeRpnl),
            unrealizedPnl: ds(totalUpnl),
            fees: ds(totalTradeFees),
            totalPnl: ds(totalPnl),
            drawdownType,
            profitTargetPercent,
            profitTargetPct: dsFixed(profitTargetPct, 2),
            profitTargetProgressPercent: dsFixed(Decimal.min(Decimal.max(ptProgress, 0), 100), 2),
            toTargetAmount: dsFixed(toTargetAmount, 2),
            maxDrawdownPercent,
            maxDrawdownAmount: dsFixed(maxDdAmount, 2),
            drawdownUsedPercent: dsFixed(Decimal.max(ddUsedPct, 0), 2),
            drawdownUsedAmount: dsFixed(Decimal.max(ddUsedAmount, 0), 2),
            drawdownLimitConsumedPercent: dsFixed(Decimal.min(Decimal.max(ddLimitConsumed, 0), 100), 2),
            drawdownRemaining: dsFixed(Decimal.max(ddRemaining, 0), 2),
            breachFloor: dsFixed(ddLimit, 2),
            maxDailyLossPercent,
            dailyLossLimitAmount: dsFixed(dlLimitAmount, 2),
            dailyLossUsedAmount: dsFixed(dlUsedAmount, 2),
            dailyLossUsedPercent: dsFixed(Decimal.max(dlUsedPct, 0), 2),
            dailyLossLimitConsumedPercent: dsFixed(Decimal.min(Decimal.max(dlLimitConsumed, 0), 100), 2),
            dailyLossRemaining: dsFixed(Decimal.max(dlRemaining, 0), 2),
            dailyLossFloor: dsFixed(dlLimit, 2),
            highWaterMark,
            tradingDays: dynamicTradingDays,
            requiredTradingDays,
            winRate: dynamicWinRate,
            winLossRatio,
            worstTradeUSD,
            bestTradeUSD,
            closedTradesCount,
            rawFillsCount: tradesRaw.length,
            openPositionCount: positions.length,
            openOrderCount: orders.length,
            positions,
            orders,
            trades,
            purchaseId,
            purchaseCostUSD: "0",
            payoutsWithdrawnUSD: "0",
            actualCashPnLUSD: "0",
            lastUpdatedAt: now,
          },
          positions,
          orders,
        };
      } catch (err) {
        console.error(`Error processing account ${accountId}:`, err);
        return null;
      }
    })
  );

  for (const res of accountResults) {
    if (res) {
      accounts.push(res.account);
      allPositions.push(...res.positions);
      allOrders.push(...res.orders);
    }
  }

    // Sort accounts: active/funded first, then active evals, etc.
    const sortPriority: Record<AccountStage, number> = {
      FUNDED: 0, EVALUATION: 1, PASSED: 2, REVIEW_PENDING: 3,
      FAILED: 4, BREACHED: 5, CLOSED: 6, UNKNOWN: 7,
    };
    accounts.sort((a, b) => (sortPriority[a.stage] ?? 99) - (sortPriority[b.stage] ?? 99));

    const payouts: PayoutData[] = payoutsRaw.map((p) => ({
      payoutId: p.payoutId as string,
      reason: p.reason as string,
      status: p.status as string,
      amount: p.amount as string,
      userAmount: p.userAmount as string,
      txHash: p.txHash as string,
      processedAt: p.processedAt as string,
      createdAt: p.createdAt as string,
      accountId: p.accountId as string,
    }));

    // Finance calculations (Three-Layer Accounting: Face Value, Actual Cash, Trading Performance)
    const ledger = SEED_PURCHASES;
    const rate = d(USD_TO_INR);

    const activePurchaseIds = new Set<string>();
    const activeAccountIds = new Set<string>();
    for (const acc of accounts) {
      if (acc.stage === "EVALUATION" || acc.stage === "FUNDED") {
        activeAccountIds.add(acc.accountId);
        if (acc.purchaseId) activePurchaseIds.add(acc.purchaseId);
      }
    }

    let proprFaceUSD = new Decimal(0);
    let proprActualCashINR = new Decimal(0);
    let breakoutActualCashINR = new Decimal(0);
    let activeFaceUSD = new Decimal(0);
    let activeActualCashINR = new Decimal(0);
    let sunkActualCashINR = new Decimal(0);
    let totalRefundsINR = new Decimal(0);
    let totalAdjustmentsINR = new Decimal(0);

    for (const tx of ledger) {
      const isPropr = tx.firm.toLowerCase() === "propr";
      const isBreakout = tx.firm.toLowerCase() === "breakout";

      if (tx.type === "purchase") {
        const faceUSD = d(tx.purchaseFaceValueUSD || tx.amountUSD || "0");
        const actualINR = d(tx.actualCashCostINR || tx.amountINR || "0");
        const isActive = Boolean(
          (tx.accountId && activeAccountIds.has(tx.accountId)) ||
          (tx.id && activePurchaseIds.has(tx.id))
        );

        if (isPropr) {
          proprFaceUSD = proprFaceUSD.plus(faceUSD);
          proprActualCashINR = proprActualCashINR.plus(actualINR);
        } else if (isBreakout) {
          breakoutActualCashINR = breakoutActualCashINR.plus(actualINR);
        }

        if (isActive) {
          activeFaceUSD = activeFaceUSD.plus(faceUSD);
          activeActualCashINR = activeActualCashINR.plus(actualINR);
        } else {
          sunkActualCashINR = sunkActualCashINR.plus(actualINR);
        }
      } else if (tx.type === "refund") {
        const inr = d(tx.refundINR || tx.amountINR || "0");
        totalRefundsINR = totalRefundsINR.plus(inr);
      } else if (tx.type === "adjustment") {
        const inr = d(tx.adjustmentINR || tx.amountINR || "0");
        totalAdjustmentsINR = totalAdjustmentsINR.plus(inr);
      }
    }

    const totalActualPropFirmCashCostINR = proprActualCashINR.plus(breakoutActualCashINR);
    const totalActualCashOutflowINR = totalActualPropFirmCashCostINR.minus(totalRefundsINR).minus(totalAdjustmentsINR);

    let totalPayoutsUSD = new Decimal(0);
    let totalPayoutsINR = new Decimal(0);
    for (const p of payouts) {
      if (p.status === "processed") {
        const amtUSD = d(p.userAmount || p.amount);
        totalPayoutsUSD = totalPayoutsUSD.plus(amtUSD);
        totalPayoutsINR = totalPayoutsINR.plus(amtUSD.times(rate));
      }
    }

    const actualCashPnLINR = totalPayoutsINR.minus(totalActualCashOutflowINR);
    const actualCashPnLUSD = rate.isZero() ? new Decimal(0) : actualCashPnLINR.dividedBy(rate);

    const summary = {
      activeEvals: accounts.filter((a) => a.stage === "EVALUATION").length,
      funded: accounts.filter((a) => a.stage === "FUNDED").length,
      passed: accounts.filter((a) => a.stage === "PASSED").length,
      failedBreached: accounts.filter((a) => a.stage === "FAILED" || a.stage === "BREACHED").length,
      totalAccounts: accounts.length,
    };

    return {
      accounts,
      allPositions,
      allOrders,
      payouts,
      health: {
        restStatus: "HEALTHY",
        wsStatus: "DISCONNECTED",
        lastSyncAt: now,
        accountCount: accounts.length,
        apiHealthy: true,
      },
      finance: {
        totalInvestedUSD: ds(proprFaceUSD),
        totalInvestedINR: ds(proprFaceUSD.times(rate)),
        proprActualCashCostINR: ds(proprActualCashINR),
        breakoutActualCashCostINR: ds(breakoutActualCashINR),
        totalActualCashCostINR: ds(totalActualPropFirmCashCostINR),
        totalPayoutsUSD: ds(totalPayoutsUSD),
        totalPayoutsINR: ds(totalPayoutsINR),
        actualCashPnLUSD: ds(actualCashPnLUSD),
        actualCashPnLINR: ds(actualCashPnLINR),
        activeCapitalUSD: ds(activeFaceUSD),
        activeCapitalINR: ds(activeFaceUSD.times(rate)),
        activeActualCashCostINR: ds(activeActualCashINR),
        historicalSunkCashCostINR: ds(sunkActualCashINR),
        totalRefundsINR: ds(totalRefundsINR),
        totalAdjustmentsINR: ds(totalAdjustmentsINR),
        ledger,
      },
      summary,
    };
  } catch (err) {
    console.error("Failed to fetch dashboard data:", err);
    return {
      accounts: [],
      allPositions: [],
      allOrders: [],
      payouts: [],
      health: {
        restStatus: "ERROR",
        wsStatus: "DISCONNECTED",
        lastSyncAt: now,
        accountCount: 0,
        apiHealthy: false,
      },
      finance: {
        totalInvestedUSD: "0",
        totalInvestedINR: "0",
        proprActualCashCostINR: "0",
        breakoutActualCashCostINR: "0",
        totalActualCashCostINR: "0",
        totalPayoutsUSD: "0",
        totalPayoutsINR: "0",
        actualCashPnLUSD: "0",
        actualCashPnLINR: "0",
        activeCapitalUSD: "0",
        activeCapitalINR: "0",
        activeActualCashCostINR: "0",
        historicalSunkCashCostINR: "0",
        totalRefundsINR: "0",
        totalAdjustmentsINR: "0",
        ledger: SEED_PURCHASES,
      },
      summary: { activeEvals: 0, funded: 0, passed: 0, failedBreached: 0, totalAccounts: 0 },
    };
  }
}

