// ─── Decimal Utilities ────────────────────────────────────────────────────────
// Safe decimal arithmetic for monetary values. Never use floating-point.

import Decimal from "decimal.js";
import type { DecimalString } from "./types.js";

// Configure Decimal.js for financial precision
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

/** Convert a string or number to a Decimal instance. */
export function toDecimal(value: string | number | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  if (typeof value === "number") return new Decimal(value);
  if (value === "" || value === null || value === undefined)
    return new Decimal(0);
  return new Decimal(value);
}

/** Convert a Decimal back to a DecimalString. */
export function fromDecimal(value: Decimal): DecimalString {
  return value.toString() as DecimalString;
}

/** Create a DecimalString from a plain string value. */
export function ds(value: string | number): DecimalString {
  return new Decimal(value).toString() as DecimalString;
}

/** Zero as DecimalString. */
export const ZERO = ds("0");

// ─── Arithmetic Helpers ───────────────────────────────────────────────────────

export function add(
  a: DecimalString | string,
  b: DecimalString | string
): DecimalString {
  return fromDecimal(toDecimal(a).plus(toDecimal(b)));
}

export function sub(
  a: DecimalString | string,
  b: DecimalString | string
): DecimalString {
  return fromDecimal(toDecimal(a).minus(toDecimal(b)));
}

export function mul(
  a: DecimalString | string,
  b: DecimalString | string
): DecimalString {
  return fromDecimal(toDecimal(a).times(toDecimal(b)));
}

export function div(
  a: DecimalString | string,
  b: DecimalString | string
): DecimalString {
  const divisor = toDecimal(b);
  if (divisor.isZero()) return ZERO;
  return fromDecimal(toDecimal(a).dividedBy(divisor));
}

export function abs(a: DecimalString | string): DecimalString {
  return fromDecimal(toDecimal(a).abs());
}

export function max(
  a: DecimalString | string,
  b: DecimalString | string
): DecimalString {
  return fromDecimal(Decimal.max(toDecimal(a), toDecimal(b)));
}

export function min(
  a: DecimalString | string,
  b: DecimalString | string
): DecimalString {
  return fromDecimal(Decimal.min(toDecimal(a), toDecimal(b)));
}

export function isPositive(a: DecimalString | string): boolean {
  return toDecimal(a).isPositive() && !toDecimal(a).isZero();
}

export function isNegative(a: DecimalString | string): boolean {
  return toDecimal(a).isNegative();
}

export function isZero(a: DecimalString | string): boolean {
  return toDecimal(a).isZero();
}

export function gt(
  a: DecimalString | string,
  b: DecimalString | string
): boolean {
  return toDecimal(a).greaterThan(toDecimal(b));
}

export function gte(
  a: DecimalString | string,
  b: DecimalString | string
): boolean {
  return toDecimal(a).greaterThanOrEqualTo(toDecimal(b));
}

export function lt(
  a: DecimalString | string,
  b: DecimalString | string
): boolean {
  return toDecimal(a).lessThan(toDecimal(b));
}

export function lte(
  a: DecimalString | string,
  b: DecimalString | string
): boolean {
  return toDecimal(a).lessThanOrEqualTo(toDecimal(b));
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format a decimal value as a currency string.
 * @param value The decimal string value.
 * @param currency The currency symbol (default: "$").
 * @param decimals Number of decimal places (default: 2).
 */
export function formatCurrency(
  value: DecimalString | string,
  currency = "$",
  decimals = 2
): string {
  const d = toDecimal(value);
  const isNeg = d.isNegative();
  const absVal = d.abs().toFixed(decimals);

  // Add thousand separators
  const parts = absVal.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = parts.join(".");

  return isNeg ? `-${currency}${formatted}` : `${currency}${formatted}`;
}

/**
 * Format a decimal value as a percentage.
 * @param value The decimal string value (already a percentage, e.g., "67.4").
 * @param decimals Number of decimal places (default: 1).
 */
export function formatPercent(
  value: DecimalString | string,
  decimals = 1
): string {
  const d = toDecimal(value);
  return `${d.toFixed(decimals)}%`;
}

/**
 * Format a decimal value as a compact number.
 * @param value The decimal string value.
 * @param decimals Number of decimal places (default: 2).
 */
export function formatNumber(
  value: DecimalString | string,
  decimals = 2
): string {
  const d = toDecimal(value);
  const parts = d.toFixed(decimals).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

/** Format a decimal value with a + prefix for positives. */
export function formatPnl(
  value: DecimalString | string,
  currency = "$",
  decimals = 2
): string {
  const d = toDecimal(value);
  const formatted = formatCurrency(value, currency, decimals);
  if (d.isPositive() && !d.isZero()) return `+${formatted}`;
  return formatted;
}
