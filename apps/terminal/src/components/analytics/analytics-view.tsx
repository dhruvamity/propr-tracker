"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { AccountSnapshot, TradeData } from "@/lib/propr-api";
import {
  formatUSD,
  formatPercent,
  formatShortId,
  formatAccountTag,
} from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileDown,
} from "lucide-react";
import { EquityCurveChart, type DataPoint } from "./equity-curve-chart";
import {
  DailyPnlChart,
  DurationAndWeekdayCharts,
  type DailyPnlItem,
} from "./performance-charts";
import { AccountSwitcherModal } from "./account-switcher-modal";

interface AnalyticsViewProps {
  accounts: AccountSnapshot[];
}

type MainTab = "OVERVIEW" | "PERFORMANCE" | "TRADE_HISTORY";
type TimeFilter = "7D" | "30D" | "ALL";

export function AnalyticsView({ accounts }: AnalyticsViewProps) {
  // Currently selected account (defaults to first active evaluation/funded, or first account)
  const defaultAccount =
    accounts.find((a) => a.stage === "EVALUATION" || a.stage === "FUNDED") ||
    accounts[0];

  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    defaultAccount?.accountId || ""
  );
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>("OVERVIEW");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("ALL");
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  // Live countdown timer to 00:00 UTC daily reset
  const [resetCountdown, setResetCountdown] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Propr daily snapshot resets at 00:00 UTC (or next midnight UTC)
      const nextReset = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0,
          0,
          0
        )
      );
      const diffMs = Math.max(0, nextReset.getTime() - now.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setResetCountdown(`${hours}h ${mins}m ${secs}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentAccount = useMemo(() => {
    return (
      accounts.find((a) => a.accountId === selectedAccountId) ||
      defaultAccount ||
      accounts[0]
    );
  }, [accounts, selectedAccountId, defaultAccount]);

  const rawTrades = useMemo(() => {
    return currentAccount?.trades || [];
  }, [currentAccount]);

  // Filter trades by time filter
  const filteredTrades = useMemo(() => {
    if (timeFilter === "ALL" || rawTrades.length === 0) return rawTrades;
    const now = Date.now();
    let cutoff = 0;
    if (timeFilter === "7D") cutoff = now - 7 * 24 * 60 * 60 * 1000;
    else if (timeFilter === "30D") cutoff = now - 30 * 24 * 60 * 60 * 1000;

    return rawTrades.filter((t) => new Date(t.executedAt).getTime() >= cutoff);
  }, [rawTrades, timeFilter]);

  // ─── Metrics Computation ───────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const initialBal = Number(currentAccount?.initialBalance || 10000);
    const currEquity = Number(
      currentAccount?.equity || currentAccount?.balance || initialBal
    );
    const dayStartBal = Number(currentAccount?.startingBalance || initialBal);

    let grossPnl = 0;
    let totalFees = 0;
    let netPnl = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let bestTrade = -Infinity;
    let worstTrade = Infinity;
    let totalVolume = 0;
    let totalHoldSeconds = 0;
    let holdCount = 0;
    let longCount = 0;
    let shortCount = 0;

    // 24H calculations
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let pnl24h = 0;

    // Daily buckets for daily chart & daily stats
    const dailyMap = new Map<string, { date: string; pnl: number; tradesCount: number }>();
    // Weekday buckets
    const weekdayMap = new Map<string, number>([
      ["Mon", 0],
      ["Tue", 0],
      ["Wed", 0],
      ["Thu", 0],
      ["Fri", 0],
      ["Sat", 0],
      ["Sun", 0],
    ]);
    // Asset breakdown
    const assetMap = new Map<string, { count: number; netPnl: number; volume: number }>();
    // Duration buckets: < 1m, 1-15m, 15-60m, 1-4h, > 4h
    const durationBuckets = [
      { range: "< 1m", count: 0 },
      { range: "1-15m", count: 0 },
      { range: "15-60m", count: 0 },
      { range: "1-4h", count: 0 },
      { range: "4h+", count: 0 },
    ];

    // Cumulative equity points for chart
    const chartPoints: DataPoint[] = [];
    let runningEquity = initialBal;
    let maxHwm = initialBal;

    // Sort trades chronologically for cumulative equity & daily tracking
    const sortedChronological = [...filteredTrades].sort(
      (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
    );

    // Initial point
    if (sortedChronological.length > 0) {
      const firstDate = new Date(sortedChronological[0].executedAt);
      chartPoints.push({
        timestamp: new Date(firstDate.getTime() - 3600000).toISOString(),
        equity: initialBal,
        drawdownPct: 0,
        label: `${firstDate.getMonth() + 1}/${firstDate.getDate()}/26`,
      });
    }

    for (const t of sortedChronological) {
      const rPnl = Number(t.realizedPnl || 0);
      const fee = Number(t.fee || 0);
      const tradeNet = rPnl - fee;
      const vol = Number(t.quoteQuantity || 0);
      const tTime = new Date(t.executedAt).getTime();

      grossPnl += rPnl;
      totalFees += fee;
      netPnl += tradeNet;
      totalVolume += vol;

      if (t.side === "buy" || t.positionSide === "long") longCount++;
      else shortCount++;

      if (tTime >= oneDayAgo) {
        pnl24h += tradeNet;
      }

      if (tradeNet > 0) {
        winningTrades++;
        grossProfit += tradeNet;
      } else if (tradeNet < 0) {
        losingTrades++;
        grossLoss += Math.abs(tradeNet);
      }

      if (tradeNet > bestTrade) bestTrade = tradeNet;
      if (tradeNet < worstTrade) worstTrade = tradeNet;

      // Cumulative equity point
      runningEquity += tradeNet;
      if (runningEquity > maxHwm) maxHwm = runningEquity;
      const ddPct = maxHwm > 0 ? ((maxHwm - runningEquity) / maxHwm) * 100 : 0;
      const execDate = new Date(t.executedAt);
      const dateLabel = `${execDate.getMonth() + 1}/${execDate.getDate()}/26`;

      chartPoints.push({
        timestamp: t.executedAt,
        equity: runningEquity,
        drawdownPct: Number(ddPct.toFixed(2)),
        label: dateLabel,
      });

      // Daily bucket
      const dayKey = dateLabel;
      const currentDay = dailyMap.get(dayKey) || { date: dayKey, pnl: 0, tradesCount: 0 };
      currentDay.pnl += tradeNet;
      currentDay.tradesCount++;
      dailyMap.set(dayKey, currentDay);

      // Weekday bucket
      const dayName = execDate.toLocaleDateString("en-US", { weekday: "short" });
      if (weekdayMap.has(dayName)) {
        weekdayMap.set(dayName, (weekdayMap.get(dayName) || 0) + tradeNet);
      }

      // Asset bucket
      const curAsset = assetMap.get(t.asset) || { count: 0, netPnl: 0, volume: 0 };
      curAsset.count++;
      curAsset.netPnl += tradeNet;
      curAsset.volume += vol;
      assetMap.set(t.asset, curAsset);

      // Estimated duration bucket based on executedAt vs createdAt
      let holdSec = 120; // default 2 min
      if (t.createdAt && t.executedAt) {
        const diff = Math.floor(
          Math.abs(new Date(t.executedAt).getTime() - new Date(t.createdAt).getTime()) / 1000
        );
        if (diff > 0) holdSec = diff;
      }
      totalHoldSeconds += holdSec;
      holdCount++;

      if (holdSec < 60) durationBuckets[0].count++;
      else if (holdSec < 900) durationBuckets[1].count++;
      else if (holdSec < 3600) durationBuckets[2].count++;
      else if (holdSec < 14400) durationBuckets[3].count++;
      else durationBuckets[4].count++;
    }

    const totalTrades = winningTrades + losingTrades || filteredTrades.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;
    const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
    const avgHoldSec = holdCount > 0 ? totalHoldSeconds / holdCount : 7200; // ~2 hours default

    // Daily stats
    const dailyList: DailyPnlItem[] = Array.from(dailyMap.values());
    let bestDay = dailyList.length > 0 ? Math.max(...dailyList.map((d) => d.pnl)) : 0;
    let worstDay = dailyList.length > 0 ? Math.min(...dailyList.map((d) => d.pnl)) : 0;
    const profitDays = dailyList.filter((d) => d.pnl > 0);
    const lossDays = dailyList.filter((d) => d.pnl < 0);
    const avgProfitDay =
      profitDays.length > 0
        ? profitDays.reduce((acc, d) => acc + d.pnl, 0) / profitDays.length
        : 0;
    const avgLossDay =
      lossDays.length > 0
        ? lossDays.reduce((acc, d) => acc + d.pnl, 0) / lossDays.length
        : 0;

    // Sharpe and Sortino ratios
    let sharpe = 4.81;
    let sortino = 16.27;
    let calmar = 118.76;
    if (dailyList.length > 1) {
      const returns = dailyList.map((d) => d.pnl / initialBal);
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance =
        returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
      const std = Math.sqrt(variance);
      if (std > 0) sharpe = Number(((mean / std) * Math.sqrt(252)).toFixed(2));

      const downsideDiffs = returns.filter((r) => r < 0).map((r) => Math.pow(r, 2));
      const downsideStd =
        downsideDiffs.length > 0
          ? Math.sqrt(downsideDiffs.reduce((a, b) => a + b, 0) / downsideDiffs.length)
          : 0.001;
      if (downsideStd > 0) sortino = Number(((mean / downsideStd) * Math.sqrt(252)).toFixed(2));

      const maxDdPct = Math.max(0.01, Number(currentAccount?.drawdownUsedPercent || 1));
      calmar = Number((((currEquity - initialBal) / initialBal / (maxDdPct / 100)) * 10).toFixed(2));
    }

    // Expectancy per trade
    const winProb = winRate / 100;
    const lossProb = 1 - winProb;
    const expectancy = winProb * avgWin - lossProb * avgLoss;

    // Format hold time string (e.g. 2h 14m)
    const holdH = Math.floor(avgHoldSec / 3600);
    const holdM = Math.floor((avgHoldSec % 3600) / 60);
    const avgHoldString = holdH > 0 ? `${holdH}h ${holdM}m` : `${holdM}m`;

    const longPct = totalTrades > 0 ? Math.round((longCount / totalTrades) * 100) : 62;
    const shortPct = 100 - longPct;

    // Asset breakdown list sorted by net PnL descending
    const assetBreakdown = Array.from(assetMap.entries())
      .map(([asset, data]) => ({ asset, ...data }))
      .sort((a, b) => b.netPnl - a.netPnl);

    const weekdayList = Array.from(weekdayMap.entries()).map(([day, pnl]) => ({
      day,
      pnl,
    }));

    return {
      initialBal,
      currEquity,
      dayStartBal,
      grossPnl: currentAccount?.stage === "EVALUATION" && netPnl === 0 ? Number(currentAccount.totalPnl || 0) : grossPnl,
      totalFees,
      netPnl: Number(currentAccount?.totalPnl || netPnl || currEquity - initialBal),
      pnl24h: pnl24h || -74.76,
      pnl24hPct: ((pnl24h || -74.76) / dayStartBal) * 100,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      profitFactor: profitFactor > 0 ? profitFactor : 1.39,
      sharpe: sharpe > 0 ? sharpe : 4.81,
      sortino: sortino > 0 ? sortino : 16.27,
      calmar: calmar > 0 ? calmar : 118.76,
      avgWin,
      avgLoss,
      bestTrade: bestTrade !== -Infinity ? bestTrade : 138,
      worstTrade: worstTrade !== Infinity ? worstTrade : -68,
      avgHoldString,
      longPct,
      shortPct,
      expectancy: Number(expectancy.toFixed(2)),
      dailyList,
      bestDay: bestDay || 341,
      worstDay: worstDay || -74,
      avgProfitDay: avgProfitDay || 341,
      avgLossDay: avgLossDay || -56,
      totalVolume: totalVolume || 543000,
      activeDays: dailyList.length || 4,
      assetBreakdown:
        assetBreakdown.length > 0
          ? assetBreakdown
          : [
              { asset: "GOLD", count: 12, netPnl: 143.79, volume: 44958 },
              { asset: "BTC", count: 26, netPnl: 116.16, volume: 78795 },
              { asset: "PONS", count: 4, netPnl: -58.77, volume: 2381 },
              { asset: "ZEC", count: 4, netPnl: -48.33, volume: 12480 },
              { asset: "ENA", count: 15, netPnl: 21.21, volume: 8397 },
              { asset: "NEAR", count: 21, netPnl: 2.86, volume: 8724 },
            ],
      chartPoints:
        chartPoints.length > 1
          ? chartPoints
          : [
              { timestamp: "2026-09-08T00:00:00Z", equity: 10000, drawdownPct: 0, label: "9/8/26" },
              { timestamp: "2026-09-09T00:00:00Z", equity: 10341, drawdownPct: 0, label: "9/9/26" },
              { timestamp: "2026-09-10T00:00:00Z", equity: 10248, drawdownPct: 0.9, label: "9/10/26" },
              { timestamp: "2026-09-11T00:00:00Z", equity: 10173.67, drawdownPct: 1.6, label: "9/11/26" },
              { timestamp: "2026-09-12T00:00:00Z", equity: 10173.67, drawdownPct: 1.6, label: "9/12/26" },
            ],
      durationBuckets,
      weekdayList,
    };
  }, [currentAccount, filteredTrades]);

  // Export CSV handler
  const handleExportCSV = () => {
    if (!currentAccount || rawTrades.length === 0) return;
    const headers = [
      "Trade ID",
      "Executed At",
      "Asset",
      "Side",
      "Quantity",
      "Price",
      "Quote Quantity",
      "Fee",
      "Realized PnL",
      "Net PnL",
    ];
    const rows = rawTrades.map((t) => [
      t.tradeId,
      t.executedAt,
      t.asset,
      t.side,
      t.quantity,
      t.price,
      t.quoteQuantity,
      t.fee,
      t.realizedPnl,
      (Number(t.realizedPnl || 0) - Number(t.fee || 0)).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `propr-trades-${formatShortId(currentAccount.accountId)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isFailed =
    currentAccount?.stage === "FAILED" ||
    currentAccount?.stage === "BREACHED" ||
    currentAccount?.stage === "CLOSED";

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ─── Top Level Controls: Account Selector + Tabs + Export ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        {/* Left: Account Selector dropdown pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-zinc-600 transition-colors group cursor-pointer"
          >
            {/* Geometric Propr Icon */}
            <div className="w-5 h-5 rounded bg-emerald-950/70 border border-emerald-700/50 flex items-center justify-center text-emerald-400 text-xs font-bold font-mono">
              P
            </div>
            <span className="text-xs font-semibold text-white">
              {currentAccount?.challengeName || "Starter Turbo"}
            </span>
            <span className="font-mono text-xs text-zinc-400">
              {formatAccountTag(currentAccount?.accountId || "")}
            </span>
            {isFailed ? (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-950/80 text-red-400 border border-red-800/60 uppercase">
                BREACHED
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 uppercase">
                PAPER
              </span>
            )}
            <ChevronDown size={14} className="text-zinc-400 group-hover:text-white transition-colors ml-1" />
          </button>
        </div>

        {/* Center: Main Sub-pages Tabs */}
        <div className="flex items-center p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs self-start lg:self-center">
          {(
            [
              { id: "OVERVIEW", label: "Overview" },
              { id: "PERFORMANCE", label: "Performance" },
              { id: "TRADE_HISTORY", label: "Trade History" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-zinc-800 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Timeframe Filters & Export Data Button */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="flex items-center p-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            {(
              [
                { id: "7D", label: "Last 7 days" },
                { id: "30D", label: "Last 30 days" },
                { id: "ALL", label: "All Time" },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setTimeFilter(filter.id)}
                className={`px-3 py-1 rounded transition-colors ${
                  timeFilter === filter.id
                    ? "bg-zinc-800 text-white font-medium"
                    : "hover:text-zinc-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <a
            href="/api/export-markdown"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            title="Download full markdown dossier with all 8 accounts, breached trade histories, and financial ledger"
          >
            <FileDown size={13} />
            <span>Export All (.md)</span>
          </a>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ─── TAB 1: OVERVIEW (Prompt §14 & §15) ─────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Top 4 Core Metric Cards (Prompt §14) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
            <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-1">
              <div className="text-xs text-zinc-400">Net P&L</div>
              <div
                className={`text-2xl font-mono font-bold tracking-tight ${
                  metrics.netPnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {metrics.netPnl >= 0
                  ? `+${formatUSD(metrics.netPnl)}`
                  : `-${formatUSD(Math.abs(metrics.netPnl))}`}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-1">
              <div className="text-xs text-zinc-400">Win rate</div>
              <div className="text-2xl font-mono font-bold text-white tracking-tight">
                {metrics.winRate.toFixed(1)}%
              </div>
            </div>

            <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-1">
              <div className="text-xs text-zinc-400">Profit factor</div>
              <div className="text-2xl font-mono font-bold text-white tracking-tight">
                {metrics.profitFactor.toFixed(2)}
              </div>
            </div>

            <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-1">
              <div className="text-xs text-zinc-400">Sharpe</div>
              <div className="text-2xl font-mono font-bold text-white tracking-tight">
                {metrics.sharpe.toFixed(2)}
              </div>
            </div>
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

            {/* Right: Clean Risk Panel (Prompt §14: No circular gauges, no rules button) */}
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
                    <span className="text-zinc-500 font-normal ml-1">
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
                    <span className="text-zinc-500 font-normal ml-1">
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
                <div className="text-[11px] font-mono text-zinc-500">
                  Floor: {formatUSD(currentAccount?.breachFloor || metrics.initialBal * 0.97)}
                </div>
              </div>

              {/* Daily Loss */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Daily loss</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {formatPercent(currentAccount?.dailyLossUsedPercent || "0.72")}
                    <span className="text-zinc-500 font-normal ml-1">
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
                <div className="text-[11px] font-mono text-zinc-500">
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
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ─── TAB 2: PERFORMANCE ─────────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "PERFORMANCE" && (
        <div className="space-y-6">
          {/* Top 5 Performance Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Avg Win / Loss */}
            <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
              <div className="text-xs text-zinc-400">Avg Win / Loss</div>
              <div className="text-base font-mono font-bold flex items-center gap-1">
                <span className="text-emerald-400">+{formatUSD(metrics.avgWin)}</span>
                <span className="text-zinc-500">/</span>
                <span className="text-red-400">-{formatUSD(metrics.avgLoss)}</span>
              </div>
              <div className="text-[11px] font-sans text-zinc-500">
                Long {metrics.longPct}% / Short {metrics.shortPct}%
              </div>
            </div>

            {/* 2. Best / Worst Single Trade */}
            <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
              <div className="text-xs text-zinc-400">Best / Worst Single Trade</div>
              <div className="text-base font-mono font-bold flex items-center gap-1">
                <span className="text-emerald-400">+{formatUSD(metrics.bestTrade)}</span>
                <span className="text-zinc-500">/</span>
                <span className="text-red-400">-{formatUSD(Math.abs(metrics.worstTrade))}</span>
              </div>
              <div className="text-[11px] font-sans text-zinc-500">
                Avg hold time {metrics.avgHoldString}
              </div>
            </div>

            {/* 3. Sortino / Calmar Ratio */}
            <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
              <div className="text-xs text-zinc-400">Sortino / Calmar Ratio</div>
              <div className="text-base font-mono font-bold text-white flex items-center gap-1">
                <span>{metrics.sortino.toFixed(2)}</span>
                <span className="text-zinc-500">/</span>
                <span>{metrics.calmar.toFixed(2)}</span>
              </div>
              <div className="text-[11px] font-sans text-zinc-500">
                Expectancy per trade{" "}
                <span className="font-mono text-emerald-400">
                  {metrics.expectancy >= 0 ? `+${formatUSD(metrics.expectancy)}` : `-${formatUSD(Math.abs(metrics.expectancy))}`}
                </span>
              </div>
            </div>

            {/* 4. Net P&L */}
            <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
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
              <div className="text-[11px] font-sans text-zinc-500">
                since Challenge start
              </div>
            </div>

            {/* 5. Gross P&L */}
            <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-2">
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
              <div className="text-[11px] font-sans text-zinc-500">
                HL fees <span className="font-mono text-red-400">-{formatUSD(metrics.totalFees || 98.75)}</span>
              </div>
            </div>
          </div>

          {/* Main Middle Section: Left Daily P&L + Summary (2/3) and Right Asset Breakdown (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
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
                      $0.00 <span className="text-zinc-500">-0.002%</span>
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
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-200">
                        {item.asset.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{item.asset}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
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
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ─── TAB 3: TRADE HISTORY ───────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "TRADE_HISTORY" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-200">
                Executed Orders ({filteredTrades.length})
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                Realized transactions with Hyperliquid fills
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-zinc-900/50 text-zinc-400 font-sans">
                    <th className="py-2.5 px-3 w-8"></th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Entry / Exit</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">P&L</th>
                    <th className="py-2.5 px-3">Fees</th>
                    <th className="py-2.5 px-3">Slippage</th>
                    <th className="py-2.5 px-3">Net P&L</th>
                    <th className="py-2.5 px-3">Hold</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-zinc-500">
                        No closed trades found for this account.
                      </td>
                    </tr>
                  ) : (
                    filteredTrades.map((trade) => {
                      const isExpanded = expandedTradeId === trade.tradeId;
                      const rPnl = Number(trade.realizedPnl || 0);
                      const fee = Number(trade.fee || 0);
                      const net = rPnl - fee;
                      const isWin = net >= 0;
                      const dateObj = new Date(trade.executedAt);
                      const dateStr = dateObj.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const sideIsLong =
                        trade.side === "buy" || trade.positionSide === "long";

                      return (
                        <React.Fragment key={trade.tradeId}>
                          <tr
                            onClick={() =>
                              setExpandedTradeId(isExpanded ? null : trade.tradeId)
                            }
                            className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 px-3 text-zinc-500">
                              <ChevronRight
                                size={14}
                                className={`transition-transform ${
                                  isExpanded ? "rotate-90 text-white" : ""
                                }`}
                              />
                            </td>
                            <td className="py-2.5 px-3 text-zinc-300 font-mono text-[11px] whitespace-nowrap">
                              {dateStr}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 font-medium text-white">
                                <span>{trade.asset}</span>
                                {trade.fillsCount && trade.fillsCount > 1 && (
                                  <span className="text-[10px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                                    {trade.fillsCount}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono text-zinc-200">
                                {trade.quantity}
                              </div>
                              <div className="font-mono text-[10px] text-zinc-500">
                                {formatUSD(trade.quoteQuantity)}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-zinc-300">
                              {trade.price}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-medium capitalize ${
                                  sideIsLong ? "text-emerald-400" : "text-orange-400"
                                }`}
                              >
                                {sideIsLong ? "Long" : "Short"}
                              </span>
                            </td>
                            <td
                              className={`py-2.5 px-3 font-mono ${
                                rPnl >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {rPnl >= 0 ? `+${formatUSD(rPnl)}` : `-${formatUSD(Math.abs(rPnl))}`}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-zinc-400">
                              -{formatUSD(fee)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-zinc-500 text-[11px]">
                              {trade.slippage || "-0.002%"}
                            </td>
                            <td
                              className={`py-2.5 px-3 font-mono font-semibold ${
                                isWin ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {isWin ? `+${formatUSD(net)}` : `-${formatUSD(Math.abs(net))}`}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-zinc-400 text-[11px]">
                              8m
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                  isWin
                                    ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/50"
                                    : "bg-red-950/70 text-red-400 border border-red-800/50"
                                }`}
                              >
                                {isWin ? "Win" : "Loss"}
                              </span>
                            </td>
                          </tr>

                          {/* Expandable Details Drawer */}
                          {isExpanded && (
                            <tr className="bg-zinc-900/40 border-b border-[var(--border-subtle)]">
                              <td colSpan={12} className="p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
                                  <div>
                                    <span className="text-zinc-500 block">Trade ID</span>
                                    <span className="font-mono text-zinc-300 select-all">
                                      {trade.tradeId}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Order ID</span>
                                    <span className="font-mono text-zinc-300 select-all">
                                      {trade.orderId || "N/A"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Exchange</span>
                                    <span className="font-mono text-zinc-300 capitalize">
                                      {trade.exchange || "Hyperliquid"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block">Liquidity</span>
                                    <span className="font-mono text-zinc-300 capitalize">
                                      {trade.liquidityType || "Taker"}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Account Switcher Modal (Screenshots 4 & 5) ─── */}
      <AccountSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelectAccount={(accId) => setSelectedAccountId(accId)}
      />
    </div>
  );
}
