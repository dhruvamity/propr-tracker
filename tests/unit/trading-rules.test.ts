import { describe, it, expect } from "vitest";

describe("Personal Trading Rules & Guardrails Logic", () => {
  // ─── Rule 1: Trading Hours Gate ───────────────────────────────────────────
  describe("Rule 1: Trading Hours (Monday 6:30 AM IST to Saturday 12:30 AM IST)", () => {
    function isWindowOpen(istDay: number, istHour: number, istMinute: number): boolean {
      // istDay: 0 = Sun, 1 = Mon, ..., 6 = Sat
      const currentWeeklyMinutes = istDay * 1440 + istHour * 60 + istMinute;
      const openMinute = 1830; // Mon 06:30 AM
      const closeMinute = 8670; // Sat 00:30 AM
      return currentWeeklyMinutes >= openMinute && currentWeeklyMinutes < closeMinute;
    }

    it("opens on Monday at 6:30 AM IST", () => {
      expect(isWindowOpen(1, 6, 29)).toBe(false); // Mon 6:29 AM -> Closed
      expect(isWindowOpen(1, 6, 30)).toBe(true);  // Mon 6:30 AM -> Open
    });

    it("remains open during midweek (Wednesday 2:00 PM IST)", () => {
      expect(isWindowOpen(3, 14, 0)).toBe(true);
    });

    it("closes on Saturday at 12:30 AM IST", () => {
      expect(isWindowOpen(5, 23, 59)).toBe(true); // Friday 11:59 PM -> Open
      expect(isWindowOpen(6, 0, 29)).toBe(true);  // Sat 00:29 AM -> Open
      expect(isWindowOpen(6, 0, 30)).toBe(false); // Sat 00:30 AM -> Closed
      expect(isWindowOpen(6, 12, 0)).toBe(false); // Sat noon -> Closed
    });

    it("is closed throughout Sunday", () => {
      expect(isWindowOpen(0, 1, 30)).toBe(false);
      expect(isWindowOpen(0, 18, 0)).toBe(false);
    });
  });

  // ─── Rule 4 & 6: Single-Trade Risk Limit & Target Proximity ──────────────
  describe("Rule 4 & 6: Single-Trade Risk and Target De-Risking", () => {
    function getRiskAllowance(tier: "5k" | "10k", profitPct: number): number {
      const isTenK = tier === "10k";
      const baseRisk = isTenK ? 50 : 30;
      if (profitPct >= 7.5) {
        return isTenK ? 50 : 25;
      }
      return baseRisk;
    }

    it("enforces $30 max risk on standard 5K Turbo", () => {
      expect(getRiskAllowance("5k", 2.5)).toBe(30);
    });

    it("enforces $50 max risk on standard 10K Turbo", () => {
      expect(getRiskAllowance("10k", 3.0)).toBe(50);
    });

    it("reduces 5K risk to $25 when profit reaches 7.5% threshold", () => {
      expect(getRiskAllowance("5k", 7.49)).toBe(30);
      expect(getRiskAllowance("5k", 7.50)).toBe(25);
      expect(getRiskAllowance("5k", 8.20)).toBe(25);
    });

    it("maintains 10K risk at $50 cap when profit reaches 7.5%", () => {
      expect(getRiskAllowance("10k", 7.50)).toBe(50);
      expect(getRiskAllowance("10k", 8.00)).toBe(50);
    });
  });

  // ─── Rule 5: Intraday Circuit Breaker ─────────────────────────────────────
  describe("Rule 5: Intraday Circuit Breaker ($75 for 5K, $135 for 10K)", () => {
    function isCircuitBreakerTripped(tier: "5k" | "10k", dailyLoss: number): { tripped: boolean; remainingRoom: number } {
      const limit = tier === "10k" ? 135 : 75;
      return {
        tripped: dailyLoss >= limit,
        remainingRoom: Math.max(0, limit - dailyLoss),
      };
    }

    it("trips 5K account at $75 loss", () => {
      const state1 = isCircuitBreakerTripped("5k", 50);
      expect(state1.tripped).toBe(false);
      expect(state1.remainingRoom).toBe(25);

      const state2 = isCircuitBreakerTripped("5k", 75);
      expect(state2.tripped).toBe(true);
      expect(state2.remainingRoom).toBe(0);
    });

    it("trips 10K account at $135 loss", () => {
      const state1 = isCircuitBreakerTripped("10k", 100);
      expect(state1.tripped).toBe(false);
      expect(state1.remainingRoom).toBe(35);

      const state2 = isCircuitBreakerTripped("10k", 135);
      expect(state2.tripped).toBe(true);
      expect(state2.remainingRoom).toBe(0);
    });
  });

  // ─── Rule 7: Parallel Trading & 45-Min Cooldown ───────────────────────────
  describe("Rule 7: Parallel Trading (Max 1 Open Trade) & 45-Min Cooldown", () => {
    function checkParallelTrade(openPositionsCount: number): boolean {
      return openPositionsCount === 0; // Only permitted when 0 open trades
    }

    function checkCooldown(lastTradeTimestampMs: number, nowMs: number): { allowed: boolean; remainingMinutes: number } {
      const elapsedMin = Math.floor((nowMs - lastTradeTimestampMs) / (1000 * 60));
      return {
        allowed: elapsedMin >= 45,
        remainingMinutes: Math.max(0, 45 - elapsedMin),
      };
    }

    it("allows new trade only when 0 positions are currently open", () => {
      expect(checkParallelTrade(0)).toBe(true);
      expect(checkParallelTrade(1)).toBe(false);
      expect(checkParallelTrade(2)).toBe(false);
    });

    it("enforces 45-minute pause after last trade fill", () => {
      const now = 1770000000000;
      const recentTrade = now - (20 * 60 * 1000); // 20 mins ago
      const cool1 = checkCooldown(recentTrade, now);
      expect(cool1.allowed).toBe(false);
      expect(cool1.remainingMinutes).toBe(25);

      const oldTrade = now - (50 * 60 * 1000); // 50 mins ago
      const cool2 = checkCooldown(oldTrade, now);
      expect(cool2.allowed).toBe(true);
      expect(cool2.remainingMinutes).toBe(0);
    });
  });

  // ─── Position Sizing Math (Rules 3 & 4) ───────────────────────────────────
  describe("Position Sizing Math", () => {
    it("computes exact unit size so stop loss loss equals max risk", () => {
      const maxRisk = 50; // $50 risk
      const entry = 68000;
      const stopLoss = 67500;
      const distance = Math.abs(entry - stopLoss); // $500 distance

      const size = maxRisk / distance; // 50 / 500 = 0.1 BTC
      expect(size).toBe(0.1);

      // Verify loss if stopped out
      const lossAtStop = size * distance;
      expect(lossAtStop).toBe(50);
    });

    it("computes exact unit size for altcoins ($30 risk)", () => {
      const maxRisk = 30;
      const entry = 5.00;
      const stopLoss = 4.70;
      const distance = entry - stopLoss; // $0.30

      const size = maxRisk / distance; // 30 / 0.30 = 100 NEAR
      expect(size).toBeCloseTo(100);

      const lossAtStop = size * distance;
      expect(lossAtStop).toBeCloseTo(30);
    });
  });
});
