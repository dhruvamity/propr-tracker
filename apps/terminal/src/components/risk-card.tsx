import React from "react";
import type { AccountSnapshot } from "@/lib/propr-api";
import { formatUSD, formatPercent, formatShortId } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";

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
  const ddConsumedPct = Number(account.drawdownLimitConsumedPercent || 0);
  const targetProgressPct = Number(account.profitTargetProgressPercent || 0);

  // Semantic Risk State Determination
  let riskStatus: "SAFE" | "CAUTION" | "CRITICAL" | "BREACHED" = "SAFE";
  if (account.stage === "BREACHED" || account.stage === "FAILED") {
    riskStatus = "BREACHED";
  } else if (ddConsumedPct >= 75 || drawdownBufferNum <= startBalNum * 0.015) {
    riskStatus = "CRITICAL";
  } else if (ddConsumedPct >= 35 || drawdownBufferNum <= startBalNum * 0.035) {
    riskStatus = "CAUTION";
  } else {
    riskStatus = "SAFE";
  }

  // Ruler calculation: percentage of equity between breachFloor and starting balance
  const floorDelta = Math.max(0, equityNum - breachFloorNum);
  const totalSpan = Math.max(1, startBalNum * 0.08);
  const rulerPercentage = Math.min(100, Math.max(8, (floorDelta / totalSpan) * 100));

  // Status rail color — only colored on the thin left rail + badge
  const railColor =
    riskStatus === "SAFE"
      ? "bg-emerald-500"
      : riskStatus === "CAUTION"
      ? "bg-amber-500"
      : "bg-red-500";

  // Dominant number color — semantic only
  const dominantColor =
    riskStatus === "SAFE"
      ? "text-white"
      : riskStatus === "CAUTION"
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4 relative overflow-hidden transition-all hover:border-zinc-700/80">
      {/* Left semantic status rail */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${railColor}`} />

      {/* Header: Title + Risk Status */}
      <div className="flex items-start justify-between pb-3 pl-1 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            {rank !== undefined && (
              <span className="text-[11px] font-mono font-bold text-zinc-400">
                #{rank}
              </span>
            )}
            <h3 className="font-semibold text-sm text-white tracking-wide">
              {account.challengeName || "Starter Turbo"}
            </h3>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
            {formatShortId(account.accountId)}
          </p>
        </div>

        {/* Risk Status Pill — only place green appears for SAFE */}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold border ${
            riskStatus === "SAFE"
              ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50"
              : riskStatus === "CAUTION"
              ? "bg-amber-950/50 text-amber-400 border-amber-800/50"
              : "bg-red-950/50 text-red-400 border-red-800/50"
          }`}
        >
          {riskStatus === "SAFE" && <ShieldCheck size={13} />}
          {riskStatus === "CAUTION" && <AlertTriangle size={13} />}
          {(riskStatus === "CRITICAL" || riskStatus === "BREACHED") && (
            <ShieldAlert size={13} className="animate-pulse" />
          )}
          {riskStatus}
        </span>
      </div>

      {/* Dominant: Remaining to breach */}
      <div className="pl-1">
        <div className={`text-2xl md:text-3xl font-mono font-bold ${dominantColor}`}>
          {formatUSD(drawdownBufferNum)}
        </div>
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          remaining to breach
        </span>
      </div>

      {/* Breach Floor Ruler */}
      <div className="pl-1">
        <div className="flex justify-between text-[11px] font-mono text-zinc-500 mb-1.5">
          <span>Floor {formatUSD(breachFloorNum)}</span>
          <span className="text-zinc-300">{formatUSD(equityNum)}</span>
        </div>
        <div className="relative h-1.5 w-full bg-zinc-900 rounded-full border border-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              riskStatus === "SAFE"
                ? "bg-zinc-500"
                : riskStatus === "CAUTION"
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

      {/* Compact Metric List — single source of truth, no duplication */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pl-1 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-zinc-500">Floor</span>
          <span className="text-zinc-300">{formatUSD(breachFloorNum)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Equity</span>
          <span className="text-white font-medium">{formatUSD(equityNum)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Buffer</span>
          <span className="text-zinc-300">{formatUSD(drawdownBufferNum)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Daily room</span>
          <span className="text-zinc-300">{formatUSD(dailyRoomNum)}</span>
        </div>
      </div>

      {/* Target Progress — small secondary meter */}
      <div className="pl-1 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex justify-between text-[11px] font-mono mb-1">
          <span className="text-zinc-500">Target</span>
          <span className="text-zinc-300 font-medium">
            {formatPercent(targetProgressPct, 2)}
            <span className="text-zinc-500 ml-1">
              / +{account.profitTargetPercent || "10"}%
            </span>
          </span>
        </div>
        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-[var(--cyan)] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, targetProgressPct))}%` }}
          />
        </div>
      </div>

      {/* Compact Footer */}
      <div className="flex items-center gap-4 pl-1 pt-1.5 text-[10px] font-mono text-zinc-500">
        <span>{account.drawdownType || "static"} DD</span>
        <span>{account.tradingDays || 1}/{account.requiredTradingDays || 5} days</span>
        <span>Bal {formatUSD(balanceNum)}</span>
      </div>
    </div>
  );
}
