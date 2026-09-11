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

/**
 * Calculate active actual cash cost in INR (actual bank debits for currently active accounts).
 * Distinct from active face capital (USD).
 */
export function calculateActiveActualCashCost(
  transactions: FinanceTransaction[],
  activeAccountIds: string[]
): DecimalString {
  const activeSet = new Set(activeAccountIds);
  let total = new Decimal(0);
  for (const tx of transactions) {
    if (tx.type === "purchase" && tx.accountId && activeSet.has(tx.accountId)) {
      const inr = tx.actualCashCostINR || tx.amountINR;
      if (inr) {
        total = total.plus(toDecimal(inr));
      }
    }
  }
  return fromDecimal(total);
}

/**
 * Calculate actual net cash outflow in INR across all prop firms (Propr + Breakout).
 * Formula: sum(actual purchase cash costs) - refunds +/- adjustments
 */
export function calculateActualCashOutflowINR(
  transactions: FinanceTransaction[]
): DecimalString {
  let totalPurchases = new Decimal(0);
  let totalRefunds = new Decimal(0);
  let totalAdjustments = new Decimal(0);

  for (const tx of transactions) {
    if (tx.type === "purchase") {
      const inr = tx.actualCashCostINR || tx.amountINR || "0";
      totalPurchases = totalPurchases.plus(toDecimal(inr));
    } else if (tx.type === "refund") {
      const inr = tx.refundINR || tx.amountINR || "0";
      totalRefunds = totalRefunds.plus(toDecimal(inr));
    } else if (tx.type === "adjustment") {
      const inr = tx.adjustmentINR || tx.amountINR || "0";
      totalAdjustments = totalAdjustments.plus(toDecimal(inr));
    }
  }

  // Net outflow: purchases - refunds - positive adjustments (or + negative adjustments)
  const netOutflow = totalPurchases.minus(totalRefunds).minus(totalAdjustments);
  return fromDecimal(netOutflow);
}

/**
 * Calculate actual cash PnL in INR from actual bank debits, refunds, adjustments, and payouts.
 * Formula (Section 7):
 * Actual Cash PnL = Processed Payouts + Refunds + Positive Adjustments - Actual Purchase Cash Costs - Negative Adjustments
 *                = Processed Payouts - Net Cash Outflow
 */
export function calculateActualCashPnLFromCashLedger(
  transactions: FinanceTransaction[],
  processedPayoutsINR: DecimalString | string = "0"
): DecimalString {
  const netOutflow = toDecimal(calculateActualCashOutflowINR(transactions));
  const payouts = toDecimal(processedPayoutsINR);
  return fromDecimal(payouts.minus(netOutflow));
}

/**
 * Compute the complete 12 aggregates required by Section 10 of Final Financial Reconciliation.
 */
export function calculateThreeLayerFinanceAggregates(
  transactions: FinanceTransaction[],
  activeAccountIds: string[],
  processedPayoutsINR: DecimalString | string = "0"
) {
  const activeSet = new Set(activeAccountIds);

  let proprFaceUSD = new Decimal(0);
  let proprActualCashINR = new Decimal(0);
  let breakoutActualCashINR = new Decimal(0);
  let activeFaceUSD = new Decimal(0);
  let activeActualCashINR = new Decimal(0);
  let sunkActualCashINR = new Decimal(0);
  let totalRefundsINR = new Decimal(0);
  let totalAdjustmentsINR = new Decimal(0);

  for (const tx of transactions) {
    const isPropr = tx.firm.toLowerCase() === "propr";
    const isBreakout = tx.firm.toLowerCase() === "breakout";

    if (tx.type === "purchase") {
      const faceUSD = toDecimal(tx.purchaseFaceValueUSD || tx.amountUSD || "0");
      const actualINR = toDecimal(tx.actualCashCostINR || tx.amountINR || "0");
      const isActive = Boolean(tx.accountId && activeSet.has(tx.accountId));

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
      const inr = toDecimal(tx.refundINR || tx.amountINR || "0");
      totalRefundsINR = totalRefundsINR.plus(inr);
    } else if (tx.type === "adjustment") {
      const inr = toDecimal(tx.adjustmentINR || tx.amountINR || "0");
      totalAdjustmentsINR = totalAdjustmentsINR.plus(inr);
    }
  }

  const totalActualPropFirmCashCostINR = proprActualCashINR.plus(breakoutActualCashINR);
  const totalActualCashOutflowINR = totalActualPropFirmCashCostINR.minus(totalRefundsINR).minus(totalAdjustmentsINR);
  const payoutsINR = toDecimal(processedPayoutsINR);
  const actualCashPnLINR = payoutsINR.minus(totalActualCashOutflowINR);

  return {
    totalProprFacePurchaseValueUSD: proprFaceUSD.toFixed(2) as DecimalString,
    totalProprActualCashCostINR: proprActualCashINR.toFixed(2) as DecimalString,
    totalBreakoutActualCashCostINR: breakoutActualCashINR.toFixed(2) as DecimalString,
    totalActualPropFirmCashCostINR: totalActualPropFirmCashCostINR.toFixed(2) as DecimalString,
    totalActiveFaceCapitalUSD: activeFaceUSD.toFixed(2) as DecimalString,
    totalActiveActualCashCostINR: activeActualCashINR.toFixed(2) as DecimalString,
    totalHistoricalSunkActualCashCostINR: sunkActualCashINR.toFixed(2) as DecimalString,
    totalRefundsINR: totalRefundsINR.toFixed(2) as DecimalString,
    totalAdjustmentsINR: totalAdjustmentsINR.toFixed(2) as DecimalString,
    totalProcessedPayoutsINR: payoutsINR.toFixed(2) as DecimalString,
    totalActualCashOutflowINR: totalActualCashOutflowINR.toFixed(2) as DecimalString,
    totalActualCashPnLINR: actualCashPnLINR.toFixed(2) as DecimalString,
  };
}

