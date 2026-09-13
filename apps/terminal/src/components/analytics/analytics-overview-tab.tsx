"use client";

import React from "react";
import Link from "next/link";
import type { AccountSnapshot } from "@/lib/types";
import { formatUSD, formatPercent } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import type { ForensicsSummary } from "@/lib/forensics";
import { EquityCurveChart, type DataPoint } from "./equity-curve-chart";
import { Card, MetricValue } from "@/components/ui";

export interface AnalyticsOverviewTabProps {
  metrics: {
    initialBal: number;
    currEquity: number;
    dayStartBal: number;
    grossPnl: number;
    totalFees: number;
    netPnl: number;
    pnl24h: number;
    pnl24hPct: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    profitFactor: number;
    sharpe: number;
    sortino: number;
    calmar: number;
    expectancy: number;
    avgWin: number;
    avgLoss: number;
    bestTrade: number;
    worstTrade: number;
    longPct: number;
    shortPct: number;
    avgHoldString: string;
    chartPoints: DataPoint[];
  };
  currentAccount: AccountSnapshot | undefined;
  forensics: ForensicsSummary;
  resetCountdown: string;
}

export function AnalyticsOverviewTab({
  metrics,
  currentAccount,
  forensics,
  resetCountdown,
}: AnalyticsOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Top 4 Core Metric Cards (Prompt §14) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        <Card spacing="1">
          <div className="text-xs text-zinc-400">Net P&L</div>
          <MetricValue
            tone={metrics.netPnl >= 0 ? "positive" : "negative"}
            value={
              metrics.netPnl >= 0
                ? `+${formatUSD(metrics.netPnl)}`
                : `-${formatUSD(Math.abs(metrics.netPnl))}`
            }
          />
        </Card>

        <Card spacing="1">
          <div className="text-xs text-zinc-400">Win rate</div>
          <MetricValue value={`${metrics.winRate.toFixed(1)}%`} />
        </Card>

        <Card spacing="1">
          <div className="text-xs text-zinc-400">Profit factor</div>
          <MetricValue value={metrics.profitFactor.toFixed(2)} />
        </Card>

        <Card spacing="1">
          <div className="text-xs text-zinc-400">Sharpe</div>
          <MetricValue value={metrics.sharpe.toFixed(2)} />
        </Card>
      </div>

      {/* Discipline Forensics & Rule Compliance Bar (Prompt P1: Sentence-case sans-serif badge) */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 sm:p-5 font-sans">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                forensics.disciplineScore >= 90
                  ? "bg-emerald-950/60 border border-emerald-800/60 text-emerald-400"
                  : forensics.disciplineScore >= 75
                  ? "bg-amber-950/60 border border-amber-800/60 text-amber-400"
                  : "bg-red-950/60 border border-red-800/60 text-red-400"
              }`}
            >
              {forensics.disciplineScore >= 90 ? (
                <ShieldCheck size={22} />
              ) : (
                <ShieldAlert size={22} />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-zinc-200">
                  Discipline Forensics & Rule Audit
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium ${
                    forensics.disciplineScore >= 90
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                      : forensics.disciplineScore >= 75
                      ? "bg-amber-950 text-amber-400 border border-amber-800/60"
                      : "bg-red-950 text-red-400 border border-red-800/60"
                  }`}
                >
                  {forensics.disciplineScore >= 90
                    ? "Strict compliance"
                    : forensics.disciplineScore >= 75
                    ? "Discipline warning"
                    : "Rule breaches detected"}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {forensics.compliantTrades} of {forensics.totalTrades} trades adhered strictly to account limits, weekend freeze, and cooldown protocols.
              </div>
            </div>
          </div>

          {/* Forensics Key Figures */}
          <div className="flex flex-wrap items-center gap-5 sm:gap-7 border-t lg:border-t-0 border-zinc-800/80 pt-3 lg:pt-0">
            <div>
              <div className="text-[11px] text-zinc-400">Discipline Score</div>
              <MetricValue
                tone={
                  forensics.disciplineScore >= 90
                    ? "positive"
                    : forensics.disciplineScore >= 75
                    ? "warning"
                    : "negative"
                }
                value={`${forensics.disciplineScore.toFixed(1)}%`}
              />
            </div>

            <div>
              <div className="text-[11px] text-zinc-400">Cost of Violations</div>
              <MetricValue
                tone={forensics.totalViolationCostUSD > 0 ? "negative" : "muted"}
                value={
                  forensics.totalViolationCostUSD > 0
                    ? `-${formatUSD(forensics.totalViolationCostUSD)}`
                    : "$0.00"
                }
              />
            </div>

            <div>
              <div className="text-[11px] text-zinc-400">Potential Clean P&L</div>
              <MetricValue
                tone="default"
                value={
                  forensics.cleanNetPnl >= 0
                    ? `+${formatUSD(forensics.cleanNetPnl)}`
                    : `-${formatUSD(Math.abs(forensics.cleanNetPnl))}`
                }
              />
            </div>

            <div className="flex items-center">
              <Link
                href="/forensics"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--cyan)]/40 bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 text-xs font-mono text-[var(--cyan)] transition-colors"
              >
                <Calendar size={13} />
                <span>Daily Calendar →</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Violation Category Pill Breakdown */}
        {forensics.violatingTrades > 0 && (
          <div className="mt-3.5 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-medium text-zinc-400">Breaches Tagged:</span>
            {forensics.violationsByType.WEEKEND_TRADE.count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/50 border border-red-900/50 text-[11px] font-mono text-red-400">
                <AlertTriangle size={11} />
                {forensics.violationsByType.WEEKEND_TRADE.count} Weekend Trade
                {forensics.violationsByType.WEEKEND_TRADE.costUSD > 0 &&
                  ` (-${formatUSD(forensics.violationsByType.WEEKEND_TRADE.costUSD)})`}
              </span>
            )}
            {forensics.violationsByType.COOLDOWN_BREACH.count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/50 border border-amber-900/50 text-[11px] font-mono text-amber-400">
                <AlertTriangle size={11} />
                {forensics.violationsByType.COOLDOWN_BREACH.count} Cooldown Breach
                {forensics.violationsByType.COOLDOWN_BREACH.costUSD > 0 &&
                  ` (-${formatUSD(forensics.violationsByType.COOLDOWN_BREACH.costUSD)})`}
              </span>
            )}
            {forensics.violationsByType.OVER_RISK.count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/50 border border-red-900/50 text-[11px] font-mono text-red-400">
                <AlertTriangle size={11} />
                {forensics.violationsByType.OVER_RISK.count} Over-Risk
                {forensics.violationsByType.OVER_RISK.costUSD > 0 &&
                  ` (-${formatUSD(forensics.violationsByType.OVER_RISK.costUSD)})`}
              </span>
            )}
            {forensics.violationsByType.UNAUTHORIZED_ASSET.count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/50 border border-amber-900/50 text-[11px] font-mono text-amber-400">
                <AlertTriangle size={11} />
                {forensics.violationsByType.UNAUTHORIZED_ASSET.count} Unauthorized Asset
                {forensics.violationsByType.UNAUTHORIZED_ASSET.costUSD > 0 &&
                  ` (-${formatUSD(forensics.violationsByType.UNAUTHORIZED_ASSET.costUSD)})`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main 2-Column: Left Large Chart + Right Clean Risk Panel (Prompt §14) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left: Equity Curve Chart */}
        <div className="lg:col-span-2">
          <EquityCurveChart
            dataPoints={metrics.chartPoints}
            startingBalance={metrics.initialBal}
            breachFloor={Number(currentAccount?.breachFloor || metrics.initialBal * 0.97)}
            dailyLossFloor={Number(
              currentAccount?.dailyLossFloor || metrics.dayStartBal * 0.97
            )}
            height={340}
          />
        </div>

        {/* Right: Clean Risk Panel */}
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4 font-sans">
          <div className="border-b border-[var(--border-subtle)] pb-2.5">
            <h3 className="text-xs font-semibold text-zinc-200">
              Risk
            </h3>
          </div>

          {/* Profit Target */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Profit target</span>
              <span className="font-mono font-semibold text-emerald-400">
                {formatPercent(currentAccount?.profitTargetPct || "2.00")}
                <span className="text-zinc-400 font-normal ml-1">
                  / {currentAccount?.profitTargetPercent || "9"}%
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (Number(currentAccount?.profitTargetPct || 0) /
                        Number(currentAccount?.profitTargetPercent || 9)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Drawdown Used */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Drawdown used</span>
              <span className="font-mono font-semibold text-zinc-200">
                {formatPercent(currentAccount?.drawdownUsedPercent || "0.00")}
                <span className="text-zinc-400 font-normal ml-1">
                  / {currentAccount?.maxDrawdownPercent || "3"}%
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (Number(currentAccount?.drawdownUsedPercent || 0) /
                        Number(currentAccount?.maxDrawdownPercent || 3)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              Floor: {formatUSD(currentAccount?.breachFloor || metrics.initialBal * 0.97)}
            </div>
          </div>

          {/* Daily Loss */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Daily loss</span>
              <span className="font-mono font-semibold text-amber-400">
                {formatPercent(currentAccount?.dailyLossUsedPercent || "0.72")}
                <span className="text-zinc-400 font-normal ml-1">
                  / {currentAccount?.maxDailyLossPercent || "3"}%
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (Number(currentAccount?.dailyLossUsedPercent || 0.72) /
                        Number(currentAccount?.maxDailyLossPercent || 3)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              Snapshot: {formatUSD(metrics.dayStartBal)}
            </div>
          </div>

          {/* Reset Time */}
          <div className="pt-3 border-t border-[var(--border-subtle)] text-xs text-zinc-400 flex items-center justify-between font-mono">
            <span>Reset in</span>
            <span className="text-zinc-200">{resetCountdown || "3h 31m 27s"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
