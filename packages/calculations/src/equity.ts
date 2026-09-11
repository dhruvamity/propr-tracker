// ─── Equity Calculations ──────────────────────────────────────────────────────
// Account-level equity, wallet, available balance, and margin ratio.
// Uses exact Propr formulas from the integration docs.

import type { DecimalString } from "@propr/data-model";
import { toDecimal, fromDecimal, ZERO } from "@propr/data-model";
import Decimal from "decimal.js";

/**
 * Calculate account equity.
 * Formula: balance + totalUpnl + isolatedPositionMargin
 */
export function calculateEquity(
  balance: DecimalString | string,
  totalUpnl: DecimalString | string,
  isolatedPositionMargin: DecimalString | string
): DecimalString {
  const eq = toDecimal(balance)
    .plus(toDecimal(totalUpnl))
    .plus(toDecimal(isolatedPositionMargin));
  return fromDecimal(eq);
}

/**
 * Calculate cross wallet balance.
 * Formula: balance + crossUpnl
 */
export function calculateCrossWallet(
  balance: DecimalString | string,
  crossUpnl: DecimalString | string
): DecimalString {
  return fromDecimal(toDecimal(balance).plus(toDecimal(crossUpnl)));
}

/**
 * Calculate available balance (free cross collateral for new orders).
 * Formula: crossWallet - crossPositionMargin - crossOrderMargin - isolatedOrderMargin
 * isolatedPositionMargin is already out of balance.
 */
export function calculateAvailableBalance(
  crossWallet: DecimalString | string,
  crossPositionMargin: DecimalString | string,
  crossOrderMargin: DecimalString | string,
  isolatedOrderMargin: DecimalString | string
): DecimalString {
  const available = toDecimal(crossWallet)
    .minus(toDecimal(crossPositionMargin))
    .minus(toDecimal(crossOrderMargin))
    .minus(toDecimal(isolatedOrderMargin));
  return fromDecimal(available);
}

/**
 * Calculate margin ratio.
 * Formula: totalMM / crossWallet (>= 1 → liquidatable)
 */
export function calculateMarginRatio(
  totalMaintMargin: DecimalString | string,
  crossWallet: DecimalString | string
): DecimalString {
  const cw = toDecimal(crossWallet);
  if (cw.lessThanOrEqualTo(0)) {
    return fromDecimal(new Decimal(1));
  }
  return fromDecimal(toDecimal(totalMaintMargin).dividedBy(cw));
}
