"use client";

import React from "react";
import type { AccountSnapshot } from "@/lib/types";
import { formatUSD, formatAccountTag } from "@/lib/utils";
import { isFunded, isEvaluation } from "@propr/data-model";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import type { DailyForensicsSummary } from "@/lib/forensics";
import { Card, MetricValue } from "@/components/ui";

export interface DayAccountInfo {
  tag: string;
  tier?: string;
  stage?: string;
}

export interface ForensicsDayDossierProps {
  selectedDaySummary: DailyForensicsSummary | undefined;
  selectedDateKey: string;
  handlePrevDay: () => void;
  handleNextDay: () => void;
  selectedDayAccounts: DayAccountInfo[] | AccountSnapshot[];
  expandedTradeId: string | null;
  setExpandedTradeId: (id: string | null) => void;
  formatIST?: (utcStr: string) => string;
}

function defaultFormatIST(utcStr: string): string {
  const dObj = new Date(utcStr);
  return (
    dObj.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " IST"
  );
}

export function ForensicsDayDossier({
  selectedDaySummary,
  selectedDateKey,
  handlePrevDay,
  handleNextDay,
  selectedDayAccounts,
  expandedTradeId,
  setExpandedTradeId,
  formatIST = defaultFormatIST,
}: ForensicsDayDossierProps) {
  if (!selectedDaySummary || selectedDaySummary.totalTrades === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-8 text-center space-y-2 font-sans">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
          <CalendarIcon size={18} />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300">
          No Trading Activity Recorded
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          No trade fills occurred on {selectedDateKey} across the active account universe. No risk or discipline rules were triggered.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-6 font-sans">
      {/* Dossier Header with Prev / Next Day navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-zinc-100 font-mono">
              {new Date(selectedDateKey + "T00:00:00Z").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}
            </h3>
            <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-zinc-800 text-zinc-300 border border-zinc-700">
              {selectedDayAccounts.length} Monitored Account{selectedDayAccounts.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Pooled cross-account discipline, execution quality, and rule audit dossier
          </div>
        </div>

        {/* Day-to-Day step navigation */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handlePrevDay}
            aria-label="Previous day"
            className="p-1.5 rounded border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextDay}
            aria-label="Next day"
            className="p-1.5 rounded border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 1. Diagnostic Banner (Sentence case, no uppercase tracking mono!) */}
      {selectedDaySummary.isFlawless ? (
        <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/60 flex items-start sm:items-center gap-3">
          <ShieldCheck size={24} className="text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <div className="text-sm font-semibold text-emerald-300 font-sans flex items-center gap-2">
              <span>Flawless protocol execution (100% discipline)</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-emerald-900/80 text-emerald-200 border border-emerald-700/60">
                Pass
              </span>
            </div>
            <div className="text-xs text-emerald-400/80 mt-0.5">
              All {selectedDaySummary.totalTrades} executions across all active accounts adhered strictly to approved assets, stop-loss caps, and cooldown windows.
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-red-950/30 border border-red-800/60 flex items-start sm:items-center gap-3">
          <ShieldAlert size={24} className="text-red-400 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <div className="text-sm font-semibold text-red-300 font-sans flex items-center gap-2">
              <span>Protocol breach detected ({selectedDaySummary.violationsCount} violations)</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-red-900/80 text-red-200 border border-red-700/60">
                Score: {selectedDaySummary.disciplineScore}%
              </span>
            </div>
            <div className="text-xs text-red-400/80 mt-0.5">
              Rule violations on this day caused{" "}
              <strong className="text-white">
                -{formatUSD(selectedDaySummary.costOfViolationsUSD)}
              </strong>{" "}
              in avoidable trading losses.
            </div>
          </div>
        </div>
      )}

      {/* 2. Key Daily Metrics (4-Card Grid using Card & MetricValue) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card spacing="1">
          <div className="text-xs text-zinc-400">Day Portfolio Net P&L</div>
          <MetricValue
            tone={selectedDaySummary.netPnl >= 0 ? "positive" : "negative"}
            value={
              selectedDaySummary.netPnl >= 0
                ? `+${formatUSD(selectedDaySummary.netPnl)}`
                : `-${formatUSD(Math.abs(selectedDaySummary.netPnl))}`
            }
          />
          <div className="text-[11px] text-zinc-400 font-mono">
            Gross: {formatUSD(selectedDaySummary.grossPnl)} · Fees: -{formatUSD(selectedDaySummary.fees)}
          </div>
        </Card>

        <Card spacing="1">
          <div className="text-xs text-zinc-400">Day Discipline Score</div>
          <MetricValue
            tone={
              selectedDaySummary.disciplineScore >= 90
                ? "positive"
                : selectedDaySummary.disciplineScore >= 75
                ? "warning"
                : "negative"
            }
            value={`${selectedDaySummary.disciplineScore.toFixed(1)}%`}
          />
          <div className="text-[11px] text-zinc-400">
            {selectedDaySummary.taggedTrades.filter((t) => t.isCompliant).length} of{" "}
            {selectedDaySummary.totalTrades} compliant trades
          </div>
        </Card>

        <Card spacing="1">
          <div className="text-xs text-zinc-400">Cost of Violations</div>
          <MetricValue
            tone={selectedDaySummary.costOfViolationsUSD > 0 ? "negative" : "muted"}
            value={
              selectedDaySummary.costOfViolationsUSD > 0
                ? `-${formatUSD(selectedDaySummary.costOfViolationsUSD)}`
                : "$0.00"
            }
          />
          <div className="text-[11px] text-zinc-400">
            Direct rule breach net loss
          </div>
        </Card>

        <Card spacing="1">
          <div className="text-xs text-zinc-400">Win Rate & Volume</div>
          <MetricValue value={`${selectedDaySummary.winRate.toFixed(0)}%`} />
          <div className="text-[11px] text-zinc-400 font-mono">
            {selectedDaySummary.winningTrades}W / {selectedDaySummary.losingTrades}L ·{" "}
            {selectedDaySummary.totalTrades} total fills
          </div>
        </Card>
      </div>

      {/* 3. Daily Protocol Verification Checklist */}
      <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200 font-sans">
          Daily Execution Protocol Checklist (Cross-Account)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Rule 1: Approved Whitelist */}
          <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800/70 flex items-start gap-2.5">
            {selectedDaySummary.checklist.whitelistApproved ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-semibold text-zinc-200">Asset Whitelist</h4>
              <div className="text-[11px] text-zinc-400">
                {selectedDaySummary.checklist.whitelistApproved
                  ? "All fills in approved assets"
                  : "Trade on unapproved symbol"}
              </div>
            </div>
          </div>

          {/* Rule 2: Single-Trade Risk Cap */}
          <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800/70 flex items-start gap-2.5">
            {selectedDaySummary.checklist.riskCapRespected ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-semibold text-zinc-200">Risk Limit Cap</h4>
              <div className="text-[11px] text-zinc-400">
                {selectedDaySummary.checklist.riskCapRespected
                  ? "No trade loss exceeded cap"
                  : "Over-risk violation recorded"}
              </div>
            </div>
          </div>

          {/* Rule 3: 45-Min Cooldown Gate */}
          <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800/70 flex items-start gap-2.5">
            {selectedDaySummary.checklist.cooldownObserved ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-semibold text-zinc-200">45-Min Cooldown</h4>
              <div className="text-[11px] text-zinc-400">
                {selectedDaySummary.checklist.cooldownObserved
                  ? "Proper reset observed"
                  : "Entered within 45m of loss"}
              </div>
            </div>
          </div>

          {/* Rule 4: Weekend Freeze */}
          <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800/70 flex items-start gap-2.5">
            {selectedDaySummary.checklist.weekendFreezeRespected ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-semibold text-zinc-200">Weekend Freeze</h4>
              <div className="text-[11px] text-zinc-400">
                {selectedDaySummary.checklist.weekendFreezeRespected
                  ? "Zero weekend freeze trades"
                  : "Executed during freeze"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Chronological Executions Table for Selected Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-200">
            Itemized Executions for this Day ({selectedDaySummary.taggedTrades.length} Trades across {selectedDayAccounts.length} Accounts)
          </h3>
          <div className="text-xs text-zinc-400 font-mono">
            Mixed chronological sequence
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-sans text-xs">
                <th className="py-2.5 px-3 w-8 font-normal">#</th>
                <th className="py-2.5 px-3 font-normal">Time (UTC / IST)</th>
                <th className="py-2.5 px-3 font-normal">Account</th>
                <th className="py-2.5 px-3 font-normal">Asset</th>
                <th className="py-2.5 px-3 font-normal">Side</th>
                <th className="py-2.5 px-3 text-right font-normal">Quantity</th>
                <th className="py-2.5 px-3 text-right font-normal">Price</th>
                <th className="py-2.5 px-3 text-right font-normal">Net P&L</th>
                <th className="py-2.5 px-3 font-normal">Discipline Audit</th>
                <th className="py-2.5 px-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 font-mono">
              {selectedDaySummary.taggedTrades.map((tt, idx) => {
                const trade = tt.trade;
                const isWin = Number(trade.realizedPnl || 0) - Number(trade.fee || 0) >= 0;
                const net = Number(trade.realizedPnl || 0) - Number(trade.fee || 0);
                const isExpanded = expandedTradeId === trade.tradeId;

                return (
                  <React.Fragment key={trade.tradeId || idx}>
                    <tr
                      onClick={() => setExpandedTradeId(isExpanded ? null : trade.tradeId)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300 text-[11px] whitespace-nowrap">
                        <div>{new Date(trade.executedAt).toISOString().slice(11, 19)} UTC</div>
                        <div className="text-zinc-400 text-[11px]">{formatIST(trade.executedAt)}</div>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-200">
                            {formatAccountTag(trade.accountId || "")}
                          </span>
                          {tt.accountName && (
                            <span className="text-[11px] text-zinc-400 hidden sm:inline">
                              · {tt.accountName}
                            </span>
                          )}
                          {tt.accountStage && (
                            <span
                              className={`text-[11px] px-1.5 py-0.5 rounded font-sans font-medium ${
                                isFunded(tt.accountStage)
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                                  : isEvaluation(tt.accountStage)
                                  ? "bg-cyan-950 text-cyan-400 border border-cyan-800/40"
                                  : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                              }`}
                            >
                              {isFunded(tt.accountStage) ? "Funded" : isEvaluation(tt.accountStage) ? "Evaluation" : tt.accountStage}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white font-sans">
                        {trade.asset}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`text-xs font-medium ${
                            trade.side === "buy" || trade.positionSide === "long"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {trade.side?.toLowerCase() === "buy" || trade.positionSide === "long" ? "Buy" : "Sell"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-200">
                        {trade.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-200">
                        {formatUSD(trade.price)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          isWin ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {isWin ? `+${formatUSD(net)}` : `-${formatUSD(Math.abs(net))}`}
                      </td>
                      <td className="py-2.5 px-3">
                        {tt.violations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {tt.violations.map((v, vIdx) => (
                              <span
                                key={vIdx}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-sans font-medium ${
                                  v.severity === "critical"
                                    ? "bg-red-950/80 text-red-400 border border-red-800/50"
                                    : "bg-amber-950/80 text-amber-400 border border-amber-800/50"
                                }`}
                                title={v.description}
                              >
                                <AlertTriangle size={11} />
                                {v.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-sans text-emerald-400 bg-emerald-950/40 border border-emerald-900/30">
                            <CheckCircle2 size={11} />
                            Clean
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium ${
                            isWin
                              ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/50"
                              : "bg-red-950/70 text-red-400 border border-red-800/50"
                          }`}
                        >
                          {isWin ? "Win" : "Loss"}
                        </span>
                      </td>
                    </tr>

                    {/* Detailed Trade Diagnostic Expansion */}
                    {isExpanded && (
                      <tr className="bg-zinc-900/50 border-b border-zinc-800">
                        <td colSpan={10} className="p-4 space-y-3 font-sans">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-zinc-400 block">Trade ID</span>
                              <span className="font-mono text-zinc-200 select-all">
                                {trade.tradeId}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">Exchange Order</span>
                              <span className="font-mono text-zinc-200 select-all">
                                {trade.orderId || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">Fee / Slippage</span>
                              <span className="font-mono text-zinc-200">
                                -{formatUSD(trade.fee || 0)} · {trade.slippage || "0.00%"}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block">Execution Role</span>
                              <span className="font-mono text-zinc-200 capitalize">
                                {trade.liquidityType || "Taker"} Fill
                              </span>
                            </div>
                          </div>

                          {/* Rule Violation Breakdown */}
                          {tt.violations.length > 0 ? (
                            <div className="p-3 rounded-md bg-red-950/30 border border-red-900/40 space-y-1.5">
                              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                                <AlertTriangle size={13} />
                                <span>Specific Rule Breaches Tagged ({tt.violations.length})</span>
                              </h4>
                              <div className="space-y-1 text-xs">
                                {tt.violations.map((v, vIdx) => (
                                  <div
                                    key={vIdx}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-zinc-300"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-red-400 font-mono text-[11px]">• [{v.label}]</span>
                                      <span>{v.description}</span>
                                    </div>
                                    {v.costUSD > 0 && (
                                      <span className="font-mono text-red-400 font-medium text-[11px]">
                                        Loss Impact: -{formatUSD(v.costUSD)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-md bg-emerald-950/20 border border-emerald-900/30 flex items-center gap-2 text-xs text-emerald-400">
                              <CheckCircle2 size={14} />
                              <span>100% Rule-Compliant Execution: Position sizing, approved asset whitelist, and mandatory cooldown respected.</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
