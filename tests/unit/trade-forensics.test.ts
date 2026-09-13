import { describe, it, expect } from "vitest";
import {
  analyzeTradeForensics,
  isWeekendTradingWindow,
  normalizeAssetSymbol,
} from "../../apps/terminal/src/lib/forensics";
import type { TradeData } from "../../apps/terminal/src/lib/types";

describe("Trade Forensics & Discipline Engine", () => {
  describe("normalizeAssetSymbol", () => {
    it("strips quote currencies and suffixes cleanly", () => {
      expect(normalizeAssetSymbol("BTC-USD")).toBe("BTC");
      expect(normalizeAssetSymbol("BTC-PERP")).toBe("BTC");
      expect(normalizeAssetSymbol("PAXG-PERP")).toBe("PAXG");
      expect(normalizeAssetSymbol("Gold / PAXG")).toBe("PAXG");
      expect(normalizeAssetSymbol("near")).toBe("NEAR");
      expect(normalizeAssetSymbol("ena-usd")).toBe("ENA");
    });
  });

  describe("isWeekendTradingWindow", () => {
    it("detects Friday post-19:00 UTC as weekend freeze", () => {
      // 2026-03-06 is Friday. 19:30 UTC = Sat 01:00 AM IST
      expect(isWeekendTradingWindow("2026-03-06T19:30:00Z")).toBe(true);
      // 2026-03-06 18:00 UTC is still active trading
      expect(isWeekendTradingWindow("2026-03-06T18:00:00Z")).toBe(false);
    });

    it("detects Saturday and Sunday as weekend freeze", () => {
      // 2026-03-07 is Saturday
      expect(isWeekendTradingWindow("2026-03-07T12:00:00Z")).toBe(true);
      // 2026-03-08 is Sunday
      expect(isWeekendTradingWindow("2026-03-08T22:00:00Z")).toBe(true);
    });

    it("detects Monday pre-01:00 UTC as weekend freeze and post-01:00 UTC as active", () => {
      // 2026-03-09 is Monday. 00:45 UTC = 06:15 IST (freeze)
      expect(isWeekendTradingWindow("2026-03-09T00:45:00Z")).toBe(true);
      // 2026-03-09 01:15 UTC = 06:45 IST (active)
      expect(isWeekendTradingWindow("2026-03-09T01:15:00Z")).toBe(false);
    });
  });

  describe("analyzeTradeForensics", () => {
    it("handles empty trade list gracefully", () => {
      const result = analyzeTradeForensics([]);
      expect(result.totalTrades).toBe(0);
      expect(result.disciplineScore).toBe(100);
      expect(result.totalViolationCostUSD).toBe(0);
      expect(result.taggedTrades).toHaveLength(0);
    });

    it("detects unauthorized asset and tags violation with cost", () => {
      const trades: TradeData[] = [
        {
          tradeId: "t1",
          accountId: "acc-1",
          asset: "DOGE",
          side: "buy",
          positionSide: "long",
          quantity: "1000",
          price: "0.15",
          quoteQuantity: "150",
          fee: "0.5",
          realizedPnl: "-25.0",
          executedAt: "2026-03-04T10:00:00Z", // Wednesday
          createdAt: "2026-03-04T09:55:00Z",
          type: "market",
          liquidityType: "taker",
          base: "DOGE",
          quote: "USD",
        },
      ];

      const result = analyzeTradeForensics(trades, 10000);
      expect(result.totalTrades).toBe(1);
      expect(result.disciplineScore).toBe(0);
      expect(result.violatingTrades).toBe(1);
      expect(result.totalViolationCostUSD).toBe(25.5); // 25 pnl + 0.5 fee
      expect(result.violationsByType.UNAUTHORIZED_ASSET.count).toBe(1);
      expect(result.taggedTrades[0].violations[0].type).toBe("UNAUTHORIZED_ASSET");
    });

    it("detects over-risk violation when loss exceeds account limit", () => {
      // 5K account has $30 limit ($32 threshold)
      const trades: TradeData[] = [
        {
          tradeId: "t1",
          accountId: "acc-5k",
          asset: "BTC",
          side: "buy",
          positionSide: "long",
          quantity: "0.1",
          price: "65000",
          quoteQuantity: "6500",
          fee: "1.0",
          realizedPnl: "-65.0", // Exceeds $32
          executedAt: "2026-03-04T12:00:00Z",
          createdAt: "2026-03-04T11:50:00Z",
          type: "market",
          liquidityType: "taker",
          base: "BTC",
          quote: "USD",
        },
      ];

      const result = analyzeTradeForensics(trades, 5000);
      expect(result.disciplineScore).toBe(0);
      expect(result.violationsByType.OVER_RISK.count).toBe(1);
      expect(result.taggedTrades[0].violations[0].type).toBe("OVER_RISK");
      expect(result.totalViolationCostUSD).toBe(66);
    });

    it("detects cooldown breach when trade entered within 45 min of a loss", () => {
      const trades: TradeData[] = [
        {
          tradeId: "t1",
          accountId: "acc-10k",
          asset: "BTC",
          side: "buy",
          positionSide: "long",
          quantity: "0.1",
          price: "65000",
          quoteQuantity: "6500",
          fee: "1.0",
          realizedPnl: "-20.0", // loss
          executedAt: "2026-03-04T10:00:00Z",
          createdAt: "2026-03-04T09:50:00Z",
          type: "market",
          liquidityType: "taker",
          base: "BTC",
          quote: "USD",
        },
        {
          tradeId: "t2",
          accountId: "acc-10k",
          asset: "BTC",
          side: "buy",
          positionSide: "long",
          quantity: "0.1",
          price: "65000",
          quoteQuantity: "6500",
          fee: "1.0",
          realizedPnl: "-30.0", // loss entered 15 mins later (cooldown breach!)
          executedAt: "2026-03-04T10:15:00Z",
          createdAt: "2026-03-04T10:14:00Z",
          type: "market",
          liquidityType: "taker",
          base: "BTC",
          quote: "USD",
        },
        {
          tradeId: "t3",
          accountId: "acc-10k",
          asset: "BTC",
          side: "sell",
          positionSide: "short",
          quantity: "0.1",
          price: "65000",
          quoteQuantity: "6500",
          fee: "1.0",
          realizedPnl: "45.0", // entered 1 hour later (compliant!)
          executedAt: "2026-03-04T11:20:00Z",
          createdAt: "2026-03-04T11:15:00Z",
          type: "market",
          liquidityType: "taker",
          base: "BTC",
          quote: "USD",
        },
      ];

      const result = analyzeTradeForensics(trades, 10000);
      expect(result.totalTrades).toBe(3);
      expect(result.compliantTrades).toBe(2); // t1 (first trade, no prior loss) and t3 (after cooldown)
      expect(result.violatingTrades).toBe(1); // t2 breached cooldown
      expect(result.disciplineScore).toBe(66.7);
      expect(result.violationsByType.COOLDOWN_BREACH.count).toBe(1);
      expect(result.totalViolationCostUSD).toBe(31); // t2 loss + fee
    });
  });
});
