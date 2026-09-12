import { Suspense } from "react";
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
        <div className="text-xs font-mono text-zinc-400">
          {summary.totalAccounts} total · {summary.activeEvals + summary.funded} active · {summary.failedBreached} failed
        </div>
      </div>

      {/* Interactive Accounts Directory with filter strip, sorting, search, and expandable inspection */}
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 font-mono text-xs">Loading accounts directory...</div>}>
        <AccountsDirectory accounts={accounts} />
      </Suspense>
    </div>
  );
}
