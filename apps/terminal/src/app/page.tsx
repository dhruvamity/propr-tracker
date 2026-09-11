import { fetchDashboardData } from "@/lib/propr-api";
import { formatUSD, formatINR, formatPercent, formatShortId, formatAccountTag } from "@/lib/utils";
import { TrendingUp, ListOrdered } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { RiskCard } from "@/components/risk-card";
import { TrendSparkline } from "@/components/trend-sparkline";

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
  const ddBreachCount = archivedAccounts.filter(
    (a) => a.failureReason?.toLowerCase().includes("drawdown")
  ).length;
  const dlBreachCount = archivedAccounts.filter(
    (a) => a.failureReason?.toLowerCase().includes("daily")
  ).length;

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

  return (
    <div className="space-y-6">
      {/* ─── 1. Capital Ledger ────────────── */}
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
              {formatINR(totalSpentINR)}{" "}
              <span className="text-xs font-normal text-zinc-500 font-sans">INR</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">
              Total Capital Outflow
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-300">
              {formatINR(activeAtRiskINR)}{" "}
              <span className="text-xs font-normal text-zinc-500 font-sans">INR</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">
              Active Capital at Risk (2 Evals)
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-200">
              −{formatINR(netOutflowINR)}{" "}
              <span className="text-xs font-normal text-zinc-500 font-sans">INR</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">
              Net Capital Outflow
            </div>
          </div>
        </div>

        {/* Detailed Allocation Breakdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-4">
            <span>Propr: <strong className="text-zinc-200">{formatINR(finance.proprActualCashCostINR)}</strong></span>
            <span>Breakout: <strong className="text-zinc-200">{formatINR(finance.breakoutActualCashCostINR)}</strong></span>
            <span>Payouts: <strong className={totalPayoutsINR > 0 ? "text-emerald-400" : "text-zinc-400"}>{formatINR(totalPayoutsINR)}</strong></span>
          </div>
          <a href="/finance" className="text-zinc-400 hover:text-white transition-colors underline underline-offset-4">
            View full audited ledger →
          </a>
        </div>
      </div>

      {/* ─── 2. Active Accounts Risk ──────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            Active Accounts
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">
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

      {/* ─── 3. Accounts Directory: High-Level Comparison (Prompt Requirement §5) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase">
            Active Accounts ({rankedActiveAccounts.length})
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">
            High-level account risk comparison
          </span>
        </div>

        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                <th className="py-2.5 px-3 text-center">Stage</th>
                <th className="py-2.5 px-3 text-left">Account</th>
                <th className="py-2.5 px-3 text-right">Equity</th>
                <th className="py-2.5 px-3 text-center">Risk State</th>
                <th className="py-2.5 px-3 text-right">Binding Room</th>
                <th className="py-2.5 px-3 text-right">Daily Room</th>
                <th className="py-2.5 px-3 text-right">Drawdown Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
              {rankedActiveAccounts.map((acc) => {
                const ddBuffer = Number(acc.drawdownRemaining || 0);
                const dailyRoom = Number(acc.dailyLossRemaining || 0);
                const dailyLimit = Number(acc.dailyLossLimitAmount || 0);
                const dailyUsed = Number(acc.dailyLossUsedAmount || 0);
                const dailyBurn = dailyLimit > 0 ? (dailyUsed / dailyLimit) * 100 : 0;
                const ddConsumed = Number(acc.drawdownLimitConsumedPercent || 0);
                const isDailyConstrained = dailyBurn >= 70 || (dailyRoom > 0 && dailyRoom < ddBuffer);
                const effectiveBuffer = isDailyConstrained ? dailyRoom : ddBuffer;
                const pctUsed = isDailyConstrained ? dailyBurn : ddConsumed;

                let riskBadgeClass = "bg-emerald-950/50 text-emerald-400 border-emerald-800/40";
                let riskLabel = "SAFE";

                if (pctUsed >= 90) {
                  riskBadgeClass = "bg-red-950/60 text-red-400 border-red-800/50 animate-pulse";
                  riskLabel = "CRITICAL";
                } else if (pctUsed >= 75) {
                  riskBadgeClass = "bg-orange-950/60 text-orange-400 border-orange-800/50";
                  riskLabel = "CRITICAL";
                } else if (pctUsed >= 50) {
                  riskBadgeClass = "bg-amber-950/50 text-amber-400 border-amber-800/40";
                  riskLabel = "CAUTION";
                }

                return (
                  <tr key={acc.accountId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-white border border-zinc-700">
                        {acc.stage}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left font-medium text-white">
                      {acc.challengeName || "Starter Turbo"}{" "}
                      <span className="font-bold text-white">{formatAccountTag(acc.accountId)}</span>{" "}
                      <span className="text-zinc-500 text-[10px]">({formatShortId(acc.accountId)})</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-white whitespace-nowrap">
                      {formatUSD(acc.equity)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${riskBadgeClass}`}>
                        {riskLabel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className={`font-semibold ${pctUsed >= 75 ? "text-red-400 font-bold" : "text-zinc-200"}`}>
                        {formatUSD(effectiveBuffer)}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        {isDailyConstrained ? "Daily-loss limit" : "Drawdown floor"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className={`font-medium ${dailyRoom < 50 ? "text-red-400 font-bold" : "text-emerald-400"}`}>
                        {formatUSD(dailyRoom)}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        {dailyBurn.toFixed(0)}% used
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300 whitespace-nowrap">
                      <span className="font-medium text-zinc-200">
                        {formatUSD(ddBuffer)}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        Max {acc.maxDrawdownPercent || "3"}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Collapsible Archived / Breached Accounts */}
        {archivedAccounts.length > 0 && (
          <details className="group rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-3 text-xs font-mono">
            <summary className="cursor-pointer flex items-center justify-between text-zinc-400 select-none hover:text-zinc-200 font-semibold">
              <span>Archived / Breached Accounts ({archivedAccounts.length})</span>
              <span className="text-[11px] text-zinc-500 font-normal group-open:hidden">
                Show {archivedAccounts.length} archived accounts ({dlBreachCount} daily loss, {ddBreachCount} drawdown breaches) ▼
              </span>
              <span className="text-[11px] text-zinc-500 font-normal hidden group-open:inline">
                Hide archived accounts ▲
              </span>
            </summary>
            <div className="mt-3 overflow-x-auto border-t border-[var(--border-subtle)] pt-3">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                    <th className="py-2 px-3 text-center">Stage</th>
                    <th className="py-2 px-3 text-left">Account</th>
                    <th className="py-2 px-3 text-right">Initial</th>
                    <th className="py-2 px-3 text-right">Ending Balance</th>
                    <th className="py-2 px-3 text-center">Breach Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
                  {archivedAccounts.map((acc) => (
                    <tr key={acc.accountId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-800/50">
                          {acc.stage}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-left font-medium text-white">
                        {acc.challengeName || "Starter Turbo"}
                        <span className="font-bold text-white">{formatAccountTag(acc.accountId)}</span>{" "}
                        <span className="text-zinc-500 text-[10px]">({formatShortId(acc.accountId)})</span>
                      </td>
                      <td className="py-2 px-3 text-right text-zinc-400">
                        {formatUSD(acc.initialBalance || acc.startingBalance)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-zinc-200">
                        {formatUSD(acc.balance)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-950/50 text-red-400 border border-red-800/40">
                          {acc.failureReason ? acc.failureReason.replace(/_/g, " ") : "Closed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
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
