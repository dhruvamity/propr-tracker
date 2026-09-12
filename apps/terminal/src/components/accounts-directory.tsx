"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { formatUSD, formatPercent, formatShortId, formatAccountTag } from "@/lib/utils";
import {
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from "lucide-react";

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

type FilterState = "ALL" | "ACTIVE" | "FUNDED" | "ARCHIVED";
type SortOption = "RISK" | "EQUITY_DESC" | "TARGET_PROGRESS" | "ID";

export function AccountsDirectory({ accounts }: AccountsDirectoryProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [filter, setFilter] = useState<FilterState>(() => {
    if (tabParam === "archived" || tabParam === "failed" || tabParam === "history") return "ARCHIVED";
    if (tabParam === "active") return "ACTIVE";
    if (tabParam === "funded") return "FUNDED";
    return "ALL";
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("RISK");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [drawerAccount, setDrawerAccount] = useState<AccountItem | null>(null);

  useEffect(() => {
    if (tabParam === "archived" || tabParam === "failed" || tabParam === "history") {
      setFilter("ARCHIVED");
    }
  }, [tabParam]);

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
        const isFailed = acc.stage === "FAILED" || acc.stage === "BREACHED" || acc.stage === "CLOSED";
        const isActive = acc.stage === "EVALUATION" || acc.stage === "FUNDED";

        if (filter === "ACTIVE" && !isActive) return false;
        if (filter === "ARCHIVED" && !isFailed) return false;
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
    (a) => a.stage === "FAILED" || a.stage === "BREACHED" || a.stage === "CLOSED"
  ).length;
  const fundedCount = accounts.filter((a) => a.stage === "FUNDED").length;

  return (
    <div className="space-y-4">
      {/* ─── Control Strip: Tabs & Search ───────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)]">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 font-sans text-xs">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "ALL"
                ? "bg-zinc-800 text-white font-medium"
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
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("FUNDED")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "FUNDED"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Funded ({fundedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("ARCHIVED")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "ARCHIVED"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Archived ({failedCount})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-sans">
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-sans"
            />
          </div>

          <div className="flex items-center gap-1 text-zinc-400 font-sans">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-sans"
            >
              <option value="RISK">Risk (Breach Proximity) ▼</option>
              <option value="EQUITY_DESC">Equity (High to Low)</option>
              <option value="TARGET_PROGRESS">Target Progress</option>
              <option value="ID">Account ID</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Consolidated Accounts Table (Prompt §12 & §13) ───────────── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 font-sans">
              <th className="py-2.5 px-3 text-left font-normal">Stage</th>
              <th className="py-2.5 px-3 text-left font-normal">Account</th>
              <th className="py-2.5 px-3 text-right font-normal">Starting Capital</th>
              <th className="py-2.5 px-3 text-right font-normal">Equity</th>
              <th className="py-2.5 px-3 text-right font-normal">Net P&L</th>
              <th className="py-2.5 px-3 text-left font-normal">Failure / Target</th>
              <th className="py-2.5 px-3 text-center font-normal">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
            {filteredAndSortedAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500 font-sans">
                  No accounts match the selected filter.
                </td>
              </tr>
            ) : (
              filteredAndSortedAccounts.map((acc) => {
                const isFailed = acc.stage === "FAILED" || acc.stage === "BREACHED" || acc.stage === "CLOSED";
                const isActive = acc.stage === "EVALUATION" || acc.stage === "FUNDED";
                const startBal = Number(acc.initialBalance || acc.startingBalance || 10000);
                const currentEq = Number(acc.equity || acc.balance || startBal);
                const netPnlNum = currentEq - startBal;
                const pnlPct = startBal > 0 ? (netPnlNum / startBal) * 100 : 0;
                const isPos = netPnlNum >= 0;

                return (
                  <tr
                    key={acc.accountId}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Column 1: Stage (Prompt §12: dot + text, no capsules) */}
                    <td className="py-2.5 px-3 text-left whitespace-nowrap font-sans">
                      {isFailed ? (
                        <span className="inline-flex items-center gap-1.5 text-red-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          <span>Failed</span>
                        </span>
                      ) : isActive ? (
                        <span className="text-zinc-300 font-medium">
                          Evaluation
                        </span>
                      ) : (
                        <span className="text-zinc-400">
                          {acc.stage}
                        </span>
                      )}
                    </td>

                    {/* Column 2: Account Identifier + Challenge Tier */}
                    <td className="py-2.5 px-3 text-left">
                      <div className="flex items-center gap-1.5 font-sans">
                        <span className="font-semibold text-zinc-100">{formatAccountTag(acc.accountId)}</span>
                        <span className="text-zinc-400 text-[11px] font-mono font-normal">({formatShortId(acc.accountId)})</span>
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
                      <span className="text-[11px] text-zinc-400 block font-sans font-normal mt-0.5">
                        {acc.challengeName || "Starter Turbo"}
                      </span>
                    </td>

                    {/* Column 3: Starting Capital (Right-aligned) */}
                    <td className="py-2.5 px-3 text-right text-zinc-400 whitespace-nowrap">
                      {formatUSD(startBal)}
                    </td>

                    {/* Column 4: Current / Ending Equity (Right-aligned) */}
                    <td className="py-2.5 px-3 text-right font-semibold text-zinc-100 whitespace-nowrap">
                      {formatUSD(currentEq)}
                    </td>

                    {/* Column 5: Net PnL (Right-aligned) */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className={`font-semibold ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                        {isPos ? `+${formatUSD(netPnlNum)}` : `-${formatUSD(Math.abs(netPnlNum))}`}
                      </span>
                      <span className={`text-[10px] block ${isPos ? "text-emerald-400/80" : "text-red-400/80"}`}>
                        {isPos ? "+" : ""}{formatPercent(pnlPct, 2)}
                      </span>
                    </td>

                    {/* Column 6: Failure Trigger / Target Progress (Left-aligned) */}
                    <td className="py-2.5 px-3 text-left font-sans">
                      {acc.failureReason ? (
                        <span className="text-xs text-zinc-400">
                          {acc.failureReason.replace(/_/g, " ")}
                        </span>
                      ) : isActive ? (
                        <div className="text-zinc-300 text-xs">
                          <span className="font-mono font-medium text-zinc-100">{formatPercent(acc.profitTargetPct, 2)}</span>
                          <span className="text-zinc-500 ml-1">/ {acc.profitTargetPercent || "9"}% target</span>
                          {acc.toTargetAmount && Number(acc.toTargetAmount) > 0 && (
                            <span className="text-zinc-400 block text-[11px] font-mono">
                              ({formatUSD(acc.toTargetAmount)} left)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-xs">Archived</span>
                      )}
                    </td>

                    {/* Column 7: Action (Clickable View Trades) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setDrawerAccount(acc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-sans font-medium text-[var(--cyan)] hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        <span>View trades</span>
                        <ExternalLink size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Slide-out Account Detail & Trade History Drawer (Prompt Requirement §10) ─── */}
      {drawerAccount && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerAccount(null)}
          />
          <div className="relative w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800 font-sans">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">
                    {drawerAccount.challengeName || "Account Details"}
                  </h3>
                  <span className="text-xs font-mono text-zinc-300 font-medium">
                    {formatAccountTag(drawerAccount.accountId)}
                  </span>
                  <span className="text-xs text-zinc-400 capitalize">
                    {drawerAccount.stage?.toLowerCase()}
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-500 mt-1">
                  {drawerAccount.accountId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerAccount(null)}
                className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <div>
                <span className="text-zinc-400 text-xs font-sans block">Equity</span>
                <span className="text-base font-mono font-bold text-white mt-0.5 block">{formatUSD(drawerAccount.equity || drawerAccount.balance)}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-xs font-sans block">Starting</span>
                <span className="text-base font-mono font-bold text-zinc-300 mt-0.5 block">{formatUSD(drawerAccount.initialBalance || drawerAccount.startingBalance)}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-xs font-sans block">Drawdown Buffer</span>
                <span className="text-base font-mono font-bold text-zinc-200 mt-0.5 block">{formatUSD(drawerAccount.drawdownRemaining)}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-xs font-sans block">Daily Room</span>
                <span className="text-base font-mono font-bold text-emerald-400 mt-0.5 block">{formatUSD(drawerAccount.dailyLossRemaining)}</span>
              </div>
            </div>

            {/* Account Trade History */}
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200 text-sm">
                  Order execution history ({drawerAccount.closedTradesCount || drawerAccount.trades?.length || 0} trades)
                </span>
                {drawerAccount.winLossRatio && (
                  <span className="text-zinc-400 font-mono">{drawerAccount.winLossRatio}</span>
                )}
              </div>

              {!drawerAccount.trades || drawerAccount.trades.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs rounded border border-zinc-800">
                  No trade history recorded for this account.
                </div>
              ) : (
                <div className="rounded border border-zinc-800 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-sans">
                        <th className="py-2 px-3 font-normal">Time</th>
                        <th className="py-2 px-3 font-normal">Asset</th>
                        <th className="py-2 px-3 font-normal">Side</th>
                        <th className="py-2 px-3 text-right font-normal">Price</th>
                        <th className="py-2 px-3 text-right font-normal">Size</th>
                        <th className="py-2 px-3 text-right font-normal">Fee</th>
                        <th className="py-2 px-3 text-right font-normal">Net PnL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono text-xs">
                      {drawerAccount.trades.map((t, idx) => {
                        const pnl = Number(t.realizedPnl || 0);
                        const isPnlPos = pnl >= 0;

                        return (
                          <tr key={t.tradeId || idx} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-3 text-zinc-500 whitespace-nowrap">
                              {t.executedAt ? new Date(t.executedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—"}
                            </td>
                            <td className="py-2 px-3 font-semibold text-white">
                              {t.asset ? t.asset.replace("xyz:", "") : "—"}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                t.side?.toLowerCase() === "buy" ? "text-emerald-400 bg-emerald-950/40" : "text-red-400 bg-red-950/40"
                              }`}>
                                {t.side ? t.side.toUpperCase() : "—"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right text-zinc-300 whitespace-nowrap">
                              {formatUSD(t.price)}
                            </td>
                            <td className="py-2 px-3 text-right text-zinc-300">
                              {t.quantity || "—"}
                            </td>
                            <td className="py-2 px-3 text-right text-zinc-500">
                              {formatUSD(t.fee)}
                            </td>
                            <td className={`py-2 px-3 text-right font-semibold whitespace-nowrap ${
                              isPnlPos ? "text-emerald-400" : "text-red-400"
                            }`}>
                              {isPnlPos ? `+${formatUSD(pnl)}` : `-${formatUSD(Math.abs(pnl))}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
