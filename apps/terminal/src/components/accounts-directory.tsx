"use client";

import React, { useState, useMemo } from "react";
import { formatUSD, formatPercent, formatShortId, formatAccountTag } from "@/lib/utils";
import {
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TradeDrawer } from "./trade-drawer";

export interface AccountItem {
  accountId: string;
  stage: string;
  challengeName?: string;
  drawdownType?: string;
  initialBalance?: string;
  startingBalance?: string;
  balance?: string;
  equity?: string;
  realizedPnl?: string;
  unrealizedPnl?: string;
  fees?: string;
  totalPnl?: string;
  profitTargetPercent?: string;
  profitTargetPct?: string;
  profitTargetProgressPercent?: string;
  toTargetAmount?: string;
  maxDrawdownPercent?: string;
  maxDrawdownAmount?: string;
  drawdownUsedPercent?: string;
  drawdownUsedAmount?: string;
  drawdownLimitConsumedPercent?: string;
  drawdownRemaining?: string;
  breachFloor?: string;
  maxDailyLossPercent?: string;
  dailyLossLimitAmount?: string;
  dailyLossUsedAmount?: string;
  dailyLossUsedPercent?: string;
  dailyLossLimitConsumedPercent?: string;
  dailyLossRemaining?: string;
  dailyLossFloor?: string;
  failureReason?: string;
  tradingDays?: number;
  requiredTradingDays?: number;
  winRate?: string;
  winLossRatio?: string;
  worstTradeUSD?: string;
  bestTradeUSD?: string;
  closedTradesCount?: number;
  rawFillsCount?: number;
  trades?: any[];
}

interface AccountsDirectoryProps {
  accounts: AccountItem[];
}

type FilterState = "ALL" | "ACTIVE" | "FAILED" | "FUNDED";
type SortOption = "RISK" | "EQUITY_DESC" | "TARGET_PROGRESS" | "ID";

export function AccountsDirectory({ accounts }: AccountsDirectoryProps) {
  const [filter, setFilter] = useState<FilterState>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("RISK");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredAndSortedAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        const isFailed = acc.stage === "FAILED" || acc.stage === "BREACHED";
        const isActive = acc.stage === "EVALUATION" || acc.stage === "FUNDED";

        if (filter === "ACTIVE" && !isActive) return false;
        if (filter === "FAILED" && !isFailed) return false;
        if (filter === "FUNDED" && acc.stage !== "FUNDED") return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchId = acc.accountId.toLowerCase().includes(q);
          const matchName = (acc.challengeName || "").toLowerCase().includes(q);
          const matchReason = (acc.failureReason || "").toLowerCase().includes(q);
          if (!matchId && !matchName && !matchReason) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "RISK") {
          const bufA = Number(a.drawdownRemaining || 999999);
          const bufB = Number(b.drawdownRemaining || 999999);
          return bufA - bufB;
        }
        if (sortBy === "EQUITY_DESC") {
          return Number(b.equity || 0) - Number(a.equity || 0);
        }
        if (sortBy === "TARGET_PROGRESS") {
          return (
            Number(b.profitTargetProgressPercent || 0) -
            Number(a.profitTargetProgressPercent || 0)
          );
        }
        if (sortBy === "ID") {
          return a.accountId.localeCompare(b.accountId);
        }
        return 0;
      });
  }, [accounts, filter, searchTerm, sortBy]);

  const activeCount = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  ).length;
  const failedCount = accounts.filter(
    (a) => a.stage === "FAILED" || a.stage === "BREACHED"
  ).length;
  const fundedCount = accounts.filter((a) => a.stage === "FUNDED").length;

  return (
    <div className="space-y-4">
      {/* ─── Compact Control Strip (Prompt Requirement §9) ───────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)]">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "ALL"
                ? "bg-zinc-800 text-white font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("ACTIVE")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "ACTIVE"
                ? "bg-zinc-800 text-white font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("FAILED")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "FAILED"
                ? "bg-zinc-800 text-white font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Failed ({failedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("FUNDED")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "FUNDED"
                ? "bg-zinc-800 text-white font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Funded ({fundedCount})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          {/* Search Box */}
          <div className="relative flex-1 md:w-56">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search account / ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-zinc-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
            >
              <option value="RISK">Risk (Breach Proximity) ▼</option>
              <option value="EQUITY_DESC">Equity (High to Low)</option>
              <option value="TARGET_PROGRESS">Target Progress</option>
              <option value="ID">Account ID</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Expandable Accounts Table (Prompt Requirement §9) ───────────── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
              <th className="py-2.5 px-3 text-center w-10"></th>
              <th className="py-2.5 px-3 text-center">Stage</th>
              <th className="py-2.5 px-3 text-left">Account</th>
              <th className="py-2.5 px-3 text-right">Starting</th>
              <th className="py-2.5 px-3 text-right">Balance</th>
              <th className="py-2.5 px-3 text-right">Equity</th>
              <th className="py-2.5 px-3 text-right">Drawdown</th>
              <th className="py-2.5 px-3 text-right">Target</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
            {filteredAndSortedAccounts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-zinc-500">
                  No accounts match the selected filter.
                </td>
              </tr>
            ) : (
              filteredAndSortedAccounts.map((acc) => {
                const isFailed = acc.stage === "FAILED" || acc.stage === "BREACHED";
                const isActive = acc.stage === "EVALUATION" || acc.stage === "FUNDED";
                const isExpanded = expandedId === acc.accountId;
                const ddConsumed = Number(acc.drawdownLimitConsumedPercent || 0);

                return (
                  <React.Fragment key={acc.accountId}>
                    <tr
                      onClick={() => toggleExpand(acc.accountId)}
                      className={`cursor-pointer transition-colors ${
                        isExpanded ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Expand toggle icon */}
                      <td className="py-2.5 px-3 text-center text-zinc-500">
                        {isExpanded ? (
                          <ChevronUp size={14} className="text-zinc-300" />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </td>

                      {/* Stage Badge */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isActive
                              ? "bg-zinc-800 text-white border-zinc-700"
                              : isFailed
                              ? "bg-red-950/60 text-red-400 border-red-800/50"
                              : "bg-zinc-900 text-zinc-400 border-zinc-800"
                          }`}
                        >
                          {acc.stage}
                        </span>
                      </td>

                      {/* Account ID / Challenge */}
                      <td className="py-2.5 px-3 text-left font-medium text-white">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{formatAccountTag(acc.accountId)}</span>
                          <span className="text-zinc-500 text-[11px] font-normal">{formatShortId(acc.accountId)}</span>
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(acc.accountId, e)}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
                            title="Copy full account ID"
                          >
                            {copiedId === acc.accountId ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-zinc-400 block font-normal">
                          {acc.challengeName || "Starter Turbo"} ({acc.drawdownType || "static"} DD • {acc.tradingDays || 1} active {acc.tradingDays === 1 ? "day" : "days"})
                        </span>
                      </td>

                      {/* Starting */}
                      <td className="py-2.5 px-3 text-right text-zinc-400 whitespace-nowrap">
                        {formatUSD(acc.initialBalance || acc.startingBalance)}
                      </td>

                      {/* Balance */}
                      <td className="py-2.5 px-3 text-right font-medium text-zinc-200 whitespace-nowrap">
                        {formatUSD(acc.balance)}
                      </td>

                      {/* Equity */}
                      <td className="py-2.5 px-3 text-right font-semibold text-white whitespace-nowrap">
                        {formatUSD(acc.equity)}
                      </td>

                      {/* Drawdown Status */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span
                          className={
                            ddConsumed >= 100 || isFailed
                              ? "text-red-400 font-bold"
                              : ddConsumed > 75
                              ? "text-red-400 font-semibold"
                              : ddConsumed > 40
                              ? "text-amber-400 font-medium"
                              : "text-zinc-200"
                          }
                        >
                          {formatPercent(acc.drawdownUsedPercent, 2)}
                          <span className="text-zinc-500 font-normal ml-1">/ {acc.maxDrawdownPercent || "3"}%</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          {formatUSD(acc.drawdownRemaining)} buffer
                        </span>
                      </td>

                      {/* Target Progress */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="font-medium text-white">
                          {formatPercent(acc.profitTargetPct, 2)}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          target: {acc.profitTargetPercent || "9"}%
                          {acc.toTargetAmount && Number(acc.toTargetAmount) > 0 ? ` • ${formatUSD(acc.toTargetAmount)} left` : ""}
                        </span>
                      </td>

                      {/* State Detail */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {acc.failureReason ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-950/50 text-red-400 border border-red-800/40">
                            {acc.failureReason.replace(/_/g, " ")}
                          </span>
                        ) : isActive ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                            Evaluation Active
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[10px]">Archived</span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Inspection Drawer */}
                    {isExpanded && (
                      <tr className="bg-zinc-950/70 border-b border-zinc-800">
                        <td colSpan={9} className="p-4 pl-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Account Details */}
                            <div className="space-y-2 text-xs font-mono">
                              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                                Risk & Limits
                              </span>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Challenge</span>
                                  <span className="text-zinc-200">{acc.challengeName || "Starter Turbo"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Breach floor</span>
                                  <span className="text-red-400 font-bold">{formatUSD(acc.breachFloor)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Drawdown used / limit</span>
                                  <span className="text-zinc-200">
                                    {formatUSD(acc.drawdownUsedAmount || 0)} / {formatUSD(acc.maxDrawdownAmount || 0)} ({formatPercent(acc.drawdownUsedPercent, 2)} / {acc.maxDrawdownPercent}%)
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Daily loss used / limit</span>
                                  <span className="text-zinc-200">
                                    {formatUSD(acc.dailyLossUsedAmount || 0)} / {formatUSD(acc.dailyLossLimitAmount || 0)} ({formatPercent(acc.dailyLossUsedPercent, 2)} / {acc.maxDailyLossPercent}%)
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Daily loss remaining</span>
                                  <span className="text-zinc-200">{formatUSD(acc.dailyLossRemaining)}</span>
                                </div>
                                {acc.toTargetAmount && Number(acc.toTargetAmount) > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Distance to target</span>
                                    <span className="text-emerald-400 font-medium">{formatUSD(acc.toTargetAmount)}</span>
                                  </div>
                                )}
                                {acc.failureReason && (
                                  <div className="flex justify-between pt-1 border-t border-red-900/30">
                                    <span className="text-red-400 font-semibold">Breach trigger</span>
                                    <span className="text-red-400 font-bold">{acc.failureReason.replace(/_/g, " ")}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Lifecycle & Trade Data */}
                            <div className="space-y-2 text-xs font-mono">
                              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                                Trade Performance
                              </span>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Win rate</span>
                                  <span className="text-zinc-200">{acc.winRate || "0.0%"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Realized PnL</span>
                                  <span className={`font-medium ${Number(acc.realizedPnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {formatUSD(acc.realizedPnl)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Trading fees</span>
                                  <span className="text-zinc-400">{formatUSD(acc.fees)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Trading days</span>
                                  <span className="text-zinc-200">{acc.tradingDays || 1} active (Unlimited / No min)</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Trade count</span>
                                  <span className="text-zinc-200">
                                    {acc.closedTradesCount || acc.trades?.length || 0} trades
                                    {acc.winLossRatio ? ` (${acc.winLossRatio})` : ""}
                                    {acc.rawFillsCount ? ` • ${acc.rawFillsCount} fills` : ""}
                                  </span>
                                </div>
                                {acc.worstTradeUSD && Number(acc.worstTradeUSD) < 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Worst trade</span>
                                    <span className="text-red-400 font-medium">
                                      -${Math.round(Math.abs(Number(acc.worstTradeUSD)))} ({formatUSD(acc.worstTradeUSD)})
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Account URN</span>
                                  <span className="text-zinc-500 text-[10px] truncate max-w-[200px]">{acc.accountId}</span>
                                </div>
                              </div>
                              {acc.trades && acc.trades.length > 0 && (
                                <div className="pt-2">
                                  <TradeDrawer
                                    accountId={acc.accountId}
                                    trades={acc.trades || []}
                                    initialBalance={acc.initialBalance || "0"}
                                    endingBalance={acc.balance || "0"}
                                  />
                                </div>
                              )}
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
  );
}
