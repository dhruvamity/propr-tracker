import { fetchDashboardData } from "@/lib/propr-api";
import { ListOrdered } from "lucide-react";
import { formatUSD, formatAccountTag } from "@/lib/utils";

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
          <h1 className="text-sm md:text-base font-semibold text-zinc-100 font-sans">
            Orders
          </h1>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Active limit, stop, and protective orders across monitored accounts
          </p>
        </div>
        <span className="text-xs font-sans px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {allOrders.length} active
        </span>
      </div>

      {allOrders.length === 0 ? (
        <div className="space-y-4">
          {/* Compact Empty State */}
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-6 md:p-8 text-center space-y-3 font-sans">
            <div className="w-10 h-10 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <ListOrdered size={20} />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
                No Active Orders
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {activeAccounts.length} active accounts · no pending orders or protective stops
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Checked now · Zero resting orders</span>
            </div>
          </div>

          {/* Account Order & Stop Status */}
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-xs font-sans">
              <span className="font-semibold text-zinc-200">Account Status</span>
              <span className="text-zinc-400">Protective Stops</span>
            </div>
            <div className="divide-y divide-zinc-800/60 font-sans text-xs">
              {activeAccounts.map((acc) => {
                const accPositions = allPositions.filter((p) => p.accountId === acc.accountId);
                const accOrders = allOrders.filter((o) => o.accountId === acc.accountId);

                return (
                  <div key={acc.accountId} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-100">{acc.challengeName}</span>
                      <span className="font-mono text-zinc-400 text-xs">{formatAccountTag(acc.accountId)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span>{accPositions.length === 0 ? "no open positions" : `${accPositions.length} open`}</span>
                      <span className="text-zinc-700">•</span>
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
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 font-sans">
                <th className="py-2.5 px-3 font-normal">Asset</th>
                <th className="py-2.5 px-3 font-normal">Account</th>
                <th className="py-2.5 px-3 font-normal">Side</th>
                <th className="py-2.5 px-3 font-normal">Type</th>
                <th className="py-2.5 px-3 text-right font-normal">Size</th>
                <th className="py-2.5 px-3 text-right font-normal">Price / Trigger</th>
                <th className="py-2.5 px-3 font-normal">Time in Force</th>
                <th className="py-2.5 px-3 text-center font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-xs">
              {allOrders.map((ord) => (
                <tr
                  key={ord.orderId}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">{ord.asset}</td>
                  <td className="py-2.5 px-3 text-zinc-300">
                    {formatAccountTag(ord.accountId)}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        ord.side === "buy" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {ord.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300 font-sans capitalize">{ord.type}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-white">
                    {ord.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-white">
                    {formatUSD(ord.price || ord.triggerPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 font-sans">
                    GTC
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans">
                    <span className="text-zinc-300">
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
