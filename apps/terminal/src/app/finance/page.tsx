import { fetchDashboardData } from "@/lib/propr-api";
import { formatINR } from "@/lib/utils";
import { FinanceLedger } from "@/components/finance-ledger";

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
      {/* ─── 1. Cash Summary (Prompt §14: Single Cash block, not 4 floating cards) ─── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 className="text-sm font-semibold text-zinc-200 font-sans">
            Cash
          </h2>
          <span className="text-xs font-sans text-zinc-400">
            Bank settled capital & cash flows
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-xs font-sans text-zinc-400">Total spent</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight mt-1">
              {formatINR(totalSpentINR)}
            </div>
            <div className="text-xs font-sans text-zinc-400 mt-1">
              Settled across 8 challenges
            </div>
          </div>
          <div>
            <div className="text-xs font-sans text-zinc-400">Cash at risk</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300 tracking-tight mt-1">
              {formatINR(activeAtRiskINR)}
            </div>
            <div className="text-xs font-sans text-zinc-400 mt-1">
              2 active evaluations
            </div>
          </div>
          <div>
            <div className="text-xs font-sans text-zinc-400">Payouts received</div>
            <div className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight mt-1 ${totalPayoutsINR > 0 ? "text-emerald-400" : "text-zinc-400"}`}>
              {formatINR(totalPayoutsINR)}
            </div>
            <div className="text-xs font-sans text-zinc-400 mt-1">
              {totalPayoutsINR > 0 ? "Bank settled" : "0 payouts"}
            </div>
          </div>
          <div>
            <div className="text-xs font-sans text-zinc-400">Net cash outflow</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-200 tracking-tight mt-1">
              −{formatINR(netOutflowINR)}
            </div>
            <div className="text-xs font-sans text-zinc-400 mt-1">
              Challenge fee basis
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Spent by firm (Prompt §14: Clean minimal breakdown) ─── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-sans text-zinc-400">
          <span className="font-semibold text-zinc-200 text-sm">Spent by firm</span>
          <span>Settled INR allocation</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-3 rounded-md bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
            <div className="flex justify-between items-baseline text-xs font-sans">
              <span className="font-semibold text-zinc-100">Propr</span>
              <span className="font-mono text-zinc-200 font-medium">
                {formatINR(finance.proprActualCashCostINR)}{" "}
                <span className="text-zinc-400 font-sans font-normal">
                  ({((Number(finance.proprActualCashCostINR) / Math.max(1, totalSpentINR)) * 100).toFixed(0)}%)
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--cyan)] rounded-full transition-all duration-500"
                style={{ width: `${(Number(finance.proprActualCashCostINR) / Math.max(1, totalSpentINR)) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-md bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
            <div className="flex justify-between items-baseline text-xs font-sans">
              <span className="font-semibold text-zinc-100">Breakout</span>
              <span className="font-mono text-zinc-200 font-medium">
                {formatINR(finance.breakoutActualCashCostINR)}{" "}
                <span className="text-zinc-400 font-sans font-normal">
                  ({((Number(finance.breakoutActualCashCostINR) / Math.max(1, totalSpentINR)) * 100).toFixed(0)}%)
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(Number(finance.breakoutActualCashCostINR) / Math.max(1, totalSpentINR)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Ledger Table with Inspection Drawer (Prompt §15) ─── */}
      <FinanceLedger ledger={finance.ledger} />
    </div>
  );
}
