import { fetchDashboardData } from "@/lib/propr-api";

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

export default async function AccountsPage() {
  const { accounts, summary } = await fetchDashboardData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-wider text-[var(--text-primary)] uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--cyan)]"></span>
            Accounts Universe Directory
          </h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
            Evaluation challenges, passed benchmarks, and funded accounts.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--cyan)]">
            Total: {summary.totalAccounts}
          </span>
          <span className="px-2 py-1 rounded bg-green-950/40 border border-green-800/40 text-[var(--green)]">
            Active: {summary.activeEvals + summary.funded}
          </span>
          <span className="px-2 py-1 rounded bg-red-950/40 border border-red-800/40 text-[var(--red)]">
            Failed: {summary.failedBreached}
          </span>
        </div>
      </div>

      {/* Accounts Directory Table */}
      <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] uppercase">
              <th className="py-2.5 px-3 text-center">Stage</th>
              <th className="py-2.5 px-3 text-left">Account ID / Challenge</th>
              <th className="py-2.5 px-3 text-right">Starting</th>
              <th className="py-2.5 px-3 text-right">Balance</th>
              <th className="py-2.5 px-3 text-right">Equity</th>
              <th className="py-2.5 px-3 text-right">Drawdown Status</th>
              <th className="py-2.5 px-3 text-right">Target Progress</th>
              <th className="py-2.5 px-3 text-center">Account State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {accounts.map((acc) => {
              const isFailed = acc.stage === "FAILED" || acc.stage === "BREACHED";
              const isActive = acc.stage === "EVALUATION" || acc.stage === "FUNDED";
              return (
                <tr key={acc.accountId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        isActive
                          ? "bg-cyan-950/60 text-[var(--cyan)] border-cyan-800/50"
                          : isFailed
                          ? "bg-red-950/60 text-[var(--red)] border-red-800/50"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                      }`}
                    >
                      {acc.stage}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-left text-[var(--text-primary)] font-medium">
                    {acc.accountId.replace(/^urn:prp-account:/, "")}
                    <span className="text-[10px] text-[var(--text-muted)] block">
                      {acc.challengeName || "Starter Turbo"} ({acc.drawdownType || "static"} DD)
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-[var(--text-secondary)] whitespace-nowrap">
                    {formatUSD(acc.startingBalance)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    {formatUSD(acc.balance)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[var(--text-primary)] whitespace-nowrap">
                    {formatUSD(acc.equity)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[var(--text-secondary)] whitespace-nowrap">
                    <span className={Number(acc.drawdownLimitConsumedPercent || 0) > 75 ? "text-[var(--red)] font-bold" : "text-[var(--text-primary)]"}>
                      {acc.drawdownLimitConsumedPercent || "0"}% of limit
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block">
                      {acc.drawdownUsedPercent || "0"}% account loss
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-[var(--text-secondary)] whitespace-nowrap">
                    {acc.profitTargetProgressPercent || "0"}%
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {acc.failureReason ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/50 text-[var(--red)] border border-red-800/40">
                        {acc.failureReason.replace(/_/g, " ")}
                      </span>
                    ) : isActive ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/50 text-[var(--cyan)] border border-cyan-800/40">
                        Active Evaluation
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)] text-[10px]">Completed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
