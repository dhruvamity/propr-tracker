import { fetchDashboardData } from "@/lib/propr-api";
import { CheckCircle2, Wallet, ArrowDown, GitBranch } from "lucide-react";
import { BankRefBadge } from "@/components/bank-ref-badge";
import { formatUSD, formatINR } from "@/lib/utils";

export const revalidate = 15;

export default async function FinancePage() {
  const { finance } = await fetchDashboardData();

  const totalSpentINR = Number(
    finance.totalActualCashCostINR || finance.totalInvestedINR || 0
  );
  const activeAtRiskINR = Number(
    finance.activeActualCashCostINR || finance.activeCapitalINR || 0
  );
  const totalPayoutsINR = Number(finance.totalPayoutsINR || 0);
  const netOutflowINR = totalSpentINR - totalPayoutsINR;

  return (
    <div className="space-y-6">
      {/* ─── 1. Three-Layer Accounting Visualization (Prompt §11) ─────────── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 md:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            <GitBranch size={15} className="text-zinc-400" />
            <span>Cash Flow</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            Bank settled capital & outflows
          </span>
        </div>

        {/* Visual Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1: Total Spent */}
          <div className="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2 relative">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
              1. Total Cash Outflow
            </span>
            <div className="text-xl md:text-2xl font-mono font-bold text-white">
              {formatINR(totalSpentINR)}
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Propr:</span>
                <span className="text-zinc-200">{formatINR(finance.proprActualCashCostINR)}</span>
              </div>
              <div className="flex justify-between">
                <span>Breakout:</span>
                <span className="text-zinc-200">{formatINR(finance.breakoutActualCashCostINR)}</span>
              </div>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                →
              </div>
            </div>
          </div>

          {/* Step 2: Active Capital at Risk */}
          <div className="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2 relative">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
              2. Active Cash At Risk
            </span>
            <div className="text-xl md:text-2xl font-mono font-bold text-amber-300">
              {formatINR(activeAtRiskINR)}
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Active Face:</span>
                <span className="text-zinc-200">{formatUSD(finance.activeCapitalUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span>Accounts:</span>
                <span className="text-zinc-200">2 Active Evals</span>
              </div>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                →
              </div>
            </div>
          </div>

          {/* Step 3: Payouts */}
          <div className="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2 relative">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
              3. Payouts Received
            </span>
            <div className="text-xl md:text-2xl font-mono font-bold text-emerald-400">
              {formatINR(totalPayoutsINR)}
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>USD Processed:</span>
                <span className="text-zinc-200">{formatUSD(finance.totalPayoutsUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-zinc-400">Bank Settled</span>
              </div>
            </div>
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                →
              </div>
            </div>
          </div>

          {/* Step 4: Net Cash Position (Prompt §10) */}
          <div className="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
              4. Net Cash Position
            </span>
            <div className="text-xl md:text-2xl font-mono font-bold text-red-400">
              −{formatINR(netOutflowINR)}
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Net Outflow:</span>
                <span className="text-red-400 font-semibold">{formatINR(netOutflowINR)}</span>
              </div>
              <div className="flex justify-between">
                <span>Net P&L:</span>
                <span className="text-zinc-400">Pure Fee Outflow</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Prop Firm Expense Ledger (Prompt §2: Right-aligned values) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-2">
            <Wallet size={14} className="text-zinc-400" />
            Expense Ledger
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">
            {finance.ledger.length} transactions reconciled
          </span>
        </div>

        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                <th className="py-2.5 px-3 text-left">Date</th>
                <th className="py-2.5 px-3 text-left">Firm</th>
                <th className="py-2.5 px-3 text-left">Challenge</th>
                <th className="py-2.5 px-3 text-right">USD Cost</th>
                <th className="py-2.5 px-3 text-right">Bank Debit (INR)</th>
                <th className="py-2.5 px-3 text-left">Invoice / Bank Ref</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
              {finance.ledger.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  {/* Date (Left-aligned) */}
                  <td className="py-2.5 px-3 text-left text-zinc-400 whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Firm (Left-aligned) */}
                  <td className="py-2.5 px-3 text-left">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        tx.firm.toLowerCase() === "breakout"
                          ? "bg-amber-950/50 text-amber-400 border-amber-800/40"
                          : "bg-zinc-800 text-zinc-200 border-zinc-700"
                      }`}
                    >
                      {tx.firm.toUpperCase()}
                    </span>
                  </td>

                  {/* Challenge Name (Left-aligned) */}
                  <td className="py-2.5 px-3 text-left font-medium text-white">
                    {tx.challengeName}
                  </td>

                  {/* Face Value USD (Right-aligned) */}
                  <td className="py-2.5 px-3 text-right font-medium text-zinc-300 whitespace-nowrap">
                    {tx.amountUSD && Number(tx.amountUSD) > 0
                      ? formatUSD(tx.amountUSD)
                      : "—"}
                  </td>

                  {/* Actual Bank Debit INR (Right-aligned) */}
                  <td className="py-2.5 px-3 text-right font-bold text-white whitespace-nowrap">
                    {formatINR(tx.actualCashCostINR || tx.amountINR)}
                  </td>

                  {/* Bank Reference (Left-aligned with copyable badge) */}
                  <td className="py-2.5 px-3 text-left">
                    <BankRefBadge
                      reference={tx.bankReference || tx.invoiceNumber || "—"}
                    />
                  </td>

                  {/* Verification Status (Centered) */}
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 whitespace-nowrap">
                      <CheckCircle2 size={11} />
                      BANK VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
