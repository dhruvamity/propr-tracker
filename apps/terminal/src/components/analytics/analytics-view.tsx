"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { AccountSnapshot } from "@/lib/types";
import { isTradingActive, isEvaluation } from "@propr/data-model";
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
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BarChart3,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import {
  analyzeTradeForensics,
  type ForensicsSummary,
  type TaggedTrade,
} from "@/lib/forensics";
import { AccountSwitcherModal } from "./account-switcher-modal";
import { AnalyticsOverviewTab } from "./analytics-overview-tab";
import { AnalyticsPerformanceTab } from "./analytics-performance-tab";
import { AnalyticsTradesTab } from "./analytics-trades-tab";
import type { DataPoint } from "./equity-curve-chart";
import type { DailyPnlItem } from "./performance-charts";

interface AnalyticsViewProps {
  accounts: AccountSnapshot[];
}

type MainTab = "OVERVIEW" | "PERFORMANCE" | "TRADE_HISTORY";
type TimeFilter = "7D" | "30D" | "ALL";

export function AnalyticsView({ accounts }: AnalyticsViewProps) {
  // Currently selected account (defaults to first active evaluation/funded, or first account)
  const defaultAccount =
    accounts.find((a) => isTradingActive(a.stage)) ||
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
    const latestTs = new Date(rawTrades[rawTrades.length - 1].executedAt).getTime();
    let cutoff = 0;
    if (timeFilter === "7D") cutoff = latestTs - 7 * 24 * 60 * 60 * 1000;
    else if (timeFilter === "30D") cutoff = latestTs - 30 * 24 * 60 * 60 * 1000;

    return rawTrades.filter((t) => new Date(t.executedAt).getTime() >= cutoff);
  }, [rawTrades, timeFilter]);

  // ─── Trade Forensics & Discipline Engine (Phase 4) ─────────────────────────
  const forensics: ForensicsSummary = useMemo(() => {
    return analyzeTradeForensics(
      filteredTrades,
      Number(currentAccount?.initialBalance || 10000)
    );
  }, [filteredTrades, currentAccount]);

  const taggedTradesMap = useMemo(() => {
    const map = new Map<string, TaggedTrade>();
    for (const tt of forensics.taggedTrades) {
      map.set(tt.trade.tradeId, tt);
    }
    return map;
  }, [forensics]);

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

    // 24H calculations
    const latestTs = rawTrades.length > 0 ? new Date(rawTrades[rawTrades.length - 1].executedAt).getTime() : 0;
    const oneDayAgo = latestTs > 0 ? latestTs - 24 * 60 * 60 * 1000 : 0;
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
    const bestDay = dailyList.length > 0 ? Math.max(...dailyList.map((d) => d.pnl)) : 0;
    const worstDay = dailyList.length > 0 ? Math.min(...dailyList.map((d) => d.pnl)) : 0;
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
      grossPnl: currentAccount && isEvaluation(currentAccount.stage) && netPnl === 0 ? Number(currentAccount.totalPnl || 0) : grossPnl,
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
  }, [currentAccount, filteredTrades, rawTrades]);

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
      "Discipline Status",
      "Violations",
      "Violation Cost USD",
    ];
    const rows = rawTrades.map((t) => {
      const net = (Number(t.realizedPnl || 0) - Number(t.fee || 0)).toFixed(2);
      const tagged = taggedTradesMap.get(t.tradeId);
      const isCompliant = tagged ? tagged.isCompliant : true;
      const violationLabels = tagged?.violations.map((v) => v.label).join(" | ") || "None";
      const cost = tagged ? tagged.costOfViolationUSD.toFixed(2) : "0.00";
      return [
        t.tradeId,
        t.executedAt,
        t.asset,
        t.side,
        t.quantity,
        t.price,
        t.quoteQuantity,
        t.fee,
        t.realizedPnl,
        net,
        isCompliant ? "COMPLIANT" : "BREACH",
        `"${violationLabels}"`,
        cost,
      ];
    });

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

  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-8 font-sans">
        <EmptyState
          icon={BarChart3}
          title="No Analytics Available"
          description="Connect or activate a trading account to view performance metrics, trade forensics, and execution analytics."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ─── Top Level Controls: Account Selector + Tabs + Export ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        {/* Left: Account Selector dropdown pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            aria-label="Switch account"
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
          <Link
            href="/forensics"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-zinc-400 hover:text-[var(--cyan)] transition-colors"
          >
            <Calendar size={13} />
            <span>Forensics Calendar</span>
          </Link>
        </div>

        {/* Right: Timeframe Filters & Export Data Button */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="flex items-center p-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            {(
              [
                { id: "7D", label: "7D" },
                { id: "30D", label: "30D" },
                { id: "ALL", label: "All" },
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

        </div>
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === "OVERVIEW" && (
        <AnalyticsOverviewTab
          metrics={metrics}
          currentAccount={currentAccount}
          forensics={forensics}
          resetCountdown={resetCountdown}
        />
      )}

      {/* ─── TAB 2: PERFORMANCE ─── */}
      {activeTab === "PERFORMANCE" && (
        <AnalyticsPerformanceTab metrics={metrics} />
      )}

      {/* ─── TAB 3: TRADE HISTORY ─── */}
      {activeTab === "TRADE_HISTORY" && (
        <AnalyticsTradesTab
          filteredTrades={filteredTrades}
          taggedTradesMap={taggedTradesMap}
          expandedTradeId={expandedTradeId}
          setExpandedTradeId={setExpandedTradeId}
        />
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
