// ─── Risk Calculations ────────────────────────────────────────────────────────
// Drawdown, daily loss, profit target progress, breach price, and liquidation.
// Uses exact Propr formulas from the integration docs.

import type { DecimalString, DrawdownType, AccountSnapshot } from "@propr/data-model";
import { toDecimal, fromDecimal, ds, ZERO } from "@propr/data-model";
import Decimal from "decimal.js";
import { MMR } from "./pnl";

// ─── Drawdown ─────────────────────────────────────────────────────────────────

export interface DrawdownConfig {
  drawdownType: DrawdownType;
  maxDrawdownPercent: DecimalString | string;
  initialBalance: DecimalString | string;
  highWaterMark?: DecimalString | string;
  startingBalance?: DecimalString | string;
}

/**
 * Calculate drawdown limit (the equity floor before breach).
 * For static: initialBalance - (maxDrawdownPercent / 100 × initialBalance)
 * For trailing: min(highWaterMark - ddAmount, initialBalance)
 */
export function calculateDrawdownLimit(config: DrawdownConfig): DecimalString {
  const ddPercent = toDecimal(config.maxDrawdownPercent);
  const initial = toDecimal(config.initialBalance);
  const ddAmount = ddPercent.dividedBy(100).times(initial);

  if (config.drawdownType === "trailing") {
    const hwm = toDecimal(config.highWaterMark || config.initialBalance);
    return fromDecimal(Decimal.min(hwm.minus(ddAmount), initial));
  }

  return fromDecimal(initial.minus(ddAmount));
}

/**
 * Calculate drawdown used as a percentage.
 * For trailing: (max(highWaterMark - equity, 0) / startingBalance) × 100
 * For static: (max(startingBalance - equity, 0) / startingBalance) × 100
 */
export function calculateDrawdownUsedPercent(
  equity: DecimalString | string,
  config: DrawdownConfig
): DecimalString {
  const eq = toDecimal(equity);
  const starting = toDecimal(
    config.startingBalance || config.initialBalance
  );

  if (starting.isZero()) return ZERO;

  const ref =
    config.drawdownType === "trailing"
      ? toDecimal(config.highWaterMark || starting)
      : starting;

  const used = Decimal.max(ref.minus(eq), 0);
  return fromDecimal(used.dividedBy(starting).times(100));
}

/** Alias for calculateDrawdownUsedPercent */
export const calculateDrawdownUsedPct = calculateDrawdownUsedPercent;

/**
 * Calculate drawdown limit consumed as a percentage of the allowed limit.
 * Formula: (drawdownUsedAmount / maxDrawdownAmount) × 100
 */
export function calculateDrawdownLimitConsumedPercent(
  equity: DecimalString | string,
  config: DrawdownConfig
): DecimalString {
  const ddPercent = toDecimal(config.maxDrawdownPercent);
  const initial = toDecimal(config.initialBalance);
  const maxDdAmount = ddPercent.dividedBy(100).times(initial);
  if (maxDdAmount.isZero()) return ZERO;

  const starting = toDecimal(
    config.startingBalance || config.initialBalance
  );
  const ref =
    config.drawdownType === "trailing"
      ? toDecimal(config.highWaterMark || starting)
      : starting;

  const used = Decimal.max(ref.minus(toDecimal(equity)), 0);
  return fromDecimal(used.dividedBy(maxDdAmount).times(100));
}

/**
 * Calculate remaining drawdown buffer.
 * Formula: equity - drawdownLimit
 */
export function calculateDrawdownRemaining(
  equity: DecimalString | string,
  config: DrawdownConfig
): DecimalString {
  const limit = toDecimal(calculateDrawdownLimit(config));
  return fromDecimal(toDecimal(equity).minus(limit));
}

// ─── Daily Loss ───────────────────────────────────────────────────────────────

export interface DailyLossConfig {
  maxDailyLossPercent: DecimalString | string;
  dailyLossBase: DecimalString | string; // startingBalance + startingIsolatedPositionMargin
}

/**
 * Calculate daily loss limit (the equity floor for today).
 * Formula: dailyLossBase - (maxDailyLossPercent / 100 × dailyLossBase)
 */
export function calculateDailyLossLimit(
  config: DailyLossConfig
): DecimalString {
  const base = toDecimal(config.dailyLossBase);
  const pct = toDecimal(config.maxDailyLossPercent);
  return fromDecimal(base.minus(pct.dividedBy(100).times(base)));
}

/**
 * Calculate daily loss used as a percentage.
 * Formula: (max(dailyLossBase - equity, 0) / dailyLossBase) × 100
 */
export function calculateDailyLossUsedPercent(
  equity: DecimalString | string,
  config: DailyLossConfig
): DecimalString {
  const base = toDecimal(config.dailyLossBase);
  if (base.isZero()) return ZERO;

  const used = Decimal.max(base.minus(toDecimal(equity)), 0);
  return fromDecimal(used.dividedBy(base).times(100));
}

/**
 * Calculate daily loss limit consumed as a percentage of the allowed limit.
 * Formula: (dailyLossUsedAmount / maxDailyLossAmount) × 100
 */
export function calculateDailyLossLimitConsumedPercent(
  equity: DecimalString | string,
  config: DailyLossConfig
): DecimalString {
  const base = toDecimal(config.dailyLossBase);
  const pct = toDecimal(config.maxDailyLossPercent);
  const maxDlAmount = pct.dividedBy(100).times(base);
  if (maxDlAmount.isZero()) return ZERO;

  const used = Decimal.max(base.minus(toDecimal(equity)), 0);
  return fromDecimal(used.dividedBy(maxDlAmount).times(100));
}

/**
 * Calculate remaining daily loss buffer.
 * Formula: equity - dailyLossLimit
 */
export function calculateDailyLossRemaining(
  equity: DecimalString | string,
  config: DailyLossConfig
): DecimalString {
  const limit = toDecimal(calculateDailyLossLimit(config));
  return fromDecimal(toDecimal(equity).minus(limit));
}

// ─── Profit Target ────────────────────────────────────────────────────────────

/**
 * Calculate current profit percentage relative to phase starting balance.
 * Formula: ((equity - phaseStartingBalance) / phaseStartingBalance) × 100
 */
export function calculateProfitTargetPercent(
  equity: DecimalString | string,
  phaseStartingBalance: DecimalString | string
): DecimalString {
  const psb = toDecimal(phaseStartingBalance);
  if (psb.isZero()) return ZERO;

  const pnlPercent = toDecimal(equity)
    .minus(psb)
    .dividedBy(psb)
    .times(100);
  return fromDecimal(pnlPercent);
}

/** Alias for calculateProfitTargetPercent */
export const calculateProfitTargetPct = calculateProfitTargetPercent;

/**
 * Calculate profit target progress as a percentage.
 * Formula: ((equity - phaseStartingBalance) / phaseStartingBalance) × 100
 * Relative to the profitTargetPercent.
 */
export function calculateProfitTargetProgress(
  equity: DecimalString | string,
  phaseStartingBalance: DecimalString | string,
  profitTargetPercent: DecimalString | string
): DecimalString {
  const psb = toDecimal(phaseStartingBalance);
  const target = toDecimal(profitTargetPercent);
  if (psb.isZero() || target.isZero()) return ZERO;

  const pnlPercent = toDecimal(equity)
    .minus(psb)
    .dividedBy(psb)
    .times(100);
  // Progress = (pnlPercent / targetPercent) × 100
  return fromDecimal(pnlPercent.dividedBy(target).times(100));
}

/**
 * Calculate the absolute profit target amount.
 * Formula: phaseStartingBalance × (profitTargetPercent / 100)
 */
export function calculateProfitTarget(
  phaseStartingBalance: DecimalString | string,
  profitTargetPercent: DecimalString | string
): DecimalString {
  const psb = toDecimal(phaseStartingBalance);
  const pct = toDecimal(profitTargetPercent);
  return fromDecimal(psb.times(pct.dividedBy(100)));
}

/**
 * Calculate the remaining amount to reach profit target.
 */
export function calculateProfitRemaining(
  equity: DecimalString | string,
  phaseStartingBalance: DecimalString | string,
  profitTargetPercent: DecimalString | string
): DecimalString {
  const target = toDecimal(
    calculateProfitTarget(phaseStartingBalance, profitTargetPercent)
  );
  const currentPnl = toDecimal(equity).minus(toDecimal(phaseStartingBalance));
  return fromDecimal(Decimal.max(target.minus(currentPnl), 0));
}

// ─── Breach Price ─────────────────────────────────────────────────────────────

/**
 * Calculate the price at which equity would hit a limit (breach/liquidation).
 * From Propr docs:
 *   buffer = equity - equityLimit
 *   offset = buffer / abs(quantity)
 *   long: mark - offset
 *   short: mark + offset
 * Returns null if buffer is already gone.
 */
export function calculateBreachPrice(
  equityLimit: DecimalString | string,
  equity: DecimalString | string,
  mark: DecimalString | string,
  quantity: DecimalString | string,
  side: "long" | "short"
): DecimalString | null {
  const buffer = toDecimal(equity).minus(toDecimal(equityLimit));
  if (buffer.lessThanOrEqualTo(0)) return null;

  const absQty = toDecimal(quantity).abs();
  if (absQty.isZero()) return null;

  const offset = buffer.dividedBy(absQty);
  const markD = toDecimal(mark);

  if (side === "long") {
    return fromDecimal(markD.minus(offset));
  }
  return fromDecimal(markD.plus(offset));
}

// ─── Liquidation Price ────────────────────────────────────────────────────────

/**
 * Calculate isolated liquidation price.
 * For long: entryPrice × (1 - 1/leverage + MMR)
 * For short: entryPrice × (1 + 1/leverage - MMR)
 */
export function calculateIsolatedLiquidationPrice(
  entryPrice: DecimalString | string,
  leverage: DecimalString | string,
  side: "long" | "short"
): DecimalString {
  const entry = toDecimal(entryPrice);
  const inv = new Decimal(1).dividedBy(toDecimal(leverage));

  if (side === "long") {
    return fromDecimal(
      entry.times(new Decimal(1).minus(inv).plus(MMR))
    );
  }
  return fromDecimal(
    entry.times(new Decimal(1).plus(inv).minus(MMR))
  );
}

/**
 * Calculate cross liquidation price for a specific position.
 * For long: max((entryPrice × qty + otherMM - walletExclThis) / (qty × (1 - MMR)), 0)
 * For short: (walletExclThis + entryPrice × qty - otherMM) / (qty × (1 + MMR))
 */
export function calculateCrossLiquidationPrice(
  entryPrice: DecimalString | string,
  quantity: DecimalString | string,
  side: "long" | "short",
  crossWallet: DecimalString | string,
  unrealizedPnl: DecimalString | string,
  totalMaintMargin: DecimalString | string,
  notionalValue: DecimalString | string
): DecimalString {
  const entry = toDecimal(entryPrice);
  const qty = toDecimal(quantity).abs();
  const cw = toDecimal(crossWallet);
  const upnl = toDecimal(unrealizedPnl);
  const totalMM = toDecimal(totalMaintMargin);
  const positionMM = toDecimal(notionalValue).times(MMR);
  const otherMM = totalMM.minus(positionMM);
  const walletExclThis = cw.minus(upnl);

  if (side === "long") {
    const numerator = entry.times(qty).plus(otherMM).minus(walletExclThis);
    const denominator = qty.times(new Decimal(1).minus(MMR));
    if (denominator.isZero()) return ZERO;
    return fromDecimal(Decimal.max(numerator.dividedBy(denominator), 0));
  }

  // short
  const numerator = walletExclThis
    .plus(entry.times(qty))
    .minus(otherMM);
  const denominator = qty.times(new Decimal(1).plus(MMR));
  if (denominator.isZero()) return ZERO;
  return fromDecimal(numerator.dividedBy(denominator));
}

// ─── Centralized Risk Recalculation ──────────────────────────────────────────

/**
 * Centralized risk recalculation for an account.
 * Updates high water mark (if trailing and equity exceeds current HWM),
 * drawdown used, drawdown limit consumed, remaining buffer, breach floor,
 * daily loss used and consumed, and profit target percentage and progress.
 */
export function recalculateAccountRisk(account: AccountSnapshot): void {
  const equity = account.equity || account.balance || ZERO;
  const initial = account.initialBalance || ZERO;
  const starting = account.startingBalance || initial;
  const phaseStarting = account.phaseStartingBalance || initial;
  const drawdownType = (account.drawdownType || "static") as DrawdownType;
  const maxDrawdownPercent = account.maxDrawdownPercent || ZERO;
  const maxDailyLossPercent = account.maxDailyLossPercent || ZERO;
  const profitTargetPercent = account.profitTargetPercent || ZERO;

  let hwm: DecimalString = account.highWaterMark || starting;
  if (toDecimal(equity).greaterThan(toDecimal(hwm))) {
    hwm = fromDecimal(toDecimal(equity));
    account.highWaterMark = hwm;
  }

  const ddConfig: DrawdownConfig = {
    drawdownType,
    maxDrawdownPercent,
    initialBalance: initial,
    startingBalance: starting,
    highWaterMark: hwm,
  };

  if (!toDecimal(maxDrawdownPercent).isZero()) {
    account.drawdownUsedPercent = calculateDrawdownUsedPercent(equity, ddConfig);
    account.drawdownLimitConsumedPercent = calculateDrawdownLimitConsumedPercent(equity, ddConfig);
    account.drawdownRemaining = calculateDrawdownRemaining(equity, ddConfig);
    account.breachFloor = calculateDrawdownLimit(ddConfig);
  }

  const dailyLossBase = account.startingBalance || initial;
  const dlConfig: DailyLossConfig = {
    maxDailyLossPercent,
    dailyLossBase,
  };

  if (!toDecimal(maxDailyLossPercent).isZero()) {
    account.dailyLossUsedPercent = calculateDailyLossUsedPercent(equity, dlConfig);
    account.dailyLossLimitConsumedPercent = calculateDailyLossLimitConsumedPercent(equity, dlConfig);
    account.dailyLossRemaining = calculateDailyLossRemaining(equity, dlConfig);
    account.dailyLossFloor = calculateDailyLossLimit(dlConfig);
  }

  if (!toDecimal(phaseStarting).isZero()) {
    account.profitTargetPct = calculateProfitTargetPercent(equity, phaseStarting);
    if (!toDecimal(profitTargetPercent).isZero()) {
      account.profitTargetProgressPercent = calculateProfitTargetProgress(
        equity,
        phaseStarting,
        profitTargetPercent
      );
    }
  }
}

