import { fetchDashboardData } from "@/lib/propr-api";
import { ListOrdered } from "lucide-react";
import { formatUSD, formatShortId, formatAccountTag } from "@/lib/utils";

export const revalidate = 15;

export default async function OrdersPage() {
  const { allOrders, accounts } = await fetchDashboardData();
  const activeCount = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-white tracking-wide">
            Open Orders
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Resting limit orders & protective stops
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {allOrders.length} Resting
        </span>
      </div>

      {allOrders.length === 0 ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <ListOrdered size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              No Active Orders
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm">
              {activeCount} active accounts currently have zero resting orders or pending protective stops.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Monitored · Upstream queue clear</span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-zinc-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Size</th>
                <th className="py-2.5 px-3 text-right">Price / Trigger</th>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Time in Force</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[12px]">
              {allOrders.map((ord) => (
                <tr
                  key={ord.orderId}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-white">{ord.asset}</td>
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
                    {formatUSD(ord.price)}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300">
                    {formatAccountTag(ord.accountId)}
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
