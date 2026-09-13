"use client";

import React from "react";
import { formatUSD } from "@/lib/utils";
import { Card } from "@/components/ui";
import {
  DailyPnlChart,
  type DailyPnlItem,
  DurationAndWeekdayCharts,
} from "./performance-charts";

export interface AnalyticsPerformanceTabProps {
  metrics: {
    avgWin: number;
    avgLoss: number;
    longPct: number;
    shortPct: number;
    bestTrade: number;
    worstTrade: number;
    avgHoldString: string;
    sortino: number;
    calmar: number;
    expectancy: number;
    netPnl: number;
    grossPnl: number;
    totalFees: number;
    bestDay: number;
    worstDay: number;
    avgProfitDay: number;
    avgLossDay: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalVolume: number;
    activeDays: number;
    dailyList: DailyPnlItem[];
    weekdayList: { day: string; pnl: number }[];
    durationBuckets: { range: string; count: number }[];
    assetBreakdown: { asset: string; count: number; netPnl: number }[];
  };
}

export function AnalyticsPerformanceTab({ metrics }: AnalyticsPerformanceTabProps) {
  return (
    <div className="space-y-6">
      {/* Top 5 Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-sans">
        {/* 1. Avg Win / Loss */}
        <Card spacing="2">
          <div className="text-xs text-zinc-400">Avg Win / Loss</div>
          <div className="text-base font-mono font-bold flex items-center gap-1">
            <span className="text-emerald-400">+{formatUSD(metrics.avgWin)}</span>
            <span className="text-zinc-400">/</span>
            <span className="text-red-400">-{formatUSD(metrics.avgLoss)}</span>
          </div>
          <div className="text-[11px] font-sans text-zinc-400">
            Long {metrics.longPct}% / Short {metrics.shortPct}%
          </div>
        </Card>

        {/* 2. Best / Worst Single Trade */}
        <Card spacing="2">
          <div className="text-xs text-zinc-400">Best / Worst Single Trade</div>
          <div className="text-base font-mono font-bold flex items-center gap-1">
            <span className="text-emerald-400">+{formatUSD(metrics.bestTrade)}</span>
            <span className="text-zinc-400">/</span>
            <span className="text-red-400">-{formatUSD(Math.abs(metrics.worstTrade))}</span>
          </div>
          <div className="text-[11px] font-sans text-zinc-400">
            Avg hold time {metrics.avgHoldString}
          </div>
        </Card>

        {/* 3. Sortino / Calmar Ratio */}
        <Card spacing="2">
          <div className="text-xs text-zinc-400">Sortino / Calmar Ratio</div>
          <div className="text-base font-mono font-bold text-white flex items-center gap-1">
            <span>{metrics.sortino.toFixed(2)}</span>
            <span className="text-zinc-400">/</span>
            <span>{metrics.calmar.toFixed(2)}</span>
          </div>
          <div className="text-[11px] font-sans text-zinc-400">
            Expectancy per trade{" "}
            <span className="font-mono text-emerald-400">
              {metrics.expectancy >= 0
                ? `+${formatUSD(metrics.expectancy)}`
                : `-${formatUSD(Math.abs(metrics.expectancy))}`}
            </span>
          </div>
        </Card>

        {/* 4. Net P&L */}
        <Card spacing="2">
          <div className="text-xs text-zinc-400">Net P&L</div>
          <div
            className={`text-base font-mono font-bold ${
              metrics.netPnl >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {metrics.netPnl >= 0
              ? `+${formatUSD(metrics.netPnl)}`
              : `-${formatUSD(Math.abs(metrics.netPnl))}`}
          </div>
          <div className="text-[11px] font-sans text-zinc-400">
            since Challenge start
          </div>
        </Card>

        {/* 5. Gross P&L */}
        <Card spacing="2">
          <div className="text-xs text-zinc-400">Gross P&L</div>
          <div
            className={`text-base font-mono font-bold ${
              metrics.grossPnl >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {metrics.grossPnl >= 0
              ? `+${formatUSD(metrics.grossPnl)}`
              : `-${formatUSD(Math.abs(metrics.grossPnl))}`}
          </div>
          <div className="text-[11px] font-sans text-zinc-400">
            HL fees <span className="font-mono text-red-400">-{formatUSD(metrics.totalFees || 98.75)}</span>
          </div>
        </Card>
      </div>

      {/* Main Middle Section: Left Daily P&L + Summary (2/3) and Right Asset Breakdown (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start font-sans">
        {/* Left: Daily P&L Chart and Summary Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
              <h3 className="text-xs font-semibold text-zinc-200">
                Daily P&L
              </h3>
            </div>

            <DailyPnlChart dailyData={metrics.dailyList} height={200} />

            {/* Summary Row */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-4 border-t border-[var(--border-subtle)] text-xs">
              <div>
                <div className="text-zinc-400 text-[11px]">Best day</div>
                <div className="font-mono font-semibold text-emerald-400 mt-0.5">
                  +{formatUSD(metrics.bestDay)}
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[11px]">Worst day</div>
                <div className="font-mono font-semibold text-red-400 mt-0.5">
                  -{formatUSD(Math.abs(metrics.worstDay))}
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[11px]">Avg Profit day</div>
                <div className="font-mono font-semibold text-emerald-400 mt-0.5">
                  +{formatUSD(metrics.avgProfitDay)}
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[11px]">Avg Loss day</div>
                <div className="font-mono font-semibold text-red-400 mt-0.5">
                  -{formatUSD(Math.abs(metrics.avgLossDay))}
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[11px]">Win Rate</div>
                <div className="font-mono font-semibold text-white mt-0.5">
                  {metrics.winRate.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
              <div>
                <div className="text-zinc-400 text-[11px]"># of trades</div>
                <div className="font-mono text-white mt-0.5">
                  {metrics.totalTrades}{" "}
                  <span className="text-emerald-400">{metrics.winningTrades}W</span>{" "}
                  <span className="text-red-400">{metrics.losingTrades}L</span>
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[11px]">Total volume</div>
                <div className="font-mono text-white mt-0.5">
                  ${Math.round(metrics.totalVolume / 1000)}K
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[11px]">Active days</div>
                <div className="font-mono text-white mt-0.5">
                  {metrics.activeDays}
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[11px]">Avg Slippage</div>
                <div className="font-mono text-zinc-300 mt-0.5">
                  $0.00 <span className="text-zinc-400">-0.002%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Asset Breakdown */}
        <div className="p-5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3">
          <div className="border-b border-[var(--border-subtle)] pb-2.5">
            <h3 className="text-xs font-semibold text-zinc-200">
              Asset Breakdown
            </h3>
          </div>

          <div className="divide-y divide-[var(--border-subtle)]">
            {metrics.assetBreakdown.map((item) => (
              <div
                key={item.asset}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-zinc-200">
                    {item.asset.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-medium text-white">{item.asset}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {item.count} trades
                    </div>
                  </div>
                </div>

                <div
                  className={`font-mono font-semibold ${
                    item.netPnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {item.netPnl >= 0
                    ? `+${formatUSD(item.netPnl)}`
                    : `-${formatUSD(Math.abs(item.netPnl))}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Duration & Day of Week Charts */}
      <DurationAndWeekdayCharts
        weekdayPnl={metrics.weekdayList}
        durationBuckets={metrics.durationBuckets}
      />
    </div>
  );
}
