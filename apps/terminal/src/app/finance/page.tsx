import { fetchDashboardData } from "@/lib/propr-api";
import { CheckCircle2, Wallet } from "lucide-react";
import { BankRefBadge } from "@/components/bank-ref-badge";

export const revalidate = 15;

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

function formatINR(val: string | number | undefined | null) {
  if (val === undefined || val === null || val === "" || val === "NaN") return "₹0.00";
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default async function FinancePage() {
  const { finance } = await fetchDashboardData();

  return (
    <div className="space-y-6">
      {/* Three-Layer Financial Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded border border-[var(--border-primary)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-[var(--text-muted)]">
            <span>TOTAL ACTUAL CASH SPENT</span>
            <span className="text-[10px] px-1 rounded bg-black/40 text-[var(--text-secondary)]">ALL FIRMS</span>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-mono font-bold text-[var(--text-primary)]">
            {formatINR(finance.totalActualCashCostINR || finance.totalInvestedINR)}
          </div>
          <div className="mt-1 text-xs font-mono text-slate-400">
            Propr: {formatINR(finance.proprActualCashCostINR)} | Breakout: {formatINR(finance.breakoutActualCashCostINR)}
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-slate-400">
            Props Face: {formatUSD(finance.totalInvestedUSD)} USD
          </div>
        </div>

        <div className="p-4 rounded border border-[var(--border-primary)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-[var(--text-muted)]">
            <span>ACTIVE CAPITAL</span>
            <span className="text-[10px] px-1 rounded bg-cyan-950/50 text-[var(--cyan)]">AT RISK</span>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-mono font-bold text-[var(--cyan)]">
            {formatINR(finance.activeActualCashCostINR || finance.activeCapitalINR)}
          </div>
          <div className="mt-1 text-xs font-mono text-slate-400">
            Active Face: {formatUSD(finance.activeCapitalUSD)} USD
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-slate-400">
            Est Face INR: {formatINR(finance.activeCapitalINR)}
          </div>
        </div>

        <div className="p-4 rounded border border-[var(--border-primary)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-[var(--text-muted)]">
            <span>PAYOUTS WITHDRAWN</span>
            <span className="text-[10px] px-1 rounded bg-black/40 text-[var(--text-secondary)]">CASH</span>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-mono font-bold text-[var(--green)]">
            {formatINR(finance.totalPayoutsINR)}
          </div>
          <div className="mt-1 text-xs font-mono text-slate-400">
            {formatUSD(finance.totalPayoutsUSD)} USD
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-slate-400">
            Processed Bank Cash
          </div>
        </div>

        <div className="p-4 rounded border border-[var(--border-primary)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-[var(--text-muted)]">
            <span>ACTUAL CASH PNL</span>
            <span className="text-[10px] px-1 rounded bg-red-950/50 text-[var(--red)]">NET</span>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-mono font-bold text-[var(--red)]">
            {formatINR(finance.actualCashPnLINR)}
          </div>
          <div className="mt-1 text-xs font-mono text-slate-400">
            Net Outflow: {formatINR(finance.totalActualCashCostINR || finance.totalInvestedINR)}
          </div>
          <div className="mt-0.5 text-[10px] font-mono text-slate-400">
            All Prop Firms Combined
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-[var(--text-secondary)] uppercase flex items-center gap-2">
            <Wallet size={14} className="text-[var(--cyan)]" />
            Prop Firm Expense Ledger (Actual Bank Debited INR)
          </h2>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {finance.ledger.length} PURCHASES RECONCILED
          </span>
        </div>

        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] uppercase">
                <th className="py-2.5 px-3 text-left">Date</th>
                <th className="py-2.5 px-3 text-left">Firm</th>
                <th className="py-2.5 px-3 text-left">Challenge Name</th>
                <th className="py-2.5 px-3 text-right">Face Value (USD)</th>
                <th className="py-2.5 px-3 text-right">Actual Bank Debit (INR)</th>
                <th className="py-2.5 px-3 text-left">Bank Reference / Invoice</th>
                <th className="py-2.5 px-3 text-center">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {finance.ledger.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 text-left text-[var(--text-secondary)] whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="py-2.5 px-3 text-left">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${tx.firm.toLowerCase() === "breakout" ? "bg-amber-950/60 text-amber-400 border border-amber-800/40" : "bg-cyan-950/60 text-[var(--cyan)] border border-cyan-800/40"}`}>
                      {tx.firm.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-left font-semibold text-[var(--text-primary)]">
                    {tx.challengeName}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-primary)] whitespace-nowrap">
                    {tx.amountUSD && Number(tx.amountUSD) > 0 ? formatUSD(tx.amountUSD) : "N/A"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--cyan)] whitespace-nowrap">
                    {formatINR(tx.actualCashCostINR || tx.amountINR)}
                  </td>
                  <td className="py-2.5 px-3 text-left">
                    <BankRefBadge reference={tx.bankReference || tx.invoiceNumber || "-"} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-950/60 text-[var(--green)] border border-green-800/40 whitespace-nowrap">
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

