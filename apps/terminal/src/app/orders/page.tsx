import { fetchDashboardData } from "@/lib/propr-api";
import { ListOrdered } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const revalidate = 15;

export default async function OrdersPage() {
  const { allOrders, accounts, allPositions } = await fetchDashboardData();
  const activeCount = accounts.filter(
    (a) => a.stage === "EVALUATION" || a.stage === "FUNDED"
  ).length;

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Page Header (Prompt §8) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <ListOrdered size={16} className="text-amber-400" />
            Open Orders & Conditionals
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Resting limit orders, trigger orders, and protective stops across accounts.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {allOrders.length} ORDERS
        </span>
      </div>

      {allOrders.length === 0 ? (
        /* Vertically Centered Compact Empty State (Prompt §8 & §10) */
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-full max-w-md p-6 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)]">
            <EmptyState
              icon={ListOrdered}
              title="No Pending Orders"
              description="No resting limit orders, trigger orders, or protective stops currently pending."
              statusBadge="Order engine active"
              metrics={{
                activeAccounts: activeCount,
                openPositions: allPositions.length,
                openOrders: 0,
                lastChecked: "Just now",
              }}
            />
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
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Size</th>
                <th className="py-2.5 px-3 text-right">Price / Trigger</th>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Created</th>
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
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-200 border border-zinc-700">
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-white">
                    {ord.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-200 font-semibold">
                    {ord.price || ord.triggerPrice || "MARKET"}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">
                    {ord.accountId.replace(/^urn:prp-account:/, "").slice(0, 8)}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-500">
                    {new Date(ord.createdAt).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour12: false,
                    })}{" "}
                    IST
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
