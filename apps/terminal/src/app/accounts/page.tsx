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
        <h1 className="text-sm md:text-base font-semibold text-zinc-100 font-sans">
          Accounts
        </h1>
        <div className="text-xs font-sans text-zinc-400">
          <span className="font-mono font-medium text-zinc-200">{summary.totalAccounts}</span> total ·{" "}
          <span className="font-mono font-medium text-zinc-200">{summary.activeEvals + summary.funded}</span> active ·{" "}
          <span className="font-mono font-medium text-zinc-200">{summary.failedBreached}</span> failed
        </div>
      </div>

      {/* Interactive Accounts Directory with filter strip, sorting, search, and expandable inspection */}
      <Suspense fallback={<div className="p-8 text-center text-zinc-400 font-sans text-xs">Loading accounts...</div>}>
        <AccountsDirectory accounts={accounts} />
      </Suspense>
    </div>
  );
}
