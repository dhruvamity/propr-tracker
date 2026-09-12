import React from "react";
import type { AccountSnapshot } from "@/lib/propr-api";
import { formatUSD, formatPercent, formatShortId, cn } from "@/lib/utils";

interface RiskCardProps {
  account: AccountSnapshot;
  rank?: number;
}

export function RiskCard({ account, rank }: RiskCardProps) {
  const equityNum = Number(account.equity || 0);
  const startBalNum = Number(account.initialBalance || account.startingBalance || 10000);
  const drawdownBufferNum = Number(account.drawdownRemaining || 0);
  const dailyRoomNum = Number(account.dailyLossRemaining || 0);
  const dailyLimitNum = Number(account.dailyLossLimitAmount || 0);
  const dailyUsedNum = Number(account.dailyLossUsedAmount || 0);
  const ddConsumedPct = Number(account.drawdownLimitConsumedPercent || 0);
  const actualProfitPct = Number(account.profitTargetPct || 0);
  const netPnl = equityNum - startBalNum;

  // Daily loss budget consumption & room
  const dailyConsumedPct = dailyLimitNum > 0 ? Math.min(100, Math.max(0, (dailyUsedNum / dailyLimitNum) * 100)) : 0;
  const dailyRoomPct = dailyLimitNum > 0 ? (dailyRoomNum / dailyLimitNum) * 100 : 100;
  const maxDdAmount = Number(account.maxDrawdownAmount || (startBalNum * 0.03));
  const bufferRemainingPct = maxDdAmount > 0 ? (drawdownBufferNum / maxDdAmount) * 100 : 100;

  // Semantic Risk State Determination (SAFE / WATCH / CRITICAL / BREACHED)
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

  // Closest failure point & binding constraint
  const dailyLossFloorNum = Number(account.dailyLossFloor || (equityNum - dailyRoomNum));
  const breachFloorNum = Number(account.breachFloor || (equityNum - drawdownBufferNum));
  const isDailyConstrained = dailyConsumedPct >= 70 || (dailyRoomNum > 0 && dailyRoomNum < drawdownBufferNum);
  const bindingRoom = isDailyConstrained ? dailyRoomNum : drawdownBufferNum;
  const activeThreshold = isDailyConstrained ? dailyLossFloorNum : breachFloorNum;
  const usedPct = isDailyConstrained ? dailyConsumedPct : ddConsumedPct;

  // Semantic styles based on state
  const railColor =
    riskStatus === "SAFE"
      ? "border-l-2 border-emerald-500"
      : riskStatus === "WATCH"
      ? "border-l-2 border-amber-500"
      : "border-l-2 border-red-500";

  const barColor =
    riskStatus === "SAFE"
      ? "bg-emerald-500"
      : riskStatus === "WATCH"
      ? "bg-amber-500"
      : "bg-red-500";

  const dominantTextColor =
    riskStatus === "SAFE"
      ? "text-white"
      : riskStatus === "WATCH"
      ? "text-amber-400"
      : "text-red-400";

  const shortAccCode = formatShortId(account.accountId);
  const cleanBadgeTag = `#${shortAccCode.slice(-4)}`;

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4 transition-colors",
        railColor
      )}
    >
      {/* ─── 1. Header: Name, Tag, Stage, Risk Status Dot ─── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {rank !== undefined && (
              <span className="text-zinc-500 font-sans text-xs font-semibold">
                #{rank}
              </span>
            )}
            <h3 className="font-semibold text-sm sm:text-base text-zinc-100 font-sans">
              {account.challengeName || "Starter Turbo"}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-sans mt-0.5">
            <span className="font-mono text-zinc-300 font-medium">{cleanBadgeTag}</span>
            <span>·</span>
            <span className="capitalize">{account.stage?.toLowerCase() || "evaluation"}</span>
            {isDailyConstrained && (
              <>
                <span>·</span>
                <span className="text-zinc-400 text-[11px]">daily binding</span>
              </>
            )}
          </div>
        </div>

        {/* Status Dot + Text (No pill, no background) */}
        <div className="flex items-center gap-1.5 text-xs font-sans font-medium">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              riskStatus === "SAFE"
                ? "bg-emerald-400"
                : riskStatus === "WATCH"
                ? "bg-amber-400"
                : "bg-red-500 animate-pulse"
            )}
          />
          <span
            className={
              riskStatus === "SAFE"
                ? "text-emerald-400"
                : riskStatus === "WATCH"
                ? "text-amber-400"
                : "text-red-400"
            }
          >
            {riskStatus}
          </span>
        </div>
      </div>

      {/* ─── 2. Hero Metric: Single Primary Question (Prompt §5) ─── */}
      <div className="space-y-1.5">
        <div className="text-xs font-sans text-zinc-400">
          {isDailyConstrained ? "Daily loss room" : "Drawdown room"}
        </div>
        <div className={cn("text-3xl font-mono font-bold tracking-tight", dominantTextColor)}>
          {formatUSD(bindingRoom)}
        </div>
        <div className="text-xs font-sans text-zinc-400">
          {usedPct.toFixed(0)}% of {isDailyConstrained ? "daily allowance" : "drawdown limit"} used
        </div>

        {/* Single Semantic Progress Bar (NO rainbow gradient) */}
        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mt-2">
          <div
            className={cn("h-full rounded-full transition-all duration-300", barColor)}
            style={{ width: `${Math.min(100, Math.max(2, usedPct))}%` }}
          />
        </div>
      </div>

      {/* ─── 3. Divider & 4 Clean Supporting Values ─── */}
      <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-3 border-t border-[var(--border-subtle)] text-xs">
        <div className="flex justify-between items-baseline">
          <span className="text-zinc-400 font-sans">Threshold</span>
          <span className="font-mono text-zinc-200 font-medium">{formatUSD(activeThreshold)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-zinc-400 font-sans">Equity</span>
          <span className="font-mono text-zinc-100 font-medium">{formatUSD(equityNum)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-zinc-400 font-sans">
            {isDailyConstrained ? "Drawdown room" : "Daily loss room"}
          </span>
          <span className="font-mono text-zinc-200 font-medium">
            {formatUSD(isDailyConstrained ? drawdownBufferNum : dailyRoomNum)}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-zinc-400 font-sans">Target progress</span>
          <span className="font-mono text-zinc-200 font-medium">
            {formatPercent(actualProfitPct, 2)}
            <span
              className={cn(
                "ml-1 font-mono text-[11px]",
                netPnl >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              ({netPnl >= 0 ? "+" : ""}{formatUSD(netPnl)})
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
