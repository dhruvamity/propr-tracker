import { fetchDashboardData } from "@/lib/propr-api";
import { ListOrdered } from "lucide-react";
import { formatUSD, formatShortId, formatAccountTag } from "@/lib/utils";

export const revalidate = 15;

export default async function OrdersPage() {
  const { allOrders, accounts, allPositions } = await fetchDashboardData();
  const activeAccounts = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-white tracking-wide">
            Orders
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Active limit, stop, and protective orders across monitored accounts
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {allOrders.length} Active
        </span>
      </div>

      {allOrders.length === 0 ? (
        <div className="space-y-4">
          {/* Compact Empty State */}
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-6 md:p-8 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <ListOrdered size={20} />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-semibold text-white">
                No Active Orders
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {activeAccounts.length} active accounts · no pending orders or protective stops
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Checked now · Upstream queue clear · Zero resting orders</span>
            </div>
          </div>

          {/* Account Order & Stop Status */}
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 font-mono text-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
              <span>Account Status</span>
              <span>Protective Stops</span>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {activeAccounts.map((acc) => {
                const accPositions = allPositions.filter((p) => p.accountId === acc.accountId);
                const accOrders = allOrders.filter((o) => o.accountId === acc.accountId);

                return (
                  <div key={acc.accountId} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{acc.challengeName}</span>
                      <span className="text-zinc-400">{formatAccountTag(acc.accountId)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span>{accPositions.length === 0 ? "no open positions" : `${accPositions.length} open positions`}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-300 font-medium">
                        {accOrders.length === 0 ? "no active stops" : `${accOrders.length} stops active`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Size</th>
                <th className="py-2.5 px-3 text-right">Price / Trigger</th>
                <th className="py-2.5 px-3">Time in Force</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {allOrders.map((ord) => (
                <tr
                  key={ord.orderId}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-white">{ord.asset}</td>
                  <td className="py-2.5 px-3 text-zinc-300">
                    {formatAccountTag(ord.accountId)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ord.side === "buy" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {ord.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300 uppercase">{ord.type}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-white">
                    {ord.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-white">
                    {formatUSD(ord.price || ord.triggerPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">
                    GTC
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-200 border border-zinc-700">
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
