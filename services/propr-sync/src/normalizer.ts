// ─── Account Universe Normalizer ──────────────────────────────────────────────
// Transforms raw Propr API data into the normalized AccountSnapshot model.
// This is the central data pipeline.

import type {
  AccountSnapshot,
  ProprChallengeAttempt,
  ProprFundedIssuance,
  PositionSnapshot,
  OrderSnapshot,
  DecimalString,
  PayoutRecord,
  FinanceTransaction,
} from "@propr/data-model";
import { ds, ZERO, toDecimal, fromDecimal, add, sub } from "@propr/data-model";
import { ProprClient } from "@propr/client";
import {
  deriveAccountStage,
  calculateDrawdownUsedPercent,
  calculateDrawdownRemaining,
  calculateDailyLossUsedPercent,
  calculateDailyLossRemaining,
  calculateProfitTargetProgress,
  sumUnrealizedPnl,
} from "@propr/calculations";
import type { DataStore } from "./store.js";
import Decimal from "decimal.js";

interface NormalizeOptions {
  usdToInrRate?: string;
}

/**
 * Build the complete normalized account universe.
 *
 * Steps (per prompt §4):
 * 1. Retrieve all challenge attempts (all statuses)
 * 2. Retrieve all funded issuances (all statuses)
 * 3. Deduplicate by accountId
 * 4. Determine lifecycle stage
 * 5. Retrieve positions, orders, trades for each
 * 6. Retrieve daily metrics (with fallback)
 * 7. Normalize into AccountSnapshot[]
 */
export async function buildAccountUniverse(
  client: ProprClient,
  ledger: FinanceTransaction[],
  payouts: PayoutRecord[],
  options: NormalizeOptions = {}
): Promise<AccountSnapshot[]> {
  const now = new Date().toISOString();

  // 1 & 2. Fetch all challenge attempts and funded issuances
  const [allAttempts, allIssuances] = await Promise.all([
    client.getAllChallengeAttempts(),
    client.getAllFundedIssuances(),
  ]);

  // 3. Build account universe, deduplicating by accountId
  // Map: accountId → { attempt?, issuance? }
  const accountMap = new Map<
    string,
    {
      attempt?: ProprChallengeAttempt;
      issuance?: ProprFundedIssuance;
    }
  >();

  for (const attempt of allAttempts) {
    const existing = accountMap.get(attempt.accountId) || {};
    existing.attempt = attempt;
    accountMap.set(attempt.accountId, existing);
  }

  for (const issuance of allIssuances) {
    const existing = accountMap.get(issuance.accountId) || {};
    existing.issuance = issuance;
    accountMap.set(issuance.accountId, existing);
  }

  // Build ledger lookups
  const ledgerByAccount = new Map<string, FinanceTransaction[]>();
  for (const tx of ledger) {
    if (tx.accountId) {
      const list = ledgerByAccount.get(tx.accountId) || [];
      list.push(tx);
      ledgerByAccount.set(tx.accountId, list);
    }
  }

  const payoutsByAccount = new Map<string, PayoutRecord[]>();
  for (const p of payouts) {
    if (p.accountId) {
      const list = payoutsByAccount.get(p.accountId) || [];
      list.push(p);
      payoutsByAccount.set(p.accountId, list);
    }
  }

  // 4–7. Process each account
  const snapshots: AccountSnapshot[] = [];

  for (const [accountId, { attempt, issuance }] of accountMap) {
    try {
      const snapshot = await normalizeAccount(
        client,
        accountId,
        attempt,
        issuance,
        ledgerByAccount.get(accountId) || [],
        payoutsByAccount.get(accountId) || [],
        now,
        options
      );
      snapshots.push(snapshot);
    } catch (err) {
      // Per-account errors should not take down the entire sync
      console.error(`Error normalizing account ${accountId}:`, err);
      snapshots.push(createErrorSnapshot(accountId, attempt, issuance, now));
    }
  }

  return snapshots;
}

async function normalizeAccount(
  client: ProprClient,
  accountId: string,
  attempt: ProprChallengeAttempt | undefined,
  issuance: ProprFundedIssuance | undefined,
  accountLedger: FinanceTransaction[],
  accountPayouts: PayoutRecord[],
  now: string,
  options: NormalizeOptions
): Promise<AccountSnapshot> {
  // Derive lifecycle stage
  const { stage, source } = deriveAccountStage(attempt, issuance);

  // Fetch trading data in parallel
  const [positions, orders, trades, dailyMetrics] = await Promise.all([
    client.getOpenPositions(accountId).catch(() => [] as PositionSnapshot[]),
    client.getOpenOrders(accountId).catch(() => [] as OrderSnapshot[]),
    client.getTrades(accountId, 50).catch(() => []),
    client.getDailyMetrics(accountId).catch(() => null),
  ]);

  // Get challenge configuration
  const challengeConfig = attempt?.challenge;
  const fundedConfig = issuance;

  // Initial/starting balance
  const initialBalance = ds(
    issuance?.initialBalance ||
      challengeConfig?.initialBalance ||
      "0"
  );
  const startingBalance = ds(
    dailyMetrics?.startingBalance || initialBalance
  );
  const phaseStartingBalance = ds(
    challengeConfig?.initialBalance || initialBalance
  );

  // Calculate total PnL from positions
  const totalUpnl = sumUnrealizedPnl(positions);
  let totalRealizedPnl = new Decimal(0);
  let totalFees = new Decimal(0);
  for (const pos of positions) {
    totalRealizedPnl = totalRealizedPnl.plus(toDecimal(pos.realizedPnl));
    totalFees = totalFees.plus(toDecimal(pos.cumulativeTradingFees));
  }

  // Drawdown config
  const maxDrawdownPercent = ds(
    issuance?.maxDrawdownPercent ||
      challengeConfig?.maxDrawdownPercent ||
      "0"
  );
  const maxDailyLossPercent = ds(
    issuance?.maxDailyLossPercent ||
      challengeConfig?.maxDailyLossPercent ||
      "0"
  );
  const drawdownType = (issuance?.drawdownType ||
    challengeConfig?.drawdownType ||
    "static") as "static" | "trailing";
  const profitTargetPercent = ds(
    challengeConfig?.profitTargetPercent || "0"
  );

  // Use attempt-level totalPnl if available (more reliable than summing positions)
  const attemptTotalPnl = attempt?.totalPnl
    ? ds(attempt.totalPnl)
    : undefined;

  // Estimate balance from initial + totalPnl (if no account.updated data yet)
  const estimatedBalance = attemptTotalPnl
    ? fromDecimal(toDecimal(initialBalance).plus(toDecimal(attemptTotalPnl)))
    : initialBalance;

  // Calculate equity (simplified without account.updated event data)
  const equity = fromDecimal(
    toDecimal(estimatedBalance).plus(toDecimal(totalUpnl))
  );

  // Drawdown calculations
  const ddConfig = {
    drawdownType,
    maxDrawdownPercent,
    initialBalance,
    startingBalance,
  };

  const drawdownUsedPercent =
    maxDrawdownPercent !== ZERO
      ? calculateDrawdownUsedPercent(equity, ddConfig)
      : ZERO;

  const drawdownRemaining =
    maxDrawdownPercent !== ZERO
      ? calculateDrawdownRemaining(equity, ddConfig)
      : ZERO;

  // Daily loss calculations
  const dailyLossBase = dailyMetrics
    ? fromDecimal(
        toDecimal(dailyMetrics.startingBalance).plus(
          toDecimal(dailyMetrics.startingIsolatedPositionMargin)
        )
      )
    : startingBalance;

  const dlConfig = { maxDailyLossPercent, dailyLossBase };
  const dailyLossUsedPercent =
    maxDailyLossPercent !== ZERO
      ? calculateDailyLossUsedPercent(equity, dlConfig)
      : ZERO;
  const dailyLossRemaining =
    maxDailyLossPercent !== ZERO
      ? calculateDailyLossRemaining(equity, dlConfig)
      : ZERO;

  // Profit target progress
  const profitTargetProgressPercent =
    profitTargetPercent !== ZERO
      ? calculateProfitTargetProgress(
          equity,
          phaseStartingBalance,
          profitTargetPercent
        )
      : ZERO;

  // Finance data
  let purchaseCostUSD = ZERO;
  for (const tx of accountLedger) {
    if (tx.type === "purchase") {
      purchaseCostUSD = add(purchaseCostUSD, tx.amountUSD);
    }
  }

  let payoutsWithdrawnUSD = ZERO;
  for (const p of accountPayouts) {
    if (p.status === "processed") {
      payoutsWithdrawnUSD = add(
        payoutsWithdrawnUSD,
        p.userAmount || p.amount
      );
    }
  }

  const actualCashPnLUSD = sub(payoutsWithdrawnUSD, purchaseCostUSD);

  return {
    accountId,
    firm: "Propr",
    stage,
    source,

    challengeName: challengeConfig?.name || attempt?.challengeId,
    challengeId: attempt?.challengeId,
    attemptId: attempt?.attemptId,
    issuanceId: issuance?.issuanceId,
    currentPhase: attempt?.currentPhase,
    accountType: issuance?.accountType,

    failureReason: attempt?.failureReason || undefined,
    closureReason: issuance?.closureReason || undefined,

    initialBalance,
    startingBalance,
    phaseStartingBalance,

    balance: estimatedBalance as DecimalString,
    equity: equity as DecimalString,

    realizedPnl: fromDecimal(totalRealizedPnl),
    unrealizedPnl: totalUpnl,
    fees: fromDecimal(totalFees),
    totalPnl: attemptTotalPnl || fromDecimal(totalRealizedPnl.plus(toDecimal(totalUpnl))),

    drawdownType,
    profitTargetPercent,
    profitTargetProgressPercent,
    maxDrawdownPercent,
    drawdownUsedPercent,
    drawdownRemaining,
    maxDailyLossPercent,
    dailyLossUsedPercent,
    dailyLossRemaining,

    tradingDays: attempt?.tradingDays,
    requiredTradingDays: challengeConfig?.requiredTradingDays,

    winRate: attempt?.winRate ? ds(attempt.winRate) : undefined,

    openPositionCount: positions.length,
    openOrderCount: orders.length,

    positions,
    orders,
    trades,

    purchaseCostUSD,
    payoutsWithdrawnUSD,
    actualCashPnLUSD,

    dataSource: "PROPR_API",
    lastRestSyncAt: now,
    lastUpdatedAt: now,
  };
}

function createErrorSnapshot(
  accountId: string,
  attempt: ProprChallengeAttempt | undefined,
  issuance: ProprFundedIssuance | undefined,
  now: string
): AccountSnapshot {
  const { stage, source } = deriveAccountStage(attempt, issuance);

  return {
    accountId,
    firm: "Propr",
    stage,
    source,
    challengeName: attempt?.challenge?.name,
    attemptId: attempt?.attemptId,
    issuanceId: issuance?.issuanceId,
    openPositionCount: 0,
    openOrderCount: 0,
    positions: [],
    orders: [],
    dataSource: "PROPR_API",
    lastRestSyncAt: now,
    lastUpdatedAt: now,
  };
}
