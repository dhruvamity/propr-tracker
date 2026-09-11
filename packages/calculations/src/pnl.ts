// ─── PnL Calculations ─────────────────────────────────────────────────────────
// Per-position PnL, notional, ROE, and maintenance margin calculations.
// Uses exact Propr formulas from the integration docs.

import type { DecimalString, PositionSnapshot } from "@propr/data-model";
import { toDecimal, fromDecimal, ds, ZERO } from "@propr/data-model";
import Decimal from "decimal.js";

/** Maintenance margin rate (Propr default). */
export const MMR = new Decimal("0.005");

/**
 * Calculate unrealized PnL for a single position.
 * Formula: sign × quantity × (markPrice - entryPrice)
 * where sign = +1 for long, -1 for short.
 */
export function calculateUnrealizedPnl(
  positionSide: "long" | "short",
  quantity: DecimalString | string,
  entryPrice: DecimalString | string,
  markPrice: DecimalString | string
): DecimalString {
  const sign = positionSide === "long" ? 1 : -1;
  const qty = toDecimal(quantity).abs();
  const entry = toDecimal(entryPrice);
  const mark = toDecimal(markPrice);

  const upnl = qty.times(mark.minus(entry)).times(sign);
  return fromDecimal(upnl);
}

/**
 * Calculate the notional value of a position.
 * Formula: abs(quantity) × markPrice
 */
export function calculateNotionalValue(
  quantity: DecimalString | string,
  markPrice: DecimalString | string
): DecimalString {
  const qty = toDecimal(quantity).abs();
  const mark = toDecimal(markPrice);
  return fromDecimal(qty.times(mark));
}

/**
 * Calculate return on equity (ROE).
 * Formula: unrealizedPnl / marginUsed
 */
export function calculateROE(
  unrealizedPnl: DecimalString | string,
  marginUsed: DecimalString | string
): DecimalString {
  const margin = toDecimal(marginUsed);
  if (margin.isZero()) return ZERO;
  return fromDecimal(toDecimal(unrealizedPnl).dividedBy(margin));
}

/**
 * Calculate maintenance margin for a position.
 * Formula: notionalValue × MMR
 */
export function calculateMaintMargin(
  notionalValue: DecimalString | string
): DecimalString {
  return fromDecimal(toDecimal(notionalValue).times(MMR));
}

/**
 * Recalculate a position's live values given a new mark price.
 * Returns updated unrealizedPnl, notionalValue, maintMargin, and roe.
 */
export function recalculatePosition(
  position: Pick<
    PositionSnapshot,
    "positionSide" | "quantity" | "entryPrice" | "marginUsed"
  >,
  markPrice: DecimalString | string
): {
  unrealizedPnl: DecimalString;
  notionalValue: DecimalString;
  maintMargin: DecimalString;
  roe: DecimalString;
} {
  const unrealizedPnl = calculateUnrealizedPnl(
    position.positionSide,
    position.quantity,
    position.entryPrice,
    markPrice
  );
  const notionalValue = calculateNotionalValue(position.quantity, markPrice);
  const maintMargin = calculateMaintMargin(notionalValue);
  const roe = calculateROE(unrealizedPnl, position.marginUsed);

  return { unrealizedPnl, notionalValue, maintMargin, roe };
}

/**
 * Sum unrealized PnL across all positions.
 */
export function sumUnrealizedPnl(
  positions: Array<{ unrealizedPnl: DecimalString | string }>
): DecimalString {
  let total = new Decimal(0);
  for (const pos of positions) {
    total = total.plus(toDecimal(pos.unrealizedPnl));
  }
  return fromDecimal(total);
}

/**
 * Sum unrealized PnL for cross-margin positions only.
 */
export function sumCrossUnrealizedPnl(
  positions: Array<{
    unrealizedPnl: DecimalString | string;
    marginMode: "cross" | "isolated";
  }>
): DecimalString {
  let total = new Decimal(0);
  for (const pos of positions) {
    if (pos.marginMode === "cross") {
      total = total.plus(toDecimal(pos.unrealizedPnl));
    }
  }
  return fromDecimal(total);
}

/**
 * Sum maintenance margins across all positions.
 */
export function sumMaintMargin(
  positions: Array<{ maintMargin: DecimalString | string }>
): DecimalString {
  let total = new Decimal(0);
  for (const pos of positions) {
    total = total.plus(toDecimal(pos.maintMargin));
  }
  return fromDecimal(total);
}
