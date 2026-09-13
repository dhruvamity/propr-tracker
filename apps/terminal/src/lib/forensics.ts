import type { TradeData } from "./types";

export type RuleViolationType =
  | "WEEKEND_TRADE"
  | "UNAUTHORIZED_ASSET"
  | "OVER_RISK"
  | "COOLDOWN_BREACH";

export interface TradeRuleViolation {
  type: RuleViolationType;
  label: string;
  severity: "critical" | "warning";
  costUSD: number;
  description: string;
}

export interface TaggedTrade {
  trade: TradeData;
  violations: TradeRuleViolation[];
  isCompliant: boolean;
  costOfViolationUSD: number;
}

export interface ForensicsSummary {
  totalTrades: number;
  compliantTrades: number;
  violatingTrades: number;
  disciplineScore: number; // 0 to 100
  totalViolationCostUSD: number; // Total dollars lost on violating trades
  netPnl: number;
  cleanNetPnl: number; // Net P&L if all violating trades had been avoided
  violationsByType: Record<
    RuleViolationType,
    { count: number; costUSD: number; label: string }
  >;
  taggedTrades: TaggedTrade[];
}

const ALLOWED_ASSET_BASE_SYMBOLS = new Set([
  "BTC",
  "GOLD",
  "PAXG",
  "NEAR",
  "ENA",
  "HYPE",
  "ZEC",
]);

/**
 * Normalizes an asset symbol (e.g. "BTC-USD", "PAXG-PERP", "Gold / PAXG")
 * down to its core ticker (e.g. "BTC", "PAXG", "GOLD").
 */
export function normalizeAssetSymbol(raw: string): string {
  if (!raw) return "";
  const cleaned = raw
    .toUpperCase()
    .replace(/-(USD|USDT|PERP)$/g, "")
    .replace(/\/(USD|USDT)$/g, "")
    .trim();

  if (cleaned.includes("PAXG") || cleaned.includes("GOLD")) {
    return "PAXG";
  }
  return cleaned;
}

/**
 * Checks if a timestamp falls within the weekend trading freeze:
 * Saturday 00:30 IST to Monday 06:30 IST (Friday 19:00 UTC to Monday 01:00 UTC).
 */
export function isWeekendTradingWindow(executedAt: string | Date): boolean {
  const d = new Date(executedAt);
  if (isNaN(d.getTime())) return false;

  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const hour = d.getUTCHours();

  // Friday after 19:00 UTC
  if (day === 5 && hour >= 19) return true;
  // Saturday all day
  if (day === 6) return true;
  // Sunday all day
  if (day === 0) return true;
  // Monday before 01:00 UTC
  if (day === 1 && hour < 1) return true;

  return false;
}

/**
 * Analyzes a list of trades for an account, tags rule violations,
 * and computes overall Discipline Score and Cost of Violations.
 */
export function analyzeTradeForensics(
  trades: TradeData[],
  initialBalance = 10000
): ForensicsSummary {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      compliantTrades: 0,
      violatingTrades: 0,
      disciplineScore: 100,
      totalViolationCostUSD: 0,
      netPnl: 0,
      cleanNetPnl: 0,
      violationsByType: {
        WEEKEND_TRADE: { count: 0, costUSD: 0, label: "Weekend Trade" },
        UNAUTHORIZED_ASSET: { count: 0, costUSD: 0, label: "Unauthorized Asset" },
        OVER_RISK: { count: 0, costUSD: 0, label: "Over-Risk" },
        COOLDOWN_BREACH: { count: 0, costUSD: 0, label: "Cooldown Breach" },
      },
      taggedTrades: [],
    };
  }

  // Sort chronologically for accurate cooldown tracking
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
  );

  // Maximum allowed risk per trade based on account tier:
  // 5K accounts: $30 ($32 with fee/slippage buffer)
  // 10K accounts: $50 ($52 with fee/slippage buffer)
  const maxRiskThreshold = initialBalance <= 5000 ? 32 : 52;
  const standardRiskLimit = initialBalance <= 5000 ? 30 : 50;

  const violationsByType: Record<
    RuleViolationType,
    { count: number; costUSD: number; label: string }
  > = {
    WEEKEND_TRADE: { count: 0, costUSD: 0, label: "Weekend Trade" },
    UNAUTHORIZED_ASSET: { count: 0, costUSD: 0, label: "Unauthorized Asset" },
    OVER_RISK: { count: 0, costUSD: 0, label: "Over-Risk" },
    COOLDOWN_BREACH: { count: 0, costUSD: 0, label: "Cooldown Breach" },
  };

  let totalNetPnl = 0;
  let cleanNetPnl = 0;
  let totalViolationCostUSD = 0;
  let compliantTradesCount = 0;

  let lastLossTimestamp: number | null = null;
  const taggedTrades: TaggedTrade[] = [];

  for (const trade of sortedTrades) {
    const rPnl = Number(trade.realizedPnl || 0);
    const fee = Number(trade.fee || 0);
    const tradeNet = rPnl - fee;
    const tradeTime = new Date(trade.executedAt).getTime();
    const tradeLoss = tradeNet < 0 ? Math.abs(tradeNet) : 0;

    totalNetPnl += tradeNet;

    const violations: TradeRuleViolation[] = [];

    // 1. Weekend Window Check
    if (isWeekendTradingWindow(trade.executedAt)) {
      violations.push({
        type: "WEEKEND_TRADE",
        label: "Weekend Trade",
        severity: "critical",
        costUSD: tradeLoss,
        description: "Executed during weekend freeze window (Sat 00:30 – Mon 06:30 IST)",
      });
      violationsByType.WEEKEND_TRADE.count++;
      violationsByType.WEEKEND_TRADE.costUSD += tradeLoss;
    }

    // 2. Unauthorized Asset Check
    const normalizedSymbol = normalizeAssetSymbol(trade.asset || trade.base || "");
    if (!ALLOWED_ASSET_BASE_SYMBOLS.has(normalizedSymbol)) {
      violations.push({
        type: "UNAUTHORIZED_ASSET",
        label: "Unauthorized Asset",
        severity: "critical",
        costUSD: tradeLoss,
        description: `Asset ${trade.asset || "UNKNOWN"} not in approved universe (BTC, Gold/PAXG, NEAR, ENA, HYPE, ZEC)`,
      });
      violationsByType.UNAUTHORIZED_ASSET.count++;
      violationsByType.UNAUTHORIZED_ASSET.costUSD += tradeLoss;
    }

    // 3. Over-Risk Check
    if (tradeNet < 0 && Math.abs(tradeNet) > maxRiskThreshold) {
      const excess = Math.abs(tradeNet) - standardRiskLimit;
      violations.push({
        type: "OVER_RISK",
        label: "Over-Risk",
        severity: "critical",
        costUSD: tradeLoss,
        description: `Loss of -$${Math.abs(tradeNet).toFixed(2)} exceeded limit ($${standardRiskLimit}) by -$${excess.toFixed(2)}`,
      });
      violationsByType.OVER_RISK.count++;
      violationsByType.OVER_RISK.costUSD += tradeLoss;
    }

    // 4. Cooldown Breach Check (45 minutes = 2,700,000 ms)
    if (lastLossTimestamp !== null) {
      const elapsedMs = tradeTime - lastLossTimestamp;
      if (elapsedMs >= 0 && elapsedMs < 45 * 60 * 1000) {
        const elapsedMins = Math.floor(elapsedMs / 60000);
        violations.push({
          type: "COOLDOWN_BREACH",
          label: "Cooldown Breach",
          severity: tradeLoss > 0 ? "critical" : "warning",
          costUSD: tradeLoss,
          description: `Entered trade only ${elapsedMins}m after prior loss (45m cooldown required)`,
        });
        violationsByType.COOLDOWN_BREACH.count++;
        violationsByType.COOLDOWN_BREACH.costUSD += tradeLoss;
      }
    }

    // Update cooldown tracker if this trade was a loss
    if (tradeNet < 0) {
      lastLossTimestamp = tradeTime;
    }

    const isCompliant = violations.length === 0;
    if (isCompliant) {
      compliantTradesCount++;
      cleanNetPnl += tradeNet;
    } else {
      totalViolationCostUSD += tradeLoss;
    }

    taggedTrades.push({
      trade,
      violations,
      isCompliant,
      costOfViolationUSD: tradeLoss,
    });
  }

  const disciplineScore =
    sortedTrades.length > 0
      ? Number(((compliantTradesCount / sortedTrades.length) * 100).toFixed(1))
      : 100;

  return {
    totalTrades: sortedTrades.length,
    compliantTrades: compliantTradesCount,
    violatingTrades: sortedTrades.length - compliantTradesCount,
    disciplineScore,
    totalViolationCostUSD: Number(totalViolationCostUSD.toFixed(2)),
    netPnl: Number(totalNetPnl.toFixed(2)),
    cleanNetPnl: Number(cleanNetPnl.toFixed(2)),
    violationsByType,
    taggedTrades,
  };
}

export interface DailyForensicsChecklist {
  whitelistApproved: boolean;
  riskCapRespected: boolean;
  cooldownObserved: boolean;
  weekendFreezeRespected: boolean;
}

export interface DailyForensicsSummary {
  dateKey: string; // YYYY-MM-DD
  dateLabel: string; // e.g. "Fri, Sep 11, 2026"
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
  grossPnl: number;
  fees: number;
  disciplineScore: number;
  isFlawless: boolean;
  violationsCount: number;
  costOfViolationsUSD: number;
  violationsByType: Record<
    RuleViolationType,
    { count: number; costUSD: number; label: string }
  >;
  taggedTrades: TaggedTrade[];
  checklist: DailyForensicsChecklist;
}

/**
 * Groups analyzed trades into daily buckets with day-level forensics and discipline checklists.
 */
export function groupTradesByDay(
  trades: TradeData[],
  initialBalance = 10000
): Map<string, DailyForensicsSummary> {
  const forensics = analyzeTradeForensics(trades, initialBalance);
  const dayMap = new Map<string, DailyForensicsSummary>();

  for (const tt of forensics.taggedTrades) {
    const executedAt = tt.trade.executedAt;
    const dateObj = new Date(executedAt);
    if (isNaN(dateObj.getTime())) continue;

    const dateKey = executedAt.slice(0, 10); // YYYY-MM-DD
    const dateLabel = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        dateKey,
        dateLabel,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        netPnl: 0,
        grossPnl: 0,
        fees: 0,
        disciplineScore: 100,
        isFlawless: true,
        violationsCount: 0,
        costOfViolationsUSD: 0,
        violationsByType: {
          WEEKEND_TRADE: { count: 0, costUSD: 0, label: "Weekend Trade" },
          UNAUTHORIZED_ASSET: { count: 0, costUSD: 0, label: "Unauthorized Asset" },
          OVER_RISK: { count: 0, costUSD: 0, label: "Over-Risk" },
          COOLDOWN_BREACH: { count: 0, costUSD: 0, label: "Cooldown Breach" },
        },
        taggedTrades: [],
        checklist: {
          whitelistApproved: true,
          riskCapRespected: true,
          cooldownObserved: true,
          weekendFreezeRespected: true,
        },
      });
    }

    const day = dayMap.get(dateKey)!;
    const rPnl = Number(tt.trade.realizedPnl || 0);
    const fee = Number(tt.trade.fee || 0);
    const net = rPnl - fee;

    day.totalTrades += 1;
    day.grossPnl += rPnl;
    day.fees += fee;
    day.netPnl += net;

    if (net > 0) day.winningTrades += 1;
    else if (net < 0) day.losingTrades += 1;

    day.violationsCount += tt.violations.length;
    day.costOfViolationsUSD += tt.costOfViolationUSD;

    for (const v of tt.violations) {
      if (day.violationsByType[v.type]) {
        day.violationsByType[v.type].count += 1;
        day.violationsByType[v.type].costUSD += v.costUSD;
      }

      if (v.type === "UNAUTHORIZED_ASSET") day.checklist.whitelistApproved = false;
      if (v.type === "OVER_RISK") day.checklist.riskCapRespected = false;
      if (v.type === "COOLDOWN_BREACH") day.checklist.cooldownObserved = false;
      if (v.type === "WEEKEND_TRADE") day.checklist.weekendFreezeRespected = false;
    }

    day.taggedTrades.push(tt);
  }

  // Final pass to compute percentages and rounding
  for (const day of dayMap.values()) {
    const compliant = day.taggedTrades.filter((t) => t.isCompliant).length;
    day.disciplineScore =
      day.totalTrades > 0
        ? Number(((compliant / day.totalTrades) * 100).toFixed(1))
        : 100;
    day.isFlawless = day.totalTrades > 0 && compliant === day.totalTrades;
    day.winRate =
      day.totalTrades > 0
        ? Number(((day.winningTrades / day.totalTrades) * 100).toFixed(1))
        : 0;
    day.netPnl = Number(day.netPnl.toFixed(2));
    day.grossPnl = Number(day.grossPnl.toFixed(2));
    day.fees = Number(day.fees.toFixed(2));
    day.costOfViolationsUSD = Number(day.costOfViolationsUSD.toFixed(2));
  }

  return dayMap;
}

