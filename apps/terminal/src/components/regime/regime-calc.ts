import { Candle, Condition, Baseline } from "./regime-types";

/**
 * Returns the hour (0..23) and weekday (0..6 where 0=Monday, 6=Sunday) in Asia/Kolkata (IST = UTC+5:30).
 */
export function istParts(date: Date): { hour: number; weekday: number } {
  const shifted = new Date(date.getTime() + 19_800_000);
  return {
    hour: shifted.getUTCHours(),
    weekday: (shifted.getUTCDay() + 6) % 7,
  };
}

/**
 * Generates the `{weekday}-{hour}` key for hourly historical quantiles lookup.
 */
export function keyFor(date: Date): string {
  const { weekday, hour } = istParts(date);
  return `${weekday}-${hour}`;
}

/**
 * Computes the empirical percentile rank (0..100) of a value against a sample series.
 */
export function rankPercentile(value: number, series: number[]): number {
  if (!series.length) return 50;
  let countLess = 0;
  let countEqual = 0;
  for (let i = 0; i < series.length; i++) {
    if (series[i] < value) countLess++;
    else if (series[i] === value) countEqual++;
  }
  const pct = ((countLess + 0.5 * countEqual) / series.length) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Piece-wise linear interpolation between standard quantiles [p10, p25, p50, p75, p90].
 */
export function percentile(value: number, quantiles: number[]): number {
  const probs = [10, 25, 50, 75, 90];
  const points: { x: number; p: number }[] = [];
  quantiles.forEach((x, i) => {
    if (!Number.isFinite(x)) return;
    const last = points.at(-1);
    if (last?.x === x) last.p = probs[i];
    else points.push({ x, p: probs[i] });
  });
  if (!points.length) return 50;

  if (value <= points[0].x) {
    return Math.max(0, Math.round((value / Math.max(points[0].x, 1e-6)) * points[0].p * 10) / 10);
  }
  if (value >= points.at(-1)!.x) {
    const last = points.at(-1)!;
    const overshoot = (value - last.x) / Math.max(last.x, 1e-6);
    return Math.min(100, Math.round((last.p + overshoot * (100 - last.p)) * 10) / 10);
  }
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (value === point.x) return point.p;
    if (i && value < point.x) {
      const left = points[i - 1];
      const p = left.p + ((value - left.x) / (point.x - left.x)) * (point.p - left.p);
      return Math.round(p * 10) / 10;
    }
  }
  return points.at(-1)!.p;
}

/**
 * Calculates True Range (basis points), Persistence ratio, and Change % over the lookback window.
 */
export function calculate(candles: Candle[], lookback: number): { range: number; persistence: number; change: number } | null {
  const window = candles.slice(-(lookback + 1));
  if (window.length !== lookback + 1) return null;
  const bars = window.slice(1);
  const close = window.at(-1)!.c;
  const prior = window[0].c;

  const tr = bars.reduce((sum, bar, index) => {
    const previous = window[index].c;
    return sum + Math.max(bar.h - bar.l, Math.abs(bar.h - previous), Math.abs(bar.l - previous));
  }, 0);

  const absMove = bars.reduce((sum, bar, index) => sum + Math.abs(bar.c - window[index].c), 0);

  return {
    range: (tr / Math.max(close, 1)) * 10_000,
    persistence: absMove ? Math.abs(close - prior) / absMove : 0,
    change: ((close - prior) / Math.max(prior, 1)) * 100,
  };
}

/**
 * Extracts rolling metric series for all candles where lookback history is available.
 */
export function extractMetricsHistory(
  candles: Candle[],
  lookback: number
): { range: number; persistence: number; change: number }[] {
  if (candles.length <= lookback) return [];
  const result: { range: number; persistence: number; change: number }[] = [];
  for (let i = lookback; i < candles.length; i++) {
    const window = candles.slice(i - lookback, i + 1);
    const bars = window.slice(1);
    const close = window.at(-1)!.c;
    const prior = window[0].c;
    const tr = bars.reduce((sum, bar, idx) => {
      const prev = window[idx].c;
      return sum + Math.max(bar.h - bar.l, Math.abs(bar.h - prev), Math.abs(bar.l - prev));
    }, 0);
    const absMove = bars.reduce((sum, bar, idx) => sum + Math.abs(bar.c - window[idx].c), 0);
    result.push({
      range: (tr / Math.max(close, 1)) * 10_000,
      persistence: absMove ? Math.abs(close - prior) / absMove : 0,
      change: ((close - prior) / Math.max(prior, 1)) * 100,
    });
  }
  return result;
}

/**
 * Assigns the market condition quadrant based on activity and persistence percentiles:
 * - TREND: high momentum (activity >= 50 && persistence >= 50) OR steady directional advance (persistence >= 65 && activity >= 30)
 * - CHOP: high volatility, low persistence (activity >= 50 && persistence < 50)
 * - GRIND: low volatility, persistent direction (persistence >= 50 && activity < 50)
 * - DEAD: low volatility, low persistence (activity < 50 && persistence < 50)
 */
export function labelFor(
  activity: number,
  persistence: number,
  _spec?: Baseline["regimeSpec"]
): Condition {
  const isTrend = (activity >= 50 && persistence >= 50) || (persistence >= 65 && activity >= 30);
  if (isTrend) return "TREND";
  if (activity >= 50 && persistence < 50) return "CHOP";
  if (persistence >= 50 && activity < 50) return "GRIND";
  return "DEAD";
}

/**
 * Appends a new closed candle, deduplicating on open timestamp `t`, sorted, and limited to `maxLimit`.
 */
export function appendCandle(previous: Candle[], candle: Candle, maxLimit: number): Candle[] {
  return [...previous.filter((x) => x.t !== candle.t), candle]
    .sort((a, b) => a.t - b.t)
    .slice(-maxLimit);
}
