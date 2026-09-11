import { fetchDashboardData } from "@/lib/propr-api";
import { History } from "lucide-react";
import { TradeDrawer } from "@/components/trade-drawer";
import { formatUSD, formatShortId } from "@/lib/utils";

export const revalidate = 15;

export default async function HistoryPage() {
  const { accounts } = await fetchDashboardData();
  const historicalAccounts = accounts.filter(
    (a) =>
      a.stage === "FAILED" ||
      a.stage === "BREACHED" ||
      a.stage === "CLOSED" ||
      a.stage === "PASSED"
  );

  const ddFailures = historicalAccounts.filter(
    (a) => a.failureReason && a.failureReason.toLowerCase().includes("drawdown")
  ).length;
  const dailyLossFailures = historicalAccounts.filter(
    (a) => a.failureReason && a.failureReason.toLowerCase().includes("daily")
  ).length;
  const otherFailures = historicalAccounts.length - ddFailures - dailyLossFailures;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-wide">
            History
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Past challenge attempts and breach triggers
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {historicalAccounts.length} archived
        </span>
      </div>

      {/* Summary Strip */}
      {historicalAccounts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] font-mono text-center">
            <div className="text-xl font-bold text-white">{historicalAccounts.length}</div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Breached</div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] font-mono text-center">
            <div className="text-xl font-bold text-white">{ddFailures}</div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">DD Failures</div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] font-mono text-center">
            <div className="text-xl font-bold text-white">{dailyLossFailures || otherFailures}</div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">{dailyLossFailures > 0 ? "Daily Loss" : "Other"}</div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
              <th className="py-2.5 px-3">Stage</th>
              <th className="py-2.5 px-3">Account ID</th>
              <th className="py-2.5 px-3">Challenge Type</th>
              <th className="py-2.5 px-3 text-right">Initial</th>
              <th className="py-2.5 px-3 text-right">Ending Balance</th>
              <th className="py-2.5 px-3">Breach / Failure Reason</th>
              <th className="py-2.5 px-3">Trade History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
            {historicalAccounts.map((acc) => (
              <tr
                key={acc.accountId}
                className="hover:bg-white/[0.02] transition-colors align-top"
              >
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                      acc.stage === "PASSED"
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                        : "bg-red-950/60 text-red-400 border-red-800/40"
                    }`}
                  >
                    {acc.stage}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium text-white">
                  {formatShortId(acc.accountId)}
                </td>
                <td className="py-2.5 px-3 text-zinc-300">
                  {acc.challengeName || "Starter Turbo"}
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-400">
                  {formatUSD(acc.initialBalance)}
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-white">
                  {formatUSD(acc.balance)}
                </td>
                <td className="py-2.5 px-3 text-zinc-400">
                  {acc.failureReason ? acc.failureReason.replace(/_/g, " ") : "Closed"}
                </td>
                <td className="py-2.5 px-3">
                  <TradeDrawer
                    accountId={acc.accountId}
                    trades={acc.trades || []}
                    initialBalance={acc.initialBalance}
                    endingBalance={acc.balance}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
