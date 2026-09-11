// ─── Finance Calculations ─────────────────────────────────────────────────────
// Personal finance metrics: actual cash PnL, ROI, total invested.
// These are distinct from trading PnL.

import type { DecimalString, FinanceTransaction, PayoutRecord } from "@propr/data-model";
import { toDecimal, fromDecimal, ds, ZERO } from "@propr/data-model";
import Decimal from "decimal.js";

/**
 * Calculate actual cash PnL (personal finance metric).
 * Formula: totalPayoutsWithdrawn - totalPropExpenses
 *
 * This is NOT trading PnL. This is: "how much money have I made/lost
 * considering what I spent on challenges vs what I've been paid out."
 */
export function calculateActualCashPnL(
  totalPayoutsWithdrawn: DecimalString | string,
  totalPropExpenses: DecimalString | string
): DecimalString {
  return fromDecimal(
    toDecimal(totalPayoutsWithdrawn).minus(toDecimal(totalPropExpenses))
  );
}

/**
 * Calculate ROI for an account.
 * Formula: (payouts - purchaseCost) / purchaseCost
 * Returns as a percentage. Negative if no payouts yet.
 */
export function calculateROI(
  payouts: DecimalString | string,
  purchaseCost: DecimalString | string
): DecimalString {
  const cost = toDecimal(purchaseCost);
  if (cost.isZero()) return ZERO;

  const roi = toDecimal(payouts).minus(cost).dividedBy(cost).times(100);
  return fromDecimal(roi);
}

/**
 * Calculate total invested (sum of all purchase transactions).
 */
export function calculateTotalInvested(
  transactions: FinanceTransaction[]
): DecimalString {
  let total = new Decimal(0);
  for (const tx of transactions) {
    if (tx.type === "purchase") {
      total = total.plus(toDecimal(tx.amountUSD));
    } else if (tx.type === "refund") {
      total = total.minus(toDecimal(tx.amountUSD));
    }
  }
  return fromDecimal(total);
}

/**
 * Calculate total payouts withdrawn.
 * Only counts successfully processed payouts.
 */
export function calculateTotalPayoutsWithdrawn(
  payouts: PayoutRecord[]
): DecimalString {
  let total = new Decimal(0);
  for (const payout of payouts) {
    if (payout.status === "processed") {
      // Use userAmount if available (excludes Propr's fee), else amount
      total = total.plus(toDecimal(payout.userAmount || payout.amount));
    }
  }
  return fromDecimal(total);
}

/**
 * Calculate active capital at risk (sum of purchase costs for active accounts).
 */
export function calculateActiveCapital(
  transactions: FinanceTransaction[],
  activeAccountIds: string[]
): DecimalString {
  const activeSet = new Set(activeAccountIds);
  let total = new Decimal(0);
  for (const tx of transactions) {
    if (tx.type === "purchase" && tx.accountId && activeSet.has(tx.accountId)) {
      total = total.plus(toDecimal(tx.amountUSD));
    }
  }
  return fromDecimal(total);
}

/**
 * Convert USD to INR using a fixed rate.
 */
export function convertUsdToInr(
  amountUsd: DecimalString | string,
  rate: DecimalString | string
): DecimalString {
  return fromDecimal(toDecimal(amountUsd).times(toDecimal(rate)));
}

/**
 * Calculate spending breakdown by category.
 */
export function calculateSpendingBreakdown(
  transactions: FinanceTransaction[],
  accountStages: Map<string, string>
): {
  totalSpend: DecimalString;
  activeSpend: DecimalString;
  failedSpend: DecimalString;
  fundedSpend: DecimalString;
  passedSpend: DecimalString;
  otherSpend: DecimalString;
} {
  let totalSpend = new Decimal(0);
  let activeSpend = new Decimal(0);
  let failedSpend = new Decimal(0);
  let fundedSpend = new Decimal(0);
  let passedSpend = new Decimal(0);
  let otherSpend = new Decimal(0);

  for (const tx of transactions) {
    if (tx.type !== "purchase") continue;
    const amount = toDecimal(tx.amountUSD);
    totalSpend = totalSpend.plus(amount);

    const stage = tx.accountId
      ? accountStages.get(tx.accountId)
      : undefined;

    switch (stage) {
      case "EVALUATION":
        activeSpend = activeSpend.plus(amount);
        break;
      case "FAILED":
      case "BREACHED":
        failedSpend = failedSpend.plus(amount);
        break;
      case "FUNDED":
        fundedSpend = fundedSpend.plus(amount);
        break;
      case "PASSED":
        passedSpend = passedSpend.plus(amount);
        break;
      default:
        otherSpend = otherSpend.plus(amount);
        break;
    }
  }

  return {
    totalSpend: fromDecimal(totalSpend),
    activeSpend: fromDecimal(activeSpend),
    failedSpend: fromDecimal(failedSpend),
    fundedSpend: fromDecimal(fundedSpend),
    passedSpend: fromDecimal(passedSpend),
    otherSpend: fromDecimal(otherSpend),
  };
}
