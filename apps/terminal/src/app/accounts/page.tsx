import { fetchDashboardData } from "@/lib/propr-api";
import { AccountsDirectory } from "@/components/accounts-directory";

export const revalidate = 15;

export default async function AccountsPage() {
  const { accounts, summary } = await fetchDashboardData();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-wide">
            Accounts Directory
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Active evaluations, funded accounts, and challenge history
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            Total: {summary.totalAccounts}
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
            Active: {summary.activeEvals + summary.funded}
          </span>
          <span className="px-2.5 py-1 rounded bg-red-950/40 border border-red-800/40 text-red-400">
            Failed: {summary.failedBreached}
          </span>
        </div>
      </div>

      {/* Interactive Accounts Directory with filter strip, sorting, search, and expandable inspection */}
      <AccountsDirectory accounts={accounts} />
    </div>
  );
}
