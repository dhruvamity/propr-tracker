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

  // Profit/Loss today from starting
  const netGainToday = equityNum - startBalNum;
  const netGainPct = startBalNum > 0 ? (netGainToday / startBalNum) * 100 : 0;

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

  // Ruler calculation: percentage of equity between breachFloor and peak target or starting balance
  const floorDelta = Math.max(0, equityNum - breachFloorNum);
  const totalSpan = Math.max(1, startBalNum * 0.08); // typical 8-10% drawdown scale
  const rulerPercentage = Math.min(100, Math.max(8, (floorDelta / totalSpan) * 100));

  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4 relative overflow-hidden transition-all hover:border-zinc-700/80">
      {/* Left semantic status rail */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          riskStatus === "SAFE"
            ? "bg-emerald-500"
            : riskStatus === "CAUTION"
            ? "bg-amber-500"
            : "bg-red-500"
        }`}
      />

      {/* Header: Title, Stage & Rank */}
      <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-3 pl-1">
        <div>
          <div className="flex items-center gap-2">
            {rank !== undefined && (
              <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-mono font-bold flex items-center justify-center text-zinc-300">
                {rank}
              </span>
            )}
            <h3 className="font-semibold text-sm text-white tracking-wide">
              {account.challengeName || "Starter Turbo"}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700">
              {account.stage}
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 mt-1">
            ID: <span className="text-zinc-300">{formatShortId(account.accountId)}</span> • Phase {account.currentPhase || 1}
          </p>
        </div>

        {/* Risk Status Pill */}
        <div className="flex flex-col items-end">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold border ${
              riskStatus === "SAFE"
                ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50"
                : riskStatus === "CAUTION"
                ? "bg-amber-950/50 text-amber-400 border-amber-800/50"
                : "bg-red-950/50 text-red-400 border-red-800/50"
            }`}
          >
            {riskStatus === "SAFE" && <ShieldCheck size={13} className="text-emerald-400" />}
            {riskStatus === "CAUTION" && <AlertTriangle size={13} className="text-amber-400" />}
            {(riskStatus === "CRITICAL" || riskStatus === "BREACHED") && (
              <ShieldAlert size={13} className="text-red-400 animate-pulse" />
            )}
            <span>{riskStatus}</span>
          </span>
          <span className="text-[11px] font-mono text-zinc-400 mt-1">
            Bal: {formatUSD(balanceNum)}
          </span>
        </div>
      </div>

      {/* Dominant Breach Buffer Display (Prompt Requirement §4) */}
      <div className="p-4 rounded-md bg-black/40 border border-zinc-800/80 pl-4">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-1">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
              Remaining Breach Buffer
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-2xl md:text-3xl font-mono font-bold ${
                  riskStatus === "SAFE"
                    ? "text-emerald-400"
                    : riskStatus === "CAUTION"
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {formatUSD(drawdownBufferNum)}
              </span>
              <span className="text-xs font-mono text-zinc-400">to breach floor</span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
              Current Equity
            </span>
            <div className="flex items-baseline gap-1.5 md:justify-end mt-0.5">
              <span className="text-lg md:text-xl font-mono font-bold text-white">
                {formatUSD(equityNum)}
              </span>
              <span
                className={`text-xs font-mono font-semibold ${
                  netGainToday >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {netGainToday >= 0 ? "+" : ""}
                {formatUSD(netGainToday)} ({formatPercent(netGainPct, 2, true)})
              </span>
            </div>
          </div>
        </div>

        {/* Horizontal Breach Floor Ruler (Prompt Requirement §4) */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80">
          <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
            <span>Floor {formatUSD(breachFloorNum)}</span>
            <span className="text-zinc-300 font-medium">Equity {formatUSD(equityNum)}</span>
          </div>
          <div className="relative h-2 w-full bg-zinc-900 rounded-full border border-zinc-800">
            {/* Ruler track fill */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                riskStatus === "SAFE"
                  ? "bg-emerald-500/80"
                  : riskStatus === "CAUTION"
                  ? "bg-amber-500/80"
                  : "bg-red-500/80"
              }`}
              style={{ width: `${rulerPercentage}%` }}
            />
            {/* Marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] border-2 border-zinc-950 transition-all duration-500"
              style={{ left: `calc(${rulerPercentage}% - 7px)` }}
            />
          </div>
          <div className="text-center mt-1 text-[10px] font-mono text-zinc-400">
            {formatUSD(drawdownBufferNum)} buffer headroom
          </div>
        </div>
      </div>

      {/* 3 Core Metric Cells with Increased Vertical Padding (Prompt Requirement §5 & §14) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded bg-zinc-900/60 border border-zinc-800/70">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Breach Floor
          </span>
          <span className="text-sm font-mono font-bold text-red-400 block mt-1">
            {formatUSD(breachFloorNum)}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
            Min allowed equity
          </span>
        </div>

        <div className="p-3.5 rounded bg-zinc-900/60 border border-zinc-800/70">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Drawdown Buffer
          </span>
          <span
            className={`text-sm font-mono font-bold block mt-1 ${
              riskStatus === "SAFE" ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {formatUSD(drawdownBufferNum)}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
            Max loss room
          </span>
        </div>

        <div className="p-3.5 rounded bg-zinc-900/60 border border-zinc-800/70">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            Daily Allowance
          </span>
          <span className="text-sm font-mono font-bold text-purple-400 block mt-1">
            {formatUSD(dailyRoomNum)}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
            Intraday loss limit
          </span>
        </div>
      </div>

      {/* Secondary Progress & Drawdown Strips */}
      <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)] font-mono text-xs">
        {/* Profit Target Progress */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-400">Profit Target Progress</span>
            <span className="text-white font-medium">
              {formatPercent(targetProgressPct, 2)}
              <span className="text-zinc-400 text-[10px] ml-1.5 font-normal">
                (target: +{account.profitTargetPercent || "10"}%)
              </span>
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-[var(--cyan)] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, targetProgressPct))}%` }}
            />
          </div>
        </div>

        {/* Drawdown Consumed */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-400">Drawdown Consumed</span>
            <span
              className={`font-medium ${
                ddConsumedPct > 70
                  ? "text-red-400"
                  : ddConsumedPct > 35
                  ? "text-amber-400"
                  : "text-zinc-200"
              }`}
            >
              {formatPercent(ddConsumedPct, 2)} of limit
              <span className="text-zinc-400 text-[10px] ml-1.5 font-normal">
                ({formatPercent(account.drawdownUsedPercent, 2)} used)
              </span>
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                ddConsumedPct > 70
                  ? "bg-red-500"
                  : ddConsumedPct > 35
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, ddConsumedPct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Meta Stats Footer */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono">
        <div>
          <span className="text-zinc-500 block">Model</span>
          <span className="text-zinc-300 font-medium capitalize">
            {account.drawdownType || "static"} DD
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block">Trading Days</span>
          <span className="text-zinc-300 font-medium">
            {account.tradingDays || 1} / {account.requiredTradingDays || 5} d
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block">Exposure</span>
          <span className="text-zinc-300 font-medium">
            {account.openPositionCount || 0} pos • {account.openOrderCount || 0} ord
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block">Sync</span>
          <span className="text-emerald-400 font-medium">REALTIME</span>
        </div>
      </div>
    </div>
  );
}
