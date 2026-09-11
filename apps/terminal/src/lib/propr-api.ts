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
  profitTargetProgressPercent: string;
  maxDrawdownPercent: string;
  drawdownUsedPercent: string;
  drawdownLimitConsumedPercent: string;
  drawdownRemaining: string;
  maxDailyLossPercent: string;
  dailyLossUsedPercent: string;
  dailyLossLimitConsumedPercent: string;
  dailyLossRemaining: string;
  highWaterMark?: string;
  tradingDays?: number;
  requiredTradingDays?: number;
  winRate?: string;
  openPositionCount: number;
  openOrderCount: number;
  positions: PositionData[];
  orders: OrderData[];
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
  firm: string;
  challengeName?: string;
  type: "purchase" | "payout" | "refund" | "adjustment";
  amountUSD: string;
  amountINR?: string;
  bankVerified: boolean;
  invoiceNumber?: string;
  purchaseId?: string;
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
    totalPayoutsUSD: string;
    totalPayoutsINR: string;
    actualCashPnLUSD: string;
    actualCashPnLINR: string;
    activeCapitalUSD: string;
    activeCapitalINR: string;
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
  while (true) {
    const res = await proprGet<{ data: T[]; total: number }>(path, {
      ...params,
      limit: String(limit),
      offset: String(offset),
    });
    all.push(...res.data);
    if (all.length >= res.total || res.data.length < limit) break;
    offset += res.data.length;
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

// ─── Main Data Fetcher ────────────────────────────────────────────────────────

export async function fetchDashboardData(): Promise<DashboardData> {
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
        totalPayoutsUSD: "0",
        totalPayoutsINR: "0",
        actualCashPnLUSD: "0",
        actualCashPnLINR: "0",
        activeCapitalUSD: "0",
        activeCapitalINR: "0",
        ledger: SEED_PURCHASES,
      },
      summary: { activeEvals: 0, funded: 0, passed: 0, failedBreached: 0, totalAccounts: 0 },
    };
  }

  try {
    // Fetch everything in parallel
    const [
      activeAttempts,
      passedAttempts,
      failedAttempts,
      activeIssuances,
      closedIssuances,
      reviewIssuances,
      payoutsRaw,
    ] = await Promise.all([
      fetchAllPages<Record<string, unknown>>("/challenge-attempts", { status: "active" }).catch(() => []),
      fetchAllPages<Record<string, unknown>>("/challenge-attempts", { status: "passed" }).catch(() => []),
      fetchAllPages<Record<string, unknown>>("/challenge-attempts", { status: "failed" }).catch(() => []),
      fetchAllPages<Record<string, unknown>>("/book-account-issuances", { status: "active" }).catch(() => []),
      fetchAllPages<Record<string, unknown>>("/book-account-issuances", { status: "closed" }).catch(() => []),
      fetchAllPages<Record<string, unknown>>("/book-account-issuances", { status: "review_pending" }).catch(() => []),
      fetchAllPages<Record<string, unknown>>("/payouts/history").catch(() => []),
    ]);

    const allAttempts = [...activeAttempts, ...passedAttempts, ...failedAttempts];
    const allIssuances = [...activeIssuances, ...closedIssuances, ...reviewIssuances];

    // Build account universe
    const accountMap = new Map<string, { attempt?: Record<string, unknown>; issuance?: Record<string, unknown> }>();
    for (const a of allAttempts) {
      const id = a.accountId as string;
      accountMap.set(id, { ...accountMap.get(id), attempt: a });
    }
    for (const i of allIssuances) {
      const id = i.accountId as string;
      accountMap.set(id, { ...accountMap.get(id), issuance: i });
    }

    // Process each account
    const accounts: AccountSnapshot[] = [];
    const allPositions: PositionData[] = [];
    const allOrders: OrderData[] = [];

    for (const [accountId, { attempt, issuance }] of accountMap) {
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

        allPositions.push(...positions);
        allOrders.push(...orders);

        // Challenge config & account details
        const challenge = attempt?.challenge as Record<string, unknown> | undefined;
        const rawAcc = (attempt?.account || issuance?.account) as Record<string, unknown> | undefined;
        const purchaseId = (attempt?.purchaseId || issuance?.purchaseId) as string | undefined;
        const drawdownType = (challenge?.drawdownType || "static") as string;

        const initialBalance = (issuance?.initialBalance || challenge?.initialBalance || "0") as string;
        const maxDrawdownPercent = (issuance?.maxDrawdownPercent || challenge?.maxDrawdownPercent || "0") as string;
        const maxDailyLossPercent = (issuance?.maxDailyLossPercent || challenge?.maxDailyLossPercent || "0") as string;
        const profitTargetPercent = (challenge?.profitTargetPercent || "0") as string;
        const highWaterMark = (rawAcc?.highWaterMark || issuance?.highWaterMark || initialBalance) as string;
        const isolatedMargin = d(rawAcc?.isolatedPositionMargin as string || "0");

        // Calculate PnL
        let totalUpnl = new Decimal(0);
        let totalRpnl = new Decimal(0);
        let totalFees = new Decimal(0);
        for (const pos of positions) {
          totalUpnl = totalUpnl.plus(d(pos.unrealizedPnl));
          totalRpnl = totalRpnl.plus(d(pos.realizedPnl));
          totalFees = totalFees.plus(d(pos.cumulativeTradingFees));
        }

        const attemptPnl = attempt?.totalPnl ? d(attempt.totalPnl as string) : new Decimal(0);
        const balance = d(initialBalance).plus(attemptPnl);
        const equity = balance.plus(totalUpnl).plus(isolatedMargin);

        // Drawdown calculation (static vs trailing)
        const maxDdPct = d(maxDrawdownPercent);
        const maxDdAmount = maxDdPct.div(100).times(d(initialBalance));
        let ddLimit = d(initialBalance).minus(maxDdAmount);
        let ddUsedAmount = Decimal.max(d(initialBalance).minus(equity), 0);

        if (drawdownType === "trailing") {
          const hwm = d(highWaterMark || initialBalance);
          ddLimit = Decimal.min(hwm.minus(maxDdAmount), d(initialBalance));
          ddUsedAmount = Decimal.max(hwm.minus(equity), 0);
        }

        const ddRemaining = equity.minus(ddLimit);
        const ddUsedPct = d(initialBalance).gt(0)
          ? ddUsedAmount.div(d(initialBalance)).times(100)
          : new Decimal(0);
        const ddLimitConsumed = maxDdAmount.gt(0)
          ? ddUsedAmount.div(maxDdAmount).times(100)
          : new Decimal(0);

        // Daily loss calculation against day-start base
        const maxDlPct = d(maxDailyLossPercent);
        const dayStartBalance = d(
          (attempt?.failureDetails as Record<string, unknown>)?.dayStartBalance as string ||
          (attempt?.phases as Array<Record<string, unknown>>)?.[0]?.startingBalance as string ||
          initialBalance
        );
        const dailyLossBase = dayStartBalance.plus(isolatedMargin);
        const maxDlAmount = maxDlPct.div(100).times(dailyLossBase);
        const dlLimit = dailyLossBase.minus(maxDlAmount);
        const dlUsedAmount = Decimal.max(dailyLossBase.minus(equity), 0);
        const dlRemaining = equity.minus(dlLimit);
        const dlUsedPct = dailyLossBase.gt(0)
          ? dlUsedAmount.div(dailyLossBase).times(100)
          : new Decimal(0);
        const dlLimitConsumed = maxDlAmount.gt(0)
          ? dlUsedAmount.div(maxDlAmount).times(100)
          : new Decimal(0);

        // Profit target progress
        const ptProgress = d(profitTargetPercent).gt(0)
          ? equity.minus(d(initialBalance)).div(d(initialBalance)).times(100).div(d(profitTargetPercent)).times(100)
          : new Decimal(0);

        const rawName = challenge?.name;
        const challengeName = typeof rawName === "object" && rawName !== null
          ? (rawName as Record<string, string>).en || Object.values(rawName as Record<string, string>)[0] || "Starter Turbo"
          : (rawName as string) || "Starter Turbo";

        accounts.push({
          accountId,
          firm: "Propr",
          stage,
          source,
          challengeName,
          challengeId: attempt?.challengeId as string,
          attemptId: attempt?.attemptId as string,
          issuanceId: issuance?.issuanceId as string,
          currentPhase: attempt?.currentPhase as number,
          accountType: issuance?.accountType as string,
          failureReason: attempt?.failureReason as string,
          closureReason: issuance?.closureReason as string,
          initialBalance,
          startingBalance: initialBalance,
          phaseStartingBalance: initialBalance,
          balance: ds(balance),
          equity: ds(equity),
          realizedPnl: ds(totalRpnl),
          unrealizedPnl: ds(totalUpnl),
          fees: ds(totalFees),
          totalPnl: ds(attemptPnl.gt(0) ? attemptPnl : totalRpnl.plus(totalUpnl)),
          drawdownType,
          profitTargetPercent,
          profitTargetProgressPercent: ds(Decimal.min(Decimal.max(ptProgress, 0), 100)),
          maxDrawdownPercent,
          drawdownUsedPercent: ds(Decimal.max(ddUsedPct, 0)),
          drawdownLimitConsumedPercent: ds(Decimal.min(Decimal.max(ddLimitConsumed, 0), 100)),
          drawdownRemaining: ds(Decimal.max(ddRemaining, 0)),
          maxDailyLossPercent,
          dailyLossUsedPercent: ds(Decimal.max(dlUsedPct, 0)),
          dailyLossLimitConsumedPercent: ds(Decimal.min(Decimal.max(dlLimitConsumed, 0), 100)),
          dailyLossRemaining: ds(Decimal.max(dlRemaining, 0)),
          highWaterMark,
          tradingDays: attempt?.tradingDays as number,
          requiredTradingDays: challenge?.requiredTradingDays as number,
          winRate: attempt?.winRate as string,
          openPositionCount: positions.length,
          openOrderCount: orders.length,
          positions,
          orders,
          purchaseId,
          purchaseCostUSD: "0",
          payoutsWithdrawnUSD: "0",
          actualCashPnLUSD: "0",
          lastUpdatedAt: now,
        });
      } catch (err) {
        console.error(`Error processing account ${accountId}:`, err);
      }
    }

    // Sort accounts: active/funded first, then active evals, etc.
    const sortPriority: Record<AccountStage, number> = {
      FUNDED: 0, EVALUATION: 1, PASSED: 2, REVIEW_PENDING: 3,
      FAILED: 4, BREACHED: 5, CLOSED: 6, UNKNOWN: 7,
    };
    accounts.sort((a, b) => (sortPriority[a.stage] ?? 99) - (sortPriority[b.stage] ?? 99));

    // Payouts
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

    // Finance calculations (accounting for purchases, refunds, and adjustments)
    const ledger = SEED_PURCHASES;
    let totalPurchases = new Decimal(0);
    let totalRefunds = new Decimal(0);
    let totalAdjustments = new Decimal(0);
    for (const tx of ledger) {
      if (tx.type === "purchase") totalPurchases = totalPurchases.plus(d(tx.amountUSD));
      if (tx.type === "refund") totalRefunds = totalRefunds.plus(d(tx.amountUSD));
      if (tx.type === "adjustment") totalAdjustments = totalAdjustments.plus(d(tx.amountUSD));
    }
    const totalInvested = totalPurchases.minus(totalRefunds);

    let totalPayouts = new Decimal(0);
    for (const p of payouts) {
      if (p.status === "processed") {
        totalPayouts = totalPayouts.plus(d(p.userAmount || p.amount));
      }
    }

    const cashPnl = totalPayouts.minus(totalInvested).plus(totalAdjustments);
    const rate = d(USD_TO_INR);

    // Link active accounts to purchases to compute true active capital at risk
    const activePurchaseIds = new Set<string>();
    for (const acc of accounts) {
      if ((acc.stage === "EVALUATION" || acc.stage === "FUNDED") && acc.purchaseId) {
        activePurchaseIds.add(acc.purchaseId);
      }
    }
    let activeCapital = new Decimal(0);
    for (const tx of ledger) {
      if (tx.type === "purchase" && activePurchaseIds.has(tx.id)) {
        activeCapital = activeCapital.plus(d(tx.amountUSD));
      }
    }

    // Summary
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
        totalInvestedUSD: ds(totalInvested),
        totalInvestedINR: ds(totalInvested.times(rate)),
        totalPayoutsUSD: ds(totalPayouts),
        totalPayoutsINR: ds(totalPayouts.times(rate)),
        actualCashPnLUSD: ds(cashPnl),
        actualCashPnLINR: ds(cashPnl.times(rate)),
        activeCapitalUSD: ds(activeCapital),
        activeCapitalINR: ds(activeCapital.times(rate)),
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
        totalPayoutsUSD: "0",
        totalPayoutsINR: "0",
        actualCashPnLUSD: "0",
        actualCashPnLINR: "0",
        activeCapitalUSD: "0",
        activeCapitalINR: "0",
        ledger: SEED_PURCHASES,
      },
      summary: { activeEvals: 0, funded: 0, passed: 0, failedBreached: 0, totalAccounts: 0 },
    };
  }
}

