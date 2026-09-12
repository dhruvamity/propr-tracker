"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TradeData {
  tradeId: string;
  accountId: string;
  type: string;
  liquidityType: "maker" | "taker";
  asset: string;
  base: string;
  quote: string;
  side: "buy" | "sell";
  positionSide: "long" | "short";
  quantity: string;
  price: string;
  fee: string;
  realizedPnl: string;
  executedAt: string;
}

interface TradeDrawerProps {
  accountId: string;
  trades: TradeData[];
  initialBalance: string;
  endingBalance: string;
}

function formatUSD(val: string | number | undefined | null) {
  if (val === undefined || val === null || val === "" || val === "NaN") return "$0.00";
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }) + " " + d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function formatNum(val: string | undefined | null, dp = 4) {
  if (!val) return "0";
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return "0";
  return n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function TradeDrawer({ accountId, trades, initialBalance, endingBalance }: TradeDrawerProps) {
  const [open, setOpen] = useState(false);

  if (!trades || trades.length === 0) {
    return (
      <span className="text-[10px] text-[var(--text-muted)] italic">No trades</span>
    );
  }

  // Sort trades by executedAt (chronological)
  const sorted = [...trades].sort(
    (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
  );

  // Reconciliation summary
  const totalFees = sorted.reduce((s, t) => s + Number(t.fee || 0), 0);
  const totalRealizedPnl = sorted.reduce((s, t) => s + Number(t.realizedPnl || 0), 0);
  const netPnl = Number(endingBalance) - Number(initialBalance);
  const isPnlPositive = totalRealizedPnl >= 0;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-mono font-medium text-[var(--cyan)] hover:text-white transition-colors cursor-pointer"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{sorted.length} trade{sorted.length !== 1 ? "s" : ""}</span>
      </button>

      {open && (
        <div className="mt-2.5 ml-0 rounded-lg border border-[var(--border-subtle)] bg-zinc-950/80 overflow-hidden">
          {/* Trades Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-zinc-400 uppercase text-[11px]">
                  <th className="py-2 px-2.5">Time</th>
                  <th className="py-2 px-2.5">Asset</th>
                  <th className="py-2 px-2.5">Side</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5 text-right">Price</th>
                  <th className="py-2 px-2.5 text-right">Qty</th>
                  <th className="py-2 px-2.5 text-right">Fee</th>
                  <th className="py-2 px-2.5 text-right">Realized PnL</th>
                  <th className="py-2 px-2.5">Liq.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {sorted.map((trade) => {
                  const rpnl = Number(trade.realizedPnl || 0);
                  const rpnlPositive = rpnl >= 0;
                  return (
                    <tr key={trade.tradeId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-2.5 text-zinc-400 whitespace-nowrap">
                        {formatDate(trade.executedAt)}
                      </td>
                      <td className="py-2 px-2.5 text-white font-medium">
                        {(trade.base || trade.asset || "").replace("xyz:", "")}
                      </td>
                      <td className="py-2 px-2.5">
                        <span className={`inline-flex items-center gap-0.5 font-bold ${
                          trade.side === "buy" ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {trade.side === "buy" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-zinc-400">
                        {trade.type}
                      </td>
                      <td className="py-2 px-2.5 text-right text-white font-medium">
                        {formatUSD(trade.price)}
                      </td>
                      <td className="py-2 px-2.5 text-right text-zinc-300">
                        {formatNum(trade.quantity)}
                      </td>
                      <td className="py-2 px-2.5 text-right text-amber-400">
                        {formatUSD(trade.fee)}
                      </td>
                      <td className={`py-2 px-2.5 text-right font-semibold ${
                        rpnlPositive ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {rpnlPositive ? "+" : ""}{formatUSD(trade.realizedPnl)}
                      </td>
                      <td className="py-2 px-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          trade.liquidityType === "maker"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30"
                            : "bg-amber-950/40 text-amber-400 border border-amber-800/30"
                        }`}>
                          {trade.liquidityType}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Reconciliation Summary */}
          <div className="border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2.5 flex flex-wrap gap-x-6 gap-y-1.5 text-xs font-mono">
            <div>
              <span className="text-zinc-400">Starting: </span>
              <span className="text-white font-semibold">{formatUSD(initialBalance)}</span>
            </div>
            <div>
              <span className="text-zinc-400">Ending: </span>
              <span className="text-white font-semibold">{formatUSD(endingBalance)}</span>
            </div>
            <div>
              <span className="text-zinc-400">Total Fees: </span>
              <span className="text-amber-400 font-semibold">{formatUSD(totalFees)}</span>
            </div>
            <div>
              <span className="text-zinc-400">Net Realized PnL: </span>
              <span className={`font-semibold ${isPnlPositive ? "text-emerald-400" : "text-red-400"}`}>
                {isPnlPositive ? "+" : ""}{formatUSD(totalRealizedPnl)}
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Balance Δ: </span>
              <span className={`font-semibold ${netPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {netPnl >= 0 ? "+" : ""}{formatUSD(netPnl)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
