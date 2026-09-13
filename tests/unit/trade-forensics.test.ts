import { describe, it, expect } from "vitest";
import {
  analyzeTradeForensics,
  groupTradesByDay,
  groupMultiAccountTradesByDay,
  isWeekendTradingWindow,
  normalizeAssetSymbol,
} from "../../apps/terminal/src/lib/forensics";
import type { TradeData, AccountSnapshot } from "../../apps/terminal/src/lib/types";

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

  describe("groupTradesByDay", () => {
    it("groups trades across multiple calendar days and computes day-level checklist and discipline", () => {
      const trades: TradeData[] = [
        // Day 1: 2026-03-04 (Wednesday) - 2 compliant trades
        {
          tradeId: "t1",
          accountId: "acc-1",
          asset: "BTC",
          side: "buy",
          positionSide: "long",
          quantity: "0.1",
          price: "65000",
          quoteQuantity: "6500",
          fee: "1.0",
          realizedPnl: "50.0",
          executedAt: "2026-03-04T10:00:00Z",
          createdAt: "2026-03-04T09:50:00Z",
          type: "market",
          liquidityType: "taker",
          base: "BTC",
          quote: "USD",
        },
        {
          tradeId: "t2",
          accountId: "acc-1",
          asset: "PAXG",
          side: "buy",
          positionSide: "long",
          quantity: "1.0",
          price: "2500",
          quoteQuantity: "2500",
          fee: "0.5",
          realizedPnl: "25.0",
          executedAt: "2026-03-04T14:00:00Z",
          createdAt: "2026-03-04T13:50:00Z",
          type: "market",
          liquidityType: "taker",
          base: "PAXG",
          quote: "USD",
        },
        // Day 2: 2026-03-07 (Saturday) - Weekend violation trade
        {
          tradeId: "t3",
          accountId: "acc-1",
          asset: "BTC",
          side: "sell",
          positionSide: "short",
          quantity: "0.1",
          price: "65000",
          quoteQuantity: "6500",
          fee: "1.0",
          realizedPnl: "-30.0",
          executedAt: "2026-03-07T12:00:00Z",
          createdAt: "2026-03-07T11:50:00Z",
          type: "market",
          liquidityType: "taker",
          base: "BTC",
          quote: "USD",
        },
      ];

      const dayMap = groupTradesByDay(trades, 10000);
      expect(dayMap.size).toBe(2);

      // Verify Day 1
      const day1 = dayMap.get("2026-03-04")!;
      expect(day1).toBeDefined();
      expect(day1.totalTrades).toBe(2);
      expect(day1.winningTrades).toBe(2);
      expect(day1.isFlawless).toBe(true);
      expect(day1.disciplineScore).toBe(100);
      expect(day1.checklist.whitelistApproved).toBe(true);
      expect(day1.checklist.riskCapRespected).toBe(true);
      expect(day1.checklist.cooldownObserved).toBe(true);
      expect(day1.checklist.weekendFreezeRespected).toBe(true);

      // Verify Day 2
      const day2 = dayMap.get("2026-03-07")!;
      expect(day2).toBeDefined();
      expect(day2.totalTrades).toBe(1);
      expect(day2.isFlawless).toBe(false);
      expect(day2.disciplineScore).toBe(0);
      expect(day2.checklist.weekendFreezeRespected).toBe(false);
      expect(day2.costOfViolationsUSD).toBe(31);
    });
  });

  describe("groupMultiAccountTradesByDay", () => {
    it("mixes multiple accounts together, applying each account's specific risk tier rules", () => {
      const acc5k: AccountSnapshot = {
        accountId: "acc-5000-1111",
        stage: "PASSED",
        challengeName: "Propr 5K Challenge",
        status: "ACTIVE",
        initialBalance: "5000",
        balance: "5200",
        equity: "5200",
        currency: "USD",
        createdAt: "2026-03-01T00:00:00Z",
        updatedAt: "2026-03-04T12:00:00Z",
        trades: [
          // On 5K account, a -$45 loss is an OVER_RISK violation (threshold is $32)
          {
            tradeId: "t-5k-1",
            accountId: "acc-5000-1111",
            asset: "BTC",
            side: "buy",
            positionSide: "long",
            quantity: "0.1",
            price: "65000",
            quoteQuantity: "6500",
            fee: "1.0",
            realizedPnl: "-45.0",
            executedAt: "2026-03-04T10:00:00Z",
            createdAt: "2026-03-04T09:50:00Z",
            type: "market",
            liquidityType: "taker",
            base: "BTC",
            quote: "USD",
          },
        ],
      };

      const acc10k: AccountSnapshot = {
        accountId: "acc-10000-2222",
        stage: "FUNDED",
        challengeName: "Propr 10K Funded",
        status: "ACTIVE",
        initialBalance: "10000",
        balance: "10150",
        equity: "10150",
        currency: "USD",
        createdAt: "2026-03-01T00:00:00Z",
        updatedAt: "2026-03-04T15:00:00Z",
        trades: [
          // On 10K account, a -$45 loss is compliant (threshold is $52)
          {
            tradeId: "t-10k-1",
            accountId: "acc-10000-2222",
            asset: "PAXG",
            side: "buy",
            positionSide: "long",
            quantity: "1.0",
            price: "2500",
            quoteQuantity: "2500",
            fee: "0.5",
            realizedPnl: "-45.0",
            executedAt: "2026-03-04T14:00:00Z",
            createdAt: "2026-03-04T13:50:00Z",
            type: "market",
            liquidityType: "taker",
            base: "PAXG",
            quote: "USD",
          },
        ],
      };

      const dayMap = groupMultiAccountTradesByDay([acc5k, acc10k]);
      expect(dayMap.size).toBe(1);

      const day = dayMap.get("2026-03-04")!;
      expect(day).toBeDefined();
      expect(day.totalTrades).toBe(2);
      expect(day.netPnl).toBe(-91.5); // (-45 - 1) + (-45 - 0.5)

      // t-5k-1 violated OVER_RISK, t-10k-1 was compliant
      expect(day.taggedTrades).toHaveLength(2);
      expect(day.taggedTrades[0].accountTier).toBe("5K");
      expect(day.taggedTrades[0].accountTag).toBe("1111");
      expect(day.taggedTrades[0].violations).toHaveLength(1);
      expect(day.taggedTrades[0].violations[0].type).toBe("OVER_RISK");

      expect(day.taggedTrades[1].accountTier).toBe("10K");
      expect(day.taggedTrades[1].accountTag).toBe("2222");
      expect(day.taggedTrades[1].violations).toHaveLength(0);
      expect(day.taggedTrades[1].isCompliant).toBe(true);

      // Multi-account daily metrics
      expect(day.disciplineScore).toBe(50);
      expect(day.violationsCount).toBe(1);
      expect(day.costOfViolationsUSD).toBe(46); // 45 loss + 1 fee
    });
  });
});
