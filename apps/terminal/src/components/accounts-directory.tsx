"use client";

import React, { useState, useMemo } from "react";
import { formatUSD, formatPercent, formatShortId } from "@/lib/utils";
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
  drawdownLimitConsumedPercent?: string;
  drawdownUsedPercent?: string;
  drawdownRemaining?: string;
  breachFloor?: string;
  profitTargetPercent?: string;
  profitTargetPct?: string;
  profitTargetProgressPercent?: string;
  dailyLossRemaining?: string;
  failureReason?: string;
  currentPhase?: number;
  tradingDays?: number;
  requiredTradingDays?: number;
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
              <th className="py-2.5 px-3 text-left">Account ID / Challenge</th>
              <th className="py-2.5 px-3 text-right">Starting</th>
              <th className="py-2.5 px-3 text-right">Balance</th>
              <th className="py-2.5 px-3 text-right">Equity</th>
              <th className="py-2.5 px-3 text-right">Drawdown Status</th>
              <th className="py-2.5 px-3 text-right">Target</th>
              <th className="py-2.5 px-3 text-center">State Detail</th>
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
                          <span>{formatShortId(acc.accountId)}</span>
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
                          {acc.challengeName || "Starter Turbo"} ({acc.drawdownType || "static"} DD)
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
                            ddConsumed > 75
                              ? "text-red-400 font-bold"
                              : ddConsumed > 40
                              ? "text-amber-400 font-medium"
                              : "text-zinc-200"
                          }
                        >
                          {formatPercent(acc.drawdownLimitConsumedPercent, 2)}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          {formatPercent(acc.drawdownUsedPercent, 2)} used
                        </span>
                      </td>

                      {/* Target Progress */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="font-medium text-white">
                          {formatPercent(acc.profitTargetProgressPercent, 2)}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          target: +{acc.profitTargetPercent || "10"}%
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

                    {/* Expandable Inspection Drawer (Prompt Requirement §9) */}
                    {isExpanded && (
                      <tr className="bg-zinc-950/70 border-b border-zinc-800">
                        <td colSpan={9} className="p-4 pl-12 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Proximity & Invariants */}
                            <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800 space-y-1 text-xs">
                              <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
                                Risk Buffers & Floor Limits
                              </span>
                              <div className="flex justify-between">
                                <span className="text-zinc-400">Breach Floor:</span>
                                <span className="text-red-400 font-bold font-mono">
                                  {formatUSD(acc.breachFloor)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-400">Drawdown Headroom:</span>
                                <span className="text-emerald-400 font-bold font-mono">
                                  {formatUSD(acc.drawdownRemaining)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-400">Daily Loss Room:</span>
                                <span className="text-purple-400 font-bold font-mono">
                                  {formatUSD(acc.dailyLossRemaining)}
                                </span>
                              </div>
                            </div>

                            {/* Lifecycle & Challenge Configuration */}
                            <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800 space-y-1 text-xs">
                              <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
                                Lifecycle Configuration
                              </span>
                              <div className="flex justify-between">
                                <span className="text-zinc-400">Phase:</span>
                                <span className="text-zinc-200">Phase {acc.currentPhase || 1}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-400">Trading Days:</span>
                                <span className="text-zinc-200">
                                  {acc.tradingDays || 1} / {acc.requiredTradingDays || 5} days
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-400">Full Account URN:</span>
                                <span className="text-zinc-400 font-mono text-[10px] truncate max-w-[140px]">
                                  {acc.accountId}
                                </span>
                              </div>
                            </div>

                            {/* Actions & Execution Drawer */}
                            <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
                                  Audit & Trade Drawer
                                </span>
                                <p className="text-[11px] text-zinc-400">
                                  {acc.trades && acc.trades.length > 0
                                    ? `${acc.trades.length} historical trades recorded.`
                                    : "No execution trades on record."}
                                </p>
                              </div>
                              <div>
                                <TradeDrawer
                                  accountId={acc.accountId}
                                  trades={acc.trades || []}
                                  initialBalance={acc.initialBalance || "0"}
                                  endingBalance={acc.balance || "0"}
                                />
                              </div>
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
