import { fetchDashboardData } from "@/lib/propr-api";
import { formatUSD, formatINR } from "@/lib/utils";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RiskCard } from "@/components/risk-card";
import Link from "next/link";

export const revalidate = 15;

export default async function OverviewPage() {
  const data = await fetchDashboardData();
  const { finance, accounts, allPositions, allOrders } = data;

  const activeAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
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
      {/* ─── Attention: Quiet state line when healthy, real alert only when danger (Prompt §3) ─── */}
      {criticalAccount ? (
        <div className="p-4 rounded-lg border border-red-800/60 bg-red-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
          <div>
            <div className="text-xs font-semibold text-red-400">1 account needs attention</div>
            <div className="text-xs text-zinc-300 mt-1 font-sans">
              {criticalAccount.challengeName || "Starter Turbo"} · <span className="font-mono text-white font-medium">{formatUSD(criticalAccount.dailyLossRemaining)}</span> daily room remaining
            </div>
          </div>
          <Link
            href="/live"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-900/50 hover:bg-red-800/60 border border-red-700/60 text-xs text-red-200 font-medium transition-colors self-start sm:self-center"
          >
            <span>View risk →</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between py-1 text-xs font-sans">
          <span className="text-zinc-300 font-medium">All accounts healthy</span>
          <div className="flex items-center gap-4">
            <span className="text-zinc-500">{rankedActiveAccounts.length} active</span>
            <Link href="/live" className="text-[var(--cyan)] hover:text-white transition-colors">
              View risk →
            </Link>
          </div>
        </div>
      )}

      {/* ─── 1. Cash: 3 clean metrics, no secondary breakdown (Prompt §4) ─── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 className="text-sm font-semibold text-zinc-200 font-sans">
            Cash
          </h2>
          <Link href="/finance" className="text-xs font-sans text-zinc-400 hover:text-zinc-200 transition-colors">
            View finance →
          </Link>
        </div>

        {/* 3 Numbers: Total Spent, Cash at Risk, Payouts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {formatINR(totalSpentINR)}
            </div>
            <div className="text-xs text-zinc-400 font-sans mt-1">
              Total spent
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300 tracking-tight">
              {formatINR(activeAtRiskINR)}
            </div>
            <div className="text-xs text-zinc-400 font-sans mt-1">
              Cash at risk
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${totalPayoutsINR > 0 ? "text-emerald-400" : "text-zinc-400"}`}>
              {formatINR(totalPayoutsINR)}
            </div>
            <div className="text-xs text-zinc-400 font-sans mt-1">
              Payouts
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Active Accounts Grid (Prompt §5: "2 active", no table-header sentences) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200 font-sans">
            Active accounts
          </h2>
          <span className="text-xs font-sans text-zinc-500">
            {rankedActiveAccounts.length} active
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

      {/* ─── 3. Exposure (Prompt §6: No telemetry descriptor, clean two columns) ─── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
          <h2 className="text-sm font-semibold text-zinc-200 font-sans">
            Exposure
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-md bg-zinc-900/40 border border-zinc-800/80">
            <div>
              <div className="text-xs text-zinc-400 font-sans">Open positions</div>
              <div className="text-2xl font-mono font-bold text-white mt-0.5">{allPositions.length}</div>
              <div className="text-xs text-zinc-500 font-sans mt-0.5">
                {allPositions.length === 0 ? "Flat across 2 active accounts" : `${allPositions.length} active perpetuals`}
              </div>
            </div>
            <Link
              href="/positions"
              className="text-xs font-sans text-[var(--cyan)] hover:text-white transition-colors"
            >
              View positions →
            </Link>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-md bg-zinc-900/40 border border-zinc-800/80">
            <div>
              <div className="text-xs text-zinc-400 font-sans">Resting orders</div>
              <div className="text-2xl font-mono font-bold text-white mt-0.5">{allOrders.length}</div>
              <div className="text-xs text-zinc-500 font-sans mt-0.5">
                {allOrders.length === 0 ? "No pending orders or stops" : `${allOrders.length} resting limit orders`}
              </div>
            </div>
            <Link
              href="/orders"
              className="text-xs font-sans text-[var(--cyan)] hover:text-white transition-colors"
            >
              View orders →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
