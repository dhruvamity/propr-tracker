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
  calculateDrawdownLimit,
  calculateDrawdownUsedPercent,
  calculateDrawdownLimitConsumedPercent,
  calculateDrawdownRemaining,
  calculateDailyLossLimit,
  calculateDailyLossUsedPercent,
  calculateDailyLossLimitConsumedPercent,
  calculateDailyLossRemaining,
  calculateProfitTargetPercent,
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
 * 3. Retrieve challenges to enrich attempt metadata
 * 4. Deduplicate by accountId
 * 5. Determine lifecycle stage
 * 6. Retrieve positions, orders, trades for each
 * 7. Retrieve daily metrics (with fallback)
 * 8. Normalize into AccountSnapshot[]
 */
export async function buildAccountUniverse(
  client: ProprClient,
  ledger: FinanceTransaction[],
  payouts: PayoutRecord[],
  options: NormalizeOptions = {}
): Promise<AccountSnapshot[]> {
  const now = new Date().toISOString();

  const [allAttempts, allIssuances, rawChallenges] = await Promise.all([
    client.getAllChallengeAttempts(),
    client.getAllFundedIssuances(),
    client.getChallenges().catch(() => []),
  ]);

  const challengeMap = new Map<string, Record<string, unknown>>();
  for (const ch of rawChallenges as Array<Record<string, unknown>>) {
    const id = (ch.challengeId || ch.id) as string;
    if (id) challengeMap.set(id, ch);
  }

  // Map: accountId -> { attempt?, issuance? }
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
        challengeMap,
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
  challengeMap: Map<string, Record<string, unknown>>,
  options: NormalizeOptions
): Promise<AccountSnapshot> {
  const { stage, source } = deriveAccountStage(attempt, issuance);

  const [positions, orders, trades, dailyMetrics] = await Promise.all([
    client.getOpenPositions(accountId).catch(() => [] as PositionSnapshot[]),
    client.getOpenOrders(accountId).catch(() => [] as OrderSnapshot[]),
    client.getTrades(accountId).catch(() => []),
    client.getDailyMetrics(accountId).catch(() => null),
  ]);

  const fallbackChallenge = (attempt?.challengeId
    ? challengeMap.get(attempt.challengeId)
    : undefined) as Record<string, unknown> | undefined;

  const challengeConfig = {
    ...fallbackChallenge,
    ...attempt?.challenge,
  } as ProprChallengeAttempt["challenge"];

  const fundedConfig = issuance;
  const rawAcc = attempt?.account as Record<string, unknown> | undefined;

  const initialBalance = ds(
    issuance?.initialBalance ||
      challengeConfig?.initialBalance ||
      (rawAcc?.balance as string | undefined) ||
      "0"
  );
  const startingBalance = ds(
    dailyMetrics?.startingBalance ||
      (rawAcc?.startingBalance as string | undefined) ||
      initialBalance
  );
  const phaseStartingBalance = ds(
    (attempt?.phases as Array<{ startingBalance?: string }>)?.[0]?.startingBalance ||
      challengeConfig?.initialBalance ||
      initialBalance
  );

  const totalUpnl = sumUnrealizedPnl(positions);
  let totalRealizedPnl = new Decimal(0);
  let totalFees = new Decimal(0);
  for (const pos of positions) {
    totalRealizedPnl = totalRealizedPnl.plus(toDecimal(pos.realizedPnl));
    totalFees = totalFees.plus(toDecimal(pos.cumulativeTradingFees));
  }

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

  const highWaterMark = ds(
    (rawAcc?.highWaterMark as string | undefined) ||
      (issuance?.highWaterMark as string | undefined) ||
      startingBalance
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

  const ddConfig = {
    drawdownType,
    maxDrawdownPercent,
    initialBalance,
    startingBalance,
    highWaterMark,
  };

  const breachFloor =
    maxDrawdownPercent !== ZERO
      ? calculateDrawdownLimit(ddConfig)
      : ZERO;

  const drawdownUsedPercent =
    maxDrawdownPercent !== ZERO
      ? calculateDrawdownUsedPercent(equity, ddConfig)
      : ZERO;

  const drawdownLimitConsumedPercent =
    maxDrawdownPercent !== ZERO
      ? calculateDrawdownLimitConsumedPercent(equity, ddConfig)
      : ZERO;

  const drawdownRemaining =
    maxDrawdownPercent !== ZERO
      ? calculateDrawdownRemaining(equity, ddConfig)
      : ZERO;

  const dailyLossBase = dailyMetrics
    ? fromDecimal(
        toDecimal(dailyMetrics.startingBalance).plus(
          toDecimal(dailyMetrics.startingIsolatedPositionMargin)
        )
      )
    : startingBalance;

  const dlConfig = { maxDailyLossPercent, dailyLossBase };
  const dailyLossFloor =
    maxDailyLossPercent !== ZERO
      ? calculateDailyLossLimit(dlConfig)
      : ZERO;
  const dailyLossUsedPercent =
    maxDailyLossPercent !== ZERO
      ? calculateDailyLossUsedPercent(equity, dlConfig)
      : ZERO;
  const dailyLossLimitConsumedPercent =
    maxDailyLossPercent !== ZERO
      ? calculateDailyLossLimitConsumedPercent(equity, dlConfig)
      : ZERO;
  const dailyLossRemaining =
    maxDailyLossPercent !== ZERO
      ? calculateDailyLossRemaining(equity, dlConfig)
      : ZERO;

  const profitTargetPct =
    phaseStartingBalance !== ZERO
      ? calculateProfitTargetPercent(equity, phaseStartingBalance)
      : ZERO;

  const profitTargetProgressPercent =
    profitTargetPercent !== ZERO && phaseStartingBalance !== ZERO
      ? calculateProfitTargetProgress(
          equity,
          phaseStartingBalance,
          profitTargetPercent
        )
      : ZERO;

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
    profitTargetPct,
    profitTargetProgressPercent,
    maxDrawdownPercent,
    drawdownUsedPercent,
    drawdownLimitConsumedPercent,
    drawdownRemaining,
    breachFloor,
    maxDailyLossPercent,
    dailyLossUsedPercent,
    dailyLossLimitConsumedPercent,
    dailyLossRemaining,
    dailyLossFloor,
    highWaterMark,

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
