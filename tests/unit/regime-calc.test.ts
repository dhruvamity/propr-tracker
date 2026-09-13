import { describe, it, expect } from "vitest";
import {
  istParts,
  keyFor,
  rankPercentile,
  percentile,
  calculate,
  labelFor,
  appendCandle,
} from "../../apps/terminal/src/components/regime/regime-calc";
import { Candle } from "../../apps/terminal/src/components/regime/regime-types";

describe("Market Regime Calculator & Utility Parity", () => {
  describe("istParts and keyFor (IST Timezone Mapping)", () => {
    it("shifts UTC timestamp by +5:30 to IST correctly", () => {
      // 2026-03-15T00:00:00Z -> IST is 05:30 AM on 2026-03-15 (Sunday, weekday=6)
      const date = new Date("2026-03-15T00:00:00Z");
      const parts = istParts(date);
      expect(parts.hour).toBe(5);
      expect(parts.weekday).toBe(6); // 0=Mon, 6=Sun
      expect(keyFor(date)).toBe("6-5");
    });

    it("handles day rollover across UTC midnight correctly", () => {
      // 2026-03-15T20:00:00Z -> IST is 01:30 AM on 2026-03-16 (Monday, weekday=0)
      const date = new Date("2026-03-15T20:00:00Z");
      const parts = istParts(date);
      expect(parts.hour).toBe(1);
      expect(parts.weekday).toBe(0);
      expect(keyFor(date)).toBe("0-1");
    });
  });

  describe("rankPercentile and percentile interpolation", () => {
    it("computes exact empirical percentile against a sample distribution", () => {
      const sample = [10, 20, 30, 40, 50];
      expect(rankPercentile(10, sample)).toBe(10);
      expect(rankPercentile(30, sample)).toBe(50);
      expect(rankPercentile(50, sample)).toBe(90);
      expect(rankPercentile(5, sample)).toBe(0);
      expect(rankPercentile(60, sample)).toBe(100);
    });

    it("interpolates piecewise percentiles against historical baseline quantiles", () => {
      // Quantiles [p10, p25, p50, p75, p90]
      const quantiles = [100, 200, 300, 400, 500];
      expect(percentile(300, quantiles)).toBe(50);
      expect(percentile(200, quantiles)).toBe(25);
      expect(percentile(400, quantiles)).toBe(75);
      // Midpoint between p25 (200) and p50 (300) -> 37.5
      expect(percentile(250, quantiles)).toBe(37.5);
    });
  });

  describe("calculate (True Range & Persistence)", () => {
    it("calculates True Range bps and Persistence correctly over 12 candles", () => {
      const candles: Candle[] = [];
      const baseTime = 1710000000000;
      // Generate 13 candles with a steady upward trend of 100 USD per bar
      for (let i = 0; i <= 12; i++) {
        const price = 50000 + i * 100;
        candles.push({
          t: baseTime + i * 300000,
          o: price - 50,
          h: price + 50,
          l: price - 50,
          c: price,
          v: 10,
          n: 100,
          q: 500000,
          x: true,
        });
      }

      const result = calculate(candles, 12);
      expect(result).not.toBeNull();
      // Steady advance in one direction: net move equals sum of moves -> persistence = 1.0
      expect(result!.persistence).toBeCloseTo(1.0, 4);
      expect(result!.range).toBeGreaterThan(0);
      expect(result!.change).toBeGreaterThan(0);
    });

    it("returns null if candle history is insufficient for lookback", () => {
      const candles: Candle[] = [
        { t: 1, o: 100, h: 105, l: 95, c: 100, v: 1, n: 1, q: 100, x: true },
      ];
      expect(calculate(candles, 12)).toBeNull();
    });
  });

  describe("labelFor (Quadrant Classification)", () => {
    it("classifies TREND when both activity and persistence are high", () => {
      expect(labelFor(60, 60)).toBe("TREND");
      expect(labelFor(35, 70)).toBe("TREND"); // Steady Trend: persistence >= 65 && activity >= 30
    });

    it("classifies CHOP when activity is high but persistence is low", () => {
      expect(labelFor(70, 40)).toBe("CHOP");
    });

    it("classifies GRIND when activity is low but persistence is high", () => {
      expect(labelFor(40, 60)).toBe("GRIND");
    });

    it("classifies DEAD when both activity and persistence are low", () => {
      expect(labelFor(30, 30)).toBe("DEAD");
      expect(labelFor(49, 49)).toBe("DEAD");
    });
  });

  describe("appendCandle", () => {
    it("deduplicates on open time and limits array length", () => {
      const c1: Candle = { t: 100, o: 1, h: 2, l: 0, c: 1, v: 1, n: 1, q: 1, x: true };
      const c2: Candle = { t: 200, o: 2, h: 3, l: 1, c: 2, v: 1, n: 1, q: 1, x: true };
      const c2Updated: Candle = { t: 200, o: 2, h: 4, l: 1, c: 3, v: 2, n: 2, q: 2, x: true };

      let list = appendCandle([c1], c2, 10);
      expect(list.length).toBe(2);

      // Updating candle with same timestamp
      list = appendCandle(list, c2Updated, 10);
      expect(list.length).toBe(2);
      expect(list[1].c).toBe(3);

      // Limiting length
      const c3: Candle = { t: 300, o: 3, h: 4, l: 2, c: 3, v: 1, n: 1, q: 1, x: true };
      list = appendCandle(list, c3, 2);
      expect(list.length).toBe(2);
      expect(list[0].t).toBe(200);
      expect(list[1].t).toBe(300);
    });
  });
});
