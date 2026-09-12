import { fetchDashboardData } from "@/lib/propr-api";
import { formatUSD, formatINR, formatPercent, formatShortId, formatAccountTag } from "@/lib/utils";
import { TrendingUp, ListOrdered, ShieldCheck, ArrowUpRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RiskCard } from "@/components/risk-card";
import Link from "next/link";

export const revalidate = 15; // Revalidate data every 15 seconds

export default async function OverviewPage() {
  const data = await fetchDashboardData();
  const { summary, finance, accounts, allPositions, allOrders } = data;

  const activeAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );
  const archivedAccounts = accounts.filter(
    (a) => a.stage !== "EVALUATION" && a.stage !== "FUNDED"
  );

  // Sort active accounts by active breach proximity (lowest effective buffer first)
  const rankedActiveAccounts = [...activeAccounts].sort((a, b) => {
    const dailyRoomA = Number(a.dailyLossRemaining || 0);
    const ddBufferA = Number(a.drawdownRemaining || 0);
    const dailyLimitA = Number(a.dailyLossLimitAmount || 0);
    const dailyUsedA = Number(a.dailyLossUsedAmount || 0);
    const dailyBurnA = dailyLimitA > 0 ? (dailyUsedA / dailyLimitA) * 100 : 0;
    const effA = dailyBurnA >= 70 || (dailyRoomA > 0 && dailyRoomA < ddBufferA) ? dailyRoomA : ddBufferA;

    const dailyRoomB = Number(b.dailyLossRemaining || 0);
    const ddBufferB = Number(b.drawdownRemaining || 0);
    const dailyLimitB = Number(b.dailyLossLimitAmount || 0);
    const dailyUsedB = Number(b.dailyLossUsedAmount || 0);
    const dailyBurnB = dailyLimitB > 0 ? (dailyUsedB / dailyLimitB) * 100 : 0;
    const effB = dailyBurnB >= 70 || (dailyRoomB > 0 && dailyRoomB < ddBufferB) ? dailyRoomB : ddBufferB;

    return effA - effB;
  });

  const totalSpentINR = Number(finance.totalActualCashCostINR || finance.totalInvestedINR || 0);
  const activeAtRiskINR = Number(finance.activeActualCashCostINR || finance.activeCapitalINR || 0);
  const totalPayoutsINR = Number(finance.totalPayoutsINR || 0);
  const netOutflowINR = totalSpentINR - totalPayoutsINR;

  // Identify most critical account for attention alert
  const criticalAccount = rankedActiveAccounts.find((acc) => {
    const dailyRoom = Number(acc.dailyLossRemaining || 0);
    const dailyLimit = Number(acc.dailyLossLimitAmount || 0);
    const dailyUsed = Number(acc.dailyLossUsedAmount || 0);
    const dailyBurn = dailyLimit > 0 ? (dailyUsed / dailyLimit) * 100 : 0;
    return dailyBurn >= 75 || dailyRoom <= 35;
  });

  return (
    <div className="space-y-6">
      {/* ─── Attention Banner (Prompt §9.1 & §27) ─── */}
      {criticalAccount ? (
        <div className="p-4 rounded-lg border border-red-800/60 bg-red-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Needs Attention · {criticalAccount.challengeName || "Starter Turbo"} {formatAccountTag(criticalAccount.accountId)}
              </div>
              <div className="text-xs text-zinc-300 mt-0.5">
                {formatUSD(criticalAccount.dailyLossRemaining)} daily loss room ({((Number(criticalAccount.dailyLossUsedAmount || 0) / Number(criticalAccount.dailyLossLimitAmount || 1)) * 100).toFixed(0)}% consumed)
              </div>
            </div>
          </div>
          <Link
            href="/live"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-900/50 hover:bg-red-800/60 border border-red-700/60 text-xs text-red-200 font-semibold transition-colors self-start sm:self-center"
          >
            <span>View risk →</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="p-3.5 rounded-lg border border-emerald-800/50 bg-emerald-950/20 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-emerald-400 uppercase tracking-wider">
              All Accounts Healthy
            </span>
            <span className="text-zinc-400">
              • {rankedActiveAccounts.length} active · no immediate breach risk
            </span>
          </div>
          <Link href="/live" className="text-xs text-[var(--cyan)] hover:text-white transition-colors">
            Risk monitor →
          </Link>
        </div>
      )}

      {/* ─── 1. Capital Ledger (Baseline-aligned 24px+ figures) ─── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 md:p-6 transition-all">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
              Capital Ledger
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              INR Base
            </span>
          </div>
        </div>

        {/* Primary Cash Figures (24px-30px bold numbers) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {formatINR(totalSpentINR)}{" "}
              <span className="text-xs font-normal text-zinc-500 font-sans">INR</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">
              Total Cash Spent
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300 tracking-tight">
              {formatINR(activeAtRiskINR)}{" "}
              <span className="text-xs font-normal text-zinc-500 font-sans">INR</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">
              Active Cash at Risk (2 evals)
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-200 tracking-tight">
              −{formatINR(netOutflowINR)}{" "}
              <span className="text-xs font-normal text-zinc-500 font-sans">INR</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">
              Net Cash Outflow
            </div>
          </div>
        </div>

        {/* Breakdown Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-4">
            <span>Propr: <strong className="text-zinc-200">{formatINR(finance.proprActualCashCostINR)}</strong></span>
            <span>Breakout: <strong className="text-zinc-200">{formatINR(finance.breakoutActualCashCostINR)}</strong></span>
            <span>Payouts: <strong className={totalPayoutsINR > 0 ? "text-emerald-400" : "text-zinc-400"}>{formatINR(totalPayoutsINR)}</strong></span>
          </div>
          <Link href="/finance" className="text-zinc-400 hover:text-white transition-colors underline underline-offset-4">
            Finance ledger →
          </Link>
        </div>
      </div>

      {/* ─── 2. Active Accounts Risk Cards ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            Active Accounts
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            {rankedActiveAccounts.length} monitored by breach proximity
          </span>
        </div>

        {rankedActiveAccounts.length === 0 ? (
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-8">
            <EmptyState
              icon={TrendingUp}
              title="No Active Accounts"
              description="Active evaluation and funded accounts will appear here with live risk meters."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rankedActiveAccounts.map((acc, idx) => (
              <RiskCard key={acc.accountId} account={acc} rank={idx + 1} />
            ))}
          </div>
        )}
      </div>

      {/* ─── 3. Market Exposure & Order Summary (Prompt Requirement §7 & §14) ─── */}
      <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5 mb-3">
          <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
            Market Exposure
          </span>
          <span className="text-zinc-500 text-[11px]">
            Telemetry
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 rounded bg-zinc-900/60 border border-zinc-800">
            <div>
              <div className="text-zinc-400 text-xs">Open Positions</div>
              <div className="text-xl font-bold text-white mt-0.5">{allPositions.length}</div>
              <div className="text-zinc-400 text-xs mt-0.5">
                {allPositions.length === 0 ? "Flat across 2 active accounts" : `${allPositions.length} active perpetuals`}
              </div>
            </div>
            <Link
              href="/positions"
              className="text-xs text-[var(--cyan)] hover:text-white transition-colors"
            >
              View positions →
            </Link>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded bg-zinc-900/60 border border-zinc-800">
            <div>
              <div className="text-zinc-400 text-xs">Resting Orders</div>
              <div className="text-xl font-bold text-white mt-0.5">{allOrders.length}</div>
              <div className="text-zinc-400 text-xs mt-0.5">
                {allOrders.length === 0 ? "No pending orders or stops" : `${allOrders.length} resting limit orders`}
              </div>
            </div>
            <Link
              href="/orders"
              className="text-xs text-[var(--cyan)] hover:text-white transition-colors"
            >
              View orders →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
