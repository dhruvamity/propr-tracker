import { fetchDashboardData } from "@/lib/propr-api";
import { Radio } from "lucide-react";

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

export default async function LiveMonitorPage() {
  const { accounts } = await fetchDashboardData();
  const liveAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-wider text-[var(--text-primary)] uppercase flex items-center gap-2">
            <Radio size={15} className="text-[var(--cyan)] animate-pulse" />
            Live Risk & Active Accounts
          </h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
            Breach limits and profit target progress for active accounts.
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--cyan)]">
          {liveAccounts.length} ACCOUNTS MONITORED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveAccounts.map((acc) => (
          <div
            key={acc.accountId}
            className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 space-y-4"
          >
            <div className="flex justify-between items-start border-b border-[var(--border-subtle)] pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[var(--cyan)]">
                  {acc.challengeName || "Starter Turbo"}
                </span>
                <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                  ID: {acc.accountId}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-[var(--text-primary)]">
                  {formatUSD(acc.equity)}
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  Balance: {formatUSD(acc.balance)}
                </span>
              </div>
            </div>

            <div className="space-y-3 font-mono">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)]">Drawdown Used</span>
                  <span className={Number(acc.drawdownLimitConsumedPercent || 0) > 75 ? "text-[var(--red)] font-bold" : "text-[var(--text-primary)]"}>
                    {acc.drawdownLimitConsumedPercent || "0"}% of limit
                  </span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className={`h-full transition-all duration-500 ${Number(acc.drawdownLimitConsumedPercent || 0) > 75 ? "bg-[var(--red)]" : "bg-[var(--cyan)]"}`}
                    style={{ width: `${Math.min(100, Math.max(0, Number(acc.drawdownLimitConsumedPercent || 0)))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)]">Profit Target Progress</span>
                  <span className="text-[var(--cyan)] font-bold">{acc.profitTargetProgressPercent || "0"}%</span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="h-full bg-[var(--cyan)] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, Number(acc.profitTargetProgressPercent || 0)))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
