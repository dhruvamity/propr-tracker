"use client";

import React, { useState } from "react";
import { formatUSD, formatINR, formatShortId, formatAccountTag } from "@/lib/utils";
import { CheckCircle2, Copy, Check, X, Receipt } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export interface TransactionItem {
  id: string;
  date: string;
  firm: string;
  challengeName?: string;
  accountId?: string;
  amountUSD?: string;
  actualCashCostINR?: string;
  amountINR?: string;
  bankReference?: string;
  invoiceNumber?: string;
  verified?: boolean;
}

interface FinanceLedgerProps {
  ledger: TransactionItem[];
}

export function FinanceLedger({ ledger }: FinanceLedgerProps) {
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const copyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200 font-sans">
            Ledger
          </h2>
          <span className="text-xs font-sans text-zinc-400">
            {ledger.length} transactions reconciled
          </span>
        </div>

        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          {ledger.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Receipt}
                title="No Reconciled Transactions"
                description="Purchase invoices, challenge registrations, and bank debits will appear here once recorded."
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 font-sans">
                  <th className="py-2.5 px-3 text-left font-normal">Date</th>
                  <th className="py-2.5 px-3 text-left font-normal">Firm</th>
                  <th className="py-2.5 px-3 text-left font-normal">Challenge</th>
                  <th className="py-2.5 px-3 text-left font-normal">Account</th>
                  <th className="py-2.5 px-3 text-right font-normal">USD Cost</th>
                  <th className="py-2.5 px-3 text-right font-normal">Bank Debit (INR)</th>
                  <th className="py-2.5 px-3 text-center font-normal">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
                {ledger.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap font-sans">
                      {new Date(tx.date).toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`font-semibold ${
                          tx.firm.toLowerCase() === "breakout" ? "text-amber-400" : "text-zinc-200"
                        }`}
                      >
                        {tx.firm}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-100 font-sans font-medium">
                      {tx.challengeName}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300">
                      {tx.accountId ? (
                        <span className="font-mono">{formatAccountTag(tx.accountId)}</span>
                      ) : (
                        <span className="text-zinc-400 font-sans">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300">
                      {tx.amountUSD && Number(tx.amountUSD) > 0 ? formatUSD(tx.amountUSD) : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-white">
                      {formatINR(tx.actualCashCostINR || tx.amountINR)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center text-emerald-400" title="Bank Settled">
                        <CheckCircle2 size={14} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Transaction Detail Drawer (Prompt §15) */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedTx(null)}
          />
          <div className="relative w-full max-w-md bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] h-full p-6 space-y-6 overflow-y-auto shadow-2xl z-10 animate-in slide-in-from-right duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Transaction Details
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {new Date(selectedTx.date).toLocaleDateString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "full",
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close transaction details"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-zinc-400 block">Bank Debit</span>
                <div className="text-2xl font-mono font-bold text-white">
                  {formatINR(selectedTx.actualCashCostINR || selectedTx.amountINR)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-zinc-400 block text-[11px]">USD Cost</span>
                  <span className="font-mono text-sm font-semibold text-zinc-200 mt-0.5 block">
                    {selectedTx.amountUSD && Number(selectedTx.amountUSD) > 0
                      ? formatUSD(selectedTx.amountUSD)
                      : "—"}
                  </span>
                </div>
                <div className="p-3 rounded bg-zinc-900/40 border border-zinc-800/80">
                  <span className="text-zinc-400 block text-[11px]">Prop Firm</span>
                  <span className="text-sm font-semibold text-zinc-200 mt-0.5 block">
                    {selectedTx.firm}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                <span className="text-zinc-400 block text-[11px]">Challenge</span>
                <span className="text-sm font-medium text-white block">
                  {selectedTx.challengeName}
                </span>
              </div>

              {selectedTx.accountId && (
                <div className="p-3.5 rounded bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-400 block text-[11px]">Account ID</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-zinc-200">
                      {formatAccountTag(selectedTx.accountId)} ({formatShortId(selectedTx.accountId)})
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
                <span className="text-zinc-400 block text-[11px]">Bank Reference</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-zinc-300 break-all select-all">
                    {selectedTx.bankReference || selectedTx.invoiceNumber || "—"}
                  </span>
                  {(selectedTx.bankReference || selectedTx.invoiceNumber) && (
                    <button
                      onClick={() =>
                        copyReference(selectedTx.bankReference || selectedTx.invoiceNumber || "")
                      }
                      className="p-1 rounded text-zinc-400 hover:text-white shrink-0"
                      title="Copy bank reference"
                      aria-label="Copy bank reference"
                    >
                      {copiedRef ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between">
                <span className="text-zinc-400 text-[11px]">Verification</span>
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 size={14} />
                  <span>Bank Settled & Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
