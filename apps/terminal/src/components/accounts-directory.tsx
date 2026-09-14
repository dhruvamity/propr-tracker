"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  isTradingActive,
  isAccountFailed,
  isFunded,
  isPassed,
} from "@propr/data-model";
import { formatUSD, formatPercent, formatAccountTag } from "@/lib/utils";
import {
  Search,
  Copy,
  Check,
  X,
  ExternalLink,
  History,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import {
  TableContainer,
  TableHeaderRow,
  TableHeaderCell,
  TableBody,
  StatusBadge,
} from "@/components/ui";

export interface AccountTrade {
  tradeId?: string;
  executedAt?: string;
  asset?: string;
  side?: string;
  price?: string | number;
  quantity?: string | number;
  fee?: string | number;
  realizedPnl?: string | number;
}

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
  trades?: AccountTrade[];
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [drawerAccount, setDrawerAccount] = useState<AccountItem | null>(null);

  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    if (tabParam === "archived" || tabParam === "failed" || tabParam === "history") {
      setFilter("ARCHIVED");
    } else if (tabParam === "active") {
      setFilter("ACTIVE");
    } else if (tabParam === "funded") {
      setFilter("FUNDED");
    }
  }

  const copyToClipboard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAndSortedAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        const isFailed = isAccountFailed(acc.stage);
        const isActive = isTradingActive(acc.stage);

        if (filter === "ACTIVE" && !isActive) return false;
        if (filter === "ARCHIVED" && !isFailed) return false;
        if (filter === "FUNDED" && !isFunded(acc.stage)) return false;

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
          const isFailedA = isAccountFailed(a.stage);
          const isFailedB = isAccountFailed(b.stage);
          if (isFailedA !== isFailedB) {
            return isFailedA ? 1 : -1;
          }
          const bufA = Number(a.drawdownRemaining ?? 999999);
          const bufB = Number(b.drawdownRemaining ?? 999999);
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

  const activeCount = accounts.filter((a) => isTradingActive(a.stage)).length;
  const failedCount = accounts.filter((a) => isAccountFailed(a.stage)).length;
  const fundedCount = accounts.filter((a) => isFunded(a.stage)).length;

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
                ? "bg-[var(--bg-elevated)] text-white font-medium"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            All ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("ACTIVE")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "ACTIVE"
                ? "bg-[var(--bg-elevated)] text-white font-medium"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("FUNDED")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "FUNDED"
                ? "bg-[var(--bg-elevated)] text-white font-medium"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Funded ({fundedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("ARCHIVED")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "ARCHIVED"
                ? "bg-[var(--bg-elevated)] text-white font-medium"
                : "text-[var(--text-secondary)] hover:text-white"
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
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
            />
            <input
              type="text"
              placeholder="Search account / ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-md pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--border-primary)] font-sans"
            />
          </div>

          <div className="flex items-center gap-1 text-[var(--text-secondary)] font-sans">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--border-primary)] font-sans"
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
      <TableContainer>
        <thead>
          <TableHeaderRow>
            <TableHeaderCell>Stage</TableHeaderCell>
            <TableHeaderCell>Account</TableHeaderCell>
            <TableHeaderCell align="right">Starting Capital</TableHeaderCell>
            <TableHeaderCell align="right">Equity</TableHeaderCell>
            <TableHeaderCell align="right">Net P&L</TableHeaderCell>
            <TableHeaderCell>Failure / Target</TableHeaderCell>
            <TableHeaderCell align="center">Action</TableHeaderCell>
          </TableHeaderRow>
        </thead>
        <TableBody>
          {filteredAndSortedAccounts.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-6 text-center font-sans">
                <EmptyState
                  icon={Search}
                  title="No Matching Accounts"
                  description={
                    searchTerm
                      ? `No accounts found matching "${searchTerm}". Try adjusting your search query.`
                      : "No accounts found for the selected stage filter."
                  }
                />
              </td>
            </tr>
          ) : (
            filteredAndSortedAccounts.map((acc) => {
              const isFailed = isAccountFailed(acc.stage);
              const isActive = isTradingActive(acc.stage);
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
                  {/* Column 1: Stage (Prompt §18: standardized dot + text) */}
                  <td className="py-2.5 px-3 text-left whitespace-nowrap font-sans">
                    {isFailed ? (
                      <StatusBadge label="Failed" tone="red" />
                    ) : isFunded(acc.stage) ? (
                      <StatusBadge label="Funded" tone="zinc" dot={false} />
                    ) : isPassed(acc.stage) ? (
                      <StatusBadge label="Passed" tone="green" />
                    ) : (
                      <StatusBadge label="Evaluation" tone="neutral" dot={false} />
                    )}
                  </td>

                    {/* Column 2: Account Identifier + Challenge Tier (Prompt §19: clean ID + hover copy) */}
                    <td className="py-2.5 px-3 text-left group">
                      <div className="flex items-center gap-1.5 font-sans">
                        <span className="font-semibold text-white">{formatAccountTag(acc.accountId)}</span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(acc.accountId, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--text-secondary)] hover:text-white transition-opacity"
                          title="Copy account ID"
                          aria-label="Copy account ID"
                        >
                          {copiedId === acc.accountId ? (
                            <Check size={11} className="text-[var(--green)]" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                      <span className="text-[11px] text-[var(--text-secondary)] block font-sans font-normal mt-0.5">
                        {acc.challengeName || "Starter Turbo"}
                      </span>
                    </td>

                    {/* Column 3: Starting Capital (Right-aligned) */}
                    <td className="py-2.5 px-3 text-right text-[var(--text-secondary)] whitespace-nowrap font-mono font-medium">
                      {formatUSD(startBal)}
                    </td>

                    {/* Column 4: Current / Ending Equity (Right-aligned) */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-medium text-white">
                      {formatUSD(currentEq)}
                    </td>

                    {/* Column 5: Net PnL (Financial Monospace + Green/Red Sign) */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono">
                      <span className={`font-semibold ${isPos ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                        {isPos ? "+" : ""}{formatUSD(netPnlNum)}
                      </span>
                      <span className={`text-[11px] block ${isPos ? "text-[var(--green)]/80" : "text-[var(--red)]/80"}`}>
                        {isPos ? "+" : ""}{pnlPct.toFixed(2)}%
                      </span>
                    </td>

                    {/* Column 5: Failure Trigger / Target Progress (Left-aligned) */}
                    <td className="py-2.5 px-3 text-left font-sans">
                      {acc.failureReason ? (
                        <span className="text-xs text-[var(--text-secondary)]">
                          {acc.failureReason.replace(/_/g, " ")}
                        </span>
                      ) : isActive ? (
                        <div className="text-[var(--text-secondary)] text-xs">
                          <span className="font-mono font-medium text-white">{formatPercent(acc.profitTargetPct, 2)}</span>
                          <span className="text-[var(--text-secondary)] ml-1">/ {acc.profitTargetPercent || "9"}% target</span>
                          {acc.toTargetAmount && Number(acc.toTargetAmount) > 0 && (
                            <span className="text-[var(--text-secondary)] block text-[11px] font-mono">
                              ({formatUSD(acc.toTargetAmount)} left)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--text-secondary)] text-xs">Archived</span>
                      )}
                    </td>

                    {/* Column 7: Action (Clickable View Trades) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setDrawerAccount(acc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-sans font-medium text-[var(--cyan)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors"
                      >
                        <span>View trades</span>
                        <ExternalLink size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </TableBody>
        </TableContainer>

      {/* ─── Slide-out Account Detail & Trade History Drawer (Prompt Requirement §10) ─── */}
      {drawerAccount && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerAccount(null)}
          />
          <div className="relative w-full max-w-2xl bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] h-full overflow-y-auto p-6 space-y-6 shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[var(--border-subtle)] font-sans">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">
                    {drawerAccount.challengeName || "Account Details"}
                  </h3>
                  <span className="text-xs font-mono text-[var(--text-secondary)] font-medium">
                    {formatAccountTag(drawerAccount.accountId)}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] capitalize">
                    {drawerAccount.stage?.toLowerCase()}
                  </span>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">
                  {drawerAccount.accountId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerAccount(null)}
                className="p-1.5 rounded text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <div>
                <span className="text-[var(--text-secondary)] text-xs font-sans block">Equity</span>
                <span className="text-base font-mono font-bold text-white mt-0.5 block">{formatUSD(drawerAccount.equity || drawerAccount.balance)}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] text-xs font-sans block">Starting</span>
                <span className="text-base font-mono font-bold text-[var(--text-secondary)] mt-0.5 block">{formatUSD(drawerAccount.initialBalance || drawerAccount.startingBalance)}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] text-xs font-sans block">Drawdown Buffer</span>
                <span className="text-base font-mono font-bold text-white mt-0.5 block">{formatUSD(drawerAccount.drawdownRemaining)}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] text-xs font-sans block">Daily Room</span>
                <span className="text-base font-mono font-bold text-[var(--green)] mt-0.5 block">{formatUSD(drawerAccount.dailyLossRemaining)}</span>
              </div>
            </div>

            {/* Account Trade History */}
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white text-sm">
                  Order execution history ({drawerAccount.closedTradesCount || drawerAccount.trades?.length || 0} trades)
                </span>
                {drawerAccount.winLossRatio && (
                  <span className="text-[var(--text-secondary)] font-mono">{drawerAccount.winLossRatio}</span>
                )}
              </div>

              {!drawerAccount.trades || drawerAccount.trades.length === 0 ? (
                <div className="rounded border border-[var(--border-subtle)] p-6 bg-[var(--bg-primary)]">
                  <EmptyState
                    icon={History}
                    title="No Trade History"
                    description="No trade history recorded for this account."
                  />
                </div>
              ) : (
                <div className="rounded border border-[var(--border-subtle)] overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-sans">
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
                            <td className="py-2 px-3 text-[var(--text-secondary)] whitespace-nowrap">
                              {t.executedAt ? new Date(t.executedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—"}
                            </td>
                            <td className="py-2 px-3 font-semibold text-white">
                              {t.asset ? t.asset.replace("xyz:", "") : "—"}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`font-sans text-[11px] font-semibold ${
                                t.side?.toLowerCase() === "buy" ? "text-[var(--green)]" : "text-[var(--red)]"
                              }`}>
                                {t.side ? (t.side.toLowerCase() === "buy" ? "Buy" : "Sell") : "—"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right text-white whitespace-nowrap">
                              {formatUSD(t.price)}
                            </td>
                            <td className="py-2 px-3 text-right text-white">
                              {t.quantity || "—"}
                            </td>
                            <td className="py-2 px-3 text-right text-[var(--text-secondary)]">
                              {formatUSD(t.fee)}
                            </td>
                            <td className={`py-2 px-3 text-right font-semibold whitespace-nowrap ${
                              isPnlPos ? "text-[var(--green)]" : "text-[var(--red)]"
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
