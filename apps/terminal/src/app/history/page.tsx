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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <History size={16} className="text-zinc-400" />
            Historical & Breached Account Archive
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Past challenge attempts, breach triggers, closed accounts, and full trade execution history.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {historicalAccounts.length} ARCHIVED
        </span>
      </div>

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
