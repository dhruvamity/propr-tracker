import { fetchDashboardData } from "@/lib/propr-api";
import { CheckCircle2, Wallet, GitBranch } from "lucide-react";
import { BankRefBadge } from "@/components/bank-ref-badge";
import { formatUSD, formatINR, formatShortId, formatAccountTag } from "@/lib/utils";

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
      {/* ─── 1. Cash Reconciliation & Allocation (24px+ Hero Font) ─────────── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 md:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            <GitBranch size={15} className="text-zinc-400" />
            <span>Cash Reconciliation</span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Bank settled capital & outflows
          </span>
        </div>

        {/* 4 Clean Reconciliation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Total Cash Spent */}
          <div className="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              Total Cash Spent
            </span>
            <div className="text-2xl font-mono font-bold text-white tracking-tight">
              {formatINR(totalSpentINR)}{" "}
              <span className="text-xs font-normal text-zinc-400 font-sans">INR</span>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-xs font-mono text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Propr:</span>
                <span className="text-zinc-200">{formatINR(finance.proprActualCashCostINR)}</span>
              </div>
              <div className="flex justify-between">
                <span>Breakout:</span>
                <span className="text-zinc-200">{formatINR(finance.breakoutActualCashCostINR)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Active Cash at Risk */}
          <div className="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
                Active Cash at Risk
              </span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/30">
                2 active evals
              </span>
            </div>
            <div className="text-2xl font-mono font-bold text-amber-300 tracking-tight">
              {formatINR(activeAtRiskINR)}{" "}
              <span className="text-xs font-normal text-zinc-400 font-sans">INR</span>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-xs font-mono text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">Target capital:</span>
                <span className="text-zinc-200 font-medium">{formatUSD(finance.activeCapitalUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Nominal size:</span>
                <span className="text-zinc-300">$15,000 USD</span>
              </div>
            </div>
          </div>

          {/* Card 3: Payouts Received */}
          <div className="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              Payouts Received
            </span>
            <div className={`text-2xl font-mono font-bold tracking-tight ${
              totalPayoutsINR > 0 ? "text-emerald-400" : "text-zinc-300"
            }`}>
              {formatINR(totalPayoutsINR)}{" "}
              <span className="text-xs font-normal text-zinc-400 font-sans">INR</span>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-xs font-mono text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>USD Processed:</span>
                <span className="text-zinc-200">{formatUSD(finance.totalPayoutsUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-zinc-300">
                  {totalPayoutsINR > 0 ? "Bank Settled" : "None Processed"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Net Cash Outflow */}
          <div className="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
              Net Cash Outflow
            </span>
            <div className="text-2xl font-mono font-bold text-zinc-200 tracking-tight">
              −{formatINR(netOutflowINR)}{" "}
              <span className="text-xs font-normal text-zinc-400 font-sans">INR</span>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-xs font-mono text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Net Outflow:</span>
                <span className="text-zinc-200 font-semibold">{formatINR(netOutflowINR)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost Basis:</span>
                <span className="text-zinc-300">Planned Challenge Fees</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Prop Firm Expense Ledger ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-2">
            <Wallet size={14} className="text-zinc-400" />
            <span>Expense Ledger</span>
          </h2>
          <span className="text-xs font-mono text-zinc-400">
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
                <th className="py-2.5 px-3 text-left">Account Funded</th>
                <th className="py-2.5 px-3 text-right">USD Cost</th>
                <th className="py-2.5 px-3 text-right">Bank Debit (INR)</th>
                <th className="py-2.5 px-3 text-left">Invoice / Bank Ref</th>
                <th className="py-2.5 px-3 text-center">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
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
                      className={`px-2 py-0.5 rounded text-xs font-bold border ${
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

                  {/* Account Funded (Left-aligned) */}
                  <td className="py-2.5 px-3 text-left">
                    {tx.accountId && tx.accountId.startsWith("urn:prp-account:") ? (
                      <div>
                        <span className="text-white font-semibold">{formatAccountTag(tx.accountId)}</span>
                        <span className="text-zinc-400 text-xs block font-normal">{formatShortId(tx.accountId)}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-xs">-</span>
                    )}
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

                  {/* Verification Status (Muted green checkmark icon) */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center" title="Bank Settled & Verified">
                      <CheckCircle2 size={16} className="text-emerald-400/90" />
                    </div>
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
