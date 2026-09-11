import { fetchDashboardData } from "@/lib/propr-api";
import { XCircle } from "lucide-react";
import { TradeDrawer } from "@/components/trade-drawer";

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

export default async function HistoryPage() {
  const { accounts } = await fetchDashboardData();
  const historicalAccounts = accounts.filter(
    (a) => a.stage === "FAILED" || a.stage === "BREACHED" || a.stage === "CLOSED" || a.stage === "PASSED"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-sm font-mono font-bold tracking-wider text-[var(--text-primary)] uppercase flex items-center gap-2">
          <XCircle size={15} className="text-[var(--red)]" />
          Historical & Breached Account Archive
        </h1>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
          Past challenge attempts, breach triggers, closed accounts, and full trade execution history.
        </p>
      </div>

      <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] uppercase">
              <th className="py-2.5 px-3">Stage</th>
              <th className="py-2.5 px-3">Account ID</th>
              <th className="py-2.5 px-3">Challenge Type</th>
              <th className="py-2.5 px-3 text-right">Initial</th>
              <th className="py-2.5 px-3 text-right">Ending Balance</th>
              <th className="py-2.5 px-3">Breach / Failure Reason</th>
              <th className="py-2.5 px-3">Trade History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {historicalAccounts.map((acc) => (
              <tr key={acc.accountId} className="hover:bg-white/[0.02] transition-colors align-top">
                <td className="py-2.5 px-3">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                    acc.stage === "PASSED"
                      ? "bg-emerald-950/60 text-[var(--green)] border-emerald-800/40"
                      : "bg-red-950/60 text-[var(--red)] border-red-800/40"
                  }`}>
                    {acc.stage}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-[var(--text-primary)] font-medium">
                  {acc.accountId.replace(/^urn:prp-account:/, "")}
                </td>
                <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                  {acc.challengeName || "Starter Turbo"}
                </td>
                <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">
                  {formatUSD(acc.initialBalance)}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-[var(--text-primary)]">
                  {formatUSD(acc.balance)}
                </td>
                <td className="py-2.5 px-3 text-zinc-400 font-normal">
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
