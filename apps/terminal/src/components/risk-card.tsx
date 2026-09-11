import React from "react";
import type { AccountSnapshot } from "@/lib/propr-api";
import { formatUSD, formatPercent, formatShortId } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { TrendSparkline } from "./trend-sparkline";

interface RiskCardProps {
  account: AccountSnapshot;
  rank?: number;
}

export function RiskCard({ account, rank }: RiskCardProps) {
  const equityNum = Number(account.equity || 0);
  const balanceNum = Number(account.balance || 0);
  const startBalNum = Number(account.initialBalance || account.startingBalance || 10000);
  const breachFloorNum = Number(account.breachFloor || (equityNum - Number(account.drawdownRemaining || 0)));
  const drawdownBufferNum = Number(account.drawdownRemaining || 0);
  const dailyRoomNum = Number(account.dailyLossRemaining || 0);
  const dailyLimitNum = Number(account.dailyLossLimitAmount || 0);
  const dailyUsedNum = Number(account.dailyLossUsedAmount || 0);
  const ddConsumedPct = Number(account.drawdownLimitConsumedPercent || 0);
  const targetProgressPct = Number(account.profitTargetProgressPercent || 0);
  const actualProfitPct = Number(account.profitTargetPct || 0);

  // Daily loss budget consumption & room
  const dailyConsumedPct = dailyLimitNum > 0 ? Math.min(100, Math.max(0, (dailyUsedNum / dailyLimitNum) * 100)) : 0;
  const dailyRoomPct = dailyLimitNum > 0 ? (dailyRoomNum / dailyLimitNum) * 100 : 100;
  const maxDdAmount = Number(account.maxDrawdownAmount || (startBalNum * 0.03));
  const bufferRemainingPct = maxDdAmount > 0 ? (drawdownBufferNum / maxDdAmount) * 100 : 100;

  // Semantic Risk State Determination (Graduated: CRITICAL / WATCH / SAFE)
  let riskStatus: "SAFE" | "WATCH" | "CRITICAL" | "BREACHED" = "SAFE";
  if (account.stage === "BREACHED" || account.stage === "FAILED") {
    riskStatus = "BREACHED";
  } else if (dailyRoomPct <= 25 || bufferRemainingPct <= 25 || ddConsumedPct >= 75 || dailyConsumedPct >= 75) {
    riskStatus = "CRITICAL";
  } else if (dailyRoomPct <= 50 || bufferRemainingPct <= 50 || ddConsumedPct >= 40 || dailyConsumedPct >= 50) {
    riskStatus = "WATCH";
  } else {
    riskStatus = "SAFE";
  }

  // Drawdown Ruler calculation
  const floorDelta = Math.max(0, equityNum - breachFloorNum);
  const totalSpan = Math.max(1, startBalNum * 0.08);
  const rulerPercentage = Math.min(100, Math.max(8, (floorDelta / totalSpan) * 100));

  // Status rail color — semantic left rail
  const railColor =
    riskStatus === "SAFE"
      ? "bg-emerald-500"
      : riskStatus === "WATCH"
      ? "bg-amber-500"
      : "bg-red-500";

  // Dominant number color
  const dominantColor =
    riskStatus === "SAFE"
      ? "text-white"
      : riskStatus === "WATCH"
      ? "text-amber-400"
      : "text-red-400";

  // Account identifier tag
  const shortAccCode = formatShortId(account.accountId);
  const cleanBadgeTag = `#${shortAccCode.slice(-4)}`;

  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4 relative overflow-hidden transition-all hover:border-zinc-700/80">
      {/* Left semantic status rail */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${railColor}`} />

      {/* Header: Title + Real Account ID + Risk Status */}
      <div className="flex items-start justify-between pb-3 pl-1 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-white tracking-wide">
              {account.challengeName || "Starter Turbo"}
            </h3>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
              {cleanBadgeTag}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              USD
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
            {shortAccCode}
          </p>
        </div>

        {/* Risk Status Pill — graduated semantic state */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold border ${
            riskStatus === "SAFE"
              ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50"
              : riskStatus === "WATCH"
              ? "bg-amber-950/50 text-amber-400 border-amber-800/50"
              : "bg-red-950/50 text-red-400 border-red-800/50"
          }`}
        >
          {riskStatus === "SAFE" && <ShieldCheck size={13} />}
          {riskStatus === "WATCH" && <AlertTriangle size={13} />}
          {(riskStatus === "CRITICAL" || riskStatus === "BREACHED") && (
            <ShieldAlert size={13} className="animate-pulse" />
          )}
          {riskStatus}
        </span>
      </div>

      {/* Dominant: Drawdown Buffer & Equity */}
      <div className="pl-1">
        <div className="flex items-baseline justify-between">
          <div className={`text-2xl md:text-3xl font-mono font-bold ${dominantColor}`}>
            {formatUSD(drawdownBufferNum)}{" "}
            <span className="text-xs font-normal text-zinc-500 font-sans">USD buffer</span>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Equity <span className="text-white font-medium">{formatUSD(equityNum)} USD</span>
          </div>
        </div>
        <div className="text-xs font-mono text-zinc-400 mt-0.5">
          Drawdown floor <span className="text-red-400/90 font-medium">{formatUSD(breachFloorNum)}</span>
        </div>
      </div>

      {/* ─── 1. Breach Floor Ruler ─── */}
      <div className="pl-1 space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
          <span>Drawdown Floor {formatUSD(breachFloorNum)}</span>
          <span className="text-zinc-400">Buffer {formatUSD(drawdownBufferNum)}</span>
        </div>
        <div className="relative h-1.5 w-full bg-zinc-900 rounded-full border border-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              riskStatus === "SAFE"
                ? "bg-zinc-500"
                : riskStatus === "WATCH"
                ? "bg-amber-500/80"
                : "bg-red-500/80"
            }`}
            style={{ width: `${rulerPercentage}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)] border-2 border-zinc-950 transition-all duration-500"
            style={{ left: `calc(${rulerPercentage}% - 6px)` }}
          />
        </div>
      </div>

      {/* ─── 2. Daily Loss Visual Slider (The Real Killer) ─── */}
      <div className="pl-1 pt-1 space-y-1.5">
        <div className="flex justify-between items-baseline text-[11px] font-mono">
          <span
            className="text-zinc-400 font-medium flex items-center gap-1.5 cursor-help"
            title={`Daily loss budget = ${account.maxDailyLossPercent || "3"}% of day start snapshot (${formatUSD(account.startingBalance)}), not initial balance. Breaches if equity drops below ${formatUSD(account.dailyLossFloor)}.`}
          >
            Daily loss budget
            <span className="text-[10px] text-zinc-500 font-normal underline decoration-dotted decoration-zinc-600">
              (3% of day start)
            </span>
            {dailyConsumedPct >= 75 && (
              <span className="text-[10px] font-bold text-red-400 animate-pulse">
                ⚠ {dailyConsumedPct.toFixed(0)}% BURNED
              </span>
            )}
          </span>
          <span
            className="text-zinc-300 font-medium cursor-help"
            title={`Used: ${formatUSD(dailyUsedNum)} of ${formatUSD(dailyLimitNum)} limit (Day start base: ${formatUSD(account.startingBalance)})`}
          >
            {formatUSD(dailyUsedNum)}{" "}
            <span className="text-zinc-500">/ {formatUSD(dailyLimitNum)}</span>
          </span>
        </div>

        <div className="relative h-2 w-full bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              dailyConsumedPct >= 75
                ? "bg-red-500"
                : dailyConsumedPct >= 50
                ? "bg-amber-500"
                : "bg-emerald-500/80"
            }`}
            style={{ width: `${dailyConsumedPct}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-mono">
          <span className="text-zinc-500">Floor: {formatUSD(account.dailyLossFloor)}</span>
          <span className={`font-semibold ${dailyRoomNum < 50 ? "text-red-400" : "text-emerald-400"}`}>
            Room left: {formatUSD(dailyRoomNum)}
          </span>
        </div>

        {/* Trade Trajectory Sparkline (Prompt: Did room disappear gradually or in one trade?) */}
        {account.trades && account.trades.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/60">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
              <span>Trade trajectory:</span>
              <span className="text-zinc-400">
                {account.closedTradesCount || account.trades.length} trades
                {account.winLossRatio ? ` (${account.winLossRatio})` : ""}
                {account.worstTradeUSD && Number(account.worstTradeUSD) < 0 && (
                  <span className="ml-1 text-red-400/90 font-medium">
                    • Worst: -${Math.round(Math.abs(Number(account.worstTradeUSD)))}
                  </span>
                )}
              </span>
            </div>
            <TrendSparkline trades={account.trades} width={130} height={24} showInsight={true} />
          </div>
        )}
      </div>

      {/* Limits & Room Matrix */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pl-1 pt-2 border-t border-[var(--border-subtle)] text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-zinc-500">Drawdown</span>
          <span className="text-zinc-300 font-medium">
            {formatPercent(account.drawdownUsedPercent, 2)}
            <span className="text-zinc-500 ml-1">/ {account.maxDrawdownPercent}%</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Daily room</span>
          <span className={`font-medium ${dailyRoomNum < 50 ? "text-red-400 font-bold" : "text-emerald-400"}`}>
            {formatUSD(dailyRoomNum)}
          </span>
        </div>
      </div>

      {/* Target Progress — shows actual profit %, bar uses progress toward target */}
      <div className="pl-1 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex justify-between text-[11px] font-mono mb-1">
          <span
            className="text-zinc-500 cursor-help"
            title={`Current PnL: +${formatUSD(account.totalPnl || equityNum - startBalNum)} over starting balance ${formatUSD(account.initialBalance || 10000)} = ${formatPercent(actualProfitPct, 2)}`}
          >
            Profit Target
          </span>
          <span className="text-zinc-300 font-medium">
            {formatPercent(actualProfitPct, 2)}
            <span className="text-zinc-500 ml-1">
              / {account.profitTargetPercent || "9"}%
            </span>
            {account.toTargetAmount && Number(account.toTargetAmount) > 0 && (
              <span className="text-zinc-400 ml-1.5 text-[10px]">
                ({formatUSD(account.toTargetAmount)} left)
              </span>
            )}
          </span>
        </div>
        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${targetProgressPct}%` }}
          />
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-[var(--border-subtle)]">
        <span>{account.drawdownType || "static"} DD</span>
        <span>
          {account.tradingDays ?? 0}/{account.requiredTradingDays || 5} days
        </span>
        <span>Bal {formatUSD(balanceNum)}</span>
      </div>
    </div>
  );
}
