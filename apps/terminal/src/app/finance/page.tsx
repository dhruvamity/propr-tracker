import { fetchDashboardData } from "@/lib/propr-api";
import { formatINR } from "@/lib/utils";
import { FinanceLedger } from "@/components/finance-ledger";
import { Target } from "lucide-react";

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
      {/* ─── 1. Cash Summary (Prompt §20 & §21: Clean Title, Strong Alignment, No Filler) ─── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 md:p-6 space-y-4">
        <div className="border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-sm font-semibold text-zinc-200 font-sans">
            Cash
          </h2>
        </div>

        {/* 4 Standardized Metrics (Prompt §21: Number dominant, Label clean) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {formatINR(totalSpentINR)}
            </div>
            <div className="text-xs font-sans text-zinc-400 mt-1">
              Total spent
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300 tracking-tight">
              {formatINR(activeAtRiskINR)}
            </div>
            <div className="text-xs font-sans text-zinc-400 mt-1">
              Cash at risk
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${totalPayoutsINR > 0 ? "text-emerald-400" : "text-zinc-400"}`}>
              {formatINR(totalPayoutsINR)}
            </div>
            <div className="text-xs font-sans text-zinc-400 mt-1">
              Payouts
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-200 tracking-tight">
              −{formatINR(netOutflowINR)}
            </div>
            <div className="text-xs font-sans text-zinc-400 mt-1">
              Net cash outflow
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Spent by firm (Prompt §20 & §22: No redundant labels, subtle percentage) ─── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-sm font-semibold text-zinc-200 font-sans">
            Spent by firm
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-md bg-zinc-900/40 border border-zinc-800/80 space-y-2">
            <div className="flex justify-between items-baseline text-xs font-sans">
              <span className="font-medium text-zinc-200">Propr</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-100 font-semibold">
                  {formatINR(finance.proprActualCashCostINR)}
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  {((Number(finance.proprActualCashCostINR) / Math.max(1, totalSpentINR)) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--cyan)] rounded-full transition-all duration-500"
                style={{ width: `${(Number(finance.proprActualCashCostINR) / Math.max(1, totalSpentINR)) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-md bg-zinc-900/40 border border-zinc-800/80 space-y-2">
            <div className="flex justify-between items-baseline text-xs font-sans">
              <span className="font-medium text-zinc-200">Breakout</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-100 font-semibold">
                  {formatINR(finance.breakoutActualCashCostINR)}
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  {((Number(finance.breakoutActualCashCostINR) / Math.max(1, totalSpentINR)) * 100).toFixed(0)}%
                </span>
              </div>
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

      {/* ─── 3. Capital Recovery & Breakeven Projection (Phase 3) ─── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 md:p-6 space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-[var(--cyan)]" />
            <h2 className="text-sm font-semibold text-zinc-200">
              Capital Recovery & Payout Milestones
            </h2>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Historical Outflow: <span className="text-zinc-200 font-bold">{formatINR(totalSpentINR)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Milestone 1: Breakeven Threshold */}
          <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Full Breakeven Need</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                100% Payback
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
              ${Math.round(totalSpentINR / (84.5 * 0.8)).toLocaleString()} USD
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              At 80% trader split, just <strong className="text-zinc-200">${Math.round(totalSpentINR / (84.5 * 0.8))}</strong> in funded profit completely offsets all ₹{totalSpentINR.toLocaleString()} spent on challenges.
            </p>
          </div>

          {/* Milestone 2: 10K Account Milestone */}
          <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-medium">10K Turbo Payout</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                212.9% Payback
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-300 tracking-tight">
              {formatINR(640 * 84.5)}
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              1 funded payout on 10K account (8% target = $640 payout) recovers <strong className="text-emerald-300">212%</strong> of all historical prop spend, leaving <strong className="text-white">+₹28,685 net cash profit</strong>.
            </p>
          </div>

          {/* Milestone 3: 5K Account Milestone */}
          <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyan-400 font-medium">5K Turbo Payout</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                106.5% Payback
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-cyan-300 tracking-tight">
              {formatINR(320 * 84.5)}
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              1 funded payout on 5K account (8% target = $320 payout) recovers <strong className="text-cyan-300">106.5%</strong> of all historical prop spend with <strong className="text-white">+₹1,645 net cash profit</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* ─── 4. Ledger Table with Inspection Drawer ─── */}
      <FinanceLedger ledger={finance.ledger} />
    </div>
  );
}
