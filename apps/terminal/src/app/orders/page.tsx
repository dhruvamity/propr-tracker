import { fetchDashboardData } from "@/lib/propr-api";
import { ListOrdered } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const revalidate = 15;

export default async function OrdersPage() {
  const { allOrders } = await fetchDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-mono font-bold tracking-wider text-[var(--text-primary)] uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--amber)]"></span>
            Open Orders & Conditionals
          </h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
            Resting limit orders, trigger orders, and protective stops across accounts.
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--amber)]">
          {allOrders.length} ORDERS PENDING
        </span>
      </div>

      {allOrders.length === 0 ? (
        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] p-12">
          <EmptyState
            icon={ListOrdered}
            title="No Pending Orders"
            description="Resting limit orders, trigger orders, and protective stops across accounts will appear here."
            statusBadge="Order engine active"
          />
        </div>
      ) : (
        <div className="rounded border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[10px] uppercase">
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
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {allOrders.map((ord) => (
                <tr key={ord.orderId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[var(--text-primary)]">{ord.asset}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ord.side === "buy" ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                      {ord.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)] uppercase">{ord.type}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/40 text-[var(--cyan)] border border-cyan-800/40">
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[var(--text-primary)]">{ord.quantity}</td>
                  <td className="py-2.5 px-3 text-right text-[var(--cyan)] font-semibold">{ord.price || ord.triggerPrice || "MARKET"}</td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">{ord.accountId.slice(0, 12)}...</td>
                  <td className="py-2.5 px-3 text-[var(--text-muted)]">{new Date(ord.createdAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })} IST</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
