import { fetchDashboardData } from "@/lib/propr-api";
import { formatUSD, formatINR, formatPercent, formatShortId } from "@/lib/utils";
import { TrendingUp, ListOrdered } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RiskCard } from "@/components/risk-card";

export const revalidate = 15; // Revalidate data every 15 seconds

export default async function OverviewPage() {
  const data = await fetchDashboardData();
  const { summary, finance, accounts, allPositions, allOrders } = data;

  const activeAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );

  const totalSpentINR = Number(finance.totalActualCashCostINR || finance.totalInvestedINR || 0);
  const activeAtRiskINR = Number(finance.activeActualCashCostINR || finance.activeCapitalINR || 0);
  const totalPayoutsINR = Number(finance.totalPayoutsINR || 0);
  const netOutflowINR = totalSpentINR - totalPayoutsINR;

  return (
    <div className="space-y-6">
      {/* ─── 1. Capital & Cash Ledger ────────────── */}
      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-5 md:p-6 transition-all">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            Cash Ledger
          </h2>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
              {summary.activeEvals + summary.funded} Active
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/40 text-red-400 border border-red-800/40 font-medium">
              {summary.failedBreached} Failed
            </span>
          </div>
        </div>

        {/* Primary Cash Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
              {formatINR(totalSpentINR)}
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">
              Total Cash Spent
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300">
              {formatINR(activeAtRiskINR)}
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">
              Capital at Risk (2 Evals)
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-red-400">
              −{formatINR(netOutflowINR)}
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">
              Net Outflow (₹0 Payouts)
            </div>
          </div>
        </div>

        {/* Detailed Allocation Breakdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-4">
            <span>Propr: <strong className="text-zinc-200">{formatINR(finance.proprActualCashCostINR)}</strong></span>
            <span>Breakout: <strong className="text-zinc-200">{formatINR(finance.breakoutActualCashCostINR)}</strong></span>
          </div>
          <div className="flex items-center gap-4">
            <span>Payouts: <strong className="text-emerald-400">{formatINR(totalPayoutsINR)}</strong></span>
            <span>Net: <strong className="text-red-400">−{formatINR(netOutflowINR)}</strong></span>
          </div>
        </div>
      </div>

      {/* ─── 2. Active Accounts Risk ──────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            Active Accounts
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">
            {activeAccounts.length} monitored
          </span>
        </div>

        {activeAccounts.length === 0 ? (
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-8">
            <EmptyState
              icon={TrendingUp}
              title="No Active Accounts"
              description="Active evaluation and funded accounts will appear here with live risk meters."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeAccounts.map((acc, idx) => (
              <RiskCard key={acc.accountId} account={acc} rank={idx + 1} />
            ))}
          </div>
        )}
      </div>

      {/* ─── 3. All Accounts Directory ─────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            All Accounts ({accounts.length})
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">
            {summary.activeEvals + summary.funded} active • {summary.failedBreached} archived
          </span>
        </div>

        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                <th className="py-2.5 px-3 text-center">Stage</th>
                <th className="py-2.5 px-3 text-left">Account ID</th>
                <th className="py-2.5 px-3 text-right">Starting</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
                <th className="py-2.5 px-3 text-right">Equity</th>
                <th className="py-2.5 px-3 text-right">Drawdown</th>
                <th className="py-2.5 px-3 text-right">Target</th>
                <th className="py-2.5 px-3 text-center">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
              {accounts.map((acc) => {
                const isFailed = acc.stage === "FAILED" || acc.stage === "BREACHED";
                const isActive = acc.stage === "EVALUATION" || acc.stage === "FUNDED";
                const ddConsumed = Number(acc.drawdownLimitConsumedPercent || 0);

                return (
                  <tr
                    key={acc.accountId}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isActive
                            ? "bg-zinc-800 text-white border-zinc-700"
                            : isFailed
                            ? "bg-red-950/60 text-red-400 border-red-800/50"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800"
                        }`}
                      >
                        {acc.stage}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left font-medium text-white">
                      {formatShortId(acc.accountId)}
                      <span className="text-[10px] text-zinc-400 block font-normal">
                        {acc.challengeName || "Starter Turbo"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-400 whitespace-nowrap">
                      {formatUSD(acc.initialBalance || acc.startingBalance)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-zinc-200 whitespace-nowrap">
                      {formatUSD(acc.balance)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-white whitespace-nowrap">
                      {formatUSD(acc.equity)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300 whitespace-nowrap">
                      <span
                        className={
                          ddConsumed >= 100 || isFailed
                            ? "text-red-400 font-bold"
                            : ddConsumed > 75
                            ? "text-red-400 font-semibold"
                            : ddConsumed > 40
                            ? "text-amber-400 font-medium"
                            : "text-zinc-300"
                        }
                      >
                        {formatPercent(acc.drawdownUsedPercent, 2)}
                        <span className="text-zinc-500 font-normal ml-1">/ {acc.maxDrawdownPercent || "3"}%</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300 whitespace-nowrap">
                      <span className="font-medium text-white">
                        {formatPercent(acc.profitTargetPct, 2)}
                        <span className="text-zinc-500 font-normal ml-1">/ {acc.profitTargetPercent || "9"}%</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {acc.failureReason ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-950/50 text-red-400 border border-red-800/40">
                          {acc.failureReason.replace(/_/g, " ")}
                        </span>
                      ) : isActive ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                          Active
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[10px]">Archived</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 5. Open Exposures Summary (Prompt §8) ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Positions Summary */}
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-2">
            <h3 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
              Positions ({allPositions.length})
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">EXPOSURE</span>
          </div>
          {allPositions.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No Open Positions"
              description="Your 2 active accounts currently have no market exposure."
              metrics={{
                activeAccounts: activeAccounts.length,
                openPositions: 0,
                openOrders: allOrders.length,
                lastChecked: "Just now",
              }}
              className="py-6"
            />
          ) : (
            <div className="space-y-2">
              {allPositions.map((pos) => (
                <div
                  key={pos.positionId}
                  className="flex justify-between text-xs font-mono border-b border-[var(--border-subtle)] pb-2"
                >
                  <span className="text-white font-bold">
                    {pos.asset} {pos.positionSide.toUpperCase()}
                  </span>
                  <span className="text-zinc-300">
                    {pos.quantity} @ {pos.entryPrice}
                  </span>
                  <span
                    className={
                      Number(pos.unrealizedPnl) >= 0 ? "text-emerald-400" : "text-red-400"
                    }
                  >
                    {formatUSD(pos.unrealizedPnl)} ({pos.returnOnEquity}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders Summary */}
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between mb-3 border-b border-[var(--border-subtle)] pb-2">
            <h3 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
              Orders ({allOrders.length})
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">PENDING</span>
          </div>
          {allOrders.length === 0 ? (
            <EmptyState
              icon={ListOrdered}
              title="No Pending Orders"
              description="No resting limit orders or protective stops currently pending."
              metrics={{
                activeAccounts: activeAccounts.length,
                openPositions: allPositions.length,
                openOrders: 0,
                lastChecked: "Just now",
              }}
              className="py-6"
            />
          ) : (
            <div className="space-y-2">
              {allOrders.map((ord) => (
                <div
                  key={ord.orderId}
                  className="flex justify-between text-xs font-mono border-b border-[var(--border-subtle)] pb-2"
                >
                  <span className="text-white">
                    {ord.asset} {ord.side.toUpperCase()}
                  </span>
                  <span className="text-zinc-400">
                    {ord.type} {ord.quantity}
                  </span>
                  <span className="text-zinc-200 font-semibold">
                    {ord.price || ord.triggerPrice || "MKT"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
