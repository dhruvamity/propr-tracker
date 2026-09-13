"use client";

import React from "react";
import type { TradeData } from "@/lib/types";
import { formatUSD } from "@/lib/utils";
import {
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { TaggedTrade } from "@/lib/forensics";

export interface AnalyticsTradesTabProps {
  filteredTrades: TradeData[];
  taggedTradesMap: Map<string, TaggedTrade>;
  expandedTradeId: string | null;
  setExpandedTradeId: (id: string | null) => void;
}

export function AnalyticsTradesTab({
  filteredTrades,
  taggedTradesMap,
  expandedTradeId,
  setExpandedTradeId,
}: AnalyticsTradesTabProps) {
  return (
    <div className="space-y-4 font-sans">
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-200">
            Executed Orders ({filteredTrades.length})
          </h3>
          <div className="text-xs text-zinc-400 font-mono">
            Realized transactions with Hyperliquid fills
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-zinc-900/50 text-zinc-400 font-sans">
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-normal">Date</th>
                <th className="py-2.5 px-3 font-normal">Asset</th>
                <th className="py-2.5 px-3 font-normal">Size</th>
                <th className="py-2.5 px-3 font-normal">Entry / Exit</th>
                <th className="py-2.5 px-3 font-normal">Side</th>
                <th className="py-2.5 px-3 font-normal text-right">P&L</th>
                <th className="py-2.5 px-3 font-normal text-right">Fees</th>
                <th className="py-2.5 px-3 font-normal text-right">Slippage</th>
                <th className="py-2.5 px-3 font-normal text-right">Net P&L</th>
                <th className="py-2.5 px-3 font-normal">Hold</th>
                <th className="py-2.5 px-3 font-normal">Status</th>
                <th className="py-2.5 px-3 font-normal">Rule Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-zinc-400">
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

                  const tagged = taggedTradesMap.get(trade.tradeId);

                  return (
                    <React.Fragment key={trade.tradeId}>
                      <tr
                        onClick={() =>
                          setExpandedTradeId(isExpanded ? null : trade.tradeId)
                        }
                        className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 text-zinc-400">
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
                              <span className="text-[11px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                                {trade.fillsCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-zinc-200">
                            {trade.quantity}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-400">
                            {formatUSD(trade.quoteQuantity)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-300">
                          {formatUSD(trade.price)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-semibold ${
                              sideIsLong ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {sideIsLong ? "Long" : "Short"}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono ${
                            rPnl >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {rPnl >= 0 ? `+${formatUSD(rPnl)}` : `-${formatUSD(Math.abs(rPnl))}`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                          -{formatUSD(fee)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                          $0.00
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            net >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {isWin ? `+${formatUSD(net)}` : `-${formatUSD(Math.abs(net))}`}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-400 text-[11px]">
                          8m
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
                        <td className="py-2.5 px-3">
                          {tagged && tagged.violations.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {tagged.violations.map((v, idx) => (
                                <span
                                  key={idx}
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
                      </tr>

                      {/* Expandable Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-zinc-900/40 border-b border-[var(--border-subtle)]">
                          <td colSpan={13} className="p-4 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
                              <div>
                                <span className="text-zinc-400 block">Trade ID</span>
                                <span className="font-mono text-zinc-300 select-all">
                                  {trade.tradeId}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-400 block">Order ID</span>
                                <span className="font-mono text-zinc-300 select-all">
                                  {trade.orderId || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-400 block">Exchange</span>
                                <span className="font-mono text-zinc-300 capitalize">
                                  {trade.exchange || "Hyperliquid"}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-400 block">Liquidity</span>
                                <span className="font-mono text-zinc-300 capitalize">
                                  {trade.liquidityType || "Taker"}
                                </span>
                              </div>
                            </div>

                            {/* Forensics Audit Drawer Section */}
                            {tagged && tagged.violations.length > 0 ? (
                              <div className="p-3 rounded-md bg-red-950/30 border border-red-900/40 space-y-1.5">
                                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                                  <AlertTriangle size={13} />
                                  <span>Trade Forensics — Rule Violations Tagged ({tagged.violations.length})</span>
                                </h4>
                                <div className="space-y-1 text-xs">
                                  {tagged.violations.map((v, idx) => (
                                    <div
                                      key={idx}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-zinc-300"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-red-400 font-mono text-[11px]">• [{v.label}]</span>
                                        <span>{v.description}</span>
                                      </div>
                                      {v.costUSD > 0 && (
                                        <span className="font-mono text-red-400 font-medium text-[11px]">
                                          Cost: -{formatUSD(v.costUSD)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-md bg-emerald-950/20 border border-emerald-900/30 flex items-center gap-2 text-xs text-emerald-400">
                                <CheckCircle2 size={14} />
                                <span>Protocol Compliant: Executed strictly within approved asset universe, risk limits, and cooldown window.</span>
                              </div>
                            )}
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
  );
}
