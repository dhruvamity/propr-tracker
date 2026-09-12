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
  const dailyLimitNum = Number(account.dailyLossLimitAmount || 0);
  const dailyUsedNum = Number(account.dailyLossUsedAmount || 0);
  const ddConsumedPct = Number(account.drawdownLimitConsumedPercent || 0);
  const actualProfitPct = Number(account.profitTargetPct || 0);
  const targetPct = Number(account.profitTargetPercent || 9);
  const targetEquity = startBalNum * (1 + targetPct / 100);
  const netPnl = equityNum - startBalNum;

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

  // Dynamic closest failure threshold
  const dailyLossFloorNum = Number(account.dailyLossFloor || (equityNum - dailyRoomNum));
  const isDailyConstrained = dailyConsumedPct >= 70 || (dailyRoomNum > 0 && dailyRoomNum < drawdownBufferNum);
  const effectiveBuffer = isDailyConstrained ? dailyRoomNum : drawdownBufferNum;
  const activeBreachFloor = isDailyConstrained ? dailyLossFloorNum : breachFloorNum;

  // Single dual-indicator bar: current equity positioned between Breach Floor (left) and Profit Target (right)
  const totalSpan = Math.max(1, targetEquity - breachFloorNum);
  const dualBarPct = Math.max(0, Math.min(100, ((equityNum - breachFloorNum) / totalSpan) * 100));

  // Status rail color
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

      {/* ─── Zone 1: Header (Challenge Name, Tag, Stage Badge, Risk Status) ─── */}
      <div className="flex items-start justify-between pb-3 pl-1 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm sm:text-base text-white tracking-wide">
              {account.challengeName || "Starter Turbo"}
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-semibold">
              {cleanBadgeTag}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
              {account.stage}
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-500 mt-1">
            {shortAccCode}
          </p>
        </div>

        {/* Risk Status Pill */}
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

      {/* ─── Zone 2: Hero Stat (Single Closest Failure Point) ─── */}
      <div className="pl-1 space-y-1">
        <div className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
          {isDailyConstrained ? "Daily Loss Room" : "Drawdown Room"}
        </div>
        <div className="flex items-baseline justify-between">
          <div className={`text-3xl sm:text-4xl font-mono font-bold tracking-tight ${dominantColor}`}>
            {formatUSD(effectiveBuffer)}
          </div>
          <div className="text-sm font-mono text-zinc-400">
            Equity <span className="text-white font-semibold">{formatUSD(equityNum)}</span>
          </div>
        </div>
        <div className="text-xs font-mono text-zinc-400 flex items-center justify-between pt-0.5">
          <span>
            {isDailyConstrained
              ? `${formatUSD(effectiveBuffer)} room to daily-loss threshold (${formatUSD(activeBreachFloor)})`
              : `${formatUSD(effectiveBuffer)} room to drawdown floor (${formatUSD(activeBreachFloor)})`}
          </span>
          {isDailyConstrained && (
            <span className="text-zinc-500 text-[11px]">
              DD floor: {formatUSD(breachFloorNum)}
            </span>
          )}
        </div>
      </div>

      {/* ─── Zone 3: Single Risk Bar (Equity between Breach Floor and Profit Target) ─── */}
      <div className="pl-1 space-y-2 pt-1">
        <div className="flex justify-between text-xs font-mono text-zinc-400">
          <span className="text-red-400 font-medium">Floor {formatUSD(breachFloorNum)}</span>
          <span className="text-zinc-200 font-semibold">Equity {formatUSD(equityNum)}</span>
          <span className="text-emerald-400 font-medium">Target {formatUSD(targetEquity)}</span>
        </div>
        <div className="relative h-2 w-full bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(4, Math.min(100, dualBarPct))}%` }}
          />
        </div>
      </div>

      {/* ─── Zone 4: Footer Grid (Balance, Today's Peak, Net P&L, Daily Reset) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-1 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono">
        <div>
          <div className="text-zinc-500 text-[11px] uppercase tracking-wider">Balance</div>
          <div className="text-sm font-semibold text-zinc-200 mt-0.5">{formatUSD(balanceNum)}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-[11px] uppercase tracking-wider">Today's Peak</div>
          <div className="text-sm font-semibold text-zinc-200 mt-0.5">
            {formatUSD(account.startingBalance || equityNum)}
          </div>
        </div>
        <div>
          <div className="text-zinc-500 text-[11px] uppercase tracking-wider">Net P&L</div>
          <div className={`text-sm font-semibold mt-0.5 ${netPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {netPnl >= 0 ? `+${formatUSD(netPnl)}` : `-${formatUSD(Math.abs(netPnl))}`}
            <span className="text-[11px] font-normal text-zinc-400 ml-1">({formatPercent(actualProfitPct, 2)})</span>
          </div>
        </div>
        <div>
          <div className="text-zinc-500 text-[11px] uppercase tracking-wider">Daily Reset</div>
          <div className="text-sm font-semibold text-zinc-300 mt-0.5">00:00 UTC</div>
        </div>
      </div>
    </div>
  );
}
